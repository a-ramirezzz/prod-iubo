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
});
