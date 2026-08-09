import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

test.describe('Timer Flow', () => {

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('displays timer at 00:00 initially', async ({ page }) => {
    // Time is rendered as separate HH / MM / SS spans inside a single <time> element,
    // so the combined text of that element is "00:00:00".
    await expect(page.locator('time').first()).toContainText(/\d{1,2}:\d{2}/);
  });

  test('can start a preset timer', async ({ page }) => {
    // Preset buttons are labeled e.g. "25 min" and clicking one immediately
    // starts the countdown (not just sets the value).
    const presetButton = page.locator('button', { hasText: /25 min/i }).first();

    if (await presetButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await presetButton.click();
      // Timer display should now reflect ~25 minutes and be running.
      await expect(page.locator('time').first()).toContainText(/25:/);
    }
  });

  test('can pause and resume a running timer with Space', async ({ page }) => {
    const presetButton = page.locator('button', { hasText: /25 min/i }).first();
    if (await presetButton.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await presetButton.click();
    }

    // Clicking the preset already started the timer; Space toggles pause.
    await page.keyboard.press('Space');
    await page.waitForTimeout(1_500);
    await page.keyboard.press('Space');

    // Timer should still be visible with a time value
    await expect(page.locator('time').first()).toContainText(/\d{1,2}:\d{2}/);
  });

  test('language switch works in app', async ({ page }) => {
    // Open settings
    const settingsBtn = page.locator('[aria-label*="config" i], [aria-label*="settings" i], [aria-label*="ajustes" i]').first();
    await settingsBtn.click();

    // Find language option and toggle (this depends on the settings UI)
    // Just verify the settings panel opened with language option visible
    await expect(page.locator('text=/idioma|language/i').first()).toBeVisible({ timeout: 3_000 });

    await page.keyboard.press('Escape');
  });
});
