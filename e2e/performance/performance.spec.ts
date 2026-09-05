import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { loginAsTestUser, hasTestAccount } from '../functional/helpers/auth';

type WebVitals = {
  lcp: number;
  cls: number;
  tti: number;
};

const RESULTS_PATH = path.resolve(process.cwd(), 'performance-results.json');
const allMetrics: Record<string, WebVitals> = {};

/**
 * Reads LCP/CLS via PerformanceObserver and approximates TTI with
 * domInteractive. The fixed delay gives buffered observers time to fire
 * before the page (and its observers) may be torn down.
 */
async function getWebVitals(page: Page): Promise<WebVitals> {
  return page.evaluate(() => {
    return new Promise<WebVitals>((resolve) => {
      const results: WebVitals = { lcp: 0, cls: 0, tti: 0 };

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) results.lcp = last.startTime;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
          if (!layoutShift.hadRecentInput) {
            results.cls += layoutShift.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      results.tti = performance.timing.domInteractive - performance.timing.navigationStart;

      setTimeout(() => resolve(results), 3000);
    });
  });
}

function recordAndLog(pageName: string, metrics: WebVitals) {
  allMetrics[pageName] = metrics;
  console.log(`${pageName} metrics:`, JSON.stringify(metrics, null, 2));
}

test.describe('Performance Benchmarks', () => {
  test('Landing page meets performance thresholds', async ({ page }) => {
    await page.goto('/');
    const metrics = await getWebVitals(page);
    recordAndLog('landing', metrics);

    expect.soft(metrics.lcp).toBeLessThan(2500);
    expect.soft(metrics.cls).toBeLessThan(0.1);
    expect.soft(metrics.tti).toBeLessThan(3000);
  });

  test('Login page meets performance thresholds', async ({ page }) => {
    await page.goto('/login');
    const metrics = await getWebVitals(page);
    recordAndLog('login', metrics);

    expect.soft(metrics.lcp).toBeLessThan(2500);
    expect.soft(metrics.cls).toBeLessThan(0.1);
    expect.soft(metrics.tti).toBeLessThan(3000);
  });

  test('App page meets performance thresholds', async ({ page }) => {
    test.skip(!hasTestAccount, 'No E2E_USER_EMAIL/E2E_USER_PASSWORD configured');

    await loginAsTestUser(page);
    const metrics = await getWebVitals(page);
    recordAndLog('app', metrics);

    expect.soft(metrics.lcp).toBeLessThan(3000);
    expect.soft(metrics.cls).toBeLessThan(0.1);
    expect.soft(metrics.tti).toBeLessThan(4000);
  });

  test.afterAll(() => {
    if (Object.keys(allMetrics).length > 0) {
      fs.writeFileSync(RESULTS_PATH, JSON.stringify(allMetrics, null, 2));
    }
  });
});
