import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * 화면을 옮기면 본문으로 포커스를 옮긴다.
 *
 * SPA는 문서가 그대로라 화면을 바꿔도 포커스가 방금 누른 버튼에 남는다.
 * 그래서 스크린리더는 화면이 바뀐 걸 모르고, 키보드로 Tab을 누르면
 * 이전 화면에서 있던 자리부터 이어진다.
 *
 * 돌려주는 ref를 tabIndex={-1}인 <main>에 붙여 쓴다.
 * (tabIndex={-1}이라 마우스·키보드 탐색 순서에는 끼지 않고, 프로그램으로만 포커스가 간다)
 */
export function useRouteFocus<T extends HTMLElement>() {
  const { pathname } = useLocation();
  const ref = useRef<T>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // 첫 진입은 브라우저가 잡아 준 포커스를 그대로 둔다
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // preventScroll — 스크롤 위치는 ScrollToTop이 맡는다
    ref.current?.focus({ preventScroll: true });
  }, [pathname]);

  return ref;
}
