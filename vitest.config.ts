import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    exclude: ['node_modules/**', 'src/app/tests/contract/**'],
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/**/*.stories.{ts,tsx}',
        'src/**/index.ts',
        'src/**/*.d.ts',
        'src/app/types/**',
        'src/app/lib/i18n/**',
        'src/database/**',
        'src/test-setup.ts',
      ],
    },
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
