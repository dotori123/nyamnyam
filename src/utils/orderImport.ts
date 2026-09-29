import type { FoodType, VolumeUnit } from '../types';

/**
 * 쇼핑몰 주문내역 붙여넣기 → 기록 후보.
 *
 * 지금은 네이버(네이버페이 주문내역) 화면을 통째로 복사한 글을 읽는다.
 * 그 글은 주문마다 이런 줄이 되풀이된다.
 *
 *   구매확정완료
 *   네이버 N배송
 *   [특판] 알모네이쳐 고양이 주식캔 습식사료 무스 3종혼합, 70g, 3개   ← 상품명, 옵션
 *   8.20. 19:18 주문                                                 ← 주문 시각
 *   (상품명 한 번 더)
 *   7,980원                                                          ← 결제 금액
 *
 * "○.○. ○○:○○ 주문" 줄을 기준점으로 삼아 바로 앞 줄을 상품명, 뒤에서 처음 나오는
 * "○원" 줄을 가격으로 본다. 나머지 버튼 문구(상세보기·장바구니 담기…)는 무시한다.
 *
 * 상품명에는 브랜드 구분이 없어서 **첫 단어를 브랜드로 짐작**한다. 틀릴 수 있으므로
 * 화면(ImportPage)에서 저장 전에 고칠 수 있게 보여준다.
 *
 * 붙여넣은 글은 이 기기 안에서만 읽는다. 어디로도 보내지 않는다.
 */

export interface ParsedOrder {
  /** 붙여넣은 글에서의 순서. 화면 key로 쓴다 */
  index: number;
  /** 원래 상품명 (광고 문구 제거 전) — 사용자가 짐작이 맞는지 대조할 수 있게 보여준다 */
  title: string;
  brand: string;
  productName: string;
  flavor: string;
  foodType: FoodType;
  volume: { amount: number; unit: VolumeUnit } | null;
  /** "70g × 3" 같은 사람이 읽을 용량 설명 */
  volumeLabel: string | null;
  price: number | null;
  /** ISO. 연도는 적혀 있지 않아 오늘보다 뒤가 되지 않게 올해/작년으로 맞춘다 */
  purchasedAt: string | null;
  store: string;
  /** 취소·반품된 주문 — 기본으로 등록하지 않는다 */
  canceled: boolean;
}

const ORDER_LINE = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})\s*주문/;
const PRICE_LINE = /^([\d,]+)\s*원$/;
const CANCELED = /취소|반품|환불/;

/** 상품명 앞의 [특판] (무료배송) 같은 광고 꼬리표 */
const PROMO_PREFIX = /^(\s*[[(【][^\])】]*[\])】]\s*)+/;

/** 상품명에서 뺄 흔한 말 — 모든 상품에 붙어 있어 구분에 도움이 안 된다 */
const GENERIC_WORDS = new Set(['고양이', '고양이용', '캣', '반려묘', '사료', '습식사료', '건식사료', '전연령']);

/** 맛으로 볼 재료. 상품명 끝쪽에서 이 말이 들어간 낱말을 맛으로 떼어 낸다 */
const FLAVOR_WORDS = [
  '참치', '닭고기', '닭가슴살', '치킨', '연어', '오리', '소고기', '비프', '칠면조', '터키',
  '흰살생선', '새우', '게살', '가다랑어', '고등어', '양고기', '램', '토끼', '사슴', '대구',
  '멸치', '북어', '황태', '정어리', '광어', '돼지', '캥거루', '생선', '해산물', '호박',
];

/** "오리지날"의 "오리"처럼 재료가 아닌데 글자만 겹치는 말 */
const NOT_FLAVOR = /오리지/;

function isFlavorWord(word: string) {
  return !NOT_FLAVOR.test(word) && FLAVOR_WORDS.some((flavor) => word.includes(flavor));
}

const TYPE_RULES: [RegExp, FoodType][] = [
  [/영양제|유산균|오메가|루테인|비타민|보조제/, 'supplement'],
  [/츄르|간식|트릿|져키|스낵|동결건조/, 'treat'],
  [/습식|주식캔|캔|파우치|무스|파테/, 'wet'],
  [/건식|건사료|키블/, 'dry'],
];

