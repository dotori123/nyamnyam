/**
 * 고양이 털색 테마.
 *
 * id는 src/styles/_themes.scss의 $themes 키와 1:1로 맞춰야 한다.
 * (SCSS가 `[data-theme='<id>']` 선택자를 그 키로 만든다)
 *
 * 색값은 여기 두지 않는다. 팔레트의 단일 출처는 _themes.scss이고,
 * 화면에서 색이 필요하면 CSS 변수(var(--primary) …)로 읽는다.
 */
export type ThemeId = 'calico' | 'cheese' | 'cream' | 'mackerel' | 'tuxedo';

export interface ThemeOption {
  id: ThemeId;
  /** 털색 이름 */
  label: string;
  /** 한 줄 설명 */
  description: string;
}
