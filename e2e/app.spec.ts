import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('App (authenticated)', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('loads the app page after login', async ({ page }) => {
    await expect(page).toHaveURL(/\/app/);
  });

  test('shows the tab bar with 3 tabs', async ({ page }) => {
    const tabs = page.locator('[role="tab"]');
    await expect(tabs).toHaveCount(3);
  });

  test('timer tab is active by default', async ({ page }) => {
    const timerTab = page.locator('[role="tab"][aria-selected="true"]');
    await expect(timerTab).toContainText(/temporizador|timer/i);
  });

  test('can switch to Focus tab', async ({ page }) => {
    const focusTab = page.locator('[role="tab"]', { hasText: /focus|enfoque/i });
    await focusTab.click();
    // Verify focus content loads (stats section or session history)
    await expect(page.locator('text=/estad|stats|historial|history/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('can switch to Achievements tab', async ({ page }) => {
    const achievementsTab = page.locator('[role="tab"]', { hasText: /logros|achievements/i });
    await achievementsTab.click();
    // Verify achievements content loads
    await expect(page.locator('text=/logros|achievements/i').first()).toBeVisible({ timeout: 5_000 });
  });

  test('settings button is visible', async ({ page }) => {
    await expect(page.locator('[aria-label*="config" i], [aria-label*="settings" i], [aria-label*="ajustes" i]').first()).toBeVisible();
  });

  test('settings panel opens and closes', async ({ page }) => {
    const settingsBtn = page.locator('[aria-label*="config" i], [aria-label*="settings" i], [aria-label*="ajustes" i]').first();
    await settingsBtn.click();

    // Settings panel should be visible
    await expect(page.locator('text=/general|idioma|language/i').first()).toBeVisible({ timeout: 3_000 });

    // Close it (press Escape)
    await page.keyboard.press('Escape');

    // Panel should be gone (wait a moment for animation)
    await page.waitForTimeout(500);
  });

  test('keyboard shortcut ? opens shortcuts modal', async ({ page }) => {
    await page.keyboard.press('?');
    // Shortcuts modal should appear
    await expect(page.locator('text=/atajos|shortcuts/i').first()).toBeVisible({ timeout: 3_000 });

    // Close it
    await page.keyboard.press('Escape');
  });
});
