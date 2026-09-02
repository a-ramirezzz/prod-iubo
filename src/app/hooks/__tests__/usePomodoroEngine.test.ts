// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// A chainable Supabase mock. Every query-builder method returns the same
// builder, which is also thenable so `await`/`.then()` resolves to a result.
const insertMock = vi.fn(() => Promise.resolve({ error: null }));
let countResult: { count: number; error: unknown } = { count: 0, error: null };

const makeBuilder = () => {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.insert = insertMock;
  builder.then = (resolve: (v: unknown) => unknown) => resolve(countResult);
  return builder;
};

const mockSupabase = {
  from: vi.fn(() => makeBuilder()),
};

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

import { usePomodoroEngine } from '@/app/hooks/usePomodoroEngine';

const ENGINE_KEY = 'prod-uibo-pomodoro-engine';
const USER = 'user-123';

describe('usePomodoroEngine', () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    countResult = { count: 0, error: null };
    insertMock.mockClear();
    mockSupabase.from.mockClear();
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
    vi.restoreAllMocks();
  });

  it('starts in idle phase with zero cycle count', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    expect(result.current.currentPhase).toBe('idle');
    expect(result.current.cycleCount).toBe(0);
  });

  it('startWorkSession sets phase to work', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    act(() => {
      result.current.startWorkSession(1500);
    });
    expect(result.current.currentPhase).toBe('work');
  });

  it('completeSession ignores sessions shorter than 20 minutes', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    act(() => {
      result.current.startWorkSession(600);
    });
    act(() => {
      result.current.completeSession(null);
    });
    expect(result.current.cycleCount).toBe(0);
    expect(result.current.currentPhase).toBe('work');
  });

  it('completeSession counts valid pomodoros (>= 20 min)', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    act(() => {
      result.current.startWorkSession(1500);
    });
    act(() => {
      result.current.completeSession('Test task');
    });
    expect(result.current.cycleCount).toBe(1);
    expect(result.current.totalPomodorosToday).toBe(1);
    expect(result.current.currentPhase).toBe('short_break');
  });

  it('advances to long_break after 4 valid pomodoros', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.startWorkSession(1500);
      });
      act(() => {
        result.current.completeSession(null);
      });
    }
    expect(result.current.currentPhase).toBe('long_break');
    expect(result.current.cycleCount).toBe(0);
  });

  it('calls onCycleComplete after 4th pomodoro', () => {
    const onCycleComplete = vi.fn();
    const { result } = renderHook(() =>
      usePomodoroEngine(USER, { onCycleComplete })
    );
    for (let i = 0; i < 4; i++) {
      act(() => {
        result.current.startWorkSession(1500);
      });
      act(() => {
        result.current.completeSession(null);
      });
    }
    expect(onCycleComplete).toHaveBeenCalledTimes(1);
  });

  it('completeBreak resets phase to idle', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    act(() => {
      result.current.startWorkSession(1500);
    });
    act(() => {
      result.current.completeSession(null);
    });
    act(() => {
      result.current.completeBreak();
    });
    expect(result.current.currentPhase).toBe('idle');
  });

  it('resetCycle resets everything to initial state', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    for (let i = 0; i < 2; i++) {
      act(() => {
        result.current.startWorkSession(1500);
      });
      act(() => {
        result.current.completeSession(null);
      });
    }
    act(() => {
      result.current.resetCycle();
    });
    expect(result.current.cycleCount).toBe(0);
    expect(result.current.currentPhase).toBe('idle');
  });

  it('persists engine state to localStorage on startWorkSession', () => {
    const { result } = renderHook(() => usePomodoroEngine(USER));
    act(() => {
      result.current.startWorkSession(1500);
    });
    expect(Storage.prototype.setItem).toHaveBeenCalledWith(
      ENGINE_KEY,
      expect.any(String)
    );
  });

  it('does not save to Supabase when userId is null', async () => {
    const { result } = renderHook(() => usePomodoroEngine(null));
    act(() => {
      result.current.startWorkSession(1500);
    });
    act(() => {
      result.current.completeSession(null);
    });
    await waitFor(() => {
      expect(insertMock).not.toHaveBeenCalled();
    });
  });

  describe('saveStopwatchSession', () => {
    it('ignores sessions shorter than MIN_VALID_SECONDS', async () => {
      const { result } = renderHook(() => usePomodoroEngine(USER));
      act(() => {
        result.current.saveStopwatchSession(600, new Date(), 'Too short');
      });
      expect(result.current.totalPomodorosToday).toBe(0);
      await waitFor(() => {
        expect(insertMock).not.toHaveBeenCalled();
      });
    });

    it('saves valid sessions (>= 20 min) and increments totalPomodorosToday', async () => {
      const { result } = renderHook(() => usePomodoroEngine(USER));
      const startedAt = new Date();
      act(() => {
        result.current.saveStopwatchSession(1500, startedAt, 'Deep work');
      });
      expect(result.current.totalPomodorosToday).toBe(1);
      await waitFor(() => {
        expect(insertMock).toHaveBeenCalledTimes(1);
      });
      expect(mockSupabase.from).toHaveBeenCalledWith('pomodoro_sessions');
    });

    it('does not touch the Pomodoro cycle/phase state machine', () => {
      const { result } = renderHook(() => usePomodoroEngine(USER));
      expect(result.current.currentPhase).toBe('idle');
      expect(result.current.cycleCount).toBe(0);
      act(() => {
        result.current.saveStopwatchSession(1800, new Date(), null);
      });
      expect(result.current.currentPhase).toBe('idle');
      expect(result.current.cycleCount).toBe(0);
    });

    it('does not save to Supabase when userId is null', async () => {
      const { result } = renderHook(() => usePomodoroEngine(null));
      act(() => {
        result.current.saveStopwatchSession(1500, new Date(), null);
      });
      await waitFor(() => {
        expect(insertMock).not.toHaveBeenCalled();
      });
    });
  });
});
