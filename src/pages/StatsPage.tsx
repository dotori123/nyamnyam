import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords';
import { useCats } from '../hooks/useCats';
import Chip from '../components/common/Chip';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import StatBarList from '../components/stats/StatBarList';
import SpendChart from '../components/stats/SpendChart';
import { formatPrice } from '../utils/format';
import {
  countByFoodType,
  countByRepurchase,
  countByStool,
  countComparableForUnitPrice,
  monthlySpend,
  rankBrandsByRating,
  rankBrandsByStoolTrouble,
  rankByUnitPrice,
  summarize,
} from '../utils/stats';
import './StatsPage.scss';

/** 재구매 의향은 순서가 있는 상태값이라 상태색을 그대로 쓴다 (이모지·글자와 함께) */
const INTENT_COLORS: Record<string, string> = {
  yes: 'var(--good)',
  maybe: 'var(--warn)',
  no: 'var(--danger)',
};

/**
 * 배변 상태도 같은 방식. 심각도에 맞춰 상태색을 붙인다.
 * '모름'은 좋고 나쁨이 아니라 정보가 없는 것이라 무채색으로 뺀다.
 */
const STOOL_COLORS: Record<string, string> = {
  good: 'var(--good)',
  soft: 'var(--warn)',
  hard: 'var(--warn)',
  diarrhea: 'var(--danger)',
  constipated: 'var(--danger)',
  unknown: 'color-mix(in srgb, var(--text) 30%, transparent)',
};

