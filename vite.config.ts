import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { landingFaqJsonLd, landingStaticHtml } from './src/pages/landing/staticHtml.ts';

/**
 * 소개 화면 문구를 index.html에 정적 HTML로 박아 넣는다.
 * JS를 실행하지 않는 크롤러도 읽을 수 있게 — 문구 원본은 src/pages/landing/content.ts.
 */
function landingStatic(): Plugin {
  return {
    name: 'nyamnyam-landing-static',
    transformIndexHtml(html) {
      return html
        .replace('<!--landing-static-->', landingStaticHtml())
        .replace('<!--landing-faq-->', landingFaqJsonLd());
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    landingStatic(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '냥냠냠 · 고양이 사료 기록장',
        short_name: '냥냠냠',
        description: '고양이가 먹은 사료·습식·간식을 기록하고 다음에 살 사료를 고르는 앱',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#faf7f2',
        theme_color: '#f4a71a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // 폰트(woff2)는 여기서 뺀다. Pretendard 분할본이 92개(약 2.8MB)라
        // 전부 프리캐시하면 설치 용량이 헛되이 커진다.
        // 대신 실제로 내려받은 구간만 아래 runtimeCaching으로 캐시한다.
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        // 소개 화면 3D(three.js, 약 140KB)는 앱을 쓰는 사람까지 미리 받을 이유가 없다.
        // 소개 화면을 열 때 받고, 그때 아래 runtimeCaching이 담아 둔다
        globIgnores: ['**/heroScene-*.js'],
        // SPA 라우팅: 캐시 미스 시 index.html로 폴백
        navigateFallback: 'index.html',
        // 크롤러용 파일은 주소창에 직접 쳐도 index.html이 아니라 파일 그대로 보여야 한다
        navigateFallbackDenylist: [/^\/(robots\.txt|sitemap\.xml|llms\.txt|og-image\.png)$/],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/heroScene-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'landing-scene',
              expiration: { maxEntries: 2 },
            },
          },
          {
            urlPattern: /\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pretendard-fonts',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        // 개발 서버에서도 서비스워커를 확인하고 싶으면 true로
        enabled: false,
      },
    }),
  ],
  // firebase는 하위 경로가 여러 개(app/auth/firestore)라 Vite가 첫 화면을 그리다가
  // 뒤늦게 발견하면 의존성을 다시 묶으면서 페이지를 새로 고친다.
  // 그 사이 화면이 스플래시에 멈춘 것처럼 보여서, 서버 시작 때 미리 묶게 못박아 둔다.
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },

  server: {
    host: true,
    port: 5173,
  },
});
