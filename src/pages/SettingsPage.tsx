import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useCats } from '../hooks/useCats';
import { useRecords } from '../hooks/useRecords';
import ThemePicker from '../components/settings/ThemePicker';
import BackupPanel from '../components/settings/BackupPanel';
import AccountPanel from '../components/settings/AccountPanel';
import { clearStoredData } from '../storage/local';
import { clearPhotoBlobs } from '../storage/photos';
import { deleteAllRecords } from '../firebase/records';
import { deleteAllCats } from '../firebase/cats';
import './SettingsPage.scss';

export default function SettingsPage() {
  const { cats } = useCats();
  const { records } = useRecords();
  // Firebase 설정이 없으면 계정 섹션 자체를 감춘다 (로컬 전용 모드)
  const { available: authAvailable, user } = useAuth();

  /** 실수로 지우는 걸 막는 2단계 확인. 네이티브 confirm 대신 화면 안에서 묻는다 */
  const [confirming, setConfirming] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);

  const handleClear = async () => {
    setClearing(true);

    // 로그인 중이면 화면이 보고 있는 건 계정 쪽이다. 로컬만 지우면 아무 일도 없는 것처럼 보인다
    if (user) {
      try {
        await deleteAllRecords(user.uid);
        await deleteAllCats(user.uid);
      } catch {
        setClearError('계정 기록을 지우지 못했어요. 연결을 확인하고 다시 시도해 주세요.');
        setClearing(false);
        return;
      }
    }

    clearStoredData();
    await clearPhotoBlobs();
    // 메모리에 남은 상태까지 확실히 털어내려고 새로 띄운다
    window.location.reload();
  };

  return (
    <div className="settings-page">
      {authAvailable && (
        <section className="settings-page__section">
          <h2 className="settings-page__title">계정</h2>
          <AccountPanel />
        </section>
      )}

      <section className="settings-page__section">
        <h2 className="settings-page__title">고양이 털색 테마</h2>
        <p className="settings-page__hint">
          우리 아이 털색을 고르면 앱 색이 그 색으로 바뀌어요.
        </p>
        <ThemePicker />
      </section>

      <section className="settings-page__section">
        <h2 className="settings-page__title">기록 현황</h2>
        <dl className="settings-page__rows">
          <div className="settings-page__row">
            <dt>등록된 고양이</dt>
            <dd>{cats.length}마리</dd>
          </div>
          <div className="settings-page__row">
            <dt>전체 기록</dt>
            <dd>{records.length}건</dd>
          </div>
        </dl>
        <p className="settings-page__hint">
          기록과 사진은 이 기기의 브라우저에 저장돼요. 아직 계정 동기화는 없어서
          다른 기기에서는 보이지 않고, 브라우저 저장소를 비우면 함께 사라집니다.
          아래 <strong>백업</strong>으로 파일에 담아 두면 안전해요.
        </p>
      </section>

      <section className="settings-page__section">
        <h2 className="settings-page__title">백업</h2>
        <BackupPanel />
      </section>

      <section className="settings-page__section">
        <h2 className="settings-page__title">기록 전체 지우기</h2>

        {confirming ? (
          <>
            <p className="settings-page__hint settings-page__hint--warn">
              기록 {records.length}건과 고양이 {cats.length}마리를 <strong>완전히</strong> 지웁니다.
              {user
                ? ' 계정에 올라간 것과 이 기기에 남은 것 모두 지워집니다.'
                : ' 이 기기에서 지워집니다.'}{' '}
              샘플 데이터도 다시 나타나지 않아요. 되돌릴 수 없습니다.
            </p>
            {clearError && (
              <p className="settings-page__hint settings-page__hint--warn" role="alert">
                {clearError}
              </p>
            )}
            <div className="settings-page__actions">
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setConfirming(false)}
                disabled={clearing}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={handleClear}
                disabled={clearing}
              >
                {clearing ? '지우는 중…' : '정말 지우기'}
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="settings-page__hint">
              저장된 기록·프로필·사진을 모두 지워 빈 상태로 만들어요.
              {user && ' 계정에 올라간 기록도 함께 지워집니다.'} 털색 테마는 그대로 둡니다.
            </p>
            <button
              type="button"
              className="btn btn--danger btn--block"
              onClick={() => setConfirming(true)}
            >
              기록 전체 지우기
            </button>
          </>
        )}
      </section>
    </div>
  );
}
