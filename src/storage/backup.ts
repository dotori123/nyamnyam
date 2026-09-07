import type { Cat, FeedRecord, Photo } from '../types';
import { readArray, STORAGE_KEYS, writeJson } from './local';
import { dehydratePhoto, readAllPhotoBlobs, writePhotoBlobs } from './photos';

/**
 * 백업 파일 내보내기 / 가져오기.
 *
 * 계정 동기화가 붙기 전까지는 기록이 이 기기 안에만 있다.
 * 폰을 바꾸거나 브라우저 저장소를 비우면 그대로 사라지므로,
 * 통째로 파일 하나에 담아 두고 다시 넣을 수 있게 한다.
 *
 * 사진도 함께 담는다. 사진 빠진 백업은 백업이라 부르기 어렵다.
 * Blob은 JSON에 못 담아서 base64(data URL)로 바꿔 넣는데,
 * 그만큼 파일이 커진다(대략 원본의 1.37배). 그래서 저장 전에 사진을 줄여 두는 게
 * (src/utils/image.ts) 여기서도 효과를 낸다.
 */

/** 파일 구조가 바뀌면 올린다. 가져오기에서 이 값을 보고 거른다 */
const BACKUP_VERSION = 1;
const BACKUP_APP = 'nyamnyam';

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: string;
  cats: Cat[];
  records: FeedRecord[];
  /** 사진 id → data URL. 기록·프로필의 photo.id로 참조된다 */
  photos: Record<string, string>;
}

export interface BackupSummary {
  cats: number;
  records: number;
  photos: number;
  /** 파일 크기(바이트). 내보내기 전에 대략을 보여줄 때도 쓴다 */
  bytes: number;
}

// ── 내보내기 ──────────────────────────────────

export async function buildBackup(): Promise<{ file: BackupFile; blob: Blob }> {
  const cats = readArray<Cat>(STORAGE_KEYS.cats) ?? [];
  const records = readArray<FeedRecord>(STORAGE_KEYS.records) ?? [];

  // 실제로 참조되는 사진만 담는다 (버려진 원본까지 백업할 이유는 없다)
  const referenced = collectPhotoIds(cats, records);
  const stored = await readAllPhotoBlobs();

  const photos: Record<string, string> = {};
  for (const [id, blob] of stored) {
    if (referenced.has(id)) photos[id] = await blobToDataUrl(blob);
  }

  const file: BackupFile = {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    // 저장된 모습 그대로 담는다. blob URL은 다음 세션에서 죽은 주소라 비운다
    cats: cats.map((cat) => ({ ...cat, photo: cat.photo ? dehydratePhoto(cat.photo) : null })),
    records: records.map((record) => ({
      ...record,
      photos: record.photos.map(dehydratePhoto),
    })),
    photos,
  };

  return { file, blob: new Blob([JSON.stringify(file)], { type: 'application/json' }) };
}

/** 내보내기 전에 "얼마나 큰 파일이 나올지" 안내하려고 미리 재 본다 */
export async function estimateBackupSize(): Promise<BackupSummary> {
  const cats = readArray<Cat>(STORAGE_KEYS.cats) ?? [];
  const records = readArray<FeedRecord>(STORAGE_KEYS.records) ?? [];
  const referenced = collectPhotoIds(cats, records);
  const stored = await readAllPhotoBlobs();

  let photoBytes = 0;
  let photoCount = 0;
  for (const [id, blob] of stored) {
    if (!referenced.has(id)) continue;
    photoCount += 1;
    // base64는 3바이트를 4글자로 늘린다
    photoBytes += Math.ceil(blob.size / 3) * 4;
  }

  const textBytes = JSON.stringify({ cats, records }).length;
  return { cats: cats.length, records: records.length, photos: photoCount, bytes: textBytes + photoBytes };
}

export function backupFileName(): string {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `냥냠냠-백업-${stamp}.json`;
}

// ── 가져오기 ──────────────────────────────────

