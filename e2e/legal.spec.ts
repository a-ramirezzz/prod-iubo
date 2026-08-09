import { test, expect } from '@playwright/test';

test.describe('Legal Pages', () => {
  test('privacy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).not.toHaveURL('/login');
    // Should have content about privacy
    await expect(page.locator('body')).toContainText(/privacidad|privacy/i);
  });

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page).not.toHaveURL('/login');
    await expect(page.locator('body')).toContainText(/términos|terms/i);
  });

  test('cookies page loads', async ({ page }) => {
    await page.goto('/cookies');
    await expect(page).not.toHaveURL('/login');
    await expect(page.locator('body')).toContainText(/cookies/i);
  });
});
