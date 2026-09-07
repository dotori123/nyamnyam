/**
 * 경로 → 화면 이름.
 *
 * 헤더 타이틀(뒤로가기 화면)과 문서 제목(<title>)이 같은 표를 보게 해서
 * 화면을 추가할 때 한 곳만 고치면 되도록 했다.
 */

export const APP_NAME = '냥냠냠';
export const APP_TITLE = `${APP_NAME} · 고양이 사료 기록장`;

interface RouteTitle {
  match: RegExp;
  title: string;
  /** 헤더에 뒤로가기 버튼과 함께 제목을 띄우는 화면인지 */
  sub: boolean;
}

const ROUTE_TITLES: RouteTitle[] = [
  // 하단 탭으로 오가는 최상위 화면 — 헤더는 브랜드 로고를 그대로 둔다
  { match: /^\/$/, title: '기록', sub: false },
  { match: /^\/stats$/, title: '통계', sub: false },
  { match: /^\/cats$/, title: '고양이', sub: false },

  // 아래는 뒤로가기가 필요한 화면들. 순서가 곧 우선순위다
  { match: /^\/new$/, title: '기록 등록', sub: true },
  { match: /^\/records\/[^/]+\/edit$/, title: '기록 수정', sub: true },
  { match: /^\/records\/[^/]+$/, title: '기록 상세', sub: true },
  { match: /^\/cats\/new$/, title: '고양이 등록', sub: true },
  { match: /^\/cats\/[^/]+\/edit$/, title: '프로필 수정', sub: true },
  { match: /^\/cats\/[^/]+$/, title: '고양이 프로필', sub: true },
  { match: /^\/settings$/, title: '설정', sub: true },
];

/** 헤더에 뒤로가기와 함께 띄울 제목. 최상위 화면이면 null */
export function getSubPageTitle(pathname: string): string | null {
  const route = ROUTE_TITLES.find((entry) => entry.match.test(pathname));
  return route?.sub ? route.title : null;
}

/**
 * 탭 제목 · 방문 기록 · 스크린리더가 화면 진입 때 읽는 문자열.
 * SPA는 페이지를 새로 불러오지 않아 이걸 갱신해주지 않으면 계속 첫 화면 제목으로 남는다.
 */
export function getDocumentTitle(pathname: string): string {
  const route = ROUTE_TITLES.find((entry) => entry.match.test(pathname));
  if (!route) return `페이지를 찾을 수 없어요 · ${APP_NAME}`;
  return route.sub ? `${route.title} · ${APP_NAME}` : APP_TITLE;
}
