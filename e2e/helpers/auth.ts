import { Page } from '@playwright/test';

/**
 * Logs in via the UI login form.
 * Waits until the /app page is loaded after successful auth.
 */
export async function login(page: Page) {
  const email = process.env.E2E_USER_EMAIL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!email || !password) {
    throw new Error('E2E_USER_EMAIL and E2E_USER_PASSWORD must be set in .env.local');
  }

  await page.goto('/login');

  const emailInput = page.locator('input[type="email"], input[placeholder*="email" i], input[name="email"]').first();
  await emailInput.fill(email);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(password);

  // Scoped to type="submit" only: a broader text-based selector also matches
  // the "Iniciar sesión" tab button (which precedes this one in the DOM and
  // is a no-op type="button"), causing .first() to click the wrong element.
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // The login form shows a ~1.2s loading overlay, then does a client-side
  // router.push("/app") — no full page load, so the default waitUntil:
  // 'load' never resolves. Wait for the URL commit instead.
  await page.waitForURL('**/app', { timeout: 15_000, waitUntil: 'commit' });
}
