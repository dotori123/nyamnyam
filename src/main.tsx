import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthProvider';
import { RecordsProvider } from './context/RecordsProvider';
import { CatsProvider } from './context/CatsProvider';
import { ThemeProvider } from './context/ThemeProvider';
// Pretendard 가변 웹폰트. unicode-range로 쪼개져 있어
// 실제로 화면에 쓰인 글자 구간의 woff2만 내려받는다.
import 'pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css';
import './styles/global.scss';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        {/* 저장소들이 로그인 상태(uid)를 봐야 해서 AuthProvider가 바깥에 온다 */}
        <AuthProvider>
          <CatsProvider>
            <RecordsProvider>
              <App />
            </RecordsProvider>
          </CatsProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);

/**
 * index.html의 스플래시 제거.
 * 첫 화면이 실제로 그려진 다음 프레임에 페이드아웃시킨다.
 * 여러 번 불려도 안전하다 (이미 지웠으면 바로 빠져나온다).
 */
function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  splash.classList.add('splash--hidden');
  splash.addEventListener('transitionend', () => splash.remove(), { once: true });
  // transition이 꺼져 있는 환경(prefers-reduced-motion 등) 대비
  window.setTimeout(() => splash.remove(), 600);
}

requestAnimationFrame(() => requestAnimationFrame(hideSplash));

// 프레임 콜백은 탭이 화면에 없으면 아예 실행되지 않는다.
// 새로고침하자마자 다른 탭·앱으로 넘어가면 rAF가 멈춘 채로 남아
// 돌아왔을 때 스플래시가 화면을 덮고 있게 된다. 타이머로 한 번 더 건다.
window.setTimeout(hideSplash, 1500);
