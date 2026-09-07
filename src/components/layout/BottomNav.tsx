import { NavLink } from 'react-router-dom';
import './BottomNav.scss';

const TABS = [
  { to: '/', label: '기록', icon: '📒', end: true },
  { to: '/stats', label: '통계', icon: '📊', end: false },
  { to: '/new', label: '등록', icon: '➕', end: false },
  { to: '/cats', label: '고양이', icon: '🐱', end: false },
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
              <span className="bottom-nav__icon" aria-hidden="true">
                {tab.icon}
              </span>
              <span className="bottom-nav__label">{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
