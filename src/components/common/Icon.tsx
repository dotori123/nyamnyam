import { ICONS, type IconName, type IconShape } from './icons';
import './Icon.scss';

interface Props {
  name: IconName;
  /** 선 아이콘의 면을 채운다 (만족도 하트의 켜진 칸) */
  filled?: boolean;
  /** 접근성 이름. 넘기지 않으면 장식으로 취급해 숨긴다 — 옆에 글자가 있으면 넘기지 않는다 */
  title?: string;
  className?: string;
}

/**
 * 선 아이콘. 크기는 1em이라 감싸는 요소의 font-size를 그대로 따르고,
 * 색은 currentColor라 글자색을 따른다. 모양은 icons.ts.
 */
export default function Icon({ name, filled, title, className }: Props) {
  const shape: IconShape = ICONS[name];

  return (
    <svg
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      className={className ? `icon ${className}` : 'icon'}
      fill={shape.solid || filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {shape.d.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
