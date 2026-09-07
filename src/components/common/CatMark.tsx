import { useId } from 'react';
import './CatMark.scss';

interface Props {
  /** 접근성 이름. 넘기지 않으면 장식으로 취급해 숨긴다 */
  title?: string;
  className?: string;
}

/**
 * 냥냠냠 로고 마크 — 삼색이(calico) 고양이 얼굴.
 *
 * 얼굴 위에 얼룩 둘을 얹어 털색이 한눈에 보이게 했다.
 * 색은 --mark-* CSS 변수라 선택한 고양이 털색 테마를 그대로 따라간다
 * (팔레트: src/styles/_themes.scss). 폴백값은 기본 테마인 삼색이.
 *
 * 같은 도형이 index.html의 스플래시와 public/favicon.svg에도 들어간다.
 * 그쪽은 설치형 아이콘·파비콘이라 브랜드 고정색(삼색이)을 쓴다.
 */
export default function CatMark({ title, className }: Props) {
  // 한 화면에 여러 번 그려도 defs id가 겹치지 않도록
  const uid = useId().replace(/:/g, '');
  const bgId = `mark-bg-${uid}`;
  const headId = `mark-head-${uid}`;

  return (
    <svg
      viewBox="0 0 100 100"
      className={className ? `cat-mark ${className}` : 'cat-mark'}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--mark-plate-from, #f4a71a)" />
          <stop offset="1" stopColor="var(--mark-plate-to, #dc8c05)" />
        </linearGradient>
        <clipPath id={headId}>
          <ellipse cx="50" cy="56" rx="29" ry="26.5" />
        </clipPath>
      </defs>

      <rect width="100" height="100" rx="24" fill={`url(#${bgId})`} />

      {/* 실루엣 림 — 오렌지 얼룩이 오렌지 배경에 묻히지 않도록 얼굴을 살짝 키워 깐다 */}
      <g fill="var(--mark-rim, #26261f)">
        <path d="M22.31 43.73 L32.24 12.38 L46.87 32.24 Z" />
        <path d="M77.69 43.73 L67.76 12.38 L53.13 32.24 Z" />
        <ellipse cx="50" cy="56.27" rx="30.31" ry="27.69" />
      </g>
      {/* 귀 — 안쪽을 각각 오렌지 / 블랙으로 나눠 삼색이 느낌을 준다 */}
      <path d="M23.5 44 L33 14 L47 33 Z" fill="var(--mark-face, #faf7f2)" />
      <path d="M76.5 44 L67 14 L53 33 Z" fill="var(--mark-face, #faf7f2)" />
      <path d="M31.5 38.5 L34.5 24.5 L41.5 33.5 Z" fill="var(--mark-patch-a, #f4a71a)" />
      <path d="M68.5 38.5 L65.5 24.5 L58.5 33.5 Z" fill="var(--mark-patch-b, #26261f)" />

      {/* 얼굴 */}
      <ellipse cx="50" cy="56" rx="29" ry="26.5" fill="var(--mark-face, #faf7f2)" />

      {/* 얼룩 — 얼굴 밖으로 삐져나가지 않게 클립 */}
      <g clipPath={`url(#${headId})`}>
        <ellipse cx="33" cy="36" rx="17" ry="12" fill="var(--mark-patch-a, #f4a71a)" />
        <ellipse cx="67" cy="35" rx="15" ry="11" fill="var(--mark-patch-b, #26261f)" />
      </g>

      {/* 눈 · 코 · 입 */}
      <ellipse cx="40.5" cy="54" rx="3.7" ry="5" fill="var(--mark-line, #26261f)" />
      <ellipse cx="59.5" cy="54" rx="3.7" ry="5" fill="var(--mark-line, #26261f)" />
      <path d="M50 66 L46.5 61 L53.5 61 Z" fill="var(--mark-nose, #f4a71a)" />
      <path
        d="M41.6 66 a4.4 4.4 0 0 0 8.4 0 a4.4 4.4 0 0 0 8.4 0"
        fill="none"
        stroke="var(--mark-line, #26261f)"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
