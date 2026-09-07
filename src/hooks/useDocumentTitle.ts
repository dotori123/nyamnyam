import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getDocumentTitle } from '../utils/routeTitles';

/**
 * 경로가 바뀌면 문서 제목도 바꾼다.
 *
 * SPA는 문서를 새로 불러오지 않아서 그냥 두면 <title>이 첫 화면 그대로 남는다.
 * 탭을 여러 개 띄웠을 때, 방문 기록에서 찾을 때, 스크린리더가 화면 전환을 알릴 때 쓰인다.
 */
export function useDocumentTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = getDocumentTitle(pathname);
  }, [pathname]);
}
