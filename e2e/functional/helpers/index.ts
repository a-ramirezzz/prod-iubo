import { Page } from '@playwright/test';

export async function waitForApp(page: Page) {
  await page.waitForLoadState('networkidle');
}

export async function getLocale(page: Page): Promise<string> {
  return await page.getAttribute('html', 'lang') || 'en';
}
