import { createContext } from 'react';

/** 화면에서 필요한 만큼만 추린 사용자 정보 (Firebase User를 그대로 흘리지 않는다) */
export interface AppUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface AuthContextValue {
  /** 로그인하지 않았으면 null */
  user: AppUser | null;
  /** 첫 인증 상태를 확인하는 중. 이때 "로그인하세요"를 띄우면 깜빡인다 */
  loading: boolean;
  /**
   * 지난번에 로그인 상태였는지 (이 기기 기준).
   * 인증 확인이 끝나기 전에 저장소들이 어느 쪽을 볼지 정하는 힌트로 쓴다 —
   * 이게 없으면 로그인한 사람에게 로컬 기록이 잠깐 보였다가 계정 기록으로 바뀐다.
   */
  expectsUser: boolean;
  /** Firebase 설정이 없어 로컬 저장만 쓰는 모드인지 */
  available: boolean;
  /** 마지막 로그인 시도의 오류 문구 */
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
