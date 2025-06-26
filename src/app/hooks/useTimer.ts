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
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage the state and logic for a countdown timer.
 * It depends on `useTimerAlert` to trigger a notification when the timer finishes.
 * @returns {object} An object containing the timer's state and control functions.
 */
export const useTimer = () => {
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

  // Dependency hook for triggering alerts.
  const { triggerAlert } = useTimerAlert();

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
        setTotalSeconds((prev) => prev - 1);
      }, 1000);
    } 
    // When the timer hits zero while active, stop it and trigger an alert.
    else if (totalSeconds === 0 && isActive) {
      clearInterval(intervalRef.current!);
      setIsActive(false);
      triggerAlert();
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
    setTotalSeconds(seconds);
    setInitialTimeSet(seconds);
    setIsActive(true);
  }, []);

  /**
   * Toggles the timer between 'running' and 'paused' states.
   */
  const togglePause = useCallback(() => {
    if (totalSeconds > 0) {
      setIsActive((prevIsActive) => !prevIsActive);
    }
  }, [totalSeconds]);

  /**
   * Resets the timer back to its initially set duration.
   */
  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTotalSeconds(initialTimeSet);
  }, [initialTimeSet]);

  /**
   * Completely stops the timer and resets all values to zero.
   */
  const stopTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTotalSeconds(0);
    setInitialTimeSet(0);
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
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  };
};
