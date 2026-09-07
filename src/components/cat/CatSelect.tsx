import { Link } from 'react-router-dom';
import { useCats } from '../../hooks/useCats';
import Chip from '../common/Chip';
import CatAvatar from './CatAvatar';
import './CatSelect.scss';

interface Props {
  /** 선택된 고양이 id. 미지정이면 빈 문자열 */
  value: string;
  onChange: (catId: string) => void;
}

/** 기록 등록 폼에서 "어느 고양이 기록인지" 고르는 UI */
export default function CatSelect({ value, onChange }: Props) {
  const { cats } = useCats();

  if (cats.length === 0) {
    return (
      <p className="cat-select__empty">
        등록된 고양이가 없어요.{' '}
        <Link to="/cats/new" className="cat-select__link">
          프로필 먼저 등록하기
        </Link>
      </p>
    );
  }

  return (
    <div className="cat-select">
      {cats.map((cat) => (
        <Chip key={cat.id} selected={value === cat.id} onClick={() => onChange(cat.id)}>
          <CatAvatar cat={cat} size="xs" />
          {cat.name}
        </Chip>
      ))}
      <Chip selected={value === ''} onClick={() => onChange('')}>
        미지정
      </Chip>
    </div>
  );
}
