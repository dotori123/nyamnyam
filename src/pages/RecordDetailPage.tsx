import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useRecords } from '../hooks/useRecords';
import { useCats } from '../hooks/useCats';
import { FOOD_TYPE_MAP, REPURCHASE_MAP, STOOL_MAP } from '../utils/options';
import { formatDate, formatPrice, formatUnitPrice, formatVolume } from '../utils/format';
import CatAvatar from '../components/cat/CatAvatar';
import RatingHearts from '../components/record/RatingHearts';
import Chip from '../components/common/Chip';
import EmptyState from '../components/common/EmptyState';
import './RecordDetailPage.scss';

export default function RecordDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getRecord, removeRecord } = useRecords();
  const { getCat } = useCats();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const record = id ? getRecord(id) : undefined;

  if (!record) {
    return (
      <EmptyState
        emoji="🙀"
        title="기록을 찾을 수 없어요"
        description="삭제되었거나 잘못된 주소일 수 있어요."
        action={
          <Link to="/" className="btn btn--primary">
            목록으로
          </Link>
        }
      />
    );
  }

  const cat = getCat(record.catId);
  const foodType = FOOD_TYPE_MAP[record.foodType];
  const stool = STOOL_MAP[record.stool];
  const repurchase = REPURCHASE_MAP[record.repurchase];
  const volume = formatVolume(record.volume);
  const unitPrice = formatUnitPrice(record);
  const shownPhotos = record.photos.filter((photo) => photo.url);

  const handleDelete = () => {
    removeRecord(record.id);
    navigate('/', { replace: true });
  };

  return (
    <article className="record-detail">
      {/* url이 빈 사진은 이 기기에 원본이 없는 것 — 빈 src를 그리지 않는다 */}
      {shownPhotos.length > 0 && (
        <ul className="record-detail__photos">
          {shownPhotos.map((photo) => (
            <li key={photo.id} className="record-detail__photo">
              <img src={photo.url} alt={photo.fileName ?? record.productName} />
            </li>
          ))}
        </ul>
      )}

      <header className="record-detail__header">
        {cat && (
          <Link to={`/cats/${cat.id}`} className="record-detail__cat">
            <CatAvatar cat={cat} size="sm" />
            <span>{cat.name}의 기록</span>
          </Link>
        )}
        <span className="record-detail__brand">{record.brand}</span>
        <h2 className="record-detail__name">{record.productName}</h2>
        <div className="record-detail__meta">
          <Chip as="span" size="sm">
            {foodType.emoji} {foodType.label}
          </Chip>
          {record.flavor && (
            <Chip as="span" size="sm">
              {record.flavor}
            </Chip>
          )}
          {volume && (
            <Chip as="span" size="sm">
              {volume}
            </Chip>
          )}
        </div>
        <RatingHearts value={record.rating} size="lg" showValue />
      </header>

      <section className="record-detail__section">
        <h3 className="record-detail__section-title">후기</h3>
        <dl className="record-detail__rows">
          <div className="record-detail__row">
            <dt>배변 상태</dt>
            <dd className={`record-detail__stool record-detail__stool--${record.stool}`}>
              {stool.emoji} {stool.label}
            </dd>
          </div>
          <div className="record-detail__row">
            <dt>재구매 의향</dt>
            <dd>
              {repurchase.emoji} {repurchase.label}
            </dd>
          </div>
        </dl>
      </section>

      <section className="record-detail__section">
        <h3 className="record-detail__section-title">구매 정보</h3>
        <dl className="record-detail__rows">
          <div className="record-detail__row">
            <dt>가격</dt>
            <dd>
              {formatPrice(record.price)}
              {unitPrice && <span className="record-detail__unit-price">{unitPrice}</span>}
            </dd>
          </div>
          <div className="record-detail__row">
            <dt>구매처</dt>
            <dd>{record.store || '-'}</dd>
          </div>
          <div className="record-detail__row">
            <dt>구매일</dt>
            <dd>{record.purchasedAt ? formatDate(record.purchasedAt) : '-'}</dd>
          </div>
        </dl>
      </section>

      {record.memo && (
        <section className="record-detail__section">
          <h3 className="record-detail__section-title">메모</h3>
          <p className="record-detail__memo">{record.memo}</p>
        </section>
      )}

      {record.tags.length > 0 && (
        <section className="record-detail__section">
          <h3 className="record-detail__section-title">태그</h3>
          <div className="record-detail__tags">
            {record.tags.map((tag) => (
              <Chip key={tag} as="span" size="sm">
                #{tag}
              </Chip>
            ))}
          </div>
        </section>
      )}

      <footer className="record-detail__footer">
        <div className="record-detail__actions">
          <Link to={`/records/${record.id}/edit`} className="btn btn--ghost">
            기록 수정
          </Link>
          {/* 같은 사료를 또 사는 일이 잦다. 제품 정보를 물려받아 새 기록으로 넘어간다 */}
          <Link to={`/new?copy=${record.id}`} className="btn btn--primary">
            🔁 다시 기록
          </Link>
        </div>

        <p className="record-detail__timestamp">{formatDate(record.createdAt)} 기록</p>
        {confirmingDelete ? (
          <div className="record-detail__confirm">
            <span>이 기록을 삭제할까요?</span>
            <div className="record-detail__confirm-actions">
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
            기록 삭제
          </button>
        )}
      </footer>
    </article>
  );
}
