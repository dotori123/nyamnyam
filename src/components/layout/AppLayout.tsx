import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';
import ScrollToTop from './ScrollToTop';
import BottomNav from './BottomNav';
import CloudSyncBanner from './CloudSyncBanner';
import { useAuth } from '../../hooks/useAuth';
import { useStoredPhotoGc } from '../../hooks/useStoredPhotoGc';
import { useDocumentTitle } from '../../hooks/useDocumentTitle';
import { useRouteFocus } from '../../hooks/useRouteFocus';
import './AppLayout.scss';

export default function AppLayout() {
  // 참조가 끊긴 사진 원본을 앱 시작 때 한 번 정리한다
  useStoredPhotoGc();
  // SPA라 화면을 옮겨도 <title>이 그대로다. 경로에 맞춰 갱신한다
  useDocumentTitle();
  // 계정이 바뀌면 배너 상태도 처음부터 (아래 key)
  const { user } = useAuth();
  // 화면이 바뀌면 포커스도 본문으로 옮겨 준다 (스크린리더·키보드 사용자용)
  const mainRef = useRouteFocus<HTMLElement>();

  return (
    <div className="app-shell">
      <ScrollToTop />
      {/* 키보드·스크린리더로 헤더를 건너뛰고 본문으로. 포커스를 받을 때만 보인다 */}
      <a href="#main" className="app-shell__skip">
        본문 바로가기
      </a>
      <AppHeader />
      {/* 로그인 직후 "이 기기 기록을 옮길까요?" — 화면을 막지 않고 위에 얹는다 */}
      <CloudSyncBanner key={user?.uid ?? "anon"} />
      <main id="main" ref={mainRef} className="app-shell__main" tabIndex={-1}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
