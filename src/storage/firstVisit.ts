import { useSyncExternalStore } from 'react';
import { SIGNED_IN_KEY } from '../context/AuthProvider';
import { readArray, STORAGE_KEYS } from './local';
import { isSampleOnly } from './sample';

/**
 * 이 기기에서 앱을 써 본 적이 있는지 — 첫 화면(/)에 소개를 띄울지 가른다.
 *
 * 처음 온 사람(검색·공유 링크로 들어온 사람, 검색엔진)에게는 소개(LandingPage)를,
 * 한 번이라도 앱을 쓴 사람에게는 늘 보던 기록 목록을 보여준다.
 * 주소는 그대로 / 하나라 북마크·홈 화면 앱(start_url: '/')이 깨지지 않는다.
 *
 * "써 본 적 있다"로 치는 경우 (하나라도 맞으면):
 *  - 앱 화면(AppLayout)을 한 번이라도 열었다 → 표시를 남긴다
 *  - 직접 만든 기록·고양이가 있다 (샘플만 있는 건 제외)
 *  - 이 기기에서 로그인한 적이 있다
 *  - 홈 화면에 설치한 앱으로 열었다
 * 앞의 표시가 생기기 전부터 쓰던 사람도 뒤의 세 가지로 걸러져 소개를 보지 않는다.
 */

const STARTED_KEY = 'nyamnyam.started';

function readStarted(): boolean {
  try {
    if (localStorage.getItem(STARTED_KEY) === 'true') return true;
    if (localStorage.getItem(SIGNED_IN_KEY) === 'true') return true;

    const records = readArray<{ id: string }>(STORAGE_KEYS.records) ?? [];
    const cats = readArray<{ id: string }>(STORAGE_KEYS.cats) ?? [];
    if (!isSampleOnly(records, cats)) return true;
  } catch {
    // 저장소가 막힌 환경(시크릿 모드 등)은 아래 설치 여부만 본다
  }
  return window.matchMedia?.('(display-mode: standalone)').matches ?? false;
}

let started = readStarted();
const listeners = new Set<() => void>();

/** 앱을 쓰기 시작했다고 표시한다. 여러 번 불러도 된다 */
export function markStarted() {
  if (started) return;
  started = true;
  try {
    localStorage.setItem(STARTED_KEY, 'true');
  } catch {
    // 저장이 막혀도 이번 세션 동안은 앱 화면을 유지한다
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useStarted(): boolean {
  return useSyncExternalStore(subscribe, () => started);
}
