import type { FoodType, VolumeUnit } from '../types';

/**
 * 쇼핑몰 주문내역 붙여넣기 → 기록 후보.
 *
 * 네이버 주문내역을 통째로 복사한 글을 읽는다. 화면이 두 가지라 둘 다 받는다.
 *
 * ① 주문 목록 화면 — 주문마다
 *      [특판] 알모네이쳐 고양이 주식캔 습식사료 무스 3종혼합, 70g, 3개   ← 상품명, 옵션
 *      8.20. 19:18 주문                                                 ← 기준점
 *      (상품명 한 번 더)
 *      7,980원
 *    "○.○. ○○:○○ 주문" 줄 바로 앞을 상품명, 뒤에서 처음 나오는 "○원"을 가격으로 본다.
 *    **수량이 안 나온다** — 2개 샀어도 1개로 읽히므로 화면에서 고칠 수 있게 한다.
 *
 * ② 주문 상세 화면 — 가게 이름 → "배송비" 줄로 시작하고, 상품마다
 *      상품명네이처스 버라이어티 … 치킨, 85g, 1개                      ← 기준점
 *      수량 / 2개
 *      상품가격6,000원(정가)…                                           ← 수량만큼의 금액
 *      상품주문번호 : 20260820…                                         ← 앞 8자리가 주문일
 *    수량과 가게 이름까지 있어 목록 화면보다 정확하다.
 *
 * 상품명에는 브랜드 구분이 없어서 **첫 단어를 브랜드로 짐작**한다. 틀릴 수 있으므로
 * 화면(ImportPage)에서 저장 전에 고칠 수 있게 보여준다.
 *
 * 붙여넣은 글은 이 기기 안에서만 읽는다. 어디로도 보내지 않는다.
 */

export interface Pack {
  amount: number;
  unit: VolumeUnit;
}

export interface ParsedOrder {
  /** 붙여넣은 글에서의 순서. 화면 key로 쓴다 */
  index: number;
  /** 원래 상품명 (광고 문구 제거 전) — 사용자가 짐작이 맞는지 대조할 수 있게 보여준다 */
  title: string;
  brand: string;
  productName: string;
  flavor: string;
  foodType: FoodType;
  /** 상품 하나(옵션 1건)의 용량. "70g, 3개" → 210g */
  pack: Pack | null;
  /** "70g × 3" 같은 사람이 읽을 옵션 설명 */
  packLabel: string | null;
  /** 이 옵션을 몇 개 샀는지 */
  quantity: number;
  /** 글에 수량이 적혀 있었는지. 목록 화면은 적혀 있지 않다 */
  quantityKnown: boolean;
  /** 수량만큼 낸 금액(원) */
  price: number | null;
  purchasedAt: string | null;
  store: string;
  /** 취소·반품된 주문 — 기본으로 등록하지 않는다 */
  canceled: boolean;
}

const LIST_ORDER_LINE = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})\s*주문/;
const LIST_PRICE_LINE = /^([\d,]+)\s*원$/;
const DETAIL_TITLE = /^상품명\s*(.+)$/;
const DETAIL_PRICE = /상품가격\s*([\d,]+)\s*원/;
const DETAIL_ORDER_NO = /상품주문번호\s*:?\s*(\d{4})(\d{2})(\d{2})\d*/;
const QUANTITY = /^(?:수량\s*)?(\d+)\s*개$/;
/** 상세 화면에서 가게 이름 바로 다음 줄 */
const SHIPPING_LINE = /^(배송비|무료배송)/;
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
  /** 앞 상품이 끝난 줄 — 그 사이에서 이 상품의 상태(취소 등)를 찾는다 */
  let blockStart = 0;
  /** 상세 화면의 가게 이름. 가게가 바뀔 때마다 새 "배송비" 줄이 온다 */
  let shop: string | null = null;

  const push = (order: Omit<ParsedOrder, 'index' | 'canceled'>, anchor: number, titleLine: number) => {
    const canceled = lines.slice(blockStart, titleLine).some((l) => CANCELED.test(l) && l.length < 12);
    blockStart = anchor + 1;
    orders.push({ ...order, index: orders.length, canceled });
  };

  lines.forEach((line, i) => {
    if (SHIPPING_LINE.test(line) && i > 0) {
      shop = lines[i - 1];
      return;
    }

    // ② 상세 화면
    const detail = DETAIL_TITLE.exec(line);
    if (detail) {
      const title = detail[1].trim();
      // 다음 상품의 "상품명" 줄 전까지만 본다
      const next = lines.findIndex((l, j) => j > i && DETAIL_TITLE.test(l));
      const block = lines.slice(i + 1, next === -1 ? i + 12 : next);

      const quantity = findQuantity(block);
      const priceMatch = block.map((l) => DETAIL_PRICE.exec(l)).find(Boolean);
      const orderNo = block.map((l) => DETAIL_ORDER_NO.exec(l)).find(Boolean);

      push(
        {
          title,
          ...parseTitle(title),
          quantity: quantity ?? 1,
          quantityKnown: quantity !== null,
          price: priceMatch ? toNumber(priceMatch[1]) : null,
          // 주문 시각은 없어 날짜만. 틀린 시각을 지어내지 않고 정오로 둔다
          purchasedAt: orderNo ? dateIso(Number(orderNo[1]), Number(orderNo[2]), Number(orderNo[3])) : null,
          store: shop ? `네이버 ${shop}` : '네이버',
        },
        i,
        // 상세 화면은 상품명이 "상품명…" 줄 바로 위에도 한 번 나온다
        Math.max(i - 1, blockStart),
      );
      return;
    }

    // ① 목록 화면
    const listDate = LIST_ORDER_LINE.exec(line);
    if (listDate && i > 0) {
      const title = lines[i - 1];
      // 가격은 주문 줄 뒤 몇 줄 안에 있다 (상품명이 한 번 더 나온 다음)
      const priceLine = lines.slice(i + 1, i + 5).find((l) => LIST_PRICE_LINE.test(l));

      push(
        {
          title,
          ...parseTitle(title),
          quantity: 1,
          quantityKnown: false,
          price: priceLine ? toNumber(LIST_PRICE_LINE.exec(priceLine)![1]) : null,
          purchasedAt: listDateIso(listDate, now),
          store: '네이버',
        },
        i,
        i - 1,
      );
    }
  });

  return orders;
}

