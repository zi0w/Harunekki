import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
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
    },
    port: 3000,
  },
});
