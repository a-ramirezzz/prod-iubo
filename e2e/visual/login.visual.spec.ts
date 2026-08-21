import { test, expect } from '@playwright/test';
import { freezeAnimations } from './helpers';

test('login page — visual', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await freezeAnimations(page);
  await expect(page).toHaveScreenshot('login.png', { fullPage: true });
});
