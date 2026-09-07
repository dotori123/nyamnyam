import type { FeedRecord, Volume } from '../types';
import { countPricePerItem, unitPricePer100 } from './stats';

const priceFormatter = new Intl.NumberFormat('ko-KR');

export function formatPrice(price: number | null): string {
  if (price === null) return '가격 미입력';
  return `${priceFormatter.format(price)}원`;
}

export function formatVolume(volume: Volume | null): string | null {
  if (!volume) return null;
  const unitLabel = volume.unit === 'ea' ? '개' : volume.unit === 'pack' ? '팩' : volume.unit;
  return `${priceFormatter.format(volume.amount)}${unitLabel}`;
}

/**
 * 비교용 단가 한 줄.
 *
 * 무게·부피로 산 것은 100g/100ml당, 낱개로 산 것은 개당(팩당)으로 적는다.
 * 습식·츄르는 원래 개수로 팔아서, 개당 가격을 안 보여주면 정작 자주 사는 것들이
 * 전부 빈칸이 된다. 환산 규칙은 utils/stats.ts에 한 벌만 둔다.
 */
export function formatUnitPrice(record: FeedRecord): string | null {
  const unitPrice = unitPricePer100(record);
  if (unitPrice) {
    return `100${unitPrice.unit}당 ${priceFormatter.format(Math.round(unitPrice.per100))}원`;
  }

  const countPrice = countPricePerItem(record);
  if (countPrice) {
    const label = countPrice.unit === 'pack' ? '팩당' : '개당';
    return `${label} ${priceFormatter.format(Math.round(countPrice.perItem))}원`;
  }

  return null;
}

/** "3일 전" 같은 상대 시간 */
export function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffDay <= 0) return '오늘';
  if (diffDay === 1) return '어제';
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  return formatDate(iso);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

/** <input type="date"> 에 넣을 yyyy-MM-dd */
export function toDateInputValue(iso: string | null): string {
  if (!iso) return '';
  return new Date(iso).toISOString().slice(0, 10);
}

/**
 * 생일로부터 나이 표시. "2살 3개월" / 첫 해는 "7개월"
 * 생일 미입력이면 null.
 */
export function formatAge(birthday: string | null): string | null {
  if (!birthday) return null;

  const birth = new Date(birthday);
  const now = new Date();
  if (Number.isNaN(birth.getTime()) || birth > now) return null;

  let months =
    (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const restMonths = months % 12;

  if (years === 0) return `${restMonths}개월`;
  if (restMonths === 0) return `${years}살`;
  return `${years}살 ${restMonths}개월`;
}

export function formatWeight(weightKg: number | null): string | null {
  if (weightKg === null) return null;
  return `${weightKg}kg`;
}
