import { useTheme } from '../../hooks/useTheme';
import CatMark from '../common/CatMark';
import './ThemePicker.scss';

/**
 * 고양이 털색 테마 고르기.
 *
 * 각 카드에 자기 테마의 data-theme를 달아 두었다.
 * 테마 CSS 변수가 [data-theme] 선택자에도 걸려 있어서(_themes.scss),
 * 카드가 자기 안에서 그 테마 색으로 미리 그려진다 — 골라 보지 않아도 색을 알 수 있다.
 */
export default function ThemePicker() {
  const { themeId, setTheme, options } = useTheme();

  return (
    <ul className="theme-picker">
      {options.map((option) => {
        const selected = option.id === themeId;

        return (
          <li key={option.id} data-theme={option.id} className="theme-picker__item">
            <button
              type="button"
              className={
                selected ? 'theme-picker__card theme-picker__card--selected' : 'theme-picker__card'
              }
              onClick={() => setTheme(option.id)}
              aria-pressed={selected}
            >
              <span className="theme-picker__mark">
                <CatMark />
              </span>

              <span className="theme-picker__body">
                <span className="theme-picker__name">
                  {option.label}
                  {selected && <span className="theme-picker__badge">사용 중</span>}
                </span>
                <span className="theme-picker__description">{option.description}</span>

                <span className="theme-picker__swatches" aria-hidden="true">
                  <span className="theme-picker__swatch theme-picker__swatch--bg" />
                  <span className="theme-picker__swatch theme-picker__swatch--primary" />
                  <span className="theme-picker__swatch theme-picker__swatch--ink" />
                </span>
              </span>

              <span className="theme-picker__check" aria-hidden="true">
                {selected ? '●' : ''}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
