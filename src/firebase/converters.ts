import {
  Timestamp,
  type DocumentData,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from 'firebase/firestore';
import type { Cat, FeedRecord, Photo } from '../types';

/**
 * Firestore ↔ 앱 타입 변환.
 *
 * 앱은 날짜를 ISO 8601 문자열로 다루고 Firestore는 Timestamp로 저장한다.
 * 그 변환을 여기 한 곳에 모아 두면 나머지 코드는 날짜 형식을 신경 쓰지 않아도 된다.
 *
 * 사진에 대해:
 *   지금 단계에서는 사진 원본을 Storage에 올리지 않고 이 기기의 IndexedDB에 둔다.
 *   그래서 Firestore에는 **메타데이터만** 저장하고 url은 비운다.
 *   blob URL은 다음 세션이면 죽는 주소라 남겨 봐야 쓸모가 없고,
 *   data URL을 그대로 넣으면 문서 1MB 제한에 걸리고 요금도 늘어난다.
 *   → 다른 기기에서 열면 사진만 빠진 기록이 보인다. 이건 Storage를 붙이면 해결된다.
 */

/**
 * 저장용으로 사진을 눕힌다. 화면용 주소(blob:)는 이 기기 밖에서 의미가 없다.
 *
 * **부분 갱신(updateDoc)에서도 반드시 거쳐야 한다.** 변환기는 setDoc에만 걸려서,
 * 수정 경로가 이걸 빼먹으면 blob: 주소가 그대로 저장되고 다음에 열 때 깨진 이미지가 된다.
 */
export function toStoredPhoto(photo: Photo) {
  return {
    id: photo.id,
    url: photo.url.startsWith('data:') ? photo.url : '',
    storagePath: photo.storagePath,
    source: photo.source,
    fileName: photo.fileName,
  };
}

/** Firestore에서 읽은 값이 사진 모양인지 확인하고 앱 타입으로 맞춘다 */
function toPhoto(value: unknown): Photo | null {
  if (typeof value !== 'object' || value === null) return null;
  const photo = value as Partial<Photo>;
  if (typeof photo.id !== 'string') return null;

  return {
    id: photo.id,
    url: typeof photo.url === 'string' ? photo.url : '',
    storagePath: typeof photo.storagePath === 'string' ? photo.storagePath : null,
    source: photo.source === 'camera' ? 'camera' : 'library',
    fileName: typeof photo.fileName === 'string' ? photo.fileName : null,
  };
}

/** ISO 문자열 → Timestamp. 빈 값은 null 그대로 (Firestore는 undefined를 저장하지 못한다) */
function toTimestamp(iso: string | null): Timestamp | null {
  return iso ? Timestamp.fromDate(new Date(iso)) : null;
}

/**
 * Timestamp → ISO 문자열.
 * 방금 쓴 문서를 서버 응답 전에 되읽으면 Timestamp가 아직 없을 수 있어 fallback을 둔다.
 */
function toIso(value: unknown, fallback: string): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return fallback;
}

function toIsoOrNull(value: unknown): string | null {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (typeof value === 'string') return value;
  return null;
}

export const feedRecordConverter: FirestoreDataConverter<FeedRecord> = {
  toFirestore(record: FeedRecord): DocumentData {
    // id는 문서 id로 들어가므로 본문에 중복 저장하지 않는다
    const { id: _id, createdAt, updatedAt, purchasedAt, photos, ...rest } = record;
    void _id;

    return {
      ...rest,
      photos: photos.map(toStoredPhoto),
      purchasedAt: toTimestamp(purchasedAt),
      createdAt: toTimestamp(createdAt),
      updatedAt: toTimestamp(updatedAt),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): FeedRecord {
    const data = snapshot.data(options);
    const now = new Date().toISOString();

    return {
      ...(data as Omit<FeedRecord, 'id' | 'photos' | 'purchasedAt' | 'createdAt' | 'updatedAt'>),
      id: snapshot.id,
      photos: Array.isArray(data.photos)
        ? data.photos.map(toPhoto).filter((photo): photo is Photo => photo !== null)
        : [],
      purchasedAt: toIsoOrNull(data.purchasedAt),
      createdAt: toIso(data.createdAt, now),
      updatedAt: toIso(data.updatedAt, now),
    };
  },
};

export const catConverter: FirestoreDataConverter<Cat> = {
  toFirestore(cat: Cat): DocumentData {
    const { id: _id, createdAt, updatedAt, birthday, photo, ...rest } = cat;
    void _id;

    return {
      ...rest,
      photo: photo ? toStoredPhoto(photo) : null,
      birthday: toTimestamp(birthday),
      createdAt: toTimestamp(createdAt),
      updatedAt: toTimestamp(updatedAt),
    };
  },

  fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): Cat {
    const data = snapshot.data(options);
    const now = new Date().toISOString();

    return {
      ...(data as Omit<Cat, 'id' | 'photo' | 'birthday' | 'createdAt' | 'updatedAt'>),
      id: snapshot.id,
      photo: toPhoto(data.photo),
      birthday: toIsoOrNull(data.birthday),
      createdAt: toIso(data.createdAt, now),
      updatedAt: toIso(data.updatedAt, now),
    };
  },
};
