// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// -----------------------------------------------------------------------------
// Integration tests — hooks running together, not in isolation
// -----------------------------------------------------------------------------
// The unit suites mock each hook's neighbours: useTimerController.test.ts mocks
// useTimer + usePomodoroEngine entirely, so nothing there proves that a real
// countdown reaching zero actually persists a real pomodoro.
//
// Here the mock boundary moves DOWN to the external world only:
//
//   MOCKED   : the Supabase client (the database), the Web Audio API, Audio,
//              Notification  — i.e. the browser/network edges.
//   REAL CODE: useTimer, useTimerAlert, usePomodoroEngine, useTimerController,
//              usePomodoroStats and lib/notificationSound.
//
// So `renderHook(() => useTimerController(...))` boots the whole chain, and
// driving the clock with fake timers exercises the real signal path:
//
//   setInterval tick → useTimer totalSeconds → 0 → onComplete
//     → useTimerController phase routing → usePomodoroEngine.completeSession
//     → supabase.from('pomodoro_sessions').insert(...)
//     → (same rows) → usePomodoroStats
//
// Note: useTimerController takes its settings as plain params (userId, task
// text, sound flags), not via React context, so no provider wrapper is needed —
// the values are injected directly through the hook's props.
// -----------------------------------------------------------------------------

// =============================================================================
// Supabase mock — a chainable, thenable query builder that records writes
// =============================================================================

interface InsertedRow {
  table: string;
  payload: Record<string, unknown>;
}

/** Every .insert() the hooks perform, in order. */
const inserted: InsertedRow[] = [];
/** Rows returned to `.select()` calls that fetch data (usePomodoroStats). */
let selectRows: Record<string, unknown>[] = [];
/** Result for the engine's `head: true` count query. */
let countResult: { count: number | null; error: unknown } = { count: 0, error: null };
/** When set, every insert resolves with this error (failure injection). */
let insertError: unknown = null;

type Result = { data?: unknown; count?: number | null; error: unknown };

/**
 * Builds a fluent Supabase query builder. Each method returns the same object
 * so arbitrary chains work, and the builder is thenable so `await` / `.then()`
 * resolves to a result shaped like the operation that was requested.
 */
const makeBuilder = (table: string) => {
  let mode: 'data' | 'count' | 'write' = 'data';

  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = vi.fn((_cols?: string, opts?: { head?: boolean }) => {
    mode = opts?.head ? 'count' : 'data';
    return builder;
  });
  builder.eq = vi.fn(chain);
  builder.gte = vi.fn(chain);
  builder.lte = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.limit = vi.fn(chain);

  builder.insert = vi.fn((payload: Record<string, unknown>) => {
    mode = 'write';
    inserted.push({ table, payload });
    return builder;
  });
  builder.update = vi.fn(() => {
    mode = 'write';
    return builder;
  });
  builder.upsert = vi.fn(() => {
    mode = 'write';
    return builder;
  });
  builder.delete = vi.fn(() => {
    mode = 'write';
    return builder;
  });

  builder.then = (resolve: (v: Result) => unknown) => {
    if (mode === 'write') return resolve({ error: insertError });
    if (mode === 'count') return resolve({ ...countResult });
    return resolve({ data: selectRows, error: null });
  };

  return builder;
};

const mockSupabase = {
  from: vi.fn((table: string) => makeBuilder(table)),
  channel: vi.fn(() => {
    const channel: Record<string, unknown> = {};
    channel.on = vi.fn(() => channel);
    channel.subscribe = vi.fn(() => channel);
    return channel;
  }),
  removeChannel: vi.fn(),
};

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// =============================================================================
// Browser API mocks (Web Audio, Audio element, Notification)
// =============================================================================

/** Number of oscillators created through the real playNotificationSound(). */
let oscillatorCount = 0;

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    oscillatorCount += 1;
    return {
      type: '',
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }
  createGain() {
    return {
      gain: {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      },
      connect: () => {},
    };
  }
  resume() {
    return Promise.resolve();
  }
  close() {
    this.state = 'closed';
    return Promise.resolve();
  }
}

