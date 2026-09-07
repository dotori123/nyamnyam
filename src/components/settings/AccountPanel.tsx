import { useAuth } from '../../hooks/useAuth';
import AccountAvatar from './AccountAvatar';
import './AccountPanel.scss';

/**
 * 구글 로그인 / 로그아웃.
 *
 * Firebase 설정이 없으면 아무것도 그리지 않는다 (SettingsPage가 섹션째 감춘다).
 * 로그인은 선택이라, 하지 않아도 앱은 지금처럼 이 기기에 저장하며 동작한다.
 */
export default function AccountPanel() {
  const { user, loading, error, signIn, signOut } = useAuth();

  if (loading) {
    return <p className="account-panel__meta">로그인 상태를 확인하는 중이에요…</p>;
  }

  return (
    <div className="account-panel">
      {user ? (
        <>
          <div className="account-panel__profile">
            {/* key로 계정이 바뀌면 이미지 실패 기록을 초기화한다 */}
            <AccountAvatar key={user.uid} photoURL={user.photoURL} />
            <div className="account-panel__who">
              <strong className="account-panel__name">{user.displayName ?? '이름 없음'}</strong>
              {user.email && <span className="account-panel__email">{user.email}</span>}
            </div>
          </div>
          <button type="button" className="btn btn--ghost btn--block" onClick={() => void signOut()}>
            로그아웃
          </button>
        </>
      ) : (
        <>
          <p className="settings-page__hint">
            로그인하면 기록이 계정을 따라다녀요. 로그인하지 않아도 앱은 그대로 쓸 수 있고,
            그때는 이 기기에만 저장돼요.
          </p>
          <button type="button" className="btn btn--primary btn--block" onClick={() => void signIn()}>
            구글로 로그인
          </button>
        </>
      )}

      {error && (
        <p className="account-panel__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
