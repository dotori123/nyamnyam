import type { Rating } from '../../types';
import Icon from '../common/Icon';
import './RatingHearts.scss';

const VALUES: Rating[] = [1, 2, 3, 4, 5];

interface Props {
  /** null이면 평가 전 — 읽기 전용에서는 "평가 전" 배지, 입력에서는 하트가 모두 꺼진 상태 */
  value: Rating | null;
  /** 넘기지 않으면 읽기 전용 표시 */
  /** 이미 고른 하트를 다시 누르면 null(안 고름)을 넘긴다 */
  onChange?: (value: Rating | null) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function RatingHearts({ value, onChange, size = 'md', showValue = false }: Props) {
  const readOnly = !onChange;

  if (readOnly) {
    if (value === null) {
      return <span className={`rating-pending rating-pending--${size}`}>평가 전</span>;
    }
    return (
      <span className={`rating rating--${size}`} aria-label={`만족도 5점 만점에 ${value}점`}>
        {VALUES.map((v) => (
          <Icon
            key={v}
            name="heart"
            filled={v <= value}
            className={v <= value ? 'rating__heart' : 'rating__heart rating__heart--off'}
          />
        ))}
        {showValue && <span className="rating__value">{value}.0</span>}
      </span>
    );
  }

  return (
    <div className={`rating rating--${size} rating--input`} role="radiogroup" aria-label="만족도">
      {VALUES.map((v) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          // 평가 전이면 첫 하트로 들어오게 (radiogroup은 한 칸만 Tab을 받는다)
          tabIndex={v === (value ?? 1) ? 0 : -1}
          aria-label={`${v}점`}
          className={value !== null && v <= value ? 'rating__button' : 'rating__button rating__button--off'}
          onClick={() => onChange(v === value ? null : v)}
        >
          <Icon name="heart" filled={value !== null && v <= value} />
        </button>
      ))}
      {showValue && value !== null && <span className="rating__value">{value}.0</span>}
    </div>
  );
}
