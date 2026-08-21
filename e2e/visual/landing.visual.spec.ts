import { test, expect } from '@playwright/test';
import { freezeAnimations, setThemeMode } from './helpers';

test.describe('Landing page — visual', () => {
  test('dark mode', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await setThemeMode(page, 'dark');
    await freezeAnimations(page);
    await expect(page).toHaveScreenshot('landing-dark.png', { fullPage: true });
  });

  test('light mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await setThemeMode(page, 'light');
    await freezeAnimations(page);
    await expect(page).toHaveScreenshot('landing-light.png', { fullPage: true });
  });
});
