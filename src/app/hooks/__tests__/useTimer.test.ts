// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock useTimerAlert so no real audio/notification logic runs.
vi.mock('@/app/hooks/useTimerAlert', () => ({
  useTimerAlert: vi.fn(() => ({ triggerAlert: vi.fn() })),
}));

import { useTimer } from '@/app/hooks/useTimer';

const TIMER_KEY = 'prod-uibo-timer';

describe('useTimer', () => {
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

  it('starts a countdown with the correct total seconds', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.startTimer(25);
    });
    expect(result.current.totalSeconds).toBe(1500);
    expect(result.current.isActive).toBe(true);
  });

  it('counts down each second', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.startTimer(1);
    });
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.totalSeconds).toBe(57);
  });

  it('calls onComplete when countdown reaches zero', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(false, onComplete));
    act(() => {
      result.current.startTimer(1);
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(result.current.isActive).toBe(false);
    expect(result.current.totalSeconds).toBe(0);
  });

  it('does not call onComplete on reset', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(false, onComplete));
    act(() => {
      result.current.startTimer(1);
    });
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    act(() => {
      result.current.resetTimer();
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('does not call onComplete on stop', () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() => useTimer(false, onComplete));
    act(() => {
      result.current.startTimer(1);
    });
    act(() => {
      vi.advanceTimersByTime(30000);
    });
    act(() => {
      result.current.stopTimer();
    });
    act(() => {
      vi.advanceTimersByTime(60000);
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('togglePause pauses and resumes correctly', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.startTimer(1);
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.totalSeconds).toBe(50);
    act(() => {
      result.current.togglePause();
    });
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(result.current.totalSeconds).toBe(50);
    act(() => {
      result.current.togglePause();
    });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.totalSeconds).toBe(45);
  });

  it('persists to localStorage on start and clears on reset', () => {
    const { result } = renderHook(() => useTimer());
    act(() => {
      result.current.startTimer(1);
    });
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      TIMER_KEY,
      expect.any(String)
    );
    act(() => {
      result.current.resetTimer();
    });
    expect(Storage.prototype.removeItem).toHaveBeenCalledWith(TIMER_KEY);
  });

  it('restores timer state from localStorage on mount', () => {
    store[TIMER_KEY] = JSON.stringify({
      endTimestamp: Date.now() + 30000,
      initialTimeSet: 60,
      isPaused: false,
      remainingOnPause: 0,
    });
    const { result } = renderHook(() => useTimer());
    expect(result.current.totalSeconds).toBeGreaterThanOrEqual(28);
    expect(result.current.totalSeconds).toBeLessThanOrEqual(32);
    expect(result.current.isActive).toBe(true);
  });
});
