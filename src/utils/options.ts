import type {
  CatGender,
  FoodType,
  RepurchaseIntent,
  StoolStatus,
  VolumeUnit,
  SortKey,
} from '../types';

interface Option<T> {
  value: T;
  label: string;
  emoji?: string;
}

export const FOOD_TYPE_OPTIONS: Option<FoodType>[] = [
  { value: 'dry', label: '건사료', emoji: '🥣' },
  { value: 'wet', label: '습식', emoji: '🥫' },
  { value: 'treat', label: '간식', emoji: '🍤' },
  { value: 'supplement', label: '영양제', emoji: '💊' },
];

export const STOOL_OPTIONS: Option<StoolStatus>[] = [
  { value: 'good', label: '좋음', emoji: '💩' },
  { value: 'soft', label: '무름', emoji: '💧' },
  { value: 'diarrhea', label: '설사', emoji: '🌊' },
  { value: 'hard', label: '딱딱', emoji: '🪨' },
  { value: 'constipated', label: '변비', emoji: '😖' },
  { value: 'unknown', label: '모름', emoji: '❔' },
];

export const REPURCHASE_OPTIONS: Option<RepurchaseIntent>[] = [
  { value: 'yes', label: '재구매', emoji: '🔁' },
  { value: 'maybe', label: '고민중', emoji: '🤔' },
  { value: 'no', label: '안 살래', emoji: '🙅' },
];

export const VOLUME_UNIT_OPTIONS: Option<VolumeUnit>[] = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'ea', label: '개' },
  { value: 'pack', label: '팩' },
];

export const GENDER_OPTIONS: Option<CatGender>[] = [
  { value: 'male', label: '남아', emoji: '♂️' },
  { value: 'female', label: '여아', emoji: '♀️' },
  { value: 'unknown', label: '모름', emoji: '❔' },
];

export const SORT_OPTIONS: Option<SortKey>[] = [
  { value: 'latest', label: '최신순' },
  { value: 'rating', label: '만족도순' },
  { value: 'priceLow', label: '가격 낮은순' },
  { value: 'priceHigh', label: '가격 높은순' },
];

function toMap<T extends string>(options: Option<T>[]): Record<T, Option<T>> {
  return Object.fromEntries(options.map((o) => [o.value, o])) as Record<T, Option<T>>;
}

export const FOOD_TYPE_MAP = toMap(FOOD_TYPE_OPTIONS);
export const STOOL_MAP = toMap(STOOL_OPTIONS);
export const REPURCHASE_MAP = toMap(REPURCHASE_OPTIONS);
export const GENDER_MAP = toMap(GENDER_OPTIONS);
