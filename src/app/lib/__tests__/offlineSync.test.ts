import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithOfflineFallback } from '../offlineSync';

describe('fetchWithOfflineFallback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns network data and mirrors it to the cache on success', async () => {
    const cacheFn = vi.fn().mockResolvedValue(undefined);
    const getCacheFn = vi.fn();

    const result = await fetchWithOfflineFallback({
      fetchFn: async () => ['a', 'b'],
      cacheFn,
      getCacheFn,
      operationName: 'test',
    });

    expect(result).toEqual({ data: ['a', 'b'], source: 'network', error: null });
    expect(getCacheFn).not.toHaveBeenCalled();
    // Cache write is fire-and-forget: give the microtask queue a turn.
    await Promise.resolve();
    expect(cacheFn).toHaveBeenCalledWith(['a', 'b']);
  });

  it('does not block on a slow or failing cache write', async () => {
    const cacheFn = vi.fn().mockRejectedValue(new Error('quota exceeded'));

    const result = await fetchWithOfflineFallback({
      fetchFn: async () => 'value',
      cacheFn,
      getCacheFn: vi.fn(),
      operationName: 'test',
    });

    expect(result.data).toBe('value');
    expect(result.source).toBe('network');
  });

  it('falls back to the cache when the network fetch fails', async () => {
    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw new Error('network down');
      },
      cacheFn: vi.fn(),
      getCacheFn: async () => ['cached-item'],
      operationName: 'test',
    });

    expect(result).toEqual({ data: ['cached-item'], source: 'cache', error: null });
  });

  it('treats an empty cached array as valid cached data', async () => {
    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw new Error('network down');
      },
      cacheFn: vi.fn(),
      getCacheFn: async () => [],
      operationName: 'test',
    });

    expect(result).toEqual({ data: [], source: 'cache', error: null });
  });

  it('returns the network error when both the network and cache fail', async () => {
    const networkError = new Error('network down');

    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw networkError;
      },
      cacheFn: vi.fn(),
      getCacheFn: async () => {
        throw new Error('cache read failed');
      },
      operationName: 'test',
    });

    expect(result).toEqual({ data: null, source: 'network', error: networkError });
  });

  it('returns the network error when the cache has nothing (null)', async () => {
    const networkError = new Error('network down');

    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw networkError;
      },
      cacheFn: vi.fn(),
      getCacheFn: async () => null,
      operationName: 'test',
    });

    expect(result).toEqual({ data: null, source: 'network', error: networkError });
  });

  it('wraps non-Error network failures into an Error', async () => {
    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw 'boom';
      },
      cacheFn: vi.fn(),
      getCacheFn: async () => null,
      operationName: 'test',
    });

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('boom');
  });

  it('tries the network before ever reading the cache (network-first, not cache-first)', async () => {
    const order: string[] = [];
    const getCacheFn = vi.fn(async () => {
      order.push('cache');
      return ['cached'];
    });

    await fetchWithOfflineFallback({
      fetchFn: async () => {
        order.push('network');
        return ['fresh'];
      },
      cacheFn: vi.fn().mockResolvedValue(undefined),
      getCacheFn,
      operationName: 'test',
    });

    expect(order).toEqual(['network']);
    expect(getCacheFn).not.toHaveBeenCalled();
  });

  it('replaces the cache with the latest network result on each successful fetch', async () => {
    const cacheFn = vi.fn().mockResolvedValue(undefined);

    await fetchWithOfflineFallback({
      fetchFn: async () => ({ value: 1 }),
      cacheFn,
      getCacheFn: vi.fn(),
      operationName: 'test',
    });
    await fetchWithOfflineFallback({
      fetchFn: async () => ({ value: 2 }),
      cacheFn,
      getCacheFn: vi.fn(),
      operationName: 'test',
    });
    await Promise.resolve();

    expect(cacheFn).toHaveBeenNthCalledWith(1, { value: 1 });
    expect(cacheFn).toHaveBeenNthCalledWith(2, { value: 2 });
  });

  it('only reads the cache once the network fetch has actually failed', async () => {
    const getCacheFn = vi.fn(async () => ['cached']);

    const result = await fetchWithOfflineFallback({
      fetchFn: async () => {
        throw new TypeError('Failed to fetch');
      },
      cacheFn: vi.fn(),
      getCacheFn,
      operationName: 'test',
    });

    expect(getCacheFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: ['cached'], source: 'cache', error: null });
  });
});
