import type { FeedRecord, NewFeedRecord } from '../types';
import { getDb } from './config';

/**
 * 기록 CRUD — users/{uid}/records/{recordId}
 *
 * 화면은 이 함수들을 직접 부르지 않는다. RecordsProvider가 로그인 여부를 보고
 * 로컬 저장소와 이 함수들 중 하나를 고른다.
 *
 * **firestore 모듈을 정적으로 import하지 않는다.** 여기서 한 번이라도 정적으로 부르면
 * 첫 화면 번들에 그대로 딸려 들어간다. 로그인한 사람에게만 필요한 코드라 함수 안에서 가져온다.
 */

/** firestore 모듈과 변환기를 함께 가져온다. 두 번째부터는 브라우저 모듈 캐시가 돌려준다 */
async function load() {
  const [firestore, { feedRecordConverter }] = await Promise.all([
    import('firebase/firestore'),
    import('./converters'),
  ]);
  const db = await getDb();
  return { firestore, feedRecordConverter, db };
}

/**
 * 기록 목록 실시간 구독.
 *
 * 정렬은 createdAt 내림차순 하나만 서버에 맡긴다.
 * 만족도순·가격순은 화면에서 다시 정렬하는데, 그래야 Firestore 복합 색인을
 * 정렬 조합마다 만들지 않아도 된다 (기록 수가 수백 건 수준이라 클라이언트 정렬로 충분하다).
 *
 * 모듈을 내려받는 동안에도 곧바로 해지 함수를 돌려준다 —
 * 그 사이에 계정이 바뀌면 구독을 아예 시작하지 않는다.
 */
export function subscribeRecords(
  uid: string,
  onChange: (records: FeedRecord[]) => void,
  onError: (error: Error) => void,
): () => void {
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  void (async () => {
    try {
      const { firestore, feedRecordConverter, db } = await load();
      if (cancelled) return;

      const ref = firestore
        .collection(db, 'users', uid, 'records')
        .withConverter(feedRecordConverter);

      unsubscribe = firestore.onSnapshot(
        firestore.query(ref, firestore.orderBy('createdAt', 'desc')),
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

/**
 * 기록 추가.
 * id를 클라이언트에서 먼저 만든다 — 화면이 저장 직후 그 id로 이동하기 때문에
 * 서버 응답을 기다리지 않아야 오프라인에서도 매끄럽다.
 */
export async function createRecord(uid: string, id: string, input: NewFeedRecord): Promise<void> {
  const { firestore, feedRecordConverter, db } = await load();
  const now = new Date().toISOString();

  await firestore.setDoc(
    firestore.doc(firestore.collection(db, 'users', uid, 'records').withConverter(feedRecordConverter), id),
    { ...input, id, createdAt: now, updatedAt: now },
  );
}

export async function patchRecord(
  uid: string,
  id: string,
  patch: Partial<NewFeedRecord>,
): Promise<void> {
  const { firestore, db } = await load();

  // 변환기를 거치지 않는 부분 갱신이라 시간만 서버 값으로 직접 넣는다
  await firestore.updateDoc(firestore.doc(db, 'users', uid, 'records', id), {
    ...patch,
    updatedAt: firestore.serverTimestamp(),
  });
}

export async function deleteRecord(uid: string, id: string): Promise<void> {
  const { firestore, db } = await load();
  await firestore.deleteDoc(firestore.doc(db, 'users', uid, 'records', id));
}

/**
 * 여러 건을 한 번에 올린다 (첫 로그인 때 이 기기에 있던 기록을 옮길 때 쓴다).
 * 배치는 500건이 한도라 잘라서 보낸다.
 */
export async function uploadRecords(uid: string, records: FeedRecord[]): Promise<void> {
  const { firestore, feedRecordConverter, db } = await load();
  const ref = firestore.collection(db, 'users', uid, 'records').withConverter(feedRecordConverter);

  for (let start = 0; start < records.length; start += 400) {
    const batch = firestore.writeBatch(db);
    for (const record of records.slice(start, start + 400)) {
      batch.set(firestore.doc(ref, record.id), record);
    }
    await batch.commit();
  }
}
