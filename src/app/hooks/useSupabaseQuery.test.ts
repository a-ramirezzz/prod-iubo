// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import useSupabaseQuery from './useSupabaseQuery';

describe('useSupabaseQuery', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch data successfully on mount', async () => {
    const queryFn = vi.fn().mockResolvedValue({ id: 1, name: 'a' });
    const { result } = renderHook(() => useSupabaseQuery(queryFn));

    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual({ id: 1, name: 'a' });
    expect(result.current.error).toBeNull();
  });

  it('should set error when query fails after all retries', async () => {
    const queryFn = vi.fn().mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() =>
      useSupabaseQuery(queryFn, { retries: 1, retryDelayMs: 10 }),
    );

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toBe('boom');
    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(queryFn).toHaveBeenCalledTimes(2); // 1 initial + 1 retry
  });

  it('should retry with exponential backoff', async () => {
    const queryFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail1'))
      .mockRejectedValueOnce(new Error('fail2'))
      .mockResolvedValue({ ok: true });

    const { result } = renderHook(() =>
      useSupabaseQuery(queryFn, { retries: 2, retryDelayMs: 10 }),
    );

    await waitFor(() => expect(result.current.data).not.toBeNull());

    expect(result.current.data).toEqual({ ok: true });
    expect(result.current.error).toBeNull();
    expect(queryFn).toHaveBeenCalledTimes(3);
  });

  it('should not fetch when enabled is false', async () => {
    const queryFn = vi.fn().mockResolvedValue('x');
    const { result } = renderHook(() =>
      useSupabaseQuery(queryFn, { enabled: false }),
    );

    // Give any potential effect a chance to run.
    await new Promise((r) => setTimeout(r, 20));

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('should run the query when enabled flips from false to true', async () => {
    const queryFn = vi.fn().mockResolvedValue('ready');
    const { result, rerender } = renderHook(
      ({ enabled }) => useSupabaseQuery(queryFn, { enabled }),
      { initialProps: { enabled: false } },
    );

    expect(queryFn).not.toHaveBeenCalled();

    rerender({ enabled: true });

    await waitFor(() => expect(result.current.data).toBe('ready'));
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  it('should refetch when refetch() is called', async () => {
    let value = 'A';
    const queryFn = vi.fn(async () => value);
    const { result } = renderHook(() => useSupabaseQuery(queryFn));

    await waitFor(() => expect(result.current.data).toBe('A'));

    value = 'B';
    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data).toBe('B');
  });

  it('should not setState after unmount', async () => {
    const errorSpy = vi.spyOn(console, 'error');
    const queryFn = vi.fn(
      () => new Promise((resolve) => setTimeout(() => resolve('late'), 50)),
    );

    const { result, unmount } = renderHook(() => useSupabaseQuery(queryFn));
    unmount();

    // Wait past the query resolution.
    await new Promise((r) => setTimeout(r, 80));

    // No React "setState on unmounted component" warnings.
    const warned = errorSpy.mock.calls.some((call) =>
      String(call[0]).includes('unmounted'),
    );
    expect(warned).toBe(false);
    expect(result.current.data).toBeNull();
  });
});
