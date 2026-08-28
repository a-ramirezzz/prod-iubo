import { test, expect, Page } from '@playwright/test';
import { signupTestUser } from './helpers/auth';

// Next.js's own route announcer also has role="alert", so this scopes to the
// app's Notification popup specifically to avoid strict-mode collisions.
function notificationAlert(page: Page) {
  return page.locator('[role="alert"][class*="notification" i]');
}

test.describe('Login page', () => {
  test('renders the form elements', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await expect(page.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('blocks submission when the form is empty', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="submit"]').first().click();
    // Required-but-empty inputs fail native HTML5 validation, so the submit
    // handler never runs and the page never navigates away.
    const emailValid = await page
      .locator('input[type="email"]')
      .first()
      .evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(emailValid).toBe(false);
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows an error notification for an invalid email format', async ({ page }) => {
    await page.goto('/login');
    // "a@b" passes the native type="email" constraint but fails the app's
    // stricter regex (requires a dot after the @), so this reaches the
    // custom validate() path and surfaces the app's own error notification.
    await page.locator('input[type="email"]').first().fill('a@b');
    await page.locator('input[type="password"]').first().fill('12345');
    await page.locator('button[type="submit"]').first().click();
    await expect(notificationAlert(page)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows an error notification for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').first().fill('nonexistent-e2e-user@example.com');
    await page.locator('input[type="password"]').first().fill('WrongPassword123!');
    await page.locator('button[type="submit"]').first().click();
    await expect(notificationAlert(page)).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(/\/login/);
  });

  test('forgot password link navigates to /forgot-password', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: /forgot|olvidaste/i }).click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

test.describe('Signup page', () => {
  test('renders the form elements', async ({ page }) => {
    await signupTestUser(page);
    await expect(page.locator('input[type="text"]')).toHaveCount(3); // username, first name, last name
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toHaveCount(2); // password, confirm
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('blocks submission when the form is empty', async ({ page }) => {
    await signupTestUser(page);
    await page.locator('button[type="submit"]').click();
    const usernameValid = await page
      .locator('input[type="text"]')
      .first()
      .evaluate((el: HTMLInputElement) => el.checkValidity());
    expect(usernameValid).toBe(false);
    await expect(page).toHaveURL(/\/signup/);
  });

  test('shows an error notification when passwords do not match', async ({ page }) => {
    await signupTestUser(page);
    const textInputs = page.locator('input[type="text"]');
    await textInputs.nth(0).fill('e2etestuser');
    await textInputs.nth(1).fill('Test');
    await textInputs.nth(2).fill('User');
    await page.locator('input[type="email"]').fill('e2e-mismatch-test@example.com');
    const passwordInputs = page.locator('input[type="password"]');
    await passwordInputs.nth(0).fill('Password123');
    await passwordInputs.nth(1).fill('DifferentPassword123');
    await page.locator('button[type="submit"]').click();
    // Client-side validate() rejects the mismatch before any network call is
    // made, so no signup request or account is ever created by this test.
    await expect(notificationAlert(page)).toBeVisible({ timeout: 5_000 });
    await expect(page).toHaveURL(/\/signup/);
  });
});

test.describe('Login / Signup tab navigation', () => {
  test('switching tabs shows the corresponding form', async ({ page }) => {
    await page.goto('/login');
    await page.locator('button[type="button"]', { hasText: /sign up|registrarse/i }).click();
    await expect(page.locator('input[type="tel"]')).toBeVisible();

    await page.locator('button[type="button"]', { hasText: /log in|iniciar sesión/i }).click();
    await expect(page.locator('input[type="tel"]')).toHaveCount(0);
  });
});

test.describe('Auth redirects', () => {
  test('unauthenticated /app redirects to login', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });
});
