import type { ReactNode } from 'react';
import './Chip.scss';

interface Props {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  /** 버튼이 아니라 단순 표시용 라벨로 쓸 때 */
  as?: 'button' | 'span';
  size?: 'sm' | 'md';
}

export default function Chip({
  children,
  selected = false,
  onClick,
  as = 'button',
  size = 'md',
}: Props) {
  const className = [
    'chip',
    `chip--${size}`,
    selected ? 'chip--selected' : '',
    as === 'span' ? 'chip--static' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (as === 'span') {
    return <span className={className}>{children}</span>;
  }

  return (
    <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
      {children}
    </button>
  );
}
