import { test, expect } from '@playwright/test';
import { loginAsTestUser, hasTestAccount } from './helpers/auth';

test.describe('Settings (public pages)', () => {
  test('settings panel is not accessible from the landing page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('button', { name: /abrir configuración|open settings/i })).toHaveCount(0);
  });
});

test.describe('Settings (authenticated)', () => {
  test.skip(!hasTestAccount, 'E2E_USER_EMAIL / E2E_USER_PASSWORD not set — skipping authenticated settings tests');

  test.beforeEach(async ({ page }) => {
    await loginAsTestUser(page);
    await page.getByRole('button', { name: /abrir configuración|open settings/i }).click();
    await expect(page.getByRole('button', { name: /cerrar configuración|close settings/i })).toBeVisible({
      timeout: 3_000,
    });
  });

  test('opens with all sections visible', async ({ page }) => {
    await expect(page.getByRole('button', { name: /^general$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /temas|themes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sonidos|sounds/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^focus$/i })).toBeVisible();
  });

  test('switching to the Themes section shows the appearance control', async ({ page }) => {
    await page.getByRole('button', { name: /temas|themes/i }).click();
    await expect(page.getByRole('radiogroup')).toBeVisible();
  });

  test('changing the language updates the panel text', async ({ page }) => {
    const languageSelect = page.locator('select#language');
    const before = await languageSelect.inputValue();
    const target = before === 'es' ? 'en' : 'es';
    await languageSelect.selectOption(target);
    await expect(page.getByRole('heading', { name: target === 'en' ? 'SETTINGS' : 'CONFIGURACIÓN' })).toBeVisible();
  });

  test('changing the theme updates the selected appearance option', async ({ page }) => {
    await page.getByRole('button', { name: /temas|themes/i }).click();
    const lightRadio = page.getByRole('radio', { name: /^(light|claro)$/i });
    await lightRadio.click();
    await expect(lightRadio).toHaveAttribute('aria-checked', 'true');
  });

  test('closes via the close button', async ({ page }) => {
    await page.getByRole('button', { name: /cerrar configuración|close settings/i }).click();
    await expect(page.getByRole('button', { name: /cerrar configuración|close settings/i })).toHaveCount(0);
  });

  test('closes via the Escape key', async ({ page }) => {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: /cerrar configuración|close settings/i })).toHaveCount(0);
  });
});
