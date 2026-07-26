import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test-setup.ts'],
  },
  resolve: {
    alias: {
      '@/components': path.resolve(__dirname, './src/app/components'),
      '@/context': path.resolve(__dirname, './src/app/context'),
      '@/hooks': path.resolve(__dirname, './src/app/hooks'),
      '@/lib': path.resolve(__dirname, './src/app/lib'),
      '@/types': path.resolve(__dirname, './src/app/types'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@': path.resolve(__dirname, './src'),
    },
  },
});
