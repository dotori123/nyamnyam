import { Link } from 'react-router-dom';
import type { FeedRecord } from '../../types';
import { FOOD_TYPE_MAP, REPURCHASE_MAP, STOOL_MAP } from '../../utils/options';
import { formatPrice, formatRelativeDate, formatUnitPrice, formatVolume } from '../../utils/format';
import { useCats } from '../../hooks/useCats';
import CatAvatar from '../cat/CatAvatar';
import RatingHearts from './RatingHearts';
import './RecordCard.scss';

export default function RecordCard({ record }: { record: FeedRecord }) {
  const { cats, getCat } = useCats();
  const cat = getCat(record.catId);
  // 한 마리만 키우면 모든 카드에 같은 이름이 붙어 노이즈가 된다.
  // 필터 줄(RecordFilterBar)과 같은 기준으로 숨긴다.
  const badgeCat = cats.length > 1 ? cat : undefined;
  const thumbnail = record.photos[0];
  const foodType = FOOD_TYPE_MAP[record.foodType];
  const stool = STOOL_MAP[record.stool];
  const repurchase = REPURCHASE_MAP[record.repurchase];
  const volume = formatVolume(record.volume);
  // 목록에서 제품끼리 비교할 때 실제로 쓰는 값. 개·팩 단위는 환산이 안 돼 null이다
  const unitPrice = formatUnitPrice(record);

  return (
    <li className="record-card">
      <Link to={`/records/${record.id}`} className="record-card__link">
        <div className="record-card__thumb">
          {thumbnail?.url ? (
            <img src={thumbnail.url} alt="" className="record-card__image" />
          ) : (
            <span className="record-card__placeholder" aria-hidden="true">
              {foodType.emoji}
            </span>
          )}
          {record.photos.length > 1 && (
            <span className="record-card__count">+{record.photos.length - 1}</span>
          )}
        </div>

        <div className="record-card__body">
          <div className="record-card__top">
            <span className="record-card__brand">{record.brand}</span>
            <span className="record-card__date">{formatRelativeDate(record.createdAt)}</span>
          </div>

          {badgeCat && (
            <span className="record-card__cat">
              <CatAvatar cat={badgeCat} size="xs" />
              {badgeCat.name}
            </span>
          )}

          <h3 className="record-card__name">{record.productName}</h3>

          <div className="record-card__meta">
            <span className="record-card__flavor">{record.flavor}</span>
            {volume && <span className="record-card__dot">·</span>}
            {volume && <span>{volume}</span>}
          </div>

          <div className="record-card__rating">
            <RatingHearts value={record.rating} size="sm" />
            <span className="record-card__price">{formatPrice(record.price)}</span>
          </div>

          <div className="record-card__badges">
            <div className="record-card__badge-wrap">
              <span className="record-card__badge">
                {foodType.emoji} {foodType.label}
              </span>
              <span className={`record-card__badge record-card__badge--stool-${record.stool}`}>
                {stool.emoji} {stool.label}
              </span>
              <span className={`record-card__badge record-card__badge--repurchase-${record.repurchase}`}>
                {repurchase.emoji} {repurchase.label}
              </span>
            </div>

            {unitPrice && <span className="record-card__price-unit">{unitPrice}</span>}
          </div>
        </div>
      </Link>
    </li>
  );
}
