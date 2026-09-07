import type { FeedRecord, FoodType, RepurchaseIntent, StoolStatus } from '../types';
import { FOOD_TYPE_MAP, REPURCHASE_MAP, STOOL_MAP } from './options';

/**
 * 기록 집계.
 *
 * 화면(StatsPage)과 분리해 순수 함수로 둔다.
 * FeedRecord가 그대로 Firestore 문서라, 나중에 서버 집계로 옮기더라도
 * 여기 규칙(무엇을 세고 무엇을 빼는지)만 그대로 옮기면 된다.
 *
 * 공통 규칙
 *  - 가격이 없는 기록(price === null)은 지출 계산에서 뺀다. 0원으로 치면 평균이 왜곡된다.
 *  - 구매일이 없는 기록(purchasedAt === null)은 월별 지출에서 뺀다.
 *  - 만족도는 모든 기록에 있으므로(1~5 필수) 평균에서 뺄 일이 없다.
 */

export interface Summary {
  count: number;
  /** 평균 만족도. 기록이 없으면 0 */
  averageRating: number;
  /** 가격이 적힌 기록의 합계(원) */
  totalSpend: number;
  /** 가격이 적힌 기록 수 — "10건 중 7건 기준" 같은 안내에 쓴다 */
  pricedCount: number;
  /** 재구매 의향 비율 0~1 */
  repurchaseRate: number;
}

/** 막대 한 줄 */
export interface StatRow {
  key: string;
  label: string;
  /** 막대 길이를 정하는 값 */
  value: number;
  /** 이 줄이 몇 건에서 나왔는지 */
  count: number;
  /** 비율을 보여줄 때의 분모 ("5건 중 3건") */
  total?: number;
  /** 값 옆에 덧붙일 짧은 설명 ("100g당") */
  note?: string;
  emoji?: string;
}

/** 100g(또는 100ml)당 값. 환산할 수 없으면 null */
export interface UnitPrice {
  /** 100단위당 가격(원) */
  per100: number;
  /** 'g' | 'ml' — 무게와 부피를 섞어 세지 않도록 어느 쪽인지 들고 다닌다 */
  unit: 'g' | 'ml';
}

/**
 * 낱개로 파는 제품의 개당(팩당) 가격.
 *
 * 습식·츄르는 원래 개수로 판다. 한 개가 몇 그램인지는 앱이 알 수 없지만,
 * **"츄르 14개 12,900원 = 개당 921원"** 은 실제 구매 판단에 그대로 쓰이는 값이다.
 * 무게 단가와 단위가 달라 한 줄에 섞어 순위를 매기지는 않고, 표시할 때만 쓴다.
 */
export interface CountPrice {
  perItem: number;
  unit: 'ea' | 'pack';
}

export function countPricePerItem(record: FeedRecord): CountPrice | null {
  const { price, volume } = record;
  if (price === null || !volume || volume.amount <= 0) return null;
  if (volume.unit !== 'ea' && volume.unit !== 'pack') return null;

  return { perItem: price / volume.amount, unit: volume.unit };
}

/**
 * 기록 한 건의 100g/100ml당 단가.
 *
 * 개·팩 단위는 환산할 수 없어 null이다 (한 개가 몇 그램인지 앱이 알 방법이 없다).
 * 화면 표시용 문자열은 utils/format.ts의 formatUnitPrice가 이 값을 받아 만든다 —
 * 환산 규칙이 두 군데 있으면 언젠가 어긋난다.
 */
export function unitPricePer100(record: FeedRecord): UnitPrice | null {
  const { price, volume } = record;
  if (price === null || !volume || volume.amount <= 0) return null;

  if (volume.unit === 'g') return { per100: (price / volume.amount) * 100, unit: 'g' };
  if (volume.unit === 'ml') return { per100: (price / volume.amount) * 100, unit: 'ml' };
  if (volume.unit === 'kg') return { per100: (price / (volume.amount * 1000)) * 100, unit: 'g' };
  return null;
}

