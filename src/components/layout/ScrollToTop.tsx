import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * 화면을 옮기면 스크롤을 맨 위로 되돌린다.
 *
 * SPA는 문서가 그대로라 스크롤 위치가 남는다.
 * 예를 들어 아래까지 내린 고양이 프로필에서 "전체 보기"로 목록에 들어가면
 * 목록도 중간부터 시작해 필터바가 안 보였다.
 *
 * 뒤로/앞으로 가기(POP)는 건드리지 않는다.
 * 원래 보던 위치로 돌아가는 게 브라우저 기본 동작에 가깝기 때문.
 *
 * 검색어·필터는 pathname을 바꾸지 않으므로 스크롤이 튀지 않는다.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo(0, 0);
  }, [pathname, navigationType]);

  return null;
}
