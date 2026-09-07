import type { FeedRecord } from '../types';

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
function thumb(emoji: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
</linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<text x="200" y="235" font-size="150" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let photoSeq = 0;
function photo(emoji: string, from: string, to: string) {
  photoSeq += 1;
  return {
    id: `photo_mock_${photoSeq}`,
    url: thumb(emoji, from, to),
    storagePath: null,
    source: 'library' as const,
    fileName: null,
  };
}

export const MOCK_RECORDS: FeedRecord[] = [
  {
    id: 'rec_mock_01',
    catId: 'cat_mock_01',
    brand: '이나바 챠오',
    productName: '츄르 종합영양식',
    flavor: '참치',
    foodType: 'treat',
    volume: { amount: 14, unit: 'ea' },
    rating: 5,
    stool: 'good',
    repurchase: 'yes',
    price: 12_900,
    currency: 'KRW',
    store: '쿠팡',
    purchasedAt: daysAgo(2),
    photos: [photo('🍤', '#ffd9c2', '#ff9f6e')],
    memo: '흡입 수준. 손에서 놓질 않는다. 하루 1개로 제한 중.',
    tags: ['최애', '기호성갑'],
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  },
];
