import type { FeedRecord, Rating } from '../types';

/**
 * "평가 전" — 사 두었지만 아직 먹여 보지 않은 기록.
 *
 * 만족도가 null이면 평가 전이다. 주문내역 붙여넣기로 한꺼번에 등록하거나,
 * 폼에서 "평가 전으로 두기"를 고르면 이렇게 저장된다.
 * 평가 전 기록의 배변·재구매 값은 채워져 있어도 결과가 아니므로
 * 만족도·배변·재구매를 세는 곳에서는 이 함수로 걸러 낸다 (지출은 그대로 센다).
 */
export type RatedRecord = FeedRecord & { rating: Rating };

export function isRated(record: FeedRecord): record is RatedRecord {
  return record.rating !== null;
}

/** 만족도 평균. 평가한 기록이 없으면 null */
export function averageRating(records: FeedRecord[]): number | null {
  const rated = records.filter(isRated);
  if (rated.length === 0) return null;
  return rated.reduce((sum, record) => sum + record.rating, 0) / rated.length;
}
