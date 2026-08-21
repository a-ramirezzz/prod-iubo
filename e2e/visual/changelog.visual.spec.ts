import { test, expect } from '@playwright/test';
import { freezeAnimations } from './helpers';

test('changelog page — visual', async ({ page }) => {
  await page.goto('/changelog');
  await page.waitForLoadState('networkidle');
  await freezeAnimations(page);
  await expect(page).toHaveScreenshot('changelog.png', { fullPage: true });
});