export function parseNaverOrders(text: string, now: Date = new Date()): ParsedOrder[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const orders: ParsedOrder[] = [];
  let blockStart = 0;

  lines.forEach((line, i) => {
    const date = ORDER_LINE.exec(line);
    if (!date || i === 0) return;

    const title = lines[i - 1];
    // 가격은 주문 줄 뒤 몇 줄 안에 있다 (상품명이 한 번 더 나온 다음)
    const priceLine = lines.slice(i + 1, i + 5).find((next) => PRICE_LINE.test(next));
    const price = priceLine ? Number(PRICE_LINE.exec(priceLine)![1].replace(/,/g, '')) : null;
    // 이 주문의 상태 줄은 앞 주문이 끝난 뒤부터 상품명 사이에 있다
    const canceled = lines.slice(blockStart, i - 1).some((l) => CANCELED.test(l) && l.length < 12);
    blockStart = i + 1;

    orders.push({
      index: orders.length,
      title,
      ...parseTitle(title),
      price,
      purchasedAt: toIso(Number(date[1]), Number(date[2]), Number(date[3]), Number(date[4]), now),
      store: '네이버',
      canceled,
    });
  });

  return orders;
}

/** "브랜드 상품명 맛, 70g, 3개" → 칸별로 */
export function parseTitle(rawTitle: string) {
  const title = rawTitle.replace(PROMO_PREFIX, '').trim();
  const [namePart, ...options] = title.split(/\s*,\s*/);

  // ── 용량: "70g" + "3개" → 210g ──
  let each: { amount: number; unit: VolumeUnit } | null = null;
  let count = 1;
  for (const option of options) {
    const weight = /^(\d+(?:\.\d+)?)\s*(g|kg|ml|l)$/i.exec(option);
    if (weight) {
      const unit = weight[2].toLowerCase();
      each = unit === 'l'
        ? { amount: Number(weight[1]) * 1000, unit: 'ml' }
        : { amount: Number(weight[1]), unit: unit as VolumeUnit };
      continue;
    }
    const pieces = /^(\d+)\s*(개|캔|팩|입|봉|포|박스)$/.exec(option);
    if (pieces) count = Number(pieces[1]);
  }

  const volume = each
    ? { amount: round(each.amount * count), unit: each.unit }
    : count > 1
      ? { amount: count, unit: 'ea' as VolumeUnit }
      : null;
  const volumeLabel = each
    ? `${each.amount}${each.unit}${count > 1 ? ` × ${count}` : ''}`
    : count > 1
      ? `${count}개`
      : null;

  // ── 이름: 첫 단어 = 브랜드, 끝쪽 재료 낱말 = 맛, 나머지 = 제품명 ──
  const words = namePart.split(/\s+/).filter(Boolean);
  const brand = words.shift() ?? '';
  const rest = words.filter((word) => !GENERIC_WORDS.has(word));

  const flavorWords: string[] = [];
  while (rest.length && isFlavorWord(rest[rest.length - 1])) {
    flavorWords.unshift(rest.pop()!);
  }

  return {
    brand,
    productName: rest.join(' '),
    flavor: flavorWords.join(' '),
    foodType: guessFoodType(title, each?.unit),
    volume,
    volumeLabel,
  };
}

function guessFoodType(title: string, unit: VolumeUnit | undefined): FoodType {
  const rule = TYPE_RULES.find(([pattern]) => pattern.test(title));
  if (rule) return rule[1];
  // 단서가 없으면 kg 단위는 건사료, 나머지는 습식으로 본다 (둘이 가장 흔하다)
  return unit === 'kg' ? 'dry' : 'wet';
}

function toIso(month: number, day: number, hour: number, minute: number, now: Date): string {
  const date = new Date(now.getFullYear(), month - 1, day, hour, minute);
  // 주문내역에는 연도가 없다. 오늘보다 뒤면 작년 주문이다
  if (date.getTime() > now.getTime()) date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
