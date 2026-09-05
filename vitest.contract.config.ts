import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';

// Contract tests hit the real Supabase project, so they need the same
// credentials Next.js would normally load from .env.local (see also
// playwright.config.ts, which loads env the same way for E2E tests).
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/app/tests/contract/**/*.test.ts'],
    testTimeout: 30000, // 30s — these are real network calls
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/app'),
    },
  },
});
