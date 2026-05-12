import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 하위 경로용 base.
// 저장소 이름이 home-family-care 가 아니면 이 값을 수정하세요.
// 커스텀 도메인을 쓰면 '/' 로 되돌립니다.
const BASE = process.env.VITE_BASE ?? '/home-family-care/';

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: '우리집·가족 케어',
        short_name: '가족케어',
        description: '뷰티/스킨케어 · 우리가족 메모 · 반려묘 케어 · 우리집 관리',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: BASE,
        scope: BASE,
        lang: 'ko',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Firebase Firestore 응답은 SDK 자체의 IndexedDB persistence에 맡기고,
        // 정적 자원만 service worker가 캐시한다.
        navigateFallback: BASE + 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts' },
          },
        ],
      },
    }),
  ],
  server: { port: 5173, host: true },
});
