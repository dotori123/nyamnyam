import type { FeedRecord } from '../types';
import { iconMarkup, type IconName } from '../components/common/icons';

/**
 * mock 데이터.
 * Firebase 연동 시 이 배열 대신 Firestore 쿼리 결과를 넣으면 된다.
 * (자리: src/firebase/records.ts)
 */

/** n일 전 ISO 문자열 */
function daysAgo(n: number, hour = 12): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

/**
 * 사진 자리를 채우는 인라인 SVG 썸네일.
 * 네트워크 없이 동작하도록 data URI로 만든다.
 * 실제 사진이 붙으면 이 함수는 지워도 된다.
 */
function thumb(icon: IconName, bg: string, fg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<rect width="400" height="400" fill="${bg}"/>
${iconMarkup(icon, fg, 110, 110, 180)}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let photoSeq = 0;
function photo(icon: IconName, bg: string, fg: string) {
  photoSeq += 1;
  return {
    id: `photo_mock_${photoSeq}`,
    url: thumb(icon, bg, fg),
    storagePath: null,
    source: 'library' as const,
    fileName: null,
  };
}

/**
 * 샘플 한 건. 구매일 = 기록일로 두고, 비어도 되는 칸은 빈 값으로 채운다.
 * id 끝의 번호만 넘기면 된다 — 샘플 id에는 _mock_ 이 들어가야 한다 (storage/sample.ts).
 */
function sample(
  no: string,
  daysBefore: number,
  fields: Omit<FeedRecord, 'id' | 'currency' | 'purchasedAt' | 'createdAt' | 'updatedAt' | 'photos' | 'memo' | 'tags'> &
    Partial<Pick<FeedRecord, 'photos' | 'memo' | 'tags'>>,
): FeedRecord {
  const at = daysAgo(daysBefore);
  return {
    id: `rec_mock_${no}`,
    currency: 'KRW',
    purchasedAt: at,
    createdAt: at,
    updatedAt: at,
    photos: [],
    memo: '',
    tags: [],
    ...fields,
  };
}

/**
 * 처음 연 사람이 둘러볼 샘플.
 *
 * 화면마다 빈 곳이 없도록 골랐다 — 고양이 두 마리, 종류 네 가지 모두,
 * 같은 제품을 여러 곳에서 산 기록(제품별 보기·최저가), g/개 단위가 섞인 단가,
 * 배변이 나빴던 사료, 최근 6개월에 흩어진 지출.
 *
 * 브랜드는 모두 지어낸 이름이다. 실제 제품에 "설사했다" 같은 평가를
 * 모든 새 사용자에게 보여주면 그 제품에 대한 주장처럼 읽힌다.
 */
export const MOCK_RECORDS: FeedRecord[] = [
  sample('01', 2, {
    catId: 'cat_mock_01',
    brand: '냥냥스틱',
    productName: '참치 스틱 간식',
    flavor: '참치',
    foodType: 'treat',
    volume: { amount: 14, unit: 'ea' },
    rating: 5,
    stool: 'good',
    repurchase: 'yes',
    price: 12_900,
    store: '온라인몰 A',
    photos: [photo('fish', '#ffd9c2', '#b85714')],
    memo: '흡입 수준. 손에서 놓질 않는다. 하루 1개로 제한 중.',
    tags: ['최애', '기호성갑'],
  }),
  sample('02', 9, {
    catId: 'cat_mock_01',
    brand: '오션키친',
    productName: '연어 무스 파우치',
    flavor: '연어',
    foodType: 'wet',
    // 85g × 12개입
    volume: { amount: 1020, unit: 'g' },
    rating: 5,
    stool: 'good',
    repurchase: 'yes',
    price: 18_900,
    store: '온라인몰 A',
    photos: [photo('can', '#fde3cf', '#b85714')],
    memo: '부드러워서 약 섞어 줄 때 좋다.',
    tags: ['최애'],
  }),
  sample('03', 48, {
    catId: 'cat_mock_01',
    brand: '오션키친',
    productName: '연어 무스 파우치',
    flavor: '연어',
    foodType: 'wet',
    volume: { amount: 1020, unit: 'g' },
    rating: 4,
    stool: 'good',
    repurchase: 'yes',
    price: 21_500,
    store: '동네 펫숍',
    memo: '급해서 동네에서 샀더니 비싸다.',
  }),
  sample('04', 91, {
    catId: 'cat_mock_01',
    brand: '오션키친',
    productName: '연어 무스 파우치',
    flavor: '연어',
    foodType: 'wet',
    volume: { amount: 1020, unit: 'g' },
    rating: 5,
    stool: 'good',
    repurchase: 'yes',
    price: 19_800,
    store: '온라인몰 B',
  }),
  sample('05', 30, {
    catId: 'cat_mock_01',
    brand: '포레스트펫',
    productName: '그레인프리 오리 & 연어',
    flavor: '오리',
    foodType: 'dry',
    volume: { amount: 2, unit: 'kg' },
    rating: 3,
    stool: 'soft',
    repurchase: 'maybe',
    price: 42_000,
    store: '대형마트',
    photos: [photo('bowl', '#f3e7d1', '#8f5a06')],
    memo: '알갱이가 커서 잘 안 씹는다. 바꾼 첫 주에 변이 조금 물렀다.',
  }),
  sample('06', 75, {
    catId: 'cat_mock_01',
    brand: '밀크캣',
    productName: '장 유산균 파우더',
    flavor: '',
    foodType: 'supplement',
    volume: { amount: 30, unit: 'ea' },
    rating: 4,
    stool: 'good',
    repurchase: 'maybe',
    price: 24_000,
    store: '온라인몰 B',
    photos: [photo('pill', '#e8eef3', '#3f5f7c')],
    memo: '습식에 섞으면 모르고 먹는다.',
  }),
  sample('07', 15, {
    catId: 'cat_mock_02',
    brand: '해피냥',
    productName: '동결건조 북어 트릿',
    flavor: '북어',
    foodType: 'treat',
    volume: { amount: 50, unit: 'g' },
    rating: 5,
    stool: 'good',
    repurchase: 'yes',
    price: 8_900,
    store: '동네 펫숍',
    tags: ['간식'],
  }),
  sample('08', 60, {
    catId: 'cat_mock_02',
    brand: '해피냥',
    productName: '인도어 캣 헤어볼 케어',
    flavor: '치킨',
    foodType: 'dry',
    volume: { amount: 1.5, unit: 'kg' },
    rating: 4,
    stool: 'good',
    repurchase: 'yes',
    price: 29_900,
    store: '온라인몰 A',
    photos: [photo('bowl', '#e3e8ee', '#3f5f7c')],
    memo: '토하는 횟수가 줄었다.',
  }),
  sample('09', 165, {
    catId: 'cat_mock_02',
    brand: '해피냥',
    productName: '인도어 캣 헤어볼 케어',
    flavor: '치킨',
    foodType: 'dry',
    volume: { amount: 1.5, unit: 'kg' },
    rating: 4,
    stool: 'good',
    repurchase: 'yes',
    price: 32_000,
    store: '동네 펫숍',
  }),
  sample('10', 120, {
    catId: 'cat_mock_02',
    brand: '냥이밥상',
    productName: '닭가슴살 캔',
    flavor: '닭가슴살',
    foodType: 'wet',
    // 160g × 24캔
    volume: { amount: 3840, unit: 'g' },
    rating: 2,
    stool: 'diarrhea',
    repurchase: 'no',
    price: 38_400,
    store: '온라인몰 B',
    memo: '먹고 나서 이틀 설사. 남은 건 나눔했다.',
    tags: ['안맞음'],
  }),
  sample('11', 140, {
    catId: 'cat_mock_02',
    brand: '포레스트펫',
    productName: '참치 & 호박 캔',
    flavor: '참치',
    foodType: 'wet',
    // 80g × 24캔
    volume: { amount: 1920, unit: 'g' },
    rating: 3,
    stool: 'hard',
    repurchase: 'maybe',
    price: 26_400,
    store: '대형마트',
    memo: '물을 더 챙겨 줘야 할 듯.',
  }),
];
