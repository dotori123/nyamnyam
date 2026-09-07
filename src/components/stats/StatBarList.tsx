import type { StatRow } from '../../utils/stats';
import './StatBarList.scss';

interface Props {
  rows: StatRow[];
  /** 오른쪽에 크게 보여줄 값 (예: "4.5", "3건") */
  formatValue: (row: StatRow) => string;
  /** 값 아래 보조 설명 (예: "3건 기준"). 없으면 생략 */
  formatCaption?: (row: StatRow) => string | null;
  /** 막대 색. 기본은 포인트색 한 가지 — 크기 비교가 목적이라 색을 나눌 이유가 없다 */
  colorOf?: (row: StatRow) => string;
  /** 막대 길이의 기준값. 안 주면 행 중 최댓값 */
  max?: number;
  /**
   * 전체 대비 비율을 보여주는 목록이면 true.
   * 막대 뒤에 옅은 트랙을 깔아 "전체"가 어디까지인지 보이게 한다.
   */
  showTrack?: boolean;
}

/**
 * 가로 막대 목록.
 *
 * 값이 이름 옆에 그대로 적혀 있어서 막대는 크기 비교를 돕는 보조 역할이다.
 * (툴팁으로만 값을 알 수 있는 차트가 되지 않도록)
 */
export default function StatBarList({
  rows,
  formatValue,
  formatCaption,
  colorOf,
  max,
  showTrack = false,
}: Props) {
  const ceiling = max ?? Math.max(...rows.map((row) => row.value), 0);

  return (
    <ul className="stat-bars">
      {rows.map((row) => {
        const ratio = ceiling > 0 ? row.value / ceiling : 0;
        const caption = formatCaption?.(row);

        return (
          <li key={row.key} className="stat-bars__row">
            <div className="stat-bars__head">
              <span className="stat-bars__label">
                {row.emoji && (
                  <span className="stat-bars__emoji" aria-hidden="true">
                    {row.emoji}
                  </span>
                )}
                {row.label}
              </span>
              <span className="stat-bars__value">
                {formatValue(row)}
                {caption && <span className="stat-bars__caption">{caption}</span>}
              </span>
            </div>

            <div className={showTrack ? 'stat-bars__track stat-bars__track--filled' : 'stat-bars__track'}>
              <div
                className="stat-bars__bar"
                style={{
                  width: `${Math.max(ratio * 100, row.value > 0 ? 2 : 0)}%`,
                  background: colorOf?.(row) ?? 'var(--primary)',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
