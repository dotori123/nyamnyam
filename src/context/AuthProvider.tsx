import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { firebaseAuth, isFirebaseConfigured } from '../firebase/config';
import { AuthContext, type AppUser, type AuthContextValue } from './authContext';

/**
 * 구글 로그인.
 *
 * 로그인은 **선택**이다. 로그인하지 않으면 지금까지처럼 이 기기에만 저장하고,
 * 로그인하면 기록이 계정을 따라다닌다. 그래서 로그인 화면으로 앱을 막지 않는다.
 *
 * Firebase 설정이 없으면(`.env.local` 미작성) available=false로 두고
 * 설정 화면에서 로그인 항목 자체를 감춘다.
 */

/** 지난번 로그인 여부를 이 기기에 남겨 둔다 (다음 실행의 첫 화면 판단용) */
const SIGNED_IN_KEY = 'nyamnyam.signedIn';

function readExpectsUser(): boolean {
  try {
    return localStorage.getItem(SIGNED_IN_KEY) === 'true';
  } catch {
    return false;
  }
}

function rememberSignedIn(signedIn: boolean): void {
  try {
    localStorage.setItem(SIGNED_IN_KEY, String(signedIn));
  } catch {
    // 남기지 못하면 다음 실행에 잠깐 로컬 기록이 보일 뿐이다
  }
}

function toAppUser(user: User): AppUser {
  return {
    uid: user.uid,
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  // 설정이 없으면 기다릴 것도 없다
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [error, setError] = useState<string | null>(null);
  const [expectsUser, setExpectsUser] = useState(() => isFirebaseConfigured && readExpectsUser());

  useEffect(() => {
    if (!firebaseAuth) return;

    // 새로고침해도 로그인이 유지되므로, 첫 상태가 올 때까지 loading으로 둔다
    return onAuthStateChanged(firebaseAuth, (next) => {
      setUser(next ? toAppUser(next) : null);
      setLoading(false);
      setExpectsUser(Boolean(next));
      rememberSignedIn(Boolean(next));
    });
  }, []);

  const signIn = useCallback(async () => {
    if (!firebaseAuth) return;
    setError(null);

    try {
      await signInWithPopup(firebaseAuth, new GoogleAuthProvider());
    } catch (caught) {
      setError(describeAuthError(caught));
    }
  }, []);

  const signOut = useCallback(async () => {
    if (!firebaseAuth) return;
    setError(null);

    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      setError('로그아웃하지 못했어요. 잠시 뒤 다시 시도해 주세요.');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, expectsUser, available: isFirebaseConfigured, error, signIn, signOut }),
    [user, loading, expectsUser, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Firebase 오류 코드를 사람이 읽을 문구로. 모르는 코드는 코드 그대로 보여준다(디버깅용) */
function describeAuthError(caught: unknown): string | null {
  const code = typeof caught === 'object' && caught !== null && 'code' in caught
    ? String((caught as { code: unknown }).code)
    : '';

  switch (code) {
    // 사용자가 창을 닫은 것뿐이라 오류로 취급하지 않는다
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return null;
    case 'auth/popup-blocked':
      return '브라우저가 로그인 창을 막았어요. 팝업을 허용하고 다시 시도해 주세요.';
    case 'auth/network-request-failed':
      return '네트워크에 연결하지 못했어요.';
    case 'auth/unauthorized-domain':
      return '이 주소가 Firebase에 등록되어 있지 않아요. 콘솔 → Authentication → 설정 → 승인된 도메인을 확인해 주세요.';
    case 'auth/operation-not-allowed':
      return '구글 로그인이 켜져 있지 않아요. 콘솔 → Authentication → Sign-in method에서 켜 주세요.';
    default:
      return code ? `로그인에 실패했어요 (${code})` : '로그인에 실패했어요.';
  }
}
