import { useState } from 'react';
import type { MonthSpend } from '../../utils/stats';
import { formatPrice } from '../../utils/format';
import './SpendChart.scss';

interface Props {
  months: MonthSpend[];
}

/**
 * 월별 지출 세로 막대.
 *
 * 값을 모든 막대에 적으면 읽히지 않아서 가장 많이 쓴 달에만 적고,
 * 나머지 숫자는 "표로 보기"에서 전부 볼 수 있게 했다.
 * (툴팁이 값을 읽는 유일한 통로가 되면 터치 기기에서 못 읽는다)
 */
export default function SpendChart({ months }: Props) {
  const [showTable, setShowTable] = useState(false);

  const peak = Math.max(...months.map((month) => month.total), 0);
  const spentMonths = months.filter((month) => month.total > 0).length;
  // 그림만으로는 아무것도 읽히지 않으므로 요약 한 줄을 이름표로 달아 준다
  const peakLabel =
    `최근 6개월 지출 막대그래프. 가장 많이 쓴 달은 ` +
    `${months.find((month) => month.total === peak)?.label ?? ''} ${formatPrice(peak)}. ` +
    `달마다의 숫자는 아래 '표로 보기'에 있어요.`;

  if (peak === 0) {
    return (
      <p className="spend-chart__empty">
        최근 6개월 안에 <strong>구매일과 가격이 함께 적힌</strong> 기록이 없어요.
      </p>
    );
  }

  return (
    <div className="spend-chart">
      <div
        className="spend-chart__plot"
        role="img"
        aria-label={peakLabel}
      >
        {months.map((month) => {
          const isPeak = month.total === peak;
          return (
            <div key={month.key} className="spend-chart__col">
              {isPeak && <span className="spend-chart__peak">{formatPrice(month.total)}</span>}
              <div
                className="spend-chart__bar"
                style={{ height: `${(month.total / peak) * 100}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="spend-chart__axis" aria-hidden="true">
        {months.map((month) => (
          <span key={month.key} className="spend-chart__tick">
            {month.label}
          </span>
        ))}
      </div>

      <button
        type="button"
        className="spend-chart__toggle"
        onClick={() => setShowTable((prev) => !prev)}
        aria-expanded={showTable}
      >
        {showTable ? '표 접기' : '표로 보기'}
      </button>

      {showTable && (
        <table className="spend-chart__table">
          <caption>
            최근 6개월 중 {spentMonths}개월에 지출이 있었어요
          </caption>
          <thead>
            <tr>
              <th scope="col">월</th>
              <th scope="col">지출</th>
            </tr>
          </thead>
          <tbody>
            {months.map((month) => (
              <tr key={month.key}>
                <th scope="row">{month.label}</th>
                <td>{month.total > 0 ? formatPrice(month.total) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