/**
 * 배변 상태 중 "좋지 않음"으로 볼 것들.
 * 'unknown'은 좋지도 나쁘지도 않은 게 아니라 **정보가 없는 것**이라
 * 비율을 낼 때 분모에서도 뺀다. 모름을 정상으로 치면 신호가 묽어진다.
 */
const TROUBLE_STOOLS: StoolStatus[] = ['soft', 'diarrhea', 'hard', 'constipated'];

export interface MonthSpend {
  /** 정렬·키용 yyyy-MM */
  key: string;
  /** 축에 쓸 짧은 이름 (예: 7월) */
  label: string;
  total: number;
}

export function summarize(records: FeedRecord[]): Summary {
  const count = records.length;
  if (count === 0) {
    return { count: 0, averageRating: 0, totalSpend: 0, pricedCount: 0, repurchaseRate: 0 };
  }

  const priced = records.filter((record) => record.price !== null);

  return {
    count,
    averageRating: records.reduce((sum, record) => sum + record.rating, 0) / count,
    totalSpend: priced.reduce((sum, record) => sum + (record.price ?? 0), 0),
    pricedCount: priced.length,
    repurchaseRate: records.filter((record) => record.repurchase === 'yes').length / count,
  };
}

/**
 * 브랜드별 평균 만족도 순위.
 *
 * 1건짜리 브랜드가 5.0으로 1등을 차지하면 순위가 의미를 잃어서
 * 기록 수를 함께 보여주고, 동점이면 기록이 많은 쪽을 위로 올린다.
 */
export function rankBrandsByRating(records: FeedRecord[], limit = 6): StatRow[] {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const record of records) {
    if (!record.brand) continue;
    const bucket = buckets.get(record.brand) ?? { sum: 0, count: 0 };
    bucket.sum += record.rating;
    bucket.count += 1;
    buckets.set(record.brand, bucket);
  }

  return [...buckets.entries()]
    .map(([brand, { sum, count }]) => ({
      key: brand,
      label: brand,
      value: sum / count,
      count,
    }))
    .sort((a, b) => b.value - a.value || b.count - a.count || a.label.localeCompare(b.label, 'ko'))
    .slice(0, limit);
}

/** 사료 종류별 기록 수. 한 건도 없는 종류는 빼고 많은 순으로 */
export function countByFoodType(records: FeedRecord[]): StatRow[] {
  const counts = new Map<FoodType, number>();
  for (const record of records) {
    counts.set(record.foodType, (counts.get(record.foodType) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([type, count]) => ({
      key: type,
      label: FOOD_TYPE_MAP[type].label,
      emoji: FOOD_TYPE_MAP[type].emoji,
      value: count,
      count,
    }))
    .sort((a, b) => b.value - a.value);
}

/** 재구매 의향 분포. 순서(재구매 → 고민중 → 안 살래)가 의미를 가지므로 정렬하지 않는다 */
export function countByRepurchase(records: FeedRecord[]): StatRow[] {
  const order: RepurchaseIntent[] = ['yes', 'maybe', 'no'];
  return order.map((intent) => {
    const count = records.filter((record) => record.repurchase === intent).length;
    return {
      key: intent,
      label: REPURCHASE_MAP[intent].label,
      emoji: REPURCHASE_MAP[intent].emoji,
      value: count,
      count,
    };
  });
}

/**
 * 최근 N개월 지출.
 * 기록이 없는 달도 0으로 채워야 "안 산 달"이 빈칸으로 보인다.
 */
export function monthlySpend(records: FeedRecord[], months = 6): MonthSpend[] {
  const now = new Date();
  const buckets = new Map<string, number>();

  // 최근 N개월 슬롯을 먼저 0으로 깔아 둔다
  for (let back = months - 1; back >= 0; back -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - back, 1);
    buckets.set(monthKey(date), 0);
  }

  for (const record of records) {
    if (!record.purchasedAt || record.price === null) continue;
    const key = monthKey(new Date(record.purchasedAt));
    // 슬롯에 있는 달만 더한다 (그보다 오래된 기록은 이 차트의 관심 밖)
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + record.price);
  }

  return [...buckets.entries()].map(([key, total]) => ({
    key,
    label: `${Number(key.slice(5))}월`,
    total,
  }));
}

