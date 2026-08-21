import { test, expect } from '@playwright/test';
import { freezeAnimations } from './helpers';

test('signup page — visual', async ({ page }) => {
  await page.goto('/signup');
  await page.waitForLoadState('networkidle');
  // AuthTabs defaults to the Login tab regardless of route — switch to Signup.
  await page.getByRole('button', { name: /sign up|registrarse/i }).click();
  await freezeAnimations(page);
  await expect(page).toHaveScreenshot('signup.png', { fullPage: true });
});
