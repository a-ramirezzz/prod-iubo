// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useTimerController.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

import { useTimer } from '@/hooks/useTimer';
import { useStopwatch } from '@/hooks/useStopwatch';
import { useTimerAlert } from '@/hooks/useTimerAlert';
import { usePomodoroEngine } from '@/hooks/usePomodoroEngine';
import { useAudio } from '@/hooks/useAudio';
import { hapticFeedback } from '@/app/lib/haptic';
import { POMODORO } from '@/app/lib/constants';

export type TimerMode = 'pomodoro' | 'stopwatch';

export interface UseTimerControllerParams {
  enableDesktopNotifications: boolean;
  confirmOnStop: boolean;
  currentTaskText: string | undefined;
  userId: string | null;
  /** Whether to play the notification chime when a session ends. */
  notificationSoundEnabled: boolean;
  /** App volume (0..1) used to scale the notification chime. */
  volume: number;
}

/**
 * useTimerController consolidates the timer + Pomodoro engine orchestration.
 * It wraps useTimer, usePomodoroEngine and useTimerAlert together, exposing the
 * timer state, custom-input state, engine object, handlers and modal/notification
 * flags that the page needs. It has no dependency on React components.
 */
export function useTimerController({
  enableDesktopNotifications,
  confirmOnStop,
  currentTaskText,
  userId,
  notificationSoundEnabled,
  volume,
}: UseTimerControllerParams) {
  // Dedicated alert instance for the "cycle complete" (long break) notification.
  const { triggerLongBreakAlert } = useTimerAlert(enableDesktopNotifications);

  // Synthesized notification chime, gated by the user's sound setting.
  const { playSound } = useAudio({ notificationSoundEnabled, volume });

  // Pomodoro cycle state machine (tracks phases, cycle count and daily stats).
  const pomodoroEngine = usePomodoroEngine(userId, {
    onCycleComplete: triggerLongBreakAlert,
  });

  // Core countdown logic.
  const {
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    // Available for future use (e.g. a "Timer restored" toast).
    timerRestored,
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  } = useTimer(enableDesktopNotifications, () => {
    // Audible notification for BOTH work and break completions so the
    // user knows a session ended even with the tab in the background.
    // playSound no-ops (and never creates the AudioContext) when disabled.
    playSound('notification-chime');
    // Advance the Pomodoro cycle when the countdown finishes naturally.
    if (pomodoroEngine.currentPhase === 'work') {
      if (notificationSoundEnabled) {
        hapticFeedback([50, 50, 100]);
      }
      pomodoroEngine.completeSession(currentTaskText ?? null);
    } else if (
      pomodoroEngine.currentPhase === 'short_break' ||
      pomodoroEngine.currentPhase === 'long_break'
    ) {
      pomodoroEngine.completeBreak();
    }
  });

  // Custom time input state.
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [customMinutesInput, setCustomMinutesInput] = useState('');

  // Modal/notification state owned by the timer flow.
  const [showVisualNotification, setShowVisualNotification] = useState(false);
  const [showInvalidTimeModal, setShowInvalidTimeModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  // Show visual notification when the timer ends.
  useEffect(() => {
    if (initialTimeSet > 0 && totalSeconds === 0 && !isActive) {
      setShowVisualNotification(true);
    }
  }, [initialTimeSet, totalSeconds, isActive]);

  /**
   * Starts the countdown and, when appropriate, registers the start of
   * a Pomodoro work session in the cycle engine.
   */
  const handleStartTimer = useCallback((minutes: number) => {
    if (notificationSoundEnabled) {
      hapticFeedback();
    }
    startTimer(minutes);
    if (pomodoroEngine.currentPhase === 'idle' || pomodoroEngine.currentPhase === 'work') {
      pomodoroEngine.startWorkSession(minutes * 60);
    }
  }, [startTimer, pomodoroEngine, notificationSoundEnabled]);

  // -----------------------------------------------------------------
  // Stopwatch mode: count-up alternative to the Pomodoro countdown.
  // Lives alongside the countdown state above rather than replacing it,
  // so switching modes never disturbs the other mode's logic.
  // -----------------------------------------------------------------

  const stopwatch = useStopwatch();

  const [timerMode, setTimerModeState] = useState<TimerMode>('pomodoro');

  // A session (either mode) is "in progress" once it has time set/elapsed,
  // whether running or paused — switching modes mid-session is not allowed.
  const isPomodoroSessionActive = initialTimeSet > 0;
  const isStopwatchSessionActive = stopwatch.hasStarted;
  const canSwitchTimerMode = !isPomodoroSessionActive && !isStopwatchSessionActive;

  /** Switches between Pomodoro and Stopwatch modes; no-ops mid-session. */
  const handleSetTimerMode = useCallback((mode: TimerMode) => {
    if (!canSwitchTimerMode) return;
    setTimerModeState(mode);
  }, [canSwitchTimerMode]);

  /** Starts a fresh Stopwatch session (no Pomodoro cycle/phase involved). */
  const handleStartStopwatch = useCallback(() => {
    if (notificationSoundEnabled) {
      hapticFeedback();
    }
    stopwatch.startStopwatch();
  }, [stopwatch, notificationSoundEnabled]);

  /**
   * Ends the Stopwatch session: saves it to `pomodoro_sessions` (as a
   * 'work' session, same MIN_VALID_SECONDS validation as Pomodoro) if
   * long enough, then resets back to 0:00.
   */
  const handleCompleteStopwatch = useCallback(() => {
    const durationSeconds = stopwatch.elapsedSeconds;
    const startedAt = stopwatch.sessionStartedAt ?? new Date();
    if (notificationSoundEnabled) {
      hapticFeedback([50, 50, 100]);
    }
    playSound('notification-chime');
    pomodoroEngine.saveStopwatchSession(durationSeconds, startedAt, currentTaskText ?? null);
    stopwatch.stopStopwatch();
  }, [stopwatch, pomodoroEngine, currentTaskText, notificationSoundEnabled, playSound]);

  // Unified, mode-aware values so downstream UI (display, controls, PiP,
  // Focus Mode, keyboard shortcuts) doesn't need to know which mode is
  // active — it just renders whatever the current mode reports.
  const displayTimeParts = timerMode === 'stopwatch' ? stopwatch.timeParts : timeParts;
  const displayIsActive = timerMode === 'stopwatch' ? stopwatch.isActive : isActive;
  const displayTotalSeconds = timerMode === 'stopwatch' ? stopwatch.elapsedSeconds : totalSeconds;
  const displayInitialTimeSet = timerMode === 'stopwatch' ? (stopwatch.hasStarted ? 1 : 0) : initialTimeSet;
  const displayTogglePause = timerMode === 'stopwatch' ? stopwatch.togglePause : togglePause;
  const displayResetTimer = timerMode === 'stopwatch' ? stopwatch.resetStopwatch : resetTimer;

  // Show the active mode's time in the browser tab title.
  useEffect(() => {
    const { hours, minutes, seconds } = displayTimeParts;
    if (displayIsActive) {
      document.title =
        hours === '00'
          ? `${minutes}:${seconds} — PROD-UIBO`
          : `${hours}:${minutes}:${seconds} — PROD-UIBO`;
    } else if (displayTotalSeconds > 0) {
      document.title = `${minutes}:${seconds} ⏸ PROD-UIBO`;
    } else {
      document.title = 'PROD-UIBO';
    }

    return () => {
      document.title = 'PROD-UIBO';
    };
  }, [displayTimeParts, displayIsActive, displayTotalSeconds]);

  /**
   * CTA from the Focus tab: starts a standard 25-minute Pomodoro.
   */
  const handleFocusStartWork = useCallback(() => {
    pomodoroEngine.startWorkSession(POMODORO.DEFAULT_WORK_MINUTES * 60);
    startTimer(POMODORO.DEFAULT_WORK_MINUTES);
  }, [pomodoroEngine, startTimer]);

  /**
   * CTA from the Focus tab: starts the earned break (5 or 15 minutes).
   */
  const handleFocusStartBreak = useCallback(() => {
    const minutes = pomodoroEngine.currentPhase === 'long_break' ? POMODORO.DEFAULT_LONG_BREAK_MINUTES : POMODORO.DEFAULT_SHORT_BREAK_MINUTES;
    pomodoroEngine.startBreak();
    startTimer(minutes);
  }, [pomodoroEngine, startTimer]);

  /**
   * Starts the timer with a custom duration provided by the user.
   * Validates the input before starting.
   */
  const handleCustomStart = useCallback(() => {
    const hours = parseInt(customHoursInput, 10) || 0;
    const minutes = parseInt(customMinutesInput, 10) || 0;
    const totalMinutesToStart = (hours * 60) + minutes;

    if (totalMinutesToStart > 0) {
      handleStartTimer(totalMinutesToStart);
      setCustomHoursInput('');
      setCustomMinutesInput('');
    } else {
      setShowInvalidTimeModal(true);
    }
  }, [customHoursInput, customMinutesInput, handleStartTimer]);

  /**
   * Stops (Pomodoro) or completes-and-saves (Stopwatch) the active mode's
   * session, showing a confirmation dialog first if the user enabled it.
   */
  const handleStopWithConfirmation = useCallback(() => {
    if (confirmOnStop) {
      setShowStopConfirm(true);
    } else if (timerMode === 'stopwatch') {
      handleCompleteStopwatch();
    } else {
      stopTimer();
    }
  }, [confirmOnStop, stopTimer, timerMode, handleCompleteStopwatch]);

  /** Confirms the pending stop from the confirmation modal, then closes it. */
  const handleConfirmStop = useCallback(() => {
    if (timerMode === 'stopwatch') {
      handleCompleteStopwatch();
    } else {
      stopTimer();
    }
    setShowStopConfirm(false);
  }, [timerMode, handleCompleteStopwatch, stopTimer]);

  return {
    // Timer state (Pomodoro/countdown only — see display* for mode-aware values)
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    timerRestored,
    togglePause,
    resetTimer,
    stopTimer,
    // Stopwatch mode
    timerMode,
    canSwitchTimerMode,
    handleSetTimerMode,
    handleStartStopwatch,
    handleCompleteStopwatch,
    stopwatchRestored: stopwatch.stopwatchRestored,
    // Mode-aware display values: whichever of Pomodoro/Stopwatch is active
    displayTimeParts,
    displayIsActive,
    displayTotalSeconds,
    displayInitialTimeSet,
    displayTogglePause,
    displayResetTimer,
    // Custom input state
    customHoursInput,
    setCustomHoursInput,
    customMinutesInput,
    setCustomMinutesInput,
    // Pomodoro engine state
    pomodoroEngine,
    // Handlers
    handleStartTimer,
    handleCustomStart,
    handleStopWithConfirmation,
    handleConfirmStop,
    handleFocusStartWork,
    handleFocusStartBreak,
    // Modal/notification state
    showInvalidTimeModal,
    setShowInvalidTimeModal,
    showStopConfirm,
    setShowStopConfirm,
    showVisualNotification,
    setShowVisualNotification,
  };
}
