import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';

/**
 * Firebase 초기화.
 *
 * 설정값은 `.env.local`에서 읽는다 (`.env.local.example` 참고).
 * **값이 하나라도 비어 있으면 초기화하지 않고 null을 내보낸다.**
 * 그래야 키 없이 clone한 사람도 앱이 그대로 돌아간다 — 로컬 저장만 쓰는 모드로.
 *
 * 여기 들어가는 값은 비밀이 아니다. 웹 앱 설정은 브라우저에 그대로 노출되고,
 * 실제 접근 통제는 Firestore 보안 규칙(firestore.rules)이 한다.
 * 그래도 .env.local은 커밋하지 않는다(.gitignore의 `*.local`).
 *
 * ## 무엇을 미리 싣고 무엇을 나중에 싣는가
 *
 * - **auth는 첫 화면에 필요하다.** 로그인 상태를 알아야 어느 저장소를 볼지 정해지므로
 *   기다렸다가 부르면 로컬 데이터가 잠깐 보였다 바뀐다.
 * - **firestore는 로그인한 사람에게만 필요하다.** 셋 중 가장 크기도 해서
 *   `getDb()`로 미룬다(동적 import). 로그아웃 상태로 쓰는 사람은 아예 내려받지 않는다.
 */

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/** 설정이 다 들어왔는지. false면 앱은 로컬 저장만 쓰는 모드로 돈다 */
export const isFirebaseConfigured = Object.values(config).every(
  (value) => typeof value === 'string' && value.length > 0,
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(config);
  authInstance = getAuth(app);
}

export const firebaseAuth = authInstance;

/** 한 번만 초기화하고 그 약속을 돌려 쓴다 */
let dbPromise: Promise<Firestore> | null = null;

/**
 * Firestore. 처음 부를 때 모듈을 내려받고 초기화한다.
 *
 * 오프라인에서도 읽고 쓸 수 있게 로컬 캐시를 켠다 — 지하철에서 기록하는 앱이라 중요하다.
 * 탭을 여러 개 띄우는 앱이 아니라 singleTab으로 둔다(멀티탭 매니저는 탭 간 조율 비용이 있다).
 */
export function getDb(): Promise<Firestore> {
  if (!app) return Promise.reject(new Error('Firebase 설정이 없습니다.'));

  dbPromise ??= import('firebase/firestore').then((firestore) =>
    firestore.initializeFirestore(app!, {
      localCache: firestore.persistentLocalCache({
        tabManager: firestore.persistentSingleTabManager({}),
      }),
    }),
  );

  return dbPromise;
}
