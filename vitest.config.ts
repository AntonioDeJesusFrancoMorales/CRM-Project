/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    // Inyectar variables de entorno para los tests (Vitest no carga .env.development).
    // Todos los handlers MSW usan /api como prefijo base.
    'import.meta.env.VITE_API_BASE_URL': JSON.stringify('/api'),
    'import.meta.env.VITE_ENABLE_MSW': JSON.stringify('false'),
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setupTests.ts'],
    css: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.{test,spec}.{ts,tsx}', 'src/test/**', 'src/mocks/**'],
    },
  },
});
