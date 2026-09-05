import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 1,
  workers: 1, // sequential — avoids port conflicts with the dev server

  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.001 },
  },

  use: {
    baseURL: 'http://localhost:3000',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Stabilizes text antialiasing across runs for screenshot comparisons.
    launchOptions: {
      args: ['--font-render-hinting=none', '--force-color-profile=srgb'],
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'performance',
      testDir: './e2e/performance',
      use: { browserName: 'chromium' },
    },
    {
      name: 'security',
      testDir: './e2e/security',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
