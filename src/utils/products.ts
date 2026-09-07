import type { FeedRecord, FoodType, Photo, Rating, SortKey } from '../types';
import { countPricePerItem, unitPricePer100 } from './stats';

/**
 * 같은 제품을 묶어 보기.
 *
 * 이 앱을 쓰는 이유가 "다음에 살 때 참고"라서, 같은 제품을 여러 번 산 기록이
 * 시간순으로 흩어져 있으면 정작 필요한 걸 못 본다 —
 * "이거 저번에 얼마였지, 어디가 쌌지, 애가 좋아했나".
 *
 * 기록 자체는 그대로 둔다. 같은 제품을 또 사면 기록은 2건이 맞다
 * (가격도 구매처도 다르니까). 묶는 건 **보여줄 때만** 한다.
 */

export interface Purchase {
  recordId: string;
  price: number | null;
  store: string;
  /** 구매일. 없으면 기록 생성일로 대신한다 */
  date: string;
  rating: Rating;
}

export interface ProductGroup {
  key: string;
  brand: string;
  productName: string;
  foodType: FoodType;
  /** 목록 썸네일. 사진이 있는 기록 중 가장 최근 것 */
  photo: Photo | null;
  /** 구매 이력. 최근 순 */
  purchases: Purchase[];
  averageRating: number;
  /** 가장 싸게 산 기록. 가격이 적힌 게 없으면 null */
  cheapest: Purchase | null;
  /** 가장 최근 구매 */
  latest: Purchase;
  /**
   * 평균 단가를 사람이 읽을 한 줄 ("100g당 평균 1,420원" / "개당 평균 921원").
   * 무게로 산 제품과 낱개로 산 제품을 같은 자리에 보여주려고 문자열로 만들어 둔다.
   */
  averageUnitPriceLabel: string | null;
  /** 정렬용 숫자. 무게로 환산되는 제품만 값이 있다 (개수 단위와 섞어 세지 않으려고) */
  sortableUnitPrice: number | null;
}

/**
 * 무엇을 "같은 제품"으로 볼지.
 *
 * 브랜드+제품명을 공백 정리하고 대소문자를 무시해 맞춘다.
 * "이나바 챠오"와 "이나바  챠오"를 다른 제품으로 세면 묶는 의미가 없다.
 * 맛(flavor)은 일부러 넣지 않는다 — 참치맛과 닭고기맛은 보통 같은 제품 라인이라
 * 가격 비교에는 같이 놓고 보는 편이 쓸모 있다.
 */
function productKey(record: FeedRecord): string {
  const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
  return `${normalize(record.brand)}|${normalize(record.productName)}`;
}

function toPurchase(record: FeedRecord): Purchase {
  return {
    recordId: record.id,
    price: record.price,
    store: record.store,
    // 구매일을 안 적었으면 기록한 날을 대신 쓴다. 순서라도 맞아야 "최근"이 의미를 가진다
    date: record.purchasedAt ?? record.createdAt,
    rating: record.rating,
  };
}

export function groupByProduct(records: FeedRecord[]): ProductGroup[] {
  const buckets = new Map<string, FeedRecord[]>();

  for (const record of records) {
    if (!record.brand && !record.productName) continue;
    const key = productKey(record);
    buckets.set(key, [...(buckets.get(key) ?? []), record]);
  }

  return [...buckets.entries()].map(([key, group]) => {
    // 최근 순으로 세워 두면 latest·썸네일·이력이 전부 이 순서에서 나온다
    const sorted = [...group].sort(
      (a, b) => Date.parse(toPurchase(b).date) - Date.parse(toPurchase(a).date),
    );
    const purchases = sorted.map(toPurchase);

    const priced = purchases.filter((purchase) => purchase.price !== null);
    const cheapest = priced.length
      ? priced.reduce((min, purchase) => ((purchase.price ?? 0) < (min.price ?? 0) ? purchase : min))
      : null;

    const unitPrices = sorted
      .map(unitPricePer100)
      .filter((value): value is { per100: number; unit: 'g' | 'ml' } => value !== null);

    // 무게로 환산이 안 되는 제품(습식·츄르처럼 개수로 파는 것)은 개당 가격으로 적는다
    const countPrices = sorted
      .map(countPricePerItem)
      .filter((value): value is { perItem: number; unit: 'ea' | 'pack' } => value !== null);

    const average = (values: number[]) => values.reduce((sum, v) => sum + v, 0) / values.length;
    const won = (value: number) => Math.round(value).toLocaleString('ko-KR');

    let averageUnitPriceLabel: string | null = null;
    if (unitPrices.length) {
      // 단위가 섞여 있으면 많은 쪽으로 적는다
      const unit = unitPrices.filter((v) => v.unit === 'ml').length > unitPrices.length / 2 ? 'ml' : 'g';
      averageUnitPriceLabel = `100${unit}당 평균 ${won(average(unitPrices.map((v) => v.per100)))}원`;
    } else if (countPrices.length) {
      const label = countPrices[0].unit === 'pack' ? '팩당' : '개당';
      averageUnitPriceLabel = `${label} 평균 ${won(average(countPrices.map((v) => v.perItem)))}원`;
    }

    return {
      key,
      // 표기는 가장 최근에 적은 걸 따른다 (오타를 고쳤다면 새 표기가 맞을 테니)
      brand: sorted[0].brand,
      productName: sorted[0].productName,
      foodType: sorted[0].foodType,
      photo: sorted.find((record) => record.photos.some((photo) => photo.url))?.photos[0] ?? null,
      purchases,
      averageRating: group.reduce((sum, record) => sum + record.rating, 0) / group.length,
      cheapest,
      latest: purchases[0],
      averageUnitPriceLabel,
      sortableUnitPrice: unitPrices.length ? average(unitPrices.map((v) => v.per100)) : null,
    };
  });
}

/** 기록 목록과 같은 정렬 기준을 제품 묶음에도 적용한다 */
export function sortProducts(groups: ProductGroup[], sort: SortKey): ProductGroup[] {
  const byUnitPrice = (group: ProductGroup) => group.sortableUnitPrice;

  return [...groups].sort((a, b) => {
    switch (sort) {
      case 'rating':
        return b.averageRating - a.averageRating || b.purchases.length - a.purchases.length;
      case 'priceLow':
      case 'priceHigh': {
        const [x, y] = [byUnitPrice(a), byUnitPrice(b)];
        // 단가를 낼 수 없는 제품(개·팩 단위)은 항상 뒤로 보낸다
        if (x === null && y === null) return 0;
        if (x === null) return 1;
        if (y === null) return -1;
        return sort === 'priceLow' ? x - y : y - x;
      }
      default:
        return Date.parse(b.latest.date) - Date.parse(a.latest.date);
    }
  });
}
