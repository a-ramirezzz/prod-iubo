import { Page } from '@playwright/test';

/**
 * Real Supabase test account, reused from the existing e2e setup (.env.local).
 * No account is ever created by these tests — only signed in.
 */
export const TEST_USER = {
  email: process.env.E2E_USER_EMAIL || 'test@example.com',
  password: process.env.E2E_USER_PASSWORD || 'TestPassword123!',
};

export const hasTestAccount = Boolean(process.env.E2E_USER_EMAIL && process.env.E2E_USER_PASSWORD);

/**
 * Logs in via the UI login form and waits for the redirect to /app.
 */
export async function loginAsTestUser(page: Page) {
  await page.goto('/login');

  await page.locator('input[type="email"]').first().fill(TEST_USER.email);
  await page.locator('input[type="password"]').first().fill(TEST_USER.password);

  // Scoped to type="submit": a broader text-based selector also matches the
  // "Iniciar sesión" tab button, which precedes this one in the DOM and is a
  // no-op type="button".
  await page.locator('button[type="submit"]').first().click();

  // Successful login shows a ~1.2s loading overlay before a client-side
  // router.push("/app") — no full page load, so the default waitUntil:
  // 'load' never resolves. Wait for the URL commit instead.
  await page.waitForURL('**/app', { timeout: 15_000, waitUntil: 'commit' });
}

/**
 * Navigates to the auth page with the Signup tab active. Only exercises the
 * signup UI (used by auth.spec.ts) — never submits real registration data.
 */
export async function signupTestUser(page: Page) {
  await page.goto('/signup');
  await page.locator('button[type="button"]', { hasText: /sign up|registrarse/i }).click();
}
