import type { Cat } from '../../types';
import './CatAvatar.scss';

interface Props {
  cat: Cat | undefined;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/** 프로필 사진이 없으면 이름 첫 글자로 대체한다 */
export default function CatAvatar({ cat, size = 'md' }: Props) {
  if (!cat) {
    return (
      <span className={`cat-avatar cat-avatar--${size} cat-avatar--empty`} aria-hidden="true">
        🐾
      </span>
    );
  }

  // url이 비어 있으면 이 기기에 원본이 없는 사진이다.
  // src=""를 그리면 브라우저가 현재 페이지를 통째로 다시 내려받으므로 이름 첫 글자로 넘긴다.
  if (cat.photo?.url) {
    return (
      <img className={`cat-avatar cat-avatar--${size}`} src={cat.photo.url} alt={`${cat.name} 프로필 사진`} />
    );
  }

  return (
    <span className={`cat-avatar cat-avatar--${size} cat-avatar--initial`} aria-hidden="true">
      {cat.name.slice(0, 1)}
    </span>
  );
}
