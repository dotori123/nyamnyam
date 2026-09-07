import { Link } from 'react-router-dom';
import type { Cat } from '../../types';
import { GENDER_MAP } from '../../utils/options';
import { formatAge, formatWeight } from '../../utils/format';
import CatAvatar from './CatAvatar';
import './CatCard.scss';

interface Props {
  cat: Cat;
  /** 현재 선택된(활성) 고양이인지 */
  selected: boolean;
  /** 기록 개수 */
  recordCount: number;
  onSelect: (id: string) => void;
}

export default function CatCard({ cat, selected, recordCount, onSelect }: Props) {
  const gender = GENDER_MAP[cat.gender];
  const age = formatAge(cat.birthday);
  const weight = formatWeight(cat.weightKg);

  const meta = [age, cat.breed, weight].filter(Boolean).join(' · ');

  return (
    <li className={selected ? 'cat-card cat-card--selected' : 'cat-card'}>
      <Link to={`/cats/${cat.id}`} className="cat-card__link">
        <CatAvatar cat={cat} size="md" />

        <div className="cat-card__body">
          <div className="cat-card__top">
            <h3 className="cat-card__name">{cat.name}</h3>
            <span className="cat-card__gender">{gender.emoji}</span>
            {selected && <span className="cat-card__badge">선택됨</span>}
          </div>
          <p className="cat-card__meta">{meta || '정보 미입력'}</p>
          <p className="cat-card__count">기록 {recordCount}건</p>
        </div>
      </Link>

      {!selected && (
        <button type="button" className="cat-card__select" onClick={() => onSelect(cat.id)}>
          이 아이로 전환
        </button>
      )}
    </li>
  );
}
