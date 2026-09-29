import { NavLink } from 'react-router-dom';
import Icon from '../common/Icon';
import type { IconName } from '../common/icons';
import './BottomNav.scss';

const TABS: { to: string; label: string; icon: IconName; end: boolean }[] = [
  { to: '/', label: '기록', icon: 'notebook', end: true },
  { to: '/stats', label: '통계', icon: 'chart', end: false },
  { to: '/new', label: '등록', icon: 'plus', end: false },
  { to: '/cats', label: '고양이', icon: 'cat', end: false },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      <ul className="bottom-nav__list">
        {TABS.map((tab) => (
          <li key={tab.to} className="bottom-nav__item">
            <NavLink
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                isActive ? 'bottom-nav__link bottom-nav__link--active' : 'bottom-nav__link'
              }
            >
              <Icon name={tab.icon} className="bottom-nav__icon" />
              <span className="bottom-nav__label">{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
