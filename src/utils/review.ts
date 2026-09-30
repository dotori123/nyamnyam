import type { FeedRecord, Rating } from '../types';

/**
 * "평가 전" — 사 두었지만 아직 먹여 보지 않은 기록.
 *
 * 만족도가 null이면 평가 전이다. 폼에서 하트를 고르지 않고 저장하거나
 * 주문내역 붙여넣기로 한꺼번에 등록하면 이렇게 저장된다.
 * 배변·재구매도 각자 null(안 고름)일 수 있어서, 세는 곳마다 그 값이 있는 기록만 센다.
 * 평가 전이어도 지출·종류·단가처럼 산 사실만으로 세는 집계에는 넣는다.
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

/**
 * 예전에 저장된 평가 전 기록 고쳐 읽기.
 *
 * 배변·재구매에 "안 고름"(null)이 생기기 전에는 평가 전 기록에도
 * 배변 'unknown'·재구매 'maybe'를 기본값으로 넣었다. 사용자가 고른 값이 아니므로
 * 불러올 때 null로 되돌린다 (RecordsProvider가 로컬·계정 기록 모두 여기를 거친다).
 */
export function normalizeReview(record: FeedRecord): FeedRecord {
  if (record.rating === null && record.stool === 'unknown' && record.repurchase === 'maybe') {
    return { ...record, stool: null, repurchase: null };
  }
  return record;
}
