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

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<RecordListPage />} />
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
