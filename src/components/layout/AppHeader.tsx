import { Link, useLocation, useNavigate } from 'react-router-dom';
import CatMark from '../common/CatMark';
import { getSubPageTitle } from '../../utils/routeTitles';
import './AppHeader.scss';

export default function AppHeader() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // 뒤로가기가 필요한 화면인지 (경로 표는 utils/routeTitles.ts 한 곳에)
  const subTitle = getSubPageTitle(pathname);

  if (!subTitle) {
    return (
      <header className="app-header app-header--brand">
        <div className="app-header__brand">
          <span className="app-header__logo">
            <CatMark title="냥냠냠 로고" />
          </span>
          <div>
            <h1 className="app-header__title">냥냠냠</h1>
            <p className="app-header__subtitle">Cat food, remembered.</p>
          </div>
        </div>

        <Link to="/settings" className="app-header__settings" aria-label="설정">
          ⚙️
        </Link>
      </header>
    );
  }

  return (
    <header className="app-header">
      <button
        type="button"
        className="app-header__back"
        onClick={() => navigate(-1)}
        aria-label="뒤로 가기"
      >
        ←
      </button>
      <h1 className="app-header__title app-header__title--sub">{subTitle}</h1>
    </header>
  );
}