/** 옵션 용량 × 수량 — 실제로 들어온 양 */
export function totalVolume(order: Pick<ParsedOrder, 'pack' | 'quantity'>): Pack | null {
  if (!order.pack) return order.quantity > 1 ? { amount: order.quantity, unit: 'ea' } : null;
  return { amount: round(order.pack.amount * order.quantity), unit: order.pack.unit };
}

/** "70g × 3 · 2개" — 화면에 적을 용량 설명 */
export function volumeLabel(order: Pick<ParsedOrder, 'packLabel' | 'quantity'>): string | null {
  const parts = [order.packLabel, order.quantity > 1 ? `${order.quantity}개 구매` : null].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/** "브랜드 상품명 맛, 70g, 3개" → 칸별로 */
export function parseTitle(rawTitle: string) {
  const title = rawTitle.replace(PROMO_PREFIX, '').trim();
  const [namePart, ...options] = title.split(/\s*,\s*/);

  // ── 옵션 용량: "70g" + "3개" → 210g ──
  let each: Pack | null = null;
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

  const pack: Pack | null = each
    ? { amount: round(each.amount * count), unit: each.unit }
    : count > 1
      ? { amount: count, unit: 'ea' }
      : null;
  const packLabel = each
    ? `${each.amount}${each.unit}${count > 1 ? ` × ${count}` : ''}`
    : count > 1
      ? `${count}개들이`
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
    pack,
    packLabel,
  };
}

/** "수량 2개" 또는 "수량" 다음 줄 "2개" */
function findQuantity(block: string[]): number | null {
  const at = block.findIndex((l) => /^수량/.test(l));
  if (at === -1) return null;
  const match = QUANTITY.exec(block[at]) ?? QUANTITY.exec(block[at + 1] ?? '');
  return match ? Number(match[1]) : null;
}

function guessFoodType(title: string, unit: VolumeUnit | undefined): FoodType {
  const rule = TYPE_RULES.find(([pattern]) => pattern.test(title));
  if (rule) return rule[1];
  // 단서가 없으면 kg 단위는 건사료, 나머지는 습식으로 본다 (둘이 가장 흔하다)
  return unit === 'kg' ? 'dry' : 'wet';
}

function listDateIso(match: RegExpExecArray, now: Date): string {
  const [month, day, hour, minute] = match.slice(1, 5).map(Number);
  const date = new Date(now.getFullYear(), month - 1, day, hour, minute);
  // 목록 화면에는 연도가 없다. 오늘보다 뒤면 작년 주문이다
  if (date.getTime() > now.getTime()) date.setFullYear(date.getFullYear() - 1);
  return date.toISOString();
}

function dateIso(year: number, month: number, day: number): string | null {
  const date = new Date(year, month - 1, day, 12, 0);
  // 주문번호가 아닌 숫자를 날짜로 읽지 않게 — 달·일이 그대로 돌아오는지 본다
  if (date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date.toISOString();
}

function toNumber(text: string) {
  return Number(text.replace(/,/g, ''));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