class MockAudio {
  play() {
    return Promise.resolve();
  }
  pause() {}
  currentTime = 0;
}

class MockNotification {
  static permission = 'denied';
  static requestPermission = vi.fn(() => Promise.resolve('denied'));
  onclick: (() => void) | null = null;
  onclose: (() => void) | null = null;
  close() {}
}

// Assigned once for the whole file — these are environment stand-ins, not
// per-test doubles.
Object.assign(globalThis, {
  AudioContext: MockAudioContext,
  Audio: MockAudio,
  Notification: MockNotification,
});

// =============================================================================
// Hooks under test — imported unmocked, on purpose.
// =============================================================================

import { useTimerController } from '@/app/hooks/useTimerController';
import { usePomodoroStats } from '@/app/hooks/usePomodoroStats';
import { POMODORO } from '@/app/lib/constants';

const USER = 'user-integration-1';

/** A valid pomodoro must be >= 20 minutes (POMODORO.MIN_VALID_SECONDS). */
const WORK_MINUTES = POMODORO.MIN_VALID_SECONDS / 60;

interface Params {
  userId?: string | null;
  currentTaskText?: string;
  notificationSoundEnabled?: boolean;
  confirmOnStop?: boolean;
  volume?: number;
}

const renderController = (params: Params = {}) =>
  renderHook(
    (props: Params) =>
      useTimerController({
        enableDesktopNotifications: false,
        confirmOnStop: props.confirmOnStop ?? false,
        currentTaskText: props.currentTaskText,
        userId: props.userId ?? USER,
        notificationSoundEnabled: props.notificationSoundEnabled ?? false,
        volume: props.volume ?? 0.5,
      }),
    { initialProps: params }
  );

/** Advances the real countdown by N seconds of wall-clock time. */
const advanceSeconds = async (seconds: number) => {
  await act(async () => {
    vi.advanceTimersByTime(seconds * 1000);
  });
};

/** Runs a full work session to natural completion through the real timer. */
const runWorkSession = async (
  result: { current: ReturnType<typeof useTimerController> },
  minutes = WORK_MINUTES
) => {
  await act(async () => {
    result.current.handleStartTimer(minutes);
  });
  await advanceSeconds(minutes * 60 + 1);
};

const pomodoroInserts = () =>
  inserted.filter((row) => row.table === 'pomodoro_sessions');

