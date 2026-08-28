import { test, expect } from '@playwright/test';
import { loginAsTestUser, hasTestAccount } from './helpers/auth';

test.describe('Public page navigation', () => {
  test('landing page loads with hero content and CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=PROD-UIBO').first()).toBeVisible();
    const cta = page.locator('a, button').filter({ hasText: /comenzar|get started/i });
    await expect(cta.first()).toBeVisible();
  });

  test('changelog page loads', async ({ page }) => {
    await page.goto('/changelog');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/changelog|novedades|cambios/i);
  });

  test('login page loads', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('body')).toContainText(/iniciar sesión|sign in|log in|email/i);
  });

  test('signup page loads and switches to the signup form', async ({ page }) => {
    await page.goto('/signup');
    await page.locator('button[type="button"]', { hasText: /sign up|registrarse/i }).click();
    await expect(page.locator('body')).toContainText(/registr|sign up|create/i);
  });

  test('legal pages load', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/privacidad|privacy/i);

    await page.goto('/terms');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/términos|terms/i);

    await page.goto('/cookies');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.locator('body')).toContainText(/cookies/i);
  });

  test('skip navigation link moves focus to the main content', async ({ page }) => {
    await page.goto('/login');
    await page.keyboard.press('Tab');
    const skipLink = page.getByRole('link', { name: /skip to|saltar al contenido/i });
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('unknown routes do not resolve as a normal page', async ({ page }) => {
    const response = await page.goto('/nonexistent-page');
    expect(response?.status()).toBe(404);
  });
});

test.describe('In-app navigation (authenticated)', () => {
  test.skip(!hasTestAccount, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set — skipping authenticated navigation tests');

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('shows the tab bar with the Timer tab active by default', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);
    const activeTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(activeTab).toContainText(/temporizador|timer/i);
  });

  test('can switch to the Focus tab', async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: /focus/i }).click();
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText(/focus/i);
  });

  test('can switch to the Achievements tab', async ({ page }) => {
    await page.locator('[role="tab"]', { hasText: /logros|achievements/i }).click();
    await expect(page.locator('[role="tab"][aria-selected="true"]')).toContainText(/logros|achievements/i);
  });
});
