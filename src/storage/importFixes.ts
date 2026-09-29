import { readJson, writeJson } from './local';

/**
 * 주문내역 붙여넣기에서 사용자가 고친 브랜드·제품명을 기억한다.
 *
 * 상품명에는 브랜드 구분이 없어 첫 단어로 짐작하는데(utils/orderImport.ts),
 * "네이처스 버라이어티 인스팅트…"처럼 틀리는 상품이 있다. 같은 상품을 또 사면
 * 같은 상품명이 오므로, 한 번 고친 결과를 상품명을 열쇠로 적어 두었다가 다음번에 채운다.
 *
 * 이 기기에만 둔다. 사람마다 부르는 이름이 달라 계정 데이터로 올릴 만한 것은 아니다.
 */

const KEY = 'nyamnyam.importFixes.v1';
/** 오래된 것부터 버린다. 고양이 사료 종류가 이보다 많을 일은 드물다 */
const MAX_ENTRIES = 300;

export interface ImportFix {
  brand: string;
  productName: string;
}

type FixMap = Record<string, ImportFix>;

/** 옵션(", 70g, 3개")과 광고 꼬리표를 떼고 공백을 정리한 상품명 — 같은 상품을 알아보는 열쇠 */
export function fixKey(title: string): string {
  return title
    .replace(/^(\s*[[(【][^\])】]*[\])】]\s*)+/, '')
    .split(',')[0]
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function readImportFixes(): FixMap {
  return readJson<FixMap>(KEY) ?? {};
}

export function saveImportFixes(fixes: { title: string; fix: ImportFix }[]) {
  if (fixes.length === 0) return;
  const map = readImportFixes();
  for (const { title, fix } of fixes) {
    const key = fixKey(title);
    // 다시 넣어 맨 뒤로 보낸다 (최근에 쓴 것이 오래 남게)
    delete map[key];
    map[key] = fix;
  }
  const entries = Object.entries(map);
  writeJson(KEY, Object.fromEntries(entries.slice(-MAX_ENTRIES)));
}