export class BackupError extends Error {}

/**
 * 파일을 읽어 형태를 확인한다.
 *
 * 잘못된 파일을 그대로 넣으면 멀쩡한 기록이 사라지므로,
 * 덮어쓰기 전에 여기서 먼저 막는다.
 */
export async function parseBackup(file: File): Promise<BackupFile> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(await file.text());
  } catch {
    throw new BackupError('JSON 파일이 아니거나 내용이 깨졌어요.');
  }

  if (!isObject(parsed)) throw new BackupError('백업 파일 형식이 아니에요.');
  if (parsed.app !== BACKUP_APP) throw new BackupError('냥냠냠에서 내보낸 파일이 아니에요.');
  if (parsed.version !== BACKUP_VERSION) {
    throw new BackupError(`이 앱이 읽을 수 없는 버전이에요 (파일 v${String(parsed.version)}).`);
  }
  if (!Array.isArray(parsed.cats) || !Array.isArray(parsed.records)) {
    throw new BackupError('기록과 고양이 목록을 찾지 못했어요.');
  }
  if (!parsed.records.every(looksLikeRecord)) throw new BackupError('기록 형식이 맞지 않아요.');
  if (!parsed.cats.every(looksLikeCat)) throw new BackupError('고양이 프로필 형식이 맞지 않아요.');

  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    cats: parsed.cats as Cat[],
    records: parsed.records as FeedRecord[],
    photos: isObject(parsed.photos) ? (parsed.photos as Record<string, string>) : {},
  };
}

/**
 * 백업으로 통째로 바꾼다.
 *
 * 합치지 않고 교체한다. 같은 id가 섞이면 어느 쪽이 최신인지 알 방법이 없어서,
 * "백업 시점으로 되돌린다"는 규칙 하나로 가는 편이 예측 가능하다.
 * 부른 쪽에서 새로고침해 Provider들이 새 데이터를 다시 읽게 한다.
 */
export async function applyBackup(backup: BackupFile): Promise<void> {
  // 사진을 먼저 넣는다. 목록만 바뀌고 사진이 없으면 그림이 깨진 채로 보인다
  const entries: [string, Blob][] = [];
  for (const [id, dataUrl] of Object.entries(backup.photos)) {
    const blob = dataUrlToBlob(dataUrl);
    if (blob) entries.push([id, blob]);
  }
  await writePhotoBlobs(entries);

  writeJson(STORAGE_KEYS.cats, backup.cats);
  writeJson(STORAGE_KEYS.records, backup.records);
  // 고른 고양이는 백업에 담지 않는다. 프로필이 통째로 바뀌면 의미가 없어서 초기화한다
  writeJson(STORAGE_KEYS.selectedCat, null);
}

// ── 잔부품 ────────────────────────────────────

function collectPhotoIds(cats: Cat[], records: FeedRecord[]): Set<string> {
  const ids = new Set<string>();
  records.forEach((record) => record.photos?.forEach((photo: Photo) => ids.add(photo.id)));
  cats.forEach((cat) => {
    if (cat.photo) ids.add(cat.photo.id);
  });
  return ids;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function looksLikeRecord(value: unknown): boolean {
  return (
    isObject(value) &&
    typeof value.id === 'string' &&
    typeof value.brand === 'string' &&
    typeof value.rating === 'number' &&
    Array.isArray(value.photos)
  );
}

function looksLikeCat(value: unknown): boolean {
  return isObject(value) && typeof value.id === 'string' && typeof value.name === 'string';
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new BackupError('사진을 읽지 못했어요.'));
    reader.readAsDataURL(blob);
  });
}

/** data URL → Blob. 깨진 값이면 null (그 사진 한 장만 빠지고 나머지는 들어간다) */
function dataUrlToBlob(dataUrl: string): Blob | null {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!match) return null;

  try {
    const binary = atob(match[2]);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: match[1] });
  } catch {
    return null;
  }
}
