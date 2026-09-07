import type { ReactNode } from 'react';
import './EmptyState.scss';

interface Props {
  emoji?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function EmptyState({ emoji = '🐈', title, description, action }: Props) {
  return (
    <div className="empty-state">
      <div className="empty-state__emoji" aria-hidden="true">
        {emoji}
      </div>
      <p className="empty-state__title">{title}</p>
      {description && <p className="empty-state__description">{description}</p>}
      {action && <div className="empty-state__action">{action}</div>}
    </div>
  );
}
