import type { ThemeId, ThemeOption } from '../types';

/** 기본 테마 — 삼색이 */
export const DEFAULT_THEME: ThemeId = 'calico';

export const THEME_OPTIONS: ThemeOption[] = [
  { id: 'calico', label: '삼색이', description: '크림 바탕에 주황과 검정 얼룩' },
  { id: 'cheese', label: '치즈', description: '버터빛 크림에 주황 줄무늬' },
  { id: 'cream', label: '크림', description: '아이보리 바탕에 살구빛과 분홍 코' },
  { id: 'mackerel', label: '고등어', description: '은빛 회색에 청회색 줄무늬' },
  { id: 'tuxedo', label: '턱시도', description: '흰 셔츠에 검정 턱시도' },
];

const THEME_IDS = new Set<string>(THEME_OPTIONS.map((theme) => theme.id));

/** 저장된 값이 아는 테마인지 확인 (오타·구버전 값 방어) */
export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.has(value);
}

export function getThemeOption(id: ThemeId): ThemeOption {
  return THEME_OPTIONS.find((theme) => theme.id === id) ?? THEME_OPTIONS[0];
}
