import type { Photo } from '../types';

/**
 * 사진 원본(Blob) 보관소 — IndexedDB.
 *
 * `URL.createObjectURL()`이 만든 blob URL은 탭을 닫으면 죽는다.
 * 그래서 기록·프로필에는 메타데이터만 남기고(localStorage),
 * 원본 Blob은 사진 id를 키로 여기에 넣어 두었다가
 * 앱을 다시 열 때 blob URL을 새로 만들어 붙인다(hydrate).
 *
 * IndexedDB를 못 쓰는 환경(시크릿 모드 등)에서는 모든 함수가 조용히 실패한다.
 * 그때는 사진만 세션 한정으로 남고 나머지 기록은 그대로 저장된다.
 *
 * Firebase Storage 연동 후에는 이 파일이 필요 없다.
 * photo.url에 downloadURL이 들어가므로 hydrate 자체가 no-op이 된다.
 */

const DB_NAME = 'nyamnyam';
const DB_VERSION = 1;
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise<IDBDatabase | null>((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) {
          request.result.createObjectStore(STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** 트랜잭션 한 번. 실패하면 null을 돌려주고 호출부는 "없음"으로 처리한다 */
async function run<T>(
  mode: IDBTransactionMode,
  request: (store: IDBObjectStore) => IDBRequest,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;

  return new Promise<T | null>((resolve) => {
    try {
      const req = request(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

/**
 * 사진 원본 저장.
 *
 * 폼을 저장하는 시점이 아니라 **고른 시점**에 넣는다.
 * 저장 시점까지 File을 들고 있다가 넣으면 코드가 복잡해지는데,
 * 폼을 취소해서 버려진 Blob은 어차피 다음 실행 때 prunePhotoBlobs가 치운다.
 */
export function putPhotoBlob(id: string, blob: Blob): void {
  void run('readwrite', (store) => store.put(blob, id));
}

function getPhotoBlob(id: string): Promise<Blob | null> {
  return run<Blob>('readonly', (store) => store.get(id));
}

/**
 * 어떤 기록·프로필도 참조하지 않는 원본을 지운다.
 *
 * 폼 취소, 사진 삭제, 기록 삭제를 각각 추적하는 대신
 * 앱 시작 때 "지금 살아있는 사진 id" 전체와 비교해 한 번에 정리한다.
 */
export async function prunePhotoBlobs(keepIds: Set<string>): Promise<void> {
  const keys = await run<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  if (!keys) return;

  const orphans = keys.filter((key) => typeof key === 'string' && !keepIds.has(key));
  for (const key of orphans) {
    await run('readwrite', (store) => store.delete(key));
  }
}

// ── 직렬화 ────────────────────────────────────

/** 저장용으로 눕히기 — blob URL은 다음 세션에서 죽은 주소라 비운다 */
export function dehydratePhoto(photo: Photo): Photo {
  return photo.url.startsWith('blob:') ? { ...photo, url: '' } : photo;
}

/** hydrate가 필요한 사진(=url이 빈 사진)이 하나라도 있는지 */
export function needsHydration(photos: Photo[]): boolean {
  return photos.some((photo) => !photo.url);
}

/**
 * 사진 id → 이번 세션에서 만든 blob URL.
 *
 * Firestore를 구독하면 스냅샷이 올 때마다 hydrate가 다시 돌아서,
 * 캐시가 없으면 같은 사진에 blob URL이 계속 새로 생기고 앞의 것들이 샌다.
 * 탭이 닫히면 어차피 모두 회수되므로 revoke는 하지 않는다.
 */
const urlCache = new Map<string, string>();

/**
 * 저장된 사진을 화면에 쓸 수 있게 되살린다.
 * 원본이 없으면(다른 기기, 브라우저가 저장소를 비운 경우) 조용히 버린다 — 깨진 이미지보다 낫다.
 */
export async function hydratePhotos(photos: Photo[]): Promise<Photo[]> {
  const restored: Photo[] = [];

  for (const photo of photos) {
    if (photo.url) {
      restored.push(photo);
      continue;
    }

    const cached = urlCache.get(photo.id);
    if (cached) {
      restored.push({ ...photo, url: cached });
      continue;
    }

    const blob = await getPhotoBlob(photo.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      urlCache.set(photo.id, url);
      restored.push({ ...photo, url });
    }
  }

  return restored;
}

/** 프로필 사진처럼 1장짜리용 */
export async function hydratePhoto(photo: Photo | null): Promise<Photo | null> {
  if (!photo) return null;
  const [restored] = await hydratePhotos([photo]);
  return restored ?? null;
}

/** 사진 원본을 전부 비운다 (설정 → 기록 전체 지우기) */
export async function clearPhotoBlobs(): Promise<void> {
  urlCache.clear();
  await run('readwrite', (store) => store.clear());
}

// ── 백업용 ────────────────────────────────────

/** 저장된 사진 전부. 내보내기에서 쓴다 */
export async function readAllPhotoBlobs(): Promise<Map<string, Blob>> {
  const keys = await run<IDBValidKey[]>('readonly', (store) => store.getAllKeys());
  const blobs = await run<Blob[]>('readonly', (store) => store.getAll());
  if (!keys || !blobs) return new Map();

  const entries = new Map<string, Blob>();
  keys.forEach((key, index) => {
    const blob = blobs[index];
    if (typeof key === 'string' && blob) entries.set(key, blob);
  });
  return entries;
}

/**
 * 사진 여러 장을 한 번에 넣는다. 가져오기에서 쓴다.
 * putPhotoBlob과 달리 끝날 때까지 기다린다 — 다 들어간 뒤에 새로고침해야 하기 때문.
 */
export async function writePhotoBlobs(entries: [string, Blob][]): Promise<void> {
  for (const [id, blob] of entries) {
    await run('readwrite', (store) => store.put(blob, id));
  }
}
