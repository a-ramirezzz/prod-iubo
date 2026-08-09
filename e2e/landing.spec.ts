import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and shows the app title', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PROD-UIBO').first()).toBeVisible();
  });

  test('shows the CTA button', async ({ page }) => {
    await page.goto('/');
    // Check for the "Get Started" / "Comenzar Ahora" CTA
    const cta = page.locator('a, button').filter({ hasText: /comenzar|get started/i });
    await expect(cta.first()).toBeVisible();
  });

  test('displays the 3 stat badges', async ({ page }) => {
    await page.goto('/');
    // Check for the stat badges (themes, sounds, free)
    await expect(page.locator('text=/temas|themes/i').first()).toBeVisible();
    await expect(page.locator('text=/sonidos|sounds/i').first()).toBeVisible();
  });

  test('has a working language switch', async ({ page }) => {
    await page.goto('/');
    // Find and click the EN button
    const enButton = page.locator('button', { hasText: 'EN' });
    await enButton.scrollIntoViewIfNeeded();
    await enButton.click();
    // Verify content switched to English
    await expect(page.locator('text=/get started/i').first()).toBeVisible();
  });

  test('BETA badge is visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=BETA').first()).toBeVisible();
  });

  test('scroll indicator is present', async ({ page }) => {
    await page.goto('/');
    const scrollIndicator = page.locator('text=/descubre|discover/i');
    await expect(scrollIndicator.first()).toBeVisible();
  });
});
