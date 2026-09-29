import type { ReactNode } from 'react';
import CatMark from './CatMark';
import Icon from './Icon';
import type { IconName } from './icons';
import './EmptyState.scss';

interface Props {
  /** 넘기지 않으면 로고 고양이가 나온다. 검색·통계처럼 상황이 분명할 때만 아이콘을 쓴다 */
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div className="empty-state">
      {icon ? (
        <span className="empty-state__icon">
          <Icon name={icon} />
        </span>
      ) : (
        <span className="empty-state__mark">
          <CatMark />
        </span>
      )}
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