/**
 * 100g당 단가가 싼 순.
 *
 * 건사료(kg)와 습식(g)이 섞여 있어도 100단위로 맞추면 비교가 된다.
 * 다만 사료와 간식을 나란히 두면 "츄르가 비싸다"는 당연한 결론이 위로 올라오므로,
 * 어느 종류인지 이모지로 함께 보여준다.
 *
 * ml은 g과 따로 표기하되 같은 목록에 둔다. 사료·습식은 밀도가 물과 비슷해
 * 100ml과 100g을 나란히 보는 게 실제 구매 판단에 더 가깝다.
 */
export function rankByUnitPrice(records: FeedRecord[], limit = 6): StatRow[] {
  return records
    .map((record) => ({ record, unitPrice: unitPricePer100(record) }))
    .filter(
      (entry): entry is { record: FeedRecord; unitPrice: UnitPrice } => entry.unitPrice !== null,
    )
    .map(({ record, unitPrice }) => ({
      key: record.id,
      label: [record.brand, record.productName].filter(Boolean).join(' '),
      emoji: FOOD_TYPE_MAP[record.foodType].emoji,
      value: Math.round(unitPrice.per100),
      count: 1,
      note: `100${unitPrice.unit}당`,
    }))
    .sort((a, b) => a.value - b.value)
    .slice(0, limit);
}

/** 단가를 낼 수 있는 기록 수. "몇 건 기준"을 적어 주려고 따로 센다 */
export function countComparableForUnitPrice(records: FeedRecord[]): number {
  return records.filter((record) => unitPricePer100(record) !== null).length;
}

/** 배변 상태 분포. 순서(좋음 → 나쁨 → 모름)가 의미를 가지므로 정렬하지 않는다 */
export function countByStool(records: FeedRecord[]): StatRow[] {
  const order: StoolStatus[] = ['good', 'soft', 'diarrhea', 'hard', 'constipated', 'unknown'];
  return order.map((stool) => {
    const count = records.filter((record) => record.stool === stool).length;
    return {
      key: stool,
      label: STOOL_MAP[stool].label,
      emoji: STOOL_MAP[stool].emoji,
      value: count,
      count,
    };
  });
}

/**
 * 배변이 안 좋았던 브랜드.
 *
 * 사료 기록장에서 제일 쓸모 있는 신호다 — "이 사료 먹으면 변이 무르더라"를
 * 사람이 기억에 의존하지 않고 볼 수 있게 한다.
 *
 * 다만 1건짜리 브랜드가 100%로 맨 위에 오면 사료를 억울하게 낙인찍는 셈이라,
 * 분모(판정 가능한 기록 수)를 항상 같이 보여주고 화면에서도 그 점을 적어 둔다.
 */
export function rankBrandsByStoolTrouble(records: FeedRecord[], limit = 5): StatRow[] {
  const buckets = new Map<string, { trouble: number; judged: number }>();

  for (const record of records) {
    if (!record.brand) continue;
    // 모름은 분모에서도 뺀다
    if (record.stool === 'unknown') continue;

    const bucket = buckets.get(record.brand) ?? { trouble: 0, judged: 0 };
    bucket.judged += 1;
    if (TROUBLE_STOOLS.includes(record.stool)) bucket.trouble += 1;
    buckets.set(record.brand, bucket);
  }

  return [...buckets.entries()]
    .filter(([, { trouble }]) => trouble > 0)
    .map(([brand, { trouble, judged }]) => ({
      key: brand,
      label: brand,
      value: trouble / judged,
      count: trouble,
      total: judged,
    }))
    .sort((a, b) => b.value - a.value || b.count - a.count || a.label.localeCompare(b.label, 'ko'))
    .slice(0, limit);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
