import { useMemo, useState } from 'react';
import type { FeedRecord, FoodType, RecordFilters, SortKey } from '../types';

const INITIAL_FILTERS: RecordFilters = {
  query: '',
  brands: [],
  flavors: [],
  foodType: null,
  catId: null,
  sort: 'latest',
};

function matchesQuery(record: FeedRecord, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    record.productName,
    record.brand,
    record.flavor,
    record.store,
    record.memo,
    ...record.tags,
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

function compare(a: FeedRecord, b: FeedRecord, sort: SortKey): number {
  switch (sort) {
    case 'rating':
      // 만족도 같으면 최신순
      return b.rating - a.rating || b.createdAt.localeCompare(a.createdAt);
    case 'priceLow':
      // 가격 미입력은 항상 뒤로
      return (a.price ?? Infinity) - (b.price ?? Infinity);
    case 'priceHigh':
      return (b.price ?? -Infinity) - (a.price ?? -Infinity);
    case 'latest':
    default:
      return b.createdAt.localeCompare(a.createdAt);
  }
}

/**
 * 목록 검색 · 필터 · 정렬 상태.
 *
 * Firestore 연동 후에는 정렬/필터 일부를 서버 쿼리(orderBy/where)로 옮길 수 있다.
 * 다만 통합 검색(query)은 Firestore가 부분일치를 지원하지 않으므로
 * 클라이언트 필터로 남기거나 별도 검색 서비스를 붙여야 한다.
 *
 * @param initialCatId 처음부터 특정 고양이로 좁혀서 열 때 (예: /?cat=xxx)
 */
export function useRecordFilters(records: FeedRecord[], initialCatId: string | null = null) {
  const [filters, setFilters] = useState<RecordFilters>(() => ({
    ...INITIAL_FILTERS,
    catId: initialCatId,
  }));

  const setQuery = (query: string) => setFilters((f) => ({ ...f, query }));
  const setSort = (sort: SortKey) => setFilters((f) => ({ ...f, sort }));
  const setFoodType = (foodType: FoodType | null) =>
    setFilters((f) => ({ ...f, foodType: f.foodType === foodType ? null : foodType }));

  /** 같은 고양이를 다시 누르면 전체로 돌아간다 */
  const setCatId = (catId: string | null) =>
    setFilters((f) => ({ ...f, catId: f.catId === catId ? null : catId }));

  const toggleBrand = (brand: string) =>
    setFilters((f) => ({
      ...f,
      brands: f.brands.includes(brand)
        ? f.brands.filter((b) => b !== brand)
        : [...f.brands, brand],
    }));

  const toggleFlavor = (flavor: string) =>
    setFilters((f) => ({
      ...f,
      flavors: f.flavors.includes(flavor)
        ? f.flavors.filter((v) => v !== flavor)
        : [...f.flavors, flavor],
    }));

  const reset = () => setFilters(INITIAL_FILTERS);

  const visibleRecords = useMemo(() => {
    return records
      .filter((record) => {
        if (!matchesQuery(record, filters.query)) return false;
        if (filters.brands.length && !filters.brands.includes(record.brand)) return false;
        if (filters.flavors.length && !filters.flavors.includes(record.flavor)) return false;
        if (filters.foodType && record.foodType !== filters.foodType) return false;
        if (filters.catId && record.catId !== filters.catId) return false;
        return true;
      })
      .sort((a, b) => compare(a, b, filters.sort));
  }, [records, filters]);

  const activeFilterCount =
    filters.brands.length +
    filters.flavors.length +
    (filters.foodType ? 1 : 0) +
    (filters.catId ? 1 : 0) +
    (filters.query.trim() ? 1 : 0);

  return {
    filters,
    visibleRecords,
    activeFilterCount,
    setQuery,
    setSort,
    setFoodType,
    setCatId,
    toggleBrand,
    toggleFlavor,
    reset,
  };
}
