/**
 * =================================================================
 * src/app/hooks/useTimer.ts
 * -----------------------------------------------------------------
 * This custom hook encapsulates all the logic for a countdown timer,
 * including starting, pausing, resetting, and stopping.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTimerAlert } from '@/app/hooks/useTimerAlert';
import { formatTime } from '@/app/lib/time';

// =================================================================
// SECTION: localStorage persistence helpers
// =================================================================

const TIMER_STORAGE_KEY = 'prod-uibo-timer';

interface PersistedTimer {
  endTimestamp: number; // Date.now() + remaining*1000 — when it hits zero
  initialTimeSet: number; // original duration in seconds
  isPaused: boolean;
  remainingOnPause: number; // seconds remaining when paused (only if isPaused)
}

/** Reads and parses the persisted timer, or null on any failure. */
const readPersistedTimer = (): PersistedTimer | null => {
  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedTimer;
  } catch {
    return null;
  }
};

/** Best-effort write of the persisted timer. Silently ignores errors. */
const writePersistedTimer = (data: PersistedTimer): void => {
  try {
    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Silent: persistence is a best-effort enhancement.
  }
};

/** Best-effort removal of the persisted timer. Silently ignores errors. */
const clearPersistedTimer = (): void => {
  try {
    localStorage.removeItem(TIMER_STORAGE_KEY);
  } catch {
    // Silent.
  }
};

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage the state and logic for a countdown timer.
 * It depends on `useTimerAlert` to trigger a notification when the timer finishes.
 * @param enableDesktopNotifications - Whether to show browser notifications when the timer ends.
 * @param onComplete - Optional callback fired when the countdown reaches zero naturally.
 * @returns {object} An object containing the timer's state and control functions.
 */
