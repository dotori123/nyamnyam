/**
 * 앱 아이콘 모양 — 24×24 격자, 1.75 굵기 선, 둥근 끝.
 *
 * 이모지는 OS·브라우저마다 그림이 달라서(특히 안드로이드와 윈도우) 쓰지 않는다.
 * 모든 아이콘은 path 몇 줄이라 React(Icon.tsx)와 문자열 SVG(mock 썸네일) 양쪽에서 쓴다.
 * 원은 arc 두 개로 그린다 — <circle>을 섞으면 두 쪽 렌더러를 따로 짜야 한다.
 *
 * 규칙은 DESIGN.md의 "아이콘" 항목.
 */
export interface IconShape {
  d: string[];
  /** 면을 채우는 아이콘 (발바닥처럼 선으로는 모양이 안 읽히는 것) */
  solid?: boolean;
}

/** (cx, cy) 중심 반지름 r 원 */
const circle = (cx: number, cy: number, r: number) =>
  `M${cx + r} ${cy}a${r} ${r} 0 1 1-${r * 2} 0a${r} ${r} 0 1 1 ${r * 2} 0`;

export const ICONS = {
  // ── 탐색 ──
  'arrow-left': { d: ['M19 12H5', 'M11 18l-6-6 6-6'] },
  close: { d: ['M6 6l12 12', 'M18 6L6 18'] },
  search: { d: [circle(11, 11, 6.5), 'M20 20l-4.4-4.4'] },
  plus: { d: ['M12 5v14', 'M5 12h14'] },
  check: { d: ['M5 12.5l4.5 4.5L19 7'] },
  settings: {
    d: ['M4 7h9', 'M19 7h1', 'M4 17h3', 'M13 17h7', circle(16, 7, 2.5), circle(10, 17, 2.5)],
  },

  // ── 탭 ──
  notebook: {
    d: [
      'M6 3.5h12a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1z',
      'M8.5 8.5h7',
      'M8.5 12h7',
      'M8.5 15.5h4',
    ],
  },
  chart: { d: ['M5 20v-9', 'M12 20V4', 'M19 20v-6'] },
  cat: {
    d: [
      'M5 10.5V4.5l4.2 3h5.6L19 4.5v6c0 4.7-3.1 8.5-7 8.5s-7-3.8-7-8.5z',
      'M9.5 12.5v.5',
      'M14.5 12.5v.5',
    ],
  },
  paw: {
    solid: true,
    d: [
      'M12 12c-2.8 0-5 2.6-5 4.8 0 1.5 1.1 2.4 2.5 2.4 1 0 1.6-.5 2.5-.5s1.5.5 2.5.5c1.4 0 2.5-.9 2.5-2.4 0-2.2-2.2-4.8-5-4.8z',
      circle(6.5, 10, 1.6),
      circle(9.8, 6.3, 1.6),
      circle(14.2, 6.3, 1.6),
      circle(17.5, 10, 1.6),
    ],
  },

  // ── 동작 ──
  camera: {
    d: [
      'M4 8.5A1.5 1.5 0 0 1 5.5 7H8l1.5-2h5L16 7h2.5A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z',
      circle(12, 13, 3.5),
    ],
  },
  image: {
    d: [
      'M5 4h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z',
      'M4 16l4.5-4.5 4 4L15 13l5 5',
      circle(15.5, 8.5, 1.5),
    ],
  },
  heart: {
    d: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  },
  download: { d: ['M12 4v11', 'M7 10l5 5 5-5', 'M5 20h14'] },
  upload: { d: ['M12 16V5', 'M7 10l5-5 5 5', 'M5 20h14'] },
  repeat: {
    d: [
      'M17 3l3 3-3 3',
      'M4 11V9a3 3 0 0 1 3-3h13',
      'M7 21l-3-3 3-3',
      'M20 13v2a3 3 0 0 1-3 3H4',
    ],
  },

  // ── 사료 종류 ──
  bowl: { d: ['M3.5 11h17', 'M4.5 11a7.5 7.5 0 0 0 15 0', 'M9 8v.01', 'M12 6.5v.01', 'M15 8v.01'] },
  can: {
    d: [
      'M18 7c0 1.1-2.7 2-6 2s-6-.9-6-2 2.7-2 6-2 6 .9 6 2z',
      'M6 7v11c0 1.1 2.7 2 6 2s6-.9 6-2V7',
      'M6 12.5c0 1.1 2.7 2 6 2s6-.9 6-2',
    ],
  },
  fish: {
    d: [
      'M20.5 12c-1.8-3.2-4.6-5-8-5s-5.6 2-7 5c1.4 3 3.6 5 7 5s6.2-1.8 8-5z',
      'M5.5 12L2.5 9v6z',
      'M15.5 11v.01',
    ],
  },
  pill: {
    d: ['M9.5 19.5l10-10a3.5 3.5 0 0 0-5-5l-10 10a3.5 3.5 0 0 0 5 5z', 'M9.5 9.5l5 5'],
  },

  // ── 성별 ──
  male: { d: [circle(10, 14, 5), 'M13.5 10.5L19 5', 'M14.5 5H19v4.5'] },
  female: { d: [circle(12, 9, 5), 'M12 14v7', 'M9 18h6'] },
} satisfies Record<string, IconShape>;

export type IconName = keyof typeof ICONS;

/** 문자열 SVG 안에 넣을 아이콘 조각. 좌표는 (x, y)에서 size 크기로 옮긴다 */
export function iconMarkup(name: IconName, color: string, x: number, y: number, size: number) {
  const shape: IconShape = ICONS[name];
  const fill = shape.solid ? color : 'none';
  const paths = shape.d.map((d) => `<path d="${d}"/>`).join('');
  return `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="${fill}" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths}</g>`;
}
