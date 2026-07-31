/**
 * =================================================================
 * src/app/hooks/usePomodoroEngine.ts
 * -----------------------------------------------------------------
 * This custom hook manages the Pomodoro cycle state machine:
 * how many pomodoros have been completed in the current cycle,
 * which phase the user is in (work / short break / long break),
 * and the daily total (persisted best-effort in Supabase).
 *
 * It does NOT auto-advance the timer — it only tracks state and
 * exposes actions; the user manually starts each phase.
 * =================================================================
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { executeOrQueue } from '@/app/lib/offlineMutation';
import { cacheSessions, getCachedSessions } from '@/app/lib/offlineDb';

// A valid Pomodoro is a work session of at least 20 minutes.
const MIN_VALID_POMODORO_SECONDS = 1200;
// A long break is earned after this many valid pomodoros.
const POMODOROS_PER_CYCLE = 4;

export type PomodoroPhase = 'work' | 'short_break' | 'long_break' | 'idle';

// =================================================================
// SECTION: localStorage persistence helpers
// =================================================================

const ENGINE_STORAGE_KEY = 'prod-uibo-pomodoro-engine';

interface PersistedEngine {
  currentPhase: PomodoroPhase;
  cycleCount: number;
  sessionStartedAt: string | null; // ISO string
  initialTimeSet: number; // the engine's initialTimeSetRef value
}

/** Reads and parses the persisted engine state, or null on any failure. */
const readPersistedEngine = (): PersistedEngine | null => {
  try {
    const raw = localStorage.getItem(ENGINE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedEngine;
  } catch {
    return null;
  }
};

/** Best-effort write of the persisted engine state. Ignores errors. */
const writePersistedEngine = (data: PersistedEngine): void => {
  try {
    localStorage.setItem(ENGINE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silent: persistence is a best-effort enhancement.
  }
};

/** Best-effort removal of the persisted engine state. Ignores errors. */
const clearPersistedEngine = (): void => {
  try {
    localStorage.removeItem(ENGINE_STORAGE_KEY);
  } catch {
    // Silent.
  }
};

interface PomodoroEngineOptions {
  /** Fired when the 4th pomodoro of a cycle completes (long break earned). */
  onCycleComplete?: () => void;
}

/**
 * Manages the Pomodoro cycle state machine and best-effort session
 * persistence in the `pomodoro_sessions` Supabase table.
 * @param userId - The authenticated user's id, or null when signed out.
 * @param options - Optional callbacks (e.g. long-break notification).
 */
export const usePomodoroEngine = (
  userId: string | null,
  options: PomodoroEngineOptions = {}
) => {
  const supabase = createClient();

  const [cycleCount, setCycleCount] = useState(0);
  const [totalPomodorosToday, setTotalPomodorosToday] = useState(0);
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('idle');
  const [sessionStartedAt, setSessionStartedAt] = useState<Date | null>(null);

  // Refs so callbacks always see the latest values without re-creating.
  const initialTimeSetRef = useRef(0);
  const sessionStartedAtRef = useRef<Date | null>(null);
  const cycleCountRef = useRef(0);
  const currentPhaseRef = useRef<PomodoroPhase>('idle');
  const onCycleCompleteRef = useRef(options.onCycleComplete);
  useEffect(() => {
    onCycleCompleteRef.current = options.onCycleComplete;
  }, [options.onCycleComplete]);

  /**
   * On mount (runs once): restore the cycle state machine (phase, cycle
   * count, session start, and the initially set duration) from
   * localStorage so a page refresh at a break pause point is preserved.
   * If nothing is stored, normal defaults apply (idle, 0, null).
   */
  useEffect(() => {
    const persisted = readPersistedEngine();
    if (!persisted) return;

    const restoredStart = persisted.sessionStartedAt
      ? new Date(persisted.sessionStartedAt)
      : null;

    currentPhaseRef.current = persisted.currentPhase;
    setCurrentPhase(persisted.currentPhase);
    cycleCountRef.current = persisted.cycleCount;
    setCycleCount(persisted.cycleCount);
    sessionStartedAtRef.current = restoredStart;
    setSessionStartedAt(restoredStart);
    initialTimeSetRef.current = persisted.initialTimeSet;
  }, []);

  /**
   * On mount (and when the user changes): restore today's completed
   * pomodoro count from Supabase. Errors are swallowed — stats are
   * best-effort, never blocking.
   */
  useEffect(() => {
    if (!userId) {
      setTotalPomodorosToday(0);
      return;
    }
    let cancelled = false;
    const fetchToday = async () => {
      try {
        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        const { count, error } = await supabase
          .from('pomodoro_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('completed_at', todayMidnight.toISOString());
        if (!cancelled && !error && typeof count === 'number') {
          setTotalPomodorosToday(count);
        }
      } catch {
        // Silent: stats are non-critical.
      }
    };
    fetchToday();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  /**
   * Begins a work session: records the phase, start time, and the
   * initially set duration (used later to validate the pomodoro).
   */
  const startWorkSession = useCallback((initialTimeSet: number) => {
    const now = new Date();
    initialTimeSetRef.current = initialTimeSet;
    sessionStartedAtRef.current = now;
    setSessionStartedAt(now);
    currentPhaseRef.current = 'work';
    setCurrentPhase('work');
    writePersistedEngine({
      currentPhase: 'work',
      cycleCount: cycleCountRef.current,
      sessionStartedAt: now.toISOString(),
      initialTimeSet: initialTimeSetRef.current,
    });
  }, []);

  /**
   * Called when the timer reaches zero naturally (via useTimer's
   * onComplete). Validates and persists the pomodoro, then advances
   * the cycle state machine.
   */
  const completeSession = useCallback((taskText: string | null) => {
    if (
      currentPhaseRef.current !== 'work' ||
      initialTimeSetRef.current < MIN_VALID_POMODORO_SECONDS
    ) {
      return; // Not a valid pomodoro — no state change.
    }

    // Persist the session (best-effort, fire-and-forget).
    if (userId) {
      const payload = {
        user_id: userId,
        started_at: (sessionStartedAtRef.current ?? new Date()).toISOString(),
        completed_at: new Date().toISOString(),
        duration_minutes: Math.round(initialTimeSetRef.current / 60),
        session_type: 'work',
        task_text: taskText,
        completed: true,
      };
      executeOrQueue(
        () => supabase.from('pomodoro_sessions').insert(payload),
        { table: 'pomodoro_sessions', operation: 'insert', data: payload, userId }
      ).then(async ({ queued, error }) => {
        if (queued) {
          // Not reflected by Supabase yet — mirror it into the local cache
          // so it shows up immediately in the offline stats view.
          const cached = (await getCachedSessions(userId)) ?? [];
          await cacheSessions(userId, [
            {
              completed_at: payload.completed_at,
              task_text: payload.task_text,
              duration_minutes: payload.duration_minutes,
            },
            ...cached,
          ]);
          return;
        }
        if (error) console.error('[usePomodoroEngine] Error saving session:', error);
      });
    }

    setTotalPomodorosToday((prev) => prev + 1);

    const newCycleCount = cycleCountRef.current + 1;
    if (newCycleCount >= POMODOROS_PER_CYCLE) {
      cycleCountRef.current = 0;
      setCycleCount(0);
      currentPhaseRef.current = 'long_break';
      setCurrentPhase('long_break');
      onCycleCompleteRef.current?.();
    } else {
      cycleCountRef.current = newCycleCount;
      setCycleCount(newCycleCount);
      currentPhaseRef.current = 'short_break';
      setCurrentPhase('short_break');
    }

    writePersistedEngine({
      currentPhase: currentPhaseRef.current,
      cycleCount: cycleCountRef.current,
      sessionStartedAt: sessionStartedAtRef.current
        ? sessionStartedAtRef.current.toISOString()
        : null,
      initialTimeSet: initialTimeSetRef.current,
    });
  }, [userId, supabase]);

  /**
   * Starts the break the user has earned. Breaks are not persisted —
   * only work sessions are saved.
   */
  const startBreak = useCallback(() => {
    const now = new Date();
    sessionStartedAtRef.current = now;
    const breakType: PomodoroPhase =
      currentPhaseRef.current === 'long_break' ? 'long_break' : 'short_break';
    currentPhaseRef.current = breakType;
    setCurrentPhase(breakType);
    writePersistedEngine({
      currentPhase: breakType,
      cycleCount: cycleCountRef.current,
      sessionStartedAt: now.toISOString(),
      initialTimeSet: initialTimeSetRef.current,
    });
  }, []);

  /**
   * Ends the current break; the user will manually start the next
   * work session.
   */
  const completeBreak = useCallback(() => {
    currentPhaseRef.current = 'idle';
    setCurrentPhase('idle');
    // The cycle pause point is over — a fresh work session will create a
    // new entry, so drop the persisted state now.
    clearPersistedEngine();
  }, []);

  /**
   * Resets the current cycle entirely.
   */
  const resetCycle = useCallback(() => {
    cycleCountRef.current = 0;
    setCycleCount(0);
    currentPhaseRef.current = 'idle';
    setCurrentPhase('idle');
    setSessionStartedAt(null);
    sessionStartedAtRef.current = null;
    clearPersistedEngine();
  }, []);

  return {
    currentPhase,
    cycleCount,
    totalPomodorosToday,
    sessionStartedAt,
    startWorkSession,
    completeSession,
    startBreak,
    completeBreak,
    resetCycle,
  };
};