describe('hook integration: timer → engine → Supabase → stats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    inserted.length = 0;
    selectRows = [];
    countResult = { count: 0, error: null };
    insertError = null;
    oscillatorCount = 0;
    localStorage.clear();
    mockSupabase.from.mockClear();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Timer → Engine flow
  // ===========================================================================

  it('should advance engine phase when timer completes', async () => {
    const { result } = renderController();

    await act(async () => {
      result.current.handleStartTimer(WORK_MINUTES);
    });
    expect(result.current.pomodoroEngine.currentPhase).toBe('work');
    expect(result.current.isActive).toBe(true);

    await advanceSeconds(WORK_MINUTES * 60 + 1);

    // The real countdown hit zero, useTimer fired onComplete, the controller
    // routed it to the engine, and the engine advanced the state machine.
    expect(result.current.isActive).toBe(false);
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.pomodoroEngine.currentPhase).toBe('short_break');
    expect(result.current.pomodoroEngine.cycleCount).toBe(1);
  });

  it('should save session to Supabase when work phase completes via timer', async () => {
    const { result } = renderController({ currentTaskText: 'Escribir tests' });

    const before = Date.now();
    await runWorkSession(result);

    const sessions = pomodoroInserts();
    expect(sessions).toHaveLength(1);

    const row = sessions[0].payload;
    expect(row.user_id).toBe(USER);
    expect(row.session_type).toBe('work');
    expect(row.completed).toBe(true);
    expect(row.duration_minutes).toBe(WORK_MINUTES);
    expect(row.task_text).toBe('Escribir tests');
    // Timestamps bracket the session: started before, completed after.
    expect(new Date(row.started_at as string).getTime()).toBeGreaterThanOrEqual(before);
    expect(new Date(row.completed_at as string).getTime()).toBeGreaterThan(
      new Date(row.started_at as string).getTime()
    );
  });

  it('should NOT save a session to Supabase when a break phase completes', async () => {
    const { result } = renderController();

    // Earn a break by completing one work session (1 insert).
    await runWorkSession(result);
    expect(pomodoroInserts()).toHaveLength(1);
    expect(result.current.pomodoroEngine.currentPhase).toBe('short_break');

    // Now run the 5-minute break to completion.
    await act(async () => {
      result.current.handleFocusStartBreak();
    });
    await advanceSeconds(5 * 60 + 1);

    // Breaks are never persisted, and the engine returns to idle.
    expect(pomodoroInserts()).toHaveLength(1);
    expect(result.current.pomodoroEngine.currentPhase).toBe('idle');
  });

  // ===========================================================================
  // Task association
  // ===========================================================================

  it('should associate the active task text with the saved session', async () => {
    const { result, rerender } = renderController({ currentTaskText: 'Tarea A' });

    // The task the user is focused on can change mid-session; the value read
    // at completion time is what must land in the row.
    await act(async () => {
      result.current.handleStartTimer(WORK_MINUTES);
    });
    rerender({ currentTaskText: 'Tarea B' });
    await advanceSeconds(WORK_MINUTES * 60 + 1);

    expect(pomodoroInserts()[0].payload.task_text).toBe('Tarea B');
  });

  it('should save the session with a null task when no task is active', async () => {
    const { result } = renderController({ currentTaskText: undefined });

    await runWorkSession(result);

    expect(pomodoroInserts()[0].payload.task_text).toBeNull();
  });

  // ===========================================================================
  // Duration / settings propagation
  // ===========================================================================

  it('should propagate the chosen duration through timer and engine consistently', async () => {
    const minutes = 45;
    const { result } = renderController();

    await act(async () => {
      result.current.handleStartTimer(minutes);
    });

    // useTimer received the duration in minutes...
    expect(result.current.initialTimeSet).toBe(minutes * 60);
    expect(result.current.totalSeconds).toBe(minutes * 60);

    // ...and the engine received the same duration in seconds, which it later
    // converts back to duration_minutes when persisting.
    await advanceSeconds(minutes * 60 + 1);
    expect(pomodoroInserts()[0].payload.duration_minutes).toBe(minutes);
  });

  it('should play the notification chime when the sound setting is enabled', async () => {
    const { result } = renderController({ notificationSoundEnabled: true });

    await runWorkSession(result);

    // The real playNotificationSound ran and built its two-tone chime.
    expect(oscillatorCount).toBe(2);
  });

  it('should NOT touch the Web Audio API when the sound setting is disabled', async () => {
    const { result } = renderController({ notificationSoundEnabled: false });

    await runWorkSession(result);

    expect(oscillatorCount).toBe(0);
    // The session itself still completed normally.
    expect(pomodoroInserts()).toHaveLength(1);
  });

  // ===========================================================================
  // Full cycle
  // ===========================================================================

  it('should complete a full 4-pomodoro cycle: work → short_break ×3 → work → long_break', async () => {
    const { result } = renderController({ currentTaskText: 'Ciclo' });

    for (let i = 1; i <= 4; i++) {
      await runWorkSession(result);

      if (i < 4) {
        expect(result.current.pomodoroEngine.currentPhase).toBe('short_break');
        expect(result.current.pomodoroEngine.cycleCount).toBe(i);
        // Take the earned short break to get back to idle.
        await act(async () => {
          result.current.handleFocusStartBreak();
        });
        await advanceSeconds(5 * 60 + 1);
        expect(result.current.pomodoroEngine.currentPhase).toBe('idle');
      }
    }

    // The 4th pomodoro earns the long break and resets the cycle counter.
    expect(result.current.pomodoroEngine.currentPhase).toBe('long_break');
    expect(result.current.pomodoroEngine.cycleCount).toBe(0);
    expect(result.current.pomodoroEngine.totalPomodorosToday).toBe(4);

    // Exactly the 4 work sessions were persisted — no break rows.
    const sessions = pomodoroInserts();
    expect(sessions).toHaveLength(4);
    expect(sessions.every((s) => s.payload.session_type === 'work')).toBe(true);
  });

  // ===========================================================================
  // Error resilience
  // ===========================================================================

  it('should keep the timer and engine working when the Supabase save fails with a data error', async () => {
    // A genuine data-level failure (RLS denial, constraint violation) — not a
    // connectivity issue, so the offline mutation queue must NOT swallow it.
    insertError = { message: 'new row violates row-level security policy', code: '42501' };
    const { result } = renderController();

    await runWorkSession(result);

    // The failure is logged, not thrown...
    expect(console.error).toHaveBeenCalledWith(
      '[usePomodoroEngine] Error saving session:',
      insertError
    );
    // ...and the cycle still advanced (local state is not rolled back).
    expect(result.current.pomodoroEngine.currentPhase).toBe('short_break');

    // The next session can still be started and completed.
    insertError = null;
    await act(async () => {
      result.current.handleFocusStartBreak();
    });
    await advanceSeconds(5 * 60 + 1);
    await runWorkSession(result);

    expect(pomodoroInserts()).toHaveLength(2);
    expect(result.current.pomodoroEngine.cycleCount).toBe(2);
  });

  // ===========================================================================
  // Stats consistency
  // ===========================================================================

  it('should produce stats consistent with the session the engine actually wrote', async () => {
    const { result } = renderController({ currentTaskText: 'Refactor' });
    await runWorkSession(result);

    // Feed exactly what the engine inserted back through the read path.
    const written = pomodoroInserts()[0].payload;
    selectRows = [
      {
        completed_at: written.completed_at,
        task_text: written.task_text,
        duration_minutes: written.duration_minutes,
      },
    ];

    const { result: stats } = renderHook(() => usePomodoroStats(USER, 1));
    // The fetch resolves on the microtask queue (fake timers are installed, so
    // waitFor's polling clock would never advance on its own).
    await act(async () => {
      await Promise.resolve();
    });
    expect(stats.current.loading).toBe(false);

    expect(stats.current.loadError).toBe(false);
    expect(stats.current.todaySessions).toHaveLength(1);
    expect(stats.current.todaySessions[0].task_text).toBe('Refactor');
    expect(stats.current.todaySessions[0].duration_minutes).toBe(WORK_MINUTES);
    expect(stats.current.weekTotal).toBe(1);
    expect(stats.current.taskBreakdown).toEqual([
      { taskName: 'Refactor', count: 1, totalMinutes: WORK_MINUTES },
    ]);
    // The write path counted one pomodoro today; the read path agrees.
    expect(result.current.pomodoroEngine.totalPomodorosToday).toBe(1);
    expect(stats.current.streak).toBe(1);
  });

  // ===========================================================================
  // Rapid interaction
  // ===========================================================================

  it('should handle rapid start/stop cycles without writing partial sessions', async () => {
    const { result } = renderController();

    for (let i = 0; i < 5; i++) {
      await act(async () => {
        result.current.handleStartTimer(WORK_MINUTES);
      });
      await advanceSeconds(2);
      await act(async () => {
        result.current.stopTimer();
      });
    }

    // Sessions abandoned before the countdown ends are never persisted.
    expect(pomodoroInserts()).toHaveLength(0);
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.isActive).toBe(false);

    // A session started after the churn still completes exactly once.
    await runWorkSession(result);
    expect(pomodoroInserts()).toHaveLength(1);
    expect(result.current.pomodoroEngine.cycleCount).toBe(1);
  });

  it('should not persist a pomodoro shorter than the 20-minute minimum', async () => {
    const { result } = renderController({ currentTaskText: 'Muy corta' });

    // 10 minutes: the timer completes, but the engine rejects it as invalid.
    await runWorkSession(result, 10);

    expect(pomodoroInserts()).toHaveLength(0);
    expect(result.current.pomodoroEngine.cycleCount).toBe(0);
    // No break is earned — the engine stays in the work phase.
    expect(result.current.pomodoroEngine.currentPhase).toBe('work');
  });
});