export const useTimer = (enableDesktopNotifications: boolean = false, onComplete?: () => void) => {
  // -----------------------------------------------------------------
  // State Management
  // -----------------------------------------------------------------

  // The core state: the remaining time in seconds.
  const [totalSeconds, setTotalSeconds] = useState(0);
  
  // The timer's active state (running or paused).
  const [isActive, setIsActive] = useState(false);
  
  // Stores the initial time set by the user, for the reset functionality.
  const [initialTimeSet, setInitialTimeSet] = useState(0);

  // A ref to hold the interval ID. Using a ref is crucial because it
  // doesn't trigger a re-render when its value changes.
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // The absolute wall-clock timestamp (ms) at which the timer hits zero.
  // Used so the countdown reflects real elapsed time — immune to laptop
  // sleep/suspend drift. Null when no running timer is active.
  const endTimestampRef = useRef<number | null>(null);

  // True when the timer state was restored from localStorage on mount.
  const [timerRestored, setTimerRestored] = useState(false);

  // Dependency hook for triggering alerts.
  const { triggerAlert } = useTimerAlert(enableDesktopNotifications);

  // Keep the latest onComplete in a ref so the countdown effect doesn't
  // restart when the caller passes a new callback identity each render.
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // -----------------------------------------------------------------
  // Restore from localStorage on mount (runs once)
  // -----------------------------------------------------------------
  useEffect(() => {
    const persisted = readPersistedTimer();
    if (!persisted) return;

    if (persisted.isPaused) {
      // Restore a paused timer: frozen at its remaining seconds.
      endTimestampRef.current = null;
      setTotalSeconds(persisted.remainingOnPause);
      setInitialTimeSet(persisted.initialTimeSet);
      setIsActive(false);
      setTimerRestored(true);
      return;
    }

    // Running timer: derive remaining from the absolute end timestamp.
    const remaining = Math.round((persisted.endTimestamp - Date.now()) / 1000);
    if (remaining > 0) {
      endTimestampRef.current = persisted.endTimestamp;
      setTotalSeconds(remaining);
      setInitialTimeSet(persisted.initialTimeSet);
      setIsActive(true);
      setTimerRestored(true);
    } else {
      // The timer expired while the page was closed — fire completion.
      endTimestampRef.current = null;
      clearPersistedTimer();
      triggerAlert();
      onCompleteRef.current?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -----------------------------------------------------------------
  // Core Timer Logic
  // -----------------------------------------------------------------

  /**
   * This effect manages the countdown interval.
   * It starts the interval when the timer is active and has time remaining.
   * It clears the interval when the timer is paused, stopped, or finishes.
   */
  useEffect(() => {
    // Start the interval only if the timer is active and time is left.
    if (isActive && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        // Wall-clock drift fix: derive remaining time from the absolute
        // end timestamp rather than blindly decrementing. This keeps the
        // countdown accurate across laptop sleep/suspend. If no end
        // timestamp is available (edge case), fall back to decrement-by-1.
        const endTimestamp = endTimestampRef.current;
        if (endTimestamp != null) {
          const remaining = Math.round((endTimestamp - Date.now()) / 1000);
          setTotalSeconds(remaining > 0 ? remaining : 0);
        } else {
          setTotalSeconds((prev) => prev - 1);
        }
      }, 1000);
    }
    // When the timer hits zero while active, stop it and trigger an alert.
    else if (totalSeconds === 0 && isActive) {
      clearInterval(intervalRef.current!);
      setIsActive(false);
      endTimestampRef.current = null;
      clearPersistedTimer();
      triggerAlert();
      onCompleteRef.current?.();
    }

    // Cleanup function: This is essential to prevent memory leaks.
    // It runs whenever the component unmounts or the dependencies change.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, totalSeconds, triggerAlert]);

  // -----------------------------------------------------------------
  // Memoized Control Functions
  // `useCallback` ensures these functions have a stable identity and
  // don't cause unnecessary re-renders in child components.
  // -----------------------------------------------------------------

  /**
   * Starts a new timer session.
   * @param {number} minutes - The total minutes for the new session.
   */
  const startTimer = useCallback((minutes: number) => {
    if (minutes <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    const seconds = minutes * 60;
    const endTimestamp = Date.now() + seconds * 1000;
    endTimestampRef.current = endTimestamp;
    setTotalSeconds(seconds);
    setInitialTimeSet(seconds);
    setIsActive(true);
    writePersistedTimer({
      endTimestamp,
      initialTimeSet: seconds,
      isPaused: false,
      remainingOnPause: 0,
    });
  }, []);

  /**
   * Toggles the timer between 'running' and 'paused' states.
   */
  const togglePause = useCallback(() => {
    if (totalSeconds > 0) {
      setIsActive((prevIsActive) => {
        const nextIsActive = !prevIsActive;
        if (nextIsActive) {
          // Resuming: re-anchor the end timestamp to now + remaining.
          const endTimestamp = Date.now() + totalSeconds * 1000;
          endTimestampRef.current = endTimestamp;
          writePersistedTimer({
            endTimestamp,
            initialTimeSet,
            isPaused: false,
            remainingOnPause: 0,
          });
        } else {
          // Pausing: freeze remaining seconds, drop the end timestamp.
          endTimestampRef.current = null;
          writePersistedTimer({
            endTimestamp: 0,
            initialTimeSet,
            isPaused: true,
            remainingOnPause: totalSeconds,
          });
        }
        return nextIsActive;
      });
    }
  }, [totalSeconds, initialTimeSet]);

  /**
   * Resets the timer back to its initially set duration.
   */
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTotalSeconds(initialTimeSet);
    endTimestampRef.current = null;
    clearPersistedTimer();
  }, [initialTimeSet]);

  /**
   * Completely stops the timer and resets all values to zero.
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTotalSeconds(0);
    setInitialTimeSet(0);
    endTimestampRef.current = null;
    clearPersistedTimer();
  }, []);
  
  // -----------------------------------------------------------------
  // Public API
  // The values and functions returned by the hook.
  // We use `useMemo` for `timeParts` to avoid re-calculating on every render.
  // -----------------------------------------------------------------

  const timeParts = useMemo(() => formatTime(totalSeconds), [totalSeconds]);

  return {
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    timerRestored,
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  };
};
