import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ['legacy-js-api', 'import'],
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/api/backend': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/api/ai': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
});
