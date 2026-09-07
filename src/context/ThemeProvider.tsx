import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ThemeId } from '../types';
import { DEFAULT_THEME, getThemeOption, isThemeId, THEME_OPTIONS } from '../utils/themes';
import { ThemeContext, type ThemeContextValue } from './themeContext';

/** index.html의 부트스트랩 스크립트와 같은 키를 써야 한다 */
export const THEME_STORAGE_KEY = 'nyamnyam.theme';

function readStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    // 시크릿 모드 등에서 localStorage 접근이 막힐 수 있다
  }
  return DEFAULT_THEME;
}

/**
 * 고양이 털색 테마.
 *
 * 실제 색은 전부 CSS 변수라, 여기서는 <html>의 data-theme만 갈아끼운다.
 * 팔레트는 src/styles/_themes.scss에 있다.
 *
 * 첫 페인트 전에 index.html의 인라인 스크립트가 같은 값을 먼저 적용하므로
 * 새로고침해도 기본 테마가 번쩍이지 않는다.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = themeId;

    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // 저장 실패해도 이번 세션 동안은 테마가 유지된다
    }

    // 주소창·상태바 색도 테마에 맞춘다.
    // 색을 TS에 중복해 두지 않으려고 계산된 CSS 변수에서 읽어온다.
    const primary = getComputedStyle(root).getPropertyValue('--primary').trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta && primary) meta.setAttribute('content', primary);
  }, [themeId]);

  const setTheme = useCallback((id: ThemeId) => setThemeId(id), []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme: getThemeOption(themeId),
      setTheme,
      options: THEME_OPTIONS,
    }),
    [themeId, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
