import { test, expect } from '@playwright/test';

test.describe('Auth Redirects', () => {
  test('unauthenticated /app redirects to login', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login/);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/iniciar sesión|sign in|log in|email/i);
  });

  test('signup page loads', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('body')).toContainText(/registr|sign up|create/i);
  });
});
