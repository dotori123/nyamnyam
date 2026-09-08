import { getDb } from './config';

/**
 * 사진 동기화 — users/{uid}/photos/{photoId}
 *
 * Cloud Storage 대신 Firestore에 담는 이유:
 * 새 프로젝트에서 Cloud Storage를 켜려면 유료 요금제(카드 등록)로 올려야 한다.
 * 무료(Spark)로 유지하려고, 이미 줄여 둔 사진을 base64로 문서에 넣는다.
 *
 * ## 지켜야 하는 선
 *
 *  - **문서 하나는 1MiB를 못 넘는다.** base64는 원본의 약 4/3이라
 *    700KB 넘는 사진은 올리기 전에 한 번 더 줄인다(utils/image.ts).
 *  - **기록 목록과 같은 문서에 넣지 않는다.** 목록을 한 번 볼 때마다 사진까지
 *    전부 딸려오면 느리고 요금 한도도 금방 닳는다. 그래서 사진만 따로 둔다.
 *  - 화면에 그릴 때만 가져오고, 받아 온 것은 이 기기(IndexedDB)에 캐시한다.
 */

/** 문서 1MiB 한도에 여유를 둔 상한 (필드 이름·메타데이터 몫을 남긴다) */
export const MAX_PHOTO_DATA_LENGTH = 900_000;

interface PhotoDoc {
  /** "data:image/jpeg;base64,..." */
  data: string;
  type: string;
  size: number;
  createdAt: string;
}

async function load() {
  const [firestore, db] = await Promise.all([import('firebase/firestore'), getDb()]);
  return { firestore, db };
}

/**
 * 사진 한 장 올리기.
 *
 * 이미 있으면 덮어쓴다 — 같은 id면 같은 사진이라 내용이 달라질 일이 없다.
 * 너무 커서 못 올리면 false를 돌려준다. 그 사진은 이 기기에만 남는다
 * (올리지 못했다고 기록 저장을 막지는 않는다).
 */
export async function uploadPhoto(uid: string, id: string, dataUrl: string): Promise<boolean> {
  if (dataUrl.length > MAX_PHOTO_DATA_LENGTH) return false;

  const { firestore, db } = await load();
  const doc: PhotoDoc = {
    data: dataUrl,
    type: dataUrl.slice(5, dataUrl.indexOf(';')),
    size: dataUrl.length,
    createdAt: new Date().toISOString(),
  };

  await firestore.setDoc(firestore.doc(db, 'users', uid, 'photos', id), doc);
  return true;
}

/** 사진 한 장 가져오기. 없으면 null */
export async function fetchPhoto(uid: string, id: string): Promise<string | null> {
  const { firestore, db } = await load();
  const snapshot = await firestore.getDoc(firestore.doc(db, 'users', uid, 'photos', id));

  if (!snapshot.exists()) return null;
  const data = snapshot.data() as Partial<PhotoDoc>;
  return typeof data.data === 'string' ? data.data : null;
}

/** 계정의 사진을 전부 지운다 (설정 → 기록 전체 지우기) */
export async function deleteAllPhotos(uid: string): Promise<void> {
  const { firestore, db } = await load();
  const snapshot = await firestore.getDocs(firestore.collection(db, 'users', uid, 'photos'));

  const docs = snapshot.docs;
  for (let start = 0; start < docs.length; start += 400) {
    const batch = firestore.writeBatch(db);
    for (const document of docs.slice(start, start + 400)) batch.delete(document.ref);
    await batch.commit();
  }
}
