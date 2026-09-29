import type {
  CatGender,
  FoodType,
  RepurchaseIntent,
  StoolStatus,
  VolumeUnit,
  SortKey,
} from '../types';
import type { IconName } from '../components/common/icons';

interface Option<T> {
  value: T;
  label: string;
  /** 목록·칩에서 글자 앞에 붙는 아이콘. 상태값(배변·재구매)은 색으로 구분하므로 두지 않는다 */
  icon?: IconName;
}

export const FOOD_TYPE_OPTIONS: Option<FoodType>[] = [
  { value: 'dry', label: '건사료', icon: 'bowl' },
  { value: 'wet', label: '습식', icon: 'can' },
  { value: 'treat', label: '간식', icon: 'fish' },
  { value: 'supplement', label: '영양제', icon: 'pill' },
];

/**
 * 종류별로 흔히 쓰는 용량 단위.
 *
 * 습식·건사료는 봉지·캔에 g으로 적혀 있고, 츄르 같은 간식은 개수로 판다.
 * 매번 드롭다운을 바꾸는 수고를 덜려고 종류를 고르면 이 값으로 따라간다.
 * (이미 용량을 적은 뒤에는 바꾸지 않는다 — RecordForm 참고)
 */
export const DEFAULT_VOLUME_UNIT: Record<FoodType, VolumeUnit> = {
  dry: 'g',
  wet: 'g',
  treat: 'ea',
  supplement: 'ea',
};

export const STOOL_OPTIONS: Option<StoolStatus>[] = [
  { value: 'good', label: '좋음' },
  { value: 'soft', label: '무름' },
  { value: 'diarrhea', label: '설사' },
  { value: 'hard', label: '딱딱' },
  { value: 'constipated', label: '변비' },
  { value: 'unknown', label: '모름' },
];

export const REPURCHASE_OPTIONS: Option<RepurchaseIntent>[] = [
  { value: 'yes', label: '재구매' },
  { value: 'maybe', label: '고민중' },
  { value: 'no', label: '안 살래' },
];

export const VOLUME_UNIT_OPTIONS: Option<VolumeUnit>[] = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'ea', label: '개' },
  { value: 'pack', label: '팩' },
];

export const GENDER_OPTIONS: Option<CatGender>[] = [
  { value: 'male', label: '남아', icon: 'male' },
  { value: 'female', label: '여아', icon: 'female' },
  { value: 'unknown', label: '모름' },
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
