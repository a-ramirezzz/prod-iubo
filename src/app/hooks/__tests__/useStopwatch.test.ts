// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useStopwatch } from '@/app/hooks/useStopwatch';

const STOPWATCH_KEY = 'prod-uibo-stopwatch';

describe('useStopwatch', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    vi.useFakeTimers();
    store = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((k) =>
      k in store ? store[k] : null
    );
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((k, v) => {
      store[k] = String(v);
    });
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation((k) => {
      delete store[k];
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts at zero and is inactive by default', () => {
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasStarted).toBe(false);
  });

  it('counts up each second once started', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => {
      result.current.startStopwatch();
    });
    expect(result.current.isActive).toBe(true);
    expect(result.current.hasStarted).toBe(true);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.elapsedSeconds).toBe(3);
  });

  it('togglePause freezes and resumes the count', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => {
      result.current.startStopwatch();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.elapsedSeconds).toBe(10);

    act(() => {
      result.current.togglePause();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.elapsedSeconds).toBe(10);
    expect(result.current.isActive).toBe(false);
    // Still counts as an in-progress session while paused.
    expect(result.current.hasStarted).toBe(true);

    act(() => {
      result.current.togglePause();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.elapsedSeconds).toBe(15);
  });

  it('resetStopwatch returns to zero and clears the session', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => {
      result.current.startStopwatch();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    act(() => {
      result.current.resetStopwatch();
    });
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasStarted).toBe(false);
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(STOPWATCH_KEY);
  });

  it('stopStopwatch resets to zero without throwing', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => {
      result.current.startStopwatch();
    });
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    const elapsedBeforeStop = result.current.elapsedSeconds;
    expect(elapsedBeforeStop).toBe(8);

    act(() => {
      result.current.stopStopwatch();
    });
    expect(result.current.elapsedSeconds).toBe(0);
    expect(result.current.hasStarted).toBe(false);
  });

  it('persists to localStorage on start and clears on stop', () => {
    const { result } = renderHook(() => useStopwatch());
    act(() => {
      result.current.startStopwatch();
    });
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      STOPWATCH_KEY,
      expect.any(String)
    );
    act(() => {
      result.current.stopStopwatch();
    });
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(STOPWATCH_KEY);
  });

  it('restores a running stopwatch from localStorage on mount', () => {
    store[STOPWATCH_KEY] = JSON.stringify({
      startTimestamp: Date.now() - 12000,
      sessionStartedAt: new Date().toISOString(),
      isPaused: false,
      elapsedOnPause: 0,
    });
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.elapsedSeconds).toBeGreaterThanOrEqual(11);
    expect(result.current.elapsedSeconds).toBeLessThanOrEqual(13);
    expect(result.current.isActive).toBe(true);
    expect(result.current.hasStarted).toBe(true);
  });

  it('restores a paused stopwatch from localStorage on mount', () => {
    store[STOPWATCH_KEY] = JSON.stringify({
      startTimestamp: 0,
      sessionStartedAt: new Date().toISOString(),
      isPaused: true,
      elapsedOnPause: 42,
    });
    const { result } = renderHook(() => useStopwatch());
    expect(result.current.elapsedSeconds).toBe(42);
    expect(result.current.isActive).toBe(false);
    expect(result.current.hasStarted).toBe(true);
  });
});
