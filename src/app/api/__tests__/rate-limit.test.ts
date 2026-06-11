import { describe, it, expect, beforeEach } from 'vitest';
import { createRateLimiter } from '@/app/lib/rate-limit';

describe('createRateLimiter', () => {
  let limiter: ReturnType<typeof createRateLimiter>;

  beforeEach(() => {
    limiter = createRateLimiter(60000, 3); // 3 requests per minute for testing
  });

  it('allows requests under the limit', () => {
    expect(limiter.isRateLimited('192.168.1.1')).toBe(false);
    expect(limiter.isRateLimited('192.168.1.1')).toBe(false);
    expect(limiter.isRateLimited('192.168.1.1')).toBe(false);
  });

  it('blocks requests over the limit', () => {
    limiter.isRateLimited('192.168.1.1'); // 1
    limiter.isRateLimited('192.168.1.1'); // 2
    limiter.isRateLimited('192.168.1.1'); // 3
    expect(limiter.isRateLimited('192.168.1.1')).toBe(true); // 4 → blocked
  });

  it('tracks IPs independently', () => {
    limiter.isRateLimited('10.0.0.1'); // 1
    limiter.isRateLimited('10.0.0.1'); // 2
    limiter.isRateLimited('10.0.0.1'); // 3
    expect(limiter.isRateLimited('10.0.0.1')).toBe(true); // blocked

    // Different IP is still allowed
    expect(limiter.isRateLimited('10.0.0.2')).toBe(false);
  });

  it('resets correctly', () => {
    limiter.isRateLimited('10.0.0.1');
    limiter.isRateLimited('10.0.0.1');
    limiter.isRateLimited('10.0.0.1');
    expect(limiter.isRateLimited('10.0.0.1')).toBe(true);

    limiter.reset();
    expect(limiter.isRateLimited('10.0.0.1')).toBe(false);
  });
});
