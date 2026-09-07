import type { Cat } from '../types';

/**
 * mock 고양이 프로필.
 * Firebase 연동 시 이 배열 대신 Firestore 쿼리 결과를 넣으면 된다.
 * (자리: src/firebase/cats.ts)
 */

/** n년 n개월 전 ISO 문자열 — 생일용 */
function yearsAgo(years: number, months = 0): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setMonth(d.getMonth() - months);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(12, 0, 0, 0);
  return d.toISOString();
}

/**
 * 프로필 사진 자리를 채우는 인라인 SVG.
 * 네트워크 없이 동작하도록 data URI로 만든다.
 * 실제 사진이 붙으면 이 함수는 지워도 된다.
 */
function avatar(emoji: string, from: string, to: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
</linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<text x="200" y="255" font-size="180" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

let photoSeq = 0;
function photo(emoji: string, from: string, to: string) {
  photoSeq += 1;
  return {
    id: `photo_cat_${photoSeq}`,
    url: avatar(emoji, from, to),
    storagePath: null,
    source: 'library' as const,
    fileName: null,
  };
}

export const MOCK_CATS: Cat[] = [
  {
    id: 'cat_mock_01',
    name: '나비',
    photo: photo('🐈', '#ffe0c2', '#ff9f6e'),
    birthday: yearsAgo(3, 4),
    breed: '코리안숏헤어',
    gender: 'female',
    weightKg: 4.2,
    memo: '닭고기 알레르기 있음. 습식을 잘 먹고 건사료는 잘게 부숴줘야 먹는다.',
    createdAt: daysAgo(120),
    updatedAt: daysAgo(30),
  },
  {
    id: 'cat_mock_02',
    name: '치즈',
    photo: photo('🐱', '#fff0cc', '#f5c451'),
    birthday: yearsAgo(1, 7),
    breed: '코리안숏헤어',
    gender: 'male',
    weightKg: 5.1,
    memo: '식탐이 많아 급하게 먹다 토할 때가 있음. 슬로우 급여기 사용 중.',
    createdAt: daysAgo(95),
    updatedAt: daysAgo(12),
  },
  {
    id: 'cat_mock_03',
    name: '깜냥',
    photo: photo('🐈‍⬛', '#dcdff0', '#8d90b8'),
    birthday: yearsAgo(6, 2),
    breed: '먼치킨',
    gender: 'female',
    weightKg: 3.6,
    memo: '노령묘 진입. 신장 수치 관찰 중이라 수분 많은 습식 위주로 급여.',
    createdAt: daysAgo(60),
    updatedAt: daysAgo(60),
  },
];
