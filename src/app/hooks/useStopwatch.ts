/**
 * =================================================================
 * src/app/hooks/useStopwatch.ts
 * -----------------------------------------------------------------
 * Count-up companion to useTimer.ts. Starts at 0:00 and counts
 * upward until the user manually stops it — no target duration,
 * no automatic completion. Mirrors useTimer's wall-clock drift
 * correction and localStorage persistence pattern so a stopwatch
 * session survives a page refresh.
 * =================================================================
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatTime } from '@/app/lib/time';

// =================================================================
// SECTION: localStorage persistence helpers
// =================================================================

const STOPWATCH_STORAGE_KEY = 'prod-uibo-stopwatch';

interface PersistedStopwatch {
  startTimestamp: number; // Date.now() - elapsed*1000 — anchor while running
  sessionStartedAt: string; // ISO string, fixed at the first start
  isPaused: boolean;
  elapsedOnPause: number; // seconds elapsed when paused (only if isPaused)
}

const readPersistedStopwatch = (): PersistedStopwatch | null => {
  try {
    const raw = localStorage.getItem(STOPWATCH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedStopwatch;
  } catch {
    return null;
  }
};

const writePersistedStopwatch = (data: PersistedStopwatch): void => {
  try {
    localStorage.setItem(STOPWATCH_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silent: persistence is a best-effort enhancement.
  }
};

const clearPersistedStopwatch = (): void => {
  try {
    localStorage.removeItem(STOPWATCH_STORAGE_KEY);
  } catch {
    // Silent.
  }
};

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage the state and logic for a count-up stopwatch.
 * @returns {object} The stopwatch's state and control functions.
 */
export const useStopwatch = () => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  // True from the moment the session starts until it's stopped/reset —
  // stays true while paused, unlike `isActive`.
  const [hasStarted, setHasStarted] = useState(false);
  const [stopwatchRestored, setStopwatchRestored] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  // Absolute wall-clock anchor: elapsed = (Date.now() - startTimestamp) / 1000.
  const startTimestampRef = useRef<number | null>(null);
  // Fixed at the first start of the session; used as `started_at` when saved.
  const sessionStartedAtRef = useRef<Date | null>(null);

  // -----------------------------------------------------------------
  // Restore from localStorage on mount (runs once)
  // -----------------------------------------------------------------
  useEffect(() => {
    const persisted = readPersistedStopwatch();
    if (!persisted) return;

    sessionStartedAtRef.current = new Date(persisted.sessionStartedAt);

    if (persisted.isPaused) {
      startTimestampRef.current = null;
      setElapsedSeconds(persisted.elapsedOnPause);
      setIsActive(false);
      setHasStarted(true);
      setStopwatchRestored(true);
      return;
    }

    const elapsed = Math.max(0, Math.round((Date.now() - persisted.startTimestamp) / 1000));
    startTimestampRef.current = persisted.startTimestamp;
    setElapsedSeconds(elapsed);
    setIsActive(true);
    setHasStarted(true);
    setStopwatchRestored(true);
  }, []);

  // -----------------------------------------------------------------
  // Core count-up interval
  // -----------------------------------------------------------------
  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        const startTimestamp = startTimestampRef.current;
        if (startTimestamp != null) {
          const elapsed = Math.max(0, Math.round((Date.now() - startTimestamp) / 1000));
          setElapsedSeconds(elapsed);
        } else {
          setElapsedSeconds((prev) => prev + 1);
        }
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isActive]);

  // -----------------------------------------------------------------
  // Memoized Control Functions
  // -----------------------------------------------------------------

  /** Starts a brand-new stopwatch session from 0:00. */
  const startStopwatch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    const now = Date.now();
    startTimestampRef.current = now;
    sessionStartedAtRef.current = new Date(now);
    setElapsedSeconds(0);
    setIsActive(true);
    setHasStarted(true);
    writePersistedStopwatch({
      startTimestamp: now,
      sessionStartedAt: sessionStartedAtRef.current.toISOString(),
      isPaused: false,
      elapsedOnPause: 0,
    });
  }, []);

  /** Toggles the stopwatch between 'running' and 'paused'. */
  const togglePause = useCallback(() => {
    setIsActive((prevIsActive) => {
      const nextIsActive = !prevIsActive;
      const startedAtIso = (sessionStartedAtRef.current ?? new Date()).toISOString();
      if (nextIsActive) {
        // Resuming: re-anchor the start timestamp to now - elapsed.
        const startTimestamp = Date.now() - elapsedSeconds * 1000;
        startTimestampRef.current = startTimestamp;
        writePersistedStopwatch({
          startTimestamp,
          sessionStartedAt: startedAtIso,
          isPaused: false,
          elapsedOnPause: 0,
        });
      } else {
        // Pausing: freeze elapsed seconds, drop the start timestamp.
        startTimestampRef.current = null;
        writePersistedStopwatch({
          startTimestamp: 0,
          sessionStartedAt: startedAtIso,
          isPaused: true,
          elapsedOnPause: elapsedSeconds,
        });
      }
      return nextIsActive;
    });
  }, [elapsedSeconds]);

  /** Resets the stopwatch back to 0:00, abandoning the current session. */
  const resetStopwatch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setElapsedSeconds(0);
    setHasStarted(false);
    startTimestampRef.current = null;
    sessionStartedAtRef.current = null;
    clearPersistedStopwatch();
  }, []);

  /**
   * Ends the current session and resets to 0:00. Callers that need to
   * persist the elapsed duration must read `elapsedSeconds` and
   * `sessionStartedAt` BEFORE calling this — it clears both.
   */
  const stopStopwatch = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setElapsedSeconds(0);
    setHasStarted(false);
    startTimestampRef.current = null;
    sessionStartedAtRef.current = null;
    clearPersistedStopwatch();
  }, []);

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  const timeParts = useMemo(() => formatTime(elapsedSeconds), [elapsedSeconds]);

  return {
    timeParts,
    elapsedSeconds,
    isActive,
    hasStarted,
    stopwatchRestored,
    sessionStartedAt: sessionStartedAtRef.current,
    startStopwatch,
    togglePause,
    resetStopwatch,
    stopStopwatch,
  };
};
