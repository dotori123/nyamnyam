import type { Cat, NewCat } from '../types';
import { getDb } from './config';

/**
 * 고양이 프로필 CRUD — users/{uid}/cats/{catId}
 *
 * 화면은 이 함수들을 직접 부르지 않는다. CatsProvider가 로그인 여부를 보고
 * 로컬 저장소와 이 함수들 중 하나를 고른다.
 *
 * records.ts와 같은 이유로 firestore 모듈을 정적으로 import하지 않는다
 * (첫 화면 번들에 딸려 들어가지 않게).
 */

async function load() {
  const [firestore, { catConverter }] = await Promise.all([
    import('firebase/firestore'),
    import('./converters'),
  ]);
  const db = await getDb();
  return { firestore, catConverter, db };
}

/** 등록한 순서대로. 목록에서 "이 아이로 전환"할 때 순서가 흔들리지 않아야 한다 */
export function subscribeCats(
  uid: string,
  onChange: (cats: Cat[]) => void,
  onError: (error: Error) => void,
): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    try {
      const { firestore, catConverter, db } = await load();
      if (cancelled) return;

      const ref = firestore.collection(db, 'users', uid, 'cats').withConverter(catConverter);

      unsubscribe = firestore.onSnapshot(
        firestore.query(ref, firestore.orderBy('createdAt', 'asc')),
        (snapshot) => onChange(snapshot.docs.map((document) => document.data())),
        onError,
      );
    } catch (caught) {
      if (!cancelled) onError(caught instanceof Error ? caught : new Error('구독 실패'));
    }
  })();

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}

export async function createCat(uid: string, id: string, input: NewCat): Promise<void> {
  const { firestore, catConverter, db } = await load();
  const now = new Date().toISOString();

  await firestore.setDoc(
    firestore.doc(firestore.collection(db, 'users', uid, 'cats').withConverter(catConverter), id),
    { ...input, id, createdAt: now, updatedAt: now },
  );
}

/** 부분 갱신. records.ts와 같은 이유로 사진을 직접 눕힌다 (updateDoc은 변환기를 타지 않는다) */
export async function patchCat(uid: string, id: string, patch: Partial<NewCat>): Promise<void> {
  const [{ firestore, db }, { toStoredPhoto }] = await Promise.all([
    load(),
    import('./converters'),
  ]);

  await firestore.updateDoc(firestore.doc(db, 'users', uid, 'cats', id), {
    ...patch,
    ...('photo' in patch ? { photo: patch.photo ? toStoredPhoto(patch.photo) : null } : {}),
    updatedAt: firestore.serverTimestamp(),
  });
}

/**
 * 프로필 삭제.
 *
 * 그 아이를 참조하던 기록은 **지우지 않고** catId만 null(미지정)로 되돌린다.
 * 프로필을 지웠다고 몇 달치 급여 기록이 함께 사라지면 곤란하기 때문이고,
 * 지금 로컬 모드의 동작과도 같다.
 *
 * 프로필 삭제와 기록 갱신을 batch로 묶어 둘 중 하나만 반영되는 상태를 막는다.
 */
export async function deleteCat(uid: string, id: string): Promise<void> {
  const { firestore, db } = await load();

  const referencing = await firestore.getDocs(
    firestore.query(
      firestore.collection(db, 'users', uid, 'records'),
      firestore.where('catId', '==', id),
    ),
  );

  const batch = firestore.writeBatch(db);
  batch.delete(firestore.doc(db, 'users', uid, 'cats', id));
  for (const record of referencing.docs) {
    batch.update(record.ref, { catId: null, updatedAt: firestore.serverTimestamp() });
  }
  await batch.commit();
}

/** 첫 로그인 때 이 기기에 있던 프로필을 옮길 때 쓴다 */
export async function uploadCats(uid: string, cats: Cat[]): Promise<void> {
  const { firestore, catConverter, db } = await load();
  const ref = firestore.collection(db, 'users', uid, 'cats').withConverter(catConverter);

  for (let start = 0; start < cats.length; start += 400) {
    const batch = firestore.writeBatch(db);
    for (const cat of cats.slice(start, start + 400)) {
      batch.set(firestore.doc(ref, cat.id), cat);
    }
    await batch.commit();
  }
}

/** 계정의 프로필을 전부 지운다 (설정 → 기록 전체 지우기) */
export async function deleteAllCats(uid: string): Promise<void> {
  const { firestore, db } = await load();
  const snapshot = await firestore.getDocs(firestore.collection(db, 'users', uid, 'cats'));

  const docs = snapshot.docs;
  for (let start = 0; start < docs.length; start += 400) {
    const batch = firestore.writeBatch(db);
    for (const document of docs.slice(start, start + 400)) batch.delete(document.ref);
    await batch.commit();
  }
}
