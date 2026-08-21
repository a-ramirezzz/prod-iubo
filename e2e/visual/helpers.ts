import type { Page } from '@playwright/test';

/**
 * Freezes CSS transitions/animations and forces scroll-triggered [data-reveal]
 * elements into their revealed state, so full-page screenshots don't depend
 * on IntersectionObserver timing or in-flight transitions.
 */
export async function freezeAnimations(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation: none !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      [data-reveal] {
        opacity: 1 !important;
        transform: none !important;
      }
    `,
  });
}

/**
 * ThemeWrapper only reacts to prefers-color-scheme when theme_mode is
 * 'system'; anonymous visitors get the hardcoded 'dark' default regardless
 * of OS preference, so light-mode screenshots need the root class forced
 * directly rather than relying on page.emulateMedia alone.
 */
export async function setThemeMode(page: Page, mode: 'light' | 'dark') {
  await page.evaluate((mode) => {
    const root = document.documentElement;
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add(`${mode}-mode`);
  }, mode);
}
