import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useCats } from '../hooks/useCats';
import { useRecords } from '../hooks/useRecords';
import { GENDER_MAP } from '../utils/options';
import { formatAge, formatDate, formatWeight } from '../utils/format';
import CatAvatar from '../components/cat/CatAvatar';
import RecordList from '../components/record/RecordList';
import EmptyState from '../components/common/EmptyState';
import './CatDetailPage.scss';

/** 상세 화면에 보여줄 최근 기록 개수 */
const RECENT_LIMIT = 3;

export default function CatDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCat, removeCat, selectedCatId, selectCat } = useCats();
  const { records, updateRecord } = useRecords();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const cat = getCat(id ?? null);

  const catRecords = useMemo(
    () => records.filter((record) => record.catId === id),
    [records, id],
  );

  if (!cat) {
    return (
      <EmptyState
        emoji="🙀"
        title="프로필을 찾을 수 없어요"
        description="삭제되었거나 잘못된 주소일 수 있어요."
        action={
          <Link to="/cats" className="btn btn--primary">
            고양이 목록으로
          </Link>
        }
      />
    );
  }

  const gender = GENDER_MAP[cat.gender];
  const age = formatAge(cat.birthday);
  const weight = formatWeight(cat.weightKg);
  const isSelected = cat.id === selectedCatId;

  const handleDelete = () => {
    // 이 아이를 참조하던 기록은 "미지정"으로 되돌린다 (기록 자체는 남긴다)
    catRecords.forEach((record) => updateRecord(record.id, { catId: null }));
    removeCat(cat.id);
    navigate('/cats', { replace: true });
  };

  return (
    <article className="cat-detail">
      <header className="cat-detail__header">
        <CatAvatar cat={cat} size="lg" />
        <h2 className="cat-detail__name">
          {cat.name}
          <span className="cat-detail__gender">{gender.emoji}</span>
        </h2>
        <p className="cat-detail__meta">
          {[age, cat.breed, weight].filter(Boolean).join(' · ') || '정보 미입력'}
        </p>

        <div className="cat-detail__header-actions">
          {isSelected ? (
            <span className="cat-detail__selected">현재 선택된 아이예요</span>
          ) : (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => selectCat(cat.id)}
            >
              이 아이로 전환
            </button>
          )}
          <Link to={`/cats/${cat.id}/edit`} className="btn btn--ghost">
            프로필 수정
          </Link>
        </div>
      </header>

      <section className="cat-detail__section">
        <h3 className="cat-detail__section-title">기본 정보</h3>
        <dl className="cat-detail__rows">
          <div className="cat-detail__row">
            <dt>생일</dt>
            <dd>{cat.birthday ? `${formatDate(cat.birthday)} (${age})` : '-'}</dd>
          </div>
          <div className="cat-detail__row">
            <dt>품종</dt>
            <dd>{cat.breed || '-'}</dd>
          </div>
          <div className="cat-detail__row">
            <dt>성별</dt>
            <dd>
              {gender.emoji} {gender.label}
            </dd>
          </div>
          <div className="cat-detail__row">
            <dt>체중</dt>
            <dd>{weight ?? '-'}</dd>
          </div>
        </dl>
      </section>

      {cat.memo && (
        <section className="cat-detail__section">
          <h3 className="cat-detail__section-title">특이사항</h3>
          <p className="cat-detail__memo">{cat.memo}</p>
        </section>
      )}

      <section className="cat-detail__section cat-detail__section--records">
        <div className="cat-detail__records-head">
          <h3 className="cat-detail__section-title">최근 기록 {catRecords.length}건</h3>
          {catRecords.length > 0 && (
            <Link to={`/?cat=${cat.id}`} className="cat-detail__more">
              전체 보기
            </Link>
          )}
        </div>

        {catRecords.length > 0 ? (
          <RecordList records={catRecords.slice(0, RECENT_LIMIT)} />
        ) : (
          <p className="cat-detail__empty">
            아직 {cat.name}의 기록이 없어요.{' '}
            <Link to="/new" className="cat-detail__more">
              기록 남기기
            </Link>
          </p>
        )}
      </section>

      <footer className="cat-detail__footer">
        <p className="cat-detail__timestamp">{formatDate(cat.createdAt)} 등록</p>
        {confirmingDelete ? (
          <div className="cat-detail__confirm">
            <span>
              {cat.name} 프로필을 삭제할까요?
              {catRecords.length > 0 && ` 기록 ${catRecords.length}건은 '미지정'으로 남아요.`}
            </span>
            <div className="cat-detail__confirm-actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirmingDelete(false)}
              >
                취소
              </button>
              <button type="button" className="btn btn--danger" onClick={handleDelete}>
                삭제
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn--danger btn--block"
            onClick={() => setConfirmingDelete(true)}
          >
            프로필 삭제
          </button>
        )}
      </footer>
    </article>
  );
}
