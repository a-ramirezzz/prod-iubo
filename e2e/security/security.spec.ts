import { test, expect } from '@playwright/test';

/**
 * CSP is set per-request by src/proxy.ts and is Report-Only in dev
 * (Content-Security-Policy-Report-Only) but enforced in production
 * (Content-Security-Policy). Both are valid depending on how the app
 * under test was started, so header lookups accept either name.
 */
function getCsp(headers: Record<string, string>): string | undefined {
  return headers['content-security-policy'] ?? headers['content-security-policy-report-only'];
}

/**
 * The auth-endpoint rate limiters in src/proxy.ts key on x-forwarded-for
 * (falling back to a shared 'unknown' bucket). Giving each test its own
 * fake IP keeps it isolated from other tests and from repeated local runs
 * against the same long-lived dev server.
 */
function uniqueIp(): string {
  const octet = () => Math.floor(Math.random() * 255);
  return `10.${octet()}.${octet()}.${octet()}`;
}

test.describe('Security Headers', () => {
  test('static security headers are present on every page', async ({ page }) => {
    const pagesToCheck = ['/', '/login', '/signup', '/forgot-password'];

    for (const url of pagesToCheck) {
      const response = await page.goto(url);
      const headers = response!.headers();

      expect(headers['x-content-type-options'], `${url}: X-Content-Type-Options`).toBe('nosniff');
      expect(headers['x-frame-options'], `${url}: X-Frame-Options`).toBe('SAMEORIGIN');
      expect(headers['referrer-policy'], `${url}: Referrer-Policy`).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy'], `${url}: Permissions-Policy`).toContain('camera=()');
    }
  });

  test('CSP header is present with a nonce and strict directives', async ({ page }) => {
    const response = await page.goto('/');
    const csp = getCsp(response!.headers());

    expect(csp).toBeDefined();
    expect(csp).toContain('nonce-');
    expect(csp).toContain("script-src");
    expect(csp).toContain("strict-dynamic");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  test('CSP nonce is unique per request', async ({ page }) => {
    const nonceRegex = /nonce-([A-Za-z0-9-]+)/;

    const response1 = await page.goto('/');
    const nonce1 = getCsp(response1!.headers())?.match(nonceRegex)?.[1];

    const response2 = await page.goto('/');
    const nonce2 = getCsp(response2!.headers())?.match(nonceRegex)?.[1];

    expect(nonce1).toBeDefined();
    expect(nonce2).toBeDefined();
    expect(nonce1).not.toBe(nonce2);
  });
});

test.describe('Authentication Protection', () => {
  test('/app redirects to /login when not authenticated', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login**');
    expect(page.url()).toContain('/login');
  });

  test('/app does not render app content without authentication', async ({ page }) => {
    await page.goto('/app');
    await page.waitForURL('**/login**');

    // The auth-gated timer UI must never reach the client — only the login form should.
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });
});

test.describe('Rate Limiting', () => {
  test('forgot-password endpoint returns 429 after too many attempts', async ({ request }) => {
    // src/proxy.ts limits POST /forgot-password to 3 requests per 15 minutes.
    const ip = uniqueIp();
    const statuses: number[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await request.post('/forgot-password', {
        headers: { 'x-forwarded-for': ip },
        form: { email: `ratelimit-test-${i}@example.com` },
      });
      statuses.push(response.status());
    }

    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
    expect(statuses[0]).not.toBe(429);
  });

  test('rate-limited response includes a Retry-After header', async ({ request }) => {
    const ip = uniqueIp();
    let limited;

    for (let i = 0; i < 5; i++) {
      const response = await request.post('/forgot-password', {
        headers: { 'x-forwarded-for': ip },
        form: { email: `retry-after-test-${i}@example.com` },
      });
      if (response.status() === 429) {
        limited = response;
        break;
      }
    }

    expect(limited).toBeDefined();
    expect(limited!.headers()['retry-after']).toBeDefined();
  });

  test('check-email API endpoint returns 429 after too many attempts', async ({ request }) => {
    // src/app/api/check-email/route.ts limits to 5 requests per minute per IP.
    const ip = uniqueIp();
    const statuses: number[] = [];

    for (let i = 0; i < 7; i++) {
      const response = await request.post('/api/check-email', {
        headers: { 'x-forwarded-for': ip },
        data: { email: `check-email-test-${i}@example.com` },
      });
      statuses.push(response.status());
    }

    expect(statuses.filter((s) => s === 429).length).toBeGreaterThan(0);
  });
});

test.describe('Input Validation', () => {
  test('check-email API rejects a missing email without a server error', async ({ request }) => {
    const response = await request.post('/api/check-email', {
      headers: { 'x-forwarded-for': uniqueIp() },
      data: {},
    });

    expect(response.status()).toBe(400);
  });
});
