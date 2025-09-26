import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt', 'applepwa_icon.png'],
      manifest: {
        name: '하루네끼',
        short_name: '하루네끼',
        description: '지역별 미식 여행 코스를 만드는 AI 여행 다이어리',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [
          {
            src: '/applepwa_icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/applepwa_icon.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/applepwa_icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // ✅ TourAPI 프록시
      '/tourapi': {
        target: 'https://apis.data.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tourapi/, ''),
        secure: true,
      },
      // ✅ 농촌진흥청 API 프록시
      '/nongsaro': {
        target: 'http://api.nongsaro.go.kr',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/nongsaro/, ''),
        secure: false,
      },
    },
    port: 3000,
  },
});
