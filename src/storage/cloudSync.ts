import type { Cat, FeedRecord } from '../types';
import { readArray, STORAGE_KEYS } from './local';
import { uploadCats } from '../firebase/cats';
import { uploadRecords } from '../firebase/records';

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
 * 샘플 id에는 mock에서 붙인 _mock_ 이 들어 있다.
 * 사용자가 만든 기록은 createId()가 만든 임의 문자열이라 겹치지 않는다.
 */
export function isUntouchedSample(snapshot: LocalSnapshot): boolean {
  const everything = [...snapshot.records, ...snapshot.cats];
  if (everything.length === 0) return true;
  return everything.every((item) => item.id.includes('_mock_'));
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

  try {
    localStorage.setItem(migratedKey(uid), 'true');
  } catch {
    // 표시를 못 남기면 다음에 또 물어본다. 같은 id로 덮어쓰므로 중복은 생기지 않는다
  }

  return snapshot;
}
