import type { Cat, FeedRecord } from '../types';
import { readArray, STORAGE_KEYS } from './local';
import { uploadCats } from '../firebase/cats';
import { uploadRecords } from '../firebase/records';
import { MAX_PHOTO_DATA_LENGTH, uploadPhoto } from '../firebase/photos';
import { readAllPhotoBlobs } from './photos';
import { blobToDataUrl, shrinkToBytes } from '../utils/image';
import { isSampleOnly } from './sample';

/**
 * 이 기기에 있던 기록을 계정으로 옮기기.
 *
 * 로그인하면 저장소가 Firestore로 바뀌는데, 그 계정이 비어 있으면 목록이 텅 빈 채로 뜬다.
 * 사용자 입장에서는 "내 기록 어디 갔지?"라서, 옮길지 먼저 물어보고 옮긴다.
 *
 * **로컬 데이터는 지우지 않고 복사만 한다.** 옮기는 도중 문제가 생겨도 원본이 남아 있고,
 * 로그아웃하면 그대로 다시 보인다.
 */

/** 계정별로 한 번만 묻기 위한 표시 */
function migratedKey(uid: string): string {
  return `nyamnyam.cloudMigrated.${uid}`;
}

/** 이번 세션에서 "나중에"를 누른 계정 (sessionStorage라 탭을 닫으면 초기화된다) */
function dismissedKey(uid: string): string {
  return `nyamnyam.cloudMigrateDismissed.${uid}`;
}

export interface LocalSnapshot {
  cats: Cat[];
  records: FeedRecord[];
}

/** 아직 계정으로 옮기지 않은 이 기기의 데이터 */
export function readLocalSnapshot(): LocalSnapshot {
  return {
    cats: readArray<Cat>(STORAGE_KEYS.cats) ?? [],
    records: readArray<FeedRecord>(STORAGE_KEYS.records) ?? [],
  };
}

/**
 * 손대지 않은 샘플 데이터인지.
 *
 * 첫 실행에 깔리는 샘플은 **사용자가 만든 것이 아니다.** 이걸 계정으로 옮기자고 물으면,
 * 눌렀을 때 계정에 샘플이 섞여 들어간다.
 * (배포 주소와 개발 주소는 오리진이 달라 localStorage가 따로다. 그래서 이미 옮긴 사람도
 *  배포본에서는 "샘플만 담긴" 배너를 다시 만나게 된다.)
 *
 * 가려내는 규칙은 백업 안내와 공유한다 — src/storage/sample.ts
 */
export function isUntouchedSample(snapshot: LocalSnapshot): boolean {
  return isSampleOnly(snapshot.records, snapshot.cats);
}

export function isMigrated(uid: string): boolean {
  try {
    return localStorage.getItem(migratedKey(uid)) === 'true';
  } catch {
    return false;
  }
}

export function isDismissed(uid: string): boolean {
  try {
    return sessionStorage.getItem(dismissedKey(uid)) === 'true';
  } catch {
    return false;
  }
}

export function dismissMigration(uid: string): void {
  try {
    sessionStorage.setItem(dismissedKey(uid), 'true');
  } catch {
    // 저장이 막혀도 이번 화면에서 숨기는 것까지는 동작한다
  }
}

/**
 * 옮기기 실행.
 *
 * 고양이를 먼저 올린다 — 기록이 catId로 고양이를 참조하므로,
 * 중간에 끊겨도 "고양이 없는 기록"보다 "기록 없는 고양이" 쪽이 덜 이상하다.
 */
export async function migrateLocalToCloud(uid: string): Promise<LocalSnapshot> {
  const snapshot = readLocalSnapshot();

  await uploadCats(uid, snapshot.cats);
  await uploadRecords(uid, snapshot.records);
  // 목록만 옮기고 사진을 두고 가면 다른 기기에서 사진 빠진 기록을 보게 된다
  await uploadReferencedPhotos(uid, snapshot);

  try {
    localStorage.setItem(migratedKey(uid), 'true');
  } catch {
    // 표시를 못 남기면 다음에 또 물어본다. 같은 id로 덮어쓰므로 중복은 생기지 않는다
  }

  return snapshot;
}

/**
 * 이 기기에 있는 사진 중 **실제로 참조되는 것만** 계정에 올린다.
 *
 * 한 장이 실패해도 나머지는 계속 올린다 — 사진 하나 때문에 옮기기 전체가
 * 실패하면, 사용자는 기록까지 못 옮긴 것으로 받아들인다.
 */
async function uploadReferencedPhotos(uid: string, snapshot: LocalSnapshot): Promise<void> {
  const referenced = new Set<string>();
  snapshot.records.forEach((record) => record.photos.forEach((photo) => referenced.add(photo.id)));
  snapshot.cats.forEach((cat) => {
    if (cat.photo) referenced.add(cat.photo.id);
  });
  if (referenced.size === 0) return;

  const stored = await readAllPhotoBlobs();

  for (const [id, blob] of stored) {
    if (!referenced.has(id)) continue;
    try {
      const fitted = await shrinkToBytes(blob, Math.floor(MAX_PHOTO_DATA_LENGTH * 0.72));
      if (fitted) await uploadPhoto(uid, id, await blobToDataUrl(fitted));
    } catch {
      // 이 사진만 이 기기에 남는다
    }
  }
}
