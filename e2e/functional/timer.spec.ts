import { test, expect } from '@playwright/test';
import { loginAsTestUser, hasTestAccount } from './helpers/auth';

test.describe('Timer (unauthenticated)', () => {
  test('redirects to login when not authenticated', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login**');
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Timer (authenticated)', () => {
  test.skip(!hasTestAccount, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set — skipping authenticated timer tests');

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
  });

  test('displays the initial timer state with a Start preset visible', async ({ page }) => {
    // Time is rendered as separate HH/MM/SS spans inside a single <time>
    // element, so its combined text reads like "00:00:00".
    await expect(page.locator('time').first()).toContainText(/\d{1,2}:\d{2}/);
    await expect(page.locator('button', { hasText: /25 min/i }).first()).toBeVisible();
  });

  test('starting a preset begins the countdown and shows Pause', async ({ page }) => {
    await page.locator('button', { hasText: /25 min/i }).first().click();
    await expect(page.locator('time').first()).toContainText(/25:/);
    await expect(page.getByRole('button', { name: /pausar|pause/i })).toBeVisible();
  });

  test('pausing switches the control to Resume', async ({ page }) => {
    await page.locator('button', { hasText: /25 min/i }).first().click();
    await page.getByRole('button', { name: /pausar|pause/i }).click();
    await expect(page.getByRole('button', { name: /reanudar|resume/i })).toBeVisible();
  });

  test('resetting returns the timer to its initially set duration', async ({ page }) => {
    await page.locator('button', { hasText: /25 min/i }).first().click();
    await page.getByRole('button', { name: /reiniciar|reset/i }).click();
    await expect(page.locator('time').first()).toContainText(/25:00/);
    await expect(page.getByRole('button', { name: /reanudar|resume/i })).toBeVisible();
  });

  test('timer controls are keyboard accessible', async ({ page }) => {
    await page.locator('button', { hasText: /25 min/i }).first().click();

    const pauseButton = page.getByRole('button', { name: /pausar|pause/i });
    await pauseButton.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('button', { name: /reanudar|resume/i })).toBeVisible();
  });
});