export default function StatsPage() {
  const { records, loading } = useRecords();
  const { cats } = useCats();

  /** 필터는 차트 위 한 줄에만 둔다 — 카드마다 따로 두면 무엇에 걸린 값인지 헷갈린다 */
  const [catId, setCatId] = useState<string | null>(null);

  const scoped = useMemo(
    () => (catId ? records.filter((record) => record.catId === catId) : records),
    [records, catId],
  );

  const summary = useMemo(() => summarize(scoped), [scoped]);
  const brands = useMemo(() => rankBrandsByRating(scoped), [scoped]);
  const foodTypes = useMemo(() => countByFoodType(scoped), [scoped]);
  const intents = useMemo(() => countByRepurchase(scoped), [scoped]);
  const stools = useMemo(() => countByStool(scoped), [scoped]);
  const stoolTrouble = useMemo(() => rankBrandsByStoolTrouble(scoped), [scoped]);
  const unitPrices = useMemo(() => rankByUnitPrice(scoped), [scoped]);
  const comparableCount = useMemo(() => countComparableForUnitPrice(scoped), [scoped]);
  const months = useMemo(() => monthlySpend(scoped), [scoped]);

  if (loading) return <LoadingState />;

  if (records.length === 0) {
    return (
      <EmptyState
        emoji="📊"
        title="아직 볼 통계가 없어요"
        description="기록이 몇 건 쌓이면 브랜드별 만족도와 지출을 여기서 볼 수 있어요."
        action={
          <Link to="/new" className="btn btn--primary">
            첫 기록 남기기
          </Link>
        }
      />
    );
  }

  return (
    <div className="stats-page">
      {cats.length > 1 && (
        <div className="stats-page__filter" role="group" aria-label="고양이 선택">
          <Chip selected={catId === null} onClick={() => setCatId(null)} size="sm">
            전체
          </Chip>
          {cats.map((cat) => (
            <Chip
              key={cat.id}
              selected={catId === cat.id}
              onClick={() => setCatId(cat.id)}
              size="sm"
            >
              {cat.name}
            </Chip>
          ))}
        </div>
      )}

      {scoped.length === 0 ? (
        <EmptyState emoji="🐾" title="이 아이의 기록이 아직 없어요" />
      ) : (
        <>
          <ul className="stats-page__tiles">
            <li className="stats-page__tile">
              <span className="stats-page__tile-value">{summary.count}</span>
              <span className="stats-page__tile-label">전체 기록</span>
            </li>
            <li className="stats-page__tile">
              <span className="stats-page__tile-value">{summary.averageRating.toFixed(1)}</span>
              <span className="stats-page__tile-label">평균 만족도</span>
            </li>
            <li className="stats-page__tile">
              <span className="stats-page__tile-value">
                {Math.round(summary.repurchaseRate * 100)}%
              </span>
              <span className="stats-page__tile-label">재구매 의향</span>
            </li>
            <li className="stats-page__tile">
              <span className="stats-page__tile-value">{formatPrice(summary.totalSpend)}</span>
              <span className="stats-page__tile-label">
                총 지출
                {summary.pricedCount < summary.count && (
                  <span className="stats-page__tile-note">
                    {' '}
                    · {summary.pricedCount}건 기준
                  </span>
                )}
              </span>
            </li>
          </ul>

          <section className="stats-page__section">
            <h2 className="stats-page__title">브랜드별 평균 만족도</h2>
            <p className="stats-page__hint">
              기록이 1건뿐인 브랜드도 함께 보여요. 옆의 건수를 같이 보세요.
            </p>
            <StatBarList
              rows={brands}
              max={5}
              formatValue={(row) => row.value.toFixed(1)}
              formatCaption={(row) => `${row.count}건`}
            />
          </section>

          <section className="stats-page__section">
            <h2 className="stats-page__title">사료 종류</h2>
            <StatBarList rows={foodTypes} formatValue={(row) => `${row.count}건`} />
          </section>

          <section className="stats-page__section">
            <h2 className="stats-page__title">재구매 의향</h2>
            <StatBarList
              rows={intents}
              max={scoped.length}
              showTrack
              colorOf={(row) => INTENT_COLORS[row.key] ?? 'var(--primary)'}
              formatValue={(row) => `${Math.round((row.count / scoped.length) * 100)}%`}
              formatCaption={(row) => `${row.count}건`}
            />
          </section>

          {/* 비교 대상이 하나뿐이면 순위가 아니라 그냥 값이라, 상세 화면에 이미 있는 것과 겹친다 */}
          {unitPrices.length >= 2 && (
            <section className="stats-page__section">
              <h2 className="stats-page__title">100g당 단가 · 싼 순</h2>
              <p className="stats-page__hint">
                가격과 용량이 함께 적힌 {comparableCount}건만 셌어요. 개·팩 단위는 그램으로 바꿀 수
                없어 빠집니다. 종류가 다르면 단가도 다르니 왼쪽 아이콘을 같이 보세요.
              </p>
              <StatBarList
                rows={unitPrices}
                formatValue={(row) => formatPrice(row.value)}
                formatCaption={(row) => row.note ?? null}
              />
            </section>
          )}

          <section className="stats-page__section">
            <h2 className="stats-page__title">배변 상태</h2>
            <StatBarList
              rows={stools}
              max={scoped.length}
              showTrack
              colorOf={(row) => STOOL_COLORS[row.key] ?? 'var(--primary)'}
              formatValue={(row) => `${row.count}건`}
            />
          </section>

          {stoolTrouble.length > 0 && (
            <section className="stats-page__section">
              <h2 className="stats-page__title">배변이 안 좋았던 사료</h2>
              <p className="stats-page__hint">
                무름·설사·딱딱·변비가 있었던 비율이에요. &lsquo;모름&rsquo;으로 남긴 기록은 빼고
                셌어요. 기록이 적으면 우연일 수 있으니 옆의 건수를 같이 보세요.
              </p>
              <StatBarList
                rows={stoolTrouble}
                max={1}
                colorOf={() => 'var(--danger)'}
                formatValue={(row) => `${Math.round(row.value * 100)}%`}
                formatCaption={(row) => `${row.count}/${row.total ?? row.count}건`}
              />
            </section>
          )}

          <section className="stats-page__section">
            <h2 className="stats-page__title">최근 6개월 지출</h2>
            <SpendChart months={months} />
          </section>
        </>
      )}
    </div>
  );
}
