import type { Rating } from '../../types';
import './RatingHearts.scss';

const VALUES: Rating[] = [1, 2, 3, 4, 5];

interface Props {
  value: Rating;
  /** 넘기지 않으면 읽기 전용 표시 */
  onChange?: (value: Rating) => void;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function RatingHearts({ value, onChange, size = 'md', showValue = false }: Props) {
  const readOnly = !onChange;

  if (readOnly) {
    return (
      <span className={`rating rating--${size}`} aria-label={`만족도 5점 만점에 ${value}점`}>
        {VALUES.map((v) => (
          <span key={v} className={v <= value ? 'rating__heart' : 'rating__heart rating__heart--off'} aria-hidden="true">
            {v <= value ? '❤️' : '🤍'}
          </span>
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
          aria-label={`${v}점`}
          className={v <= value ? 'rating__button' : 'rating__button rating__button--off'}
          onClick={() => onChange(v)}
        >
          <span aria-hidden="true">{v <= value ? '❤️' : '🤍'}</span>
        </button>
      ))}
      {showValue && <span className="rating__value">{value}.0</span>}
    </div>
  );
}
