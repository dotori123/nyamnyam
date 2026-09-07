import { Link, useSearchParams } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords';
import { useCats } from '../hooks/useCats';
import { useRecordFilters } from '../hooks/useRecordFilters';
import RecordFilterBar from '../components/record/RecordFilterBar';
import RecordList from '../components/record/RecordList';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import './RecordListPage.scss';

export default function RecordListPage() {
  const { records, brands, flavors, loading } = useRecords();
  const { cats } = useCats();
  // 고양이 상세에서 "전체 보기"로 들어오면 해당 아이로 좁혀서 연다
  const [searchParams] = useSearchParams();

  const {
    filters,
    visibleRecords,
    activeFilterCount,
    setQuery,
    setSort,
    setFoodType,
    setCatId,
    toggleBrand,
    toggleFlavor,
    reset,
  } = useRecordFilters(records, searchParams.get('cat'));

  const averageRating = records.length
    ? records.reduce((sum, record) => sum + record.rating, 0) / records.length
    : 0;
  const repurchaseCount = records.filter((record) => record.repurchase === 'yes').length;

  // 불러오는 중에 "기록이 없어요"를 띄우면 있는 사람에게 없다고 하는 셈이다
  if (loading) return <LoadingState />;

  if (records.length === 0) {
    return (
      <EmptyState
        emoji="🐾"
        title="아직 기록이 없어요"
        description="우리 고양이가 먹은 사료를 기록해두면 다음 구매가 쉬워져요."
        action={
          <Link to="/new" className="btn btn--primary">
            첫 기록 남기기
          </Link>
        }
      />
    );
  }

  return (
    <div className="record-list-page">
      <ul className="record-list-page__stats">
        <li className="record-list-page__stat">
          <span className="record-list-page__stat-value">{records.length}</span>
          <span className="record-list-page__stat-label">전체 기록</span>
        </li>
        <li className="record-list-page__stat">
          <span className="record-list-page__stat-value">{averageRating.toFixed(1)}</span>
          <span className="record-list-page__stat-label">평균 만족도</span>
        </li>
        <li className="record-list-page__stat">
          <span className="record-list-page__stat-value">{repurchaseCount}</span>
          <span className="record-list-page__stat-label">재구매 의향</span>
        </li>
      </ul>

      <RecordFilterBar
        filters={filters}
        cats={cats}
        brands={brands}
        flavors={flavors}
        resultCount={visibleRecords.length}
        activeFilterCount={activeFilterCount}
        onQueryChange={setQuery}
        onSortChange={setSort}
        onFoodTypeToggle={setFoodType}
        onCatToggle={setCatId}
        onBrandToggle={toggleBrand}
        onFlavorToggle={toggleFlavor}
        onReset={reset}
      />

      {visibleRecords.length > 0 ? (
        <RecordList records={visibleRecords} />
      ) : (
        <EmptyState
          emoji="🔍"
          title="조건에 맞는 기록이 없어요"
          description="검색어나 필터를 바꿔서 다시 찾아보세요."
          action={
            <button type="button" className="btn btn--ghost" onClick={reset}>
              필터 초기화
            </button>
          }
        />
      )}
    </div>
  );
}
