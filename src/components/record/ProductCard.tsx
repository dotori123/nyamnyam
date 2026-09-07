import { Link } from 'react-router-dom';
import type { ProductGroup } from '../../utils/products';
import { FOOD_TYPE_MAP } from '../../utils/options';
import { formatDate, formatPrice } from '../../utils/format';
import RatingHearts from './RatingHearts';
import './ProductCard.scss';

/** 이력에서 몇 건까지 보여줄지. 더 있으면 "외 N번"으로 접는다 */
const SHOWN_PURCHASES = 3;

/**
 * 같은 제품을 여러 번 산 기록을 한 장으로.
 *
 * 이 화면의 질문은 하나다 — **"다음에 또 살까? 산다면 어디서?"**
 * 그래서 평균 만족도와 구매처별 가격을 나란히 놓고,
 * 가장 싸게 샀던 건을 표시한다.
 */
export default function ProductCard({ group }: { group: ProductGroup }) {
  const foodType = FOOD_TYPE_MAP[group.foodType];
  const shown = group.purchases.slice(0, SHOWN_PURCHASES);
  const hidden = group.purchases.length - shown.length;

  return (
    <li className="product-card">
      <div className="product-card__head">
        {group.photo?.url ? (
          <img src={group.photo.url} alt="" className="product-card__image" />
        ) : (
          <span className="product-card__placeholder" aria-hidden="true">
            {foodType.emoji}
          </span>
        )}

        <div className="product-card__title">
          <span className="product-card__brand">{group.brand}</span>
          <strong className="product-card__name">{group.productName}</strong>
          <span className="product-card__meta">
            <RatingHearts value={roundToRating(group.averageRating)} size="sm" />
            <span className="product-card__average">{group.averageRating.toFixed(1)}</span>
            <span className="product-card__count">· {group.purchases.length}번 구매</span>
          </span>
        </div>
      </div>

      {group.averageUnitPriceLabel && (
        <p className="product-card__unit">{group.averageUnitPriceLabel}</p>
      )}

      <ul className="product-card__purchases">
        {shown.map((purchase) => {
          const isCheapest =
            group.cheapest !== null &&
            group.purchases.length > 1 &&
            purchase.recordId === group.cheapest.recordId;

          return (
            <li key={purchase.recordId}>
              <Link to={`/records/${purchase.recordId}`} className="product-card__purchase">
                <span className="product-card__date">{formatDate(purchase.date)}</span>
                <span className="product-card__store">{purchase.store || '구매처 미입력'}</span>
                <span className="product-card__price">
                  {purchase.price === null ? '—' : formatPrice(purchase.price)}
                  {isCheapest && <span className="product-card__cheapest">최저</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {hidden > 0 && <p className="product-card__more">외 {hidden}번 더 구매</p>}
    </li>
  );
}

/** 평균은 소수인데 하트는 1~5 정수라 반올림해서 그린다 (정확한 값은 옆에 숫자로 적는다) */
function roundToRating(average: number) {
  return Math.min(5, Math.max(1, Math.round(average))) as 1 | 2 | 3 | 4 | 5;
}
