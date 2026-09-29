import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import RecordListPage from './pages/RecordListPage';
import RecordFormPage from './pages/RecordFormPage';
import RecordDetailPage from './pages/RecordDetailPage';
import StatsPage from './pages/StatsPage';
import CatListPage from './pages/CatListPage';
import CatFormPage from './pages/CatFormPage';
import CatDetailPage from './pages/CatDetailPage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';
import LandingPage from './pages/landing/LandingPage';
import { useStarted } from './storage/firstVisit';

export default function App() {
  // 처음 온 사람의 / 는 소개 화면이다. 앱을 한 번 쓰면 같은 주소가 기록 목록이 된다 (storage/firstVisit.ts)
  const started = useStarted();

  return (
    <Routes>
      {!started && <Route path="/" element={<LandingPage />} />}
      {/* 앱을 쓰던 사람도 소개를 다시 보거나 공유할 수 있게 늘 열어 둔다 */}
      <Route path="/intro" element={<LandingPage />} />
      <Route element={<AppLayout />}>
        {started && <Route path="/" element={<RecordListPage />} />}
        <Route path="/new" element={<RecordFormPage />} />
        <Route path="/records/:id" element={<RecordDetailPage />} />
        <Route path="/records/:id/edit" element={<RecordFormPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/cats" element={<CatListPage />} />
        <Route path="/cats/new" element={<CatFormPage />} />
        <Route path="/cats/:id" element={<CatDetailPage />} />
        <Route path="/cats/:id/edit" element={<CatFormPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
