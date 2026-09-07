import { Link } from 'react-router-dom';
import { useCats } from '../hooks/useCats';
import { useRecords } from '../hooks/useRecords';
import CatCard from '../components/cat/CatCard';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import './CatListPage.scss';

export default function CatListPage() {
  const { cats, selectedCatId, selectCat, loading } = useCats();
  const { records } = useRecords();

  if (loading) return <LoadingState label="고양이" />;

  if (cats.length === 0) {
    return (
      <EmptyState
        emoji="🐈"
        title="등록된 고양이가 없어요"
        description="프로필을 만들면 기록을 고양이별로 나눠서 볼 수 있어요."
        action={
          <Link to="/cats/new" className="btn btn--primary">
            첫 프로필 만들기
          </Link>
        }
      />
    );
  }

  const countByCat = records.reduce<Record<string, number>>((acc, record) => {
    if (record.catId) acc[record.catId] = (acc[record.catId] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="cat-list-page">
      <p className="cat-list-page__hint">
        선택한 아이가 기록 등록 시 기본값으로 채워져요.
      </p>

      <ul className="cat-list-page__list">
        {cats.map((cat) => (
          <CatCard
            key={cat.id}
            cat={cat}
            selected={cat.id === selectedCatId}
            recordCount={countByCat[cat.id] ?? 0}
            onSelect={selectCat}
          />
        ))}
      </ul>

      <div className="cat-list-page__actions">
        <Link to="/cats/new" className="btn btn--primary btn--block">
          + 고양이 추가
        </Link>
      </div>
    </div>
  );
}
