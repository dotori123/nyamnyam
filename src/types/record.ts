/**
 * 냥냠냠(NyamNyam) — 사료/습식 기록 도메인 타입
 *
 * ⚠️ 이 파일의 인터페이스는 그대로 Firestore 문서 구조가 됩니다.
 *
 * Firestore 매핑 계획
 * ────────────────────────────────────────────────────────────
 *   users/{uid}/records/{recordId}      → FeedRecord
 *   users/{uid}/cats/{catId}            → Cat (types/cat.ts)
 *
 * 규칙
 *  1. 중첩 배열(배열 안의 배열)은 쓰지 않는다. Firestore가 지원하지 않음.
 *  2. `undefined`를 쓰지 않고 `null`을 쓴다. Firestore는 undefined를 저장하지 못함.
 *  3. 날짜는 앱 내부에서 ISO 8601 문자열로 다루고,
 *     Firestore 저장 시 converter에서 `Timestamp`로 바꾼다.
 *     (자리: src/firebase/converters.ts)
 *  4. 검색/필터에 쓰는 필드는 문서 최상위에 평평하게 둔다 (색인 가능하도록).
 */

import type { Photo } from './photo';

/** ISO 8601 문자열. Firestore 저장 시 Timestamp로 변환된다. */
export type IsoDateString = string;

/** 사료 종류 */
export type FoodType = 'dry' | 'wet' | 'treat' | 'supplement';

/** 배변 상태 */
export type StoolStatus = 'good' | 'soft' | 'diarrhea' | 'hard' | 'constipated' | 'unknown';

/** 재구매 의향 */
export type RepurchaseIntent = 'yes' | 'maybe' | 'no';

/** 용량 단위 */
export type VolumeUnit = 'g' | 'kg' | 'ml' | 'ea' | 'pack';

/** 만족도 (하트 1~5) */
export type Rating = 1 | 2 | 3 | 4 | 5;

/** 용량 정보. 입력하지 않으면 record.volume === null */
export interface Volume {
  amount: number;
  unit: VolumeUnit;
}

/**
 * 사료/습식 기록 1건.
 * → Firestore: users/{uid}/records/{id}
 */
export interface FeedRecord {
  /** Firestore 문서 ID와 동일하게 유지한다 */
  id: string;

  /** 어느 고양이의 기록인지. 미지정이면 null (다묘 가정 대응) */
  catId: string | null;

  // ── 제품 정보 ──────────────────────────────
  /** 브랜드명. 필터에 쓰이므로 최상위 평문 필드 */
  brand: string;
  /** 제품명 */
  productName: string;
  /** 맛 (예: 참치, 닭가슴살). 필터에 쓰임 */
  flavor: string;
  foodType: FoodType;
  /** 용량. 미입력 시 null */
  volume: Volume | null;

  // ── 평가 ──────────────────────────────────
  /** 만족도 (하트 1~5) */
  rating: Rating;
  /** 배변 상태 */
  stool: StoolStatus;
  /** 재구매 의향 */
  repurchase: RepurchaseIntent;

  // ── 구매 정보 ──────────────────────────────
  /** 가격(원). 미입력 시 null */
  price: number | null;
  /** 통화. 확장 대비해 필드로 둔다 */
  currency: 'KRW';
  /** 구매처 (쿠팡, 마이펫샵 등) */
  store: string;
  /** 구매일 ISO. 미입력 시 null */
  purchasedAt: IsoDateString | null;

  // ── 기타 ──────────────────────────────────
  photos: Photo[];
  memo: string;
  /** 자유 태그. Firestore array-contains 쿼리로 필터 가능 */
  tags: string[];

  // ── 메타 ──────────────────────────────────
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
}

/**
 * 폼에서 다루는 값.
 * 숫자 입력을 문자열로 들고 있다가 저장 시점에 파싱한다
 * (빈 문자열 ↔ null 구분을 위해).
 */
export interface FeedRecordFormValues {
  /** 선택된 고양이. 미지정이면 빈 문자열 */
  catId: string;
  brand: string;
  productName: string;
  flavor: string;
  foodType: FoodType;
  volumeAmount: string;
  volumeUnit: VolumeUnit;
  rating: Rating;
  stool: StoolStatus;
  repurchase: RepurchaseIntent;
  price: string;
  store: string;
  purchasedAt: string;
  photos: Photo[];
  memo: string;
  /** 쉼표로 구분된 태그 문자열. 저장 시 string[]로 파싱한다 */
  tags: string;
}

/** 새 기록 생성 시 서버가 채우는 필드를 뺀 입력값 */
export type NewFeedRecord = Omit<FeedRecord, 'id' | 'createdAt' | 'updatedAt'>;

// ── 목록 정렬 / 필터 ─────────────────────────
export type SortKey = 'latest' | 'rating' | 'priceLow' | 'priceHigh';

export interface RecordFilters {
  /** 제품명·브랜드·맛·메모·태그 통합 검색어 */
  query: string;
  /** 선택된 브랜드. 빈 배열이면 전체 */
  brands: string[];
  /** 선택된 맛. 빈 배열이면 전체 */
  flavors: string[];
  /** 선택된 종류. null이면 전체 */
  foodType: FoodType | null;
  /** 선택된 고양이. null이면 전체 */
  catId: string | null;
  sort: SortKey;
}
