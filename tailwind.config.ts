import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Noto Sans KR"',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      colors: {
        // 기존 스킨케어 앱의 톤을 그대로 토큰화
        brand: {
          ink: '#0f172a',      // slate-900 — 헤더/탭 활성 배경
          accent: '#facc15',   // yellow-400 — 액센트 텍스트
          surface: '#f9fafb',  // gray-50 — 페이지 배경
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
} satisfies Config;
