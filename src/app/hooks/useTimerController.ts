// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useTimerController.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

import { useTimer } from '@/hooks/useTimer';
import { useTimerAlert } from '@/hooks/useTimerAlert';
import { usePomodoroEngine } from '@/hooks/usePomodoroEngine';
import { playNotificationSound } from '@/app/lib/notificationSound';

interface UseTimerControllerParams {
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
    // Skip entirely (and never create the AudioContext) when disabled.
    if (notificationSoundEnabled) {
      playNotificationSound(volume);
    }
    // Advance the Pomodoro cycle when the countdown finishes naturally.
    if (pomodoroEngine.currentPhase === 'work') {
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

  // Show the remaining timer time in the browser tab title.
  useEffect(() => {
    const { hours, minutes, seconds } = timeParts;
    if (isActive) {
      document.title =
        hours === '00'
          ? `${minutes}:${seconds} — PROD-UIBO`
          : `${hours}:${minutes}:${seconds} — PROD-UIBO`;
    } else if (totalSeconds > 0) {
      document.title = `${minutes}:${seconds} ⏸ PROD-UIBO`;
    } else {
      document.title = 'PROD-UIBO';
    }

    return () => {
      document.title = 'PROD-UIBO';
    };
  }, [timeParts, isActive, totalSeconds]);

  /**
   * Starts the countdown and, when appropriate, registers the start of
   * a Pomodoro work session in the cycle engine.
   */
  const handleStartTimer = useCallback((minutes: number) => {
    startTimer(minutes);
    if (pomodoroEngine.currentPhase === 'idle' || pomodoroEngine.currentPhase === 'work') {
      pomodoroEngine.startWorkSession(minutes * 60);
    }
  }, [startTimer, pomodoroEngine]);

  /**
   * CTA from the Focus tab: starts a standard 25-minute Pomodoro.
   */
  const handleFocusStartWork = useCallback(() => {
    pomodoroEngine.startWorkSession(25 * 60);
    startTimer(25);
  }, [pomodoroEngine, startTimer]);

  /**
   * CTA from the Focus tab: starts the earned break (5 or 15 minutes).
   */
  const handleFocusStartBreak = useCallback(() => {
    const minutes = pomodoroEngine.currentPhase === 'long_break' ? 15 : 5;
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
   * Stops and resets the timer, showing a confirmation dialog if the
   * user has enabled this setting.
   */
  const handleStopWithConfirmation = useCallback(() => {
    if (confirmOnStop) {
      setShowStopConfirm(true);
    } else {
      stopTimer();
    }
  }, [confirmOnStop, stopTimer]);

  return {
    // Timer state
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    timerRestored,
    togglePause,
    resetTimer,
    stopTimer,
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
