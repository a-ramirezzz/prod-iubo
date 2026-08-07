// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useKeyboardShortcuts.ts
'use client';

import { useEffect } from 'react';

/**
 * useKeyboardShortcuts registers global keyboard listeners for power-user
 * productivity. It is purely side-effect-based: no state, no return value.
 * Call it once from the main app page.
 *
 * Shortcuts:
 *   SPACE — Toggle play/pause (only when the timer has been started or is active).
 *   ESC   — Close the topmost open modal/panel (Focus Mode first, then settings, then tasks).
 *   R     — Reset the timer (only when started, no modal open, not typing).
 *   S     — Stop the timer with confirmation (only when active, no modal open, not typing).
 *   M     — Toggle mini mode (no modal open, not typing).
 *   1     — Switch to the Timer tab (not in mini mode, no modal open, not typing).
 *   2     — Switch to the Focus tab (not in mini mode, no modal open, not typing).
 *   F     — Toggle Focus Mode (distraction-free overlay), not typing.
 *
 * All shortcuts are ignored while the user is typing in an <input>, <textarea>,
 * <select>, or a contentEditable element.
 */

interface UseKeyboardShortcutsParams {
  // Timer
  isActive: boolean;
  totalSeconds: number;
  initialTimeSet: number;
  togglePause: () => void;
  resetTimer: () => void;
  handleStopWithConfirmation: () => void;
  // UI state
  isSettingsPanelOpen: boolean;
  setIsSettingsPanelOpen: (open: boolean) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  activeTab: 'timer' | 'focus';
  setActiveTab: (tab: 'timer' | 'focus') => void;
  isMiniMode: boolean;
  setIsMiniMode: (mini: boolean) => void;
  // Focus mode
  isFocusModeActive: boolean;
  onToggleFocusMode: () => void;
}

export function useKeyboardShortcuts({
  isActive,
  totalSeconds,
  initialTimeSet,
  togglePause,
  resetTimer,
  handleStopWithConfirmation,
  isSettingsPanelOpen,
  setIsSettingsPanelOpen,
  isTaskModalOpen,
  setIsTaskModalOpen,
  activeTab,
  setActiveTab,
  isMiniMode,
  setIsMiniMode,
  isFocusModeActive,
  onToggleFocusMode,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Guard: ignore shortcuts while the user is typing in a form field.
      const target = document.activeElement as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable === true;

      const anyModalOpen = isSettingsPanelOpen || isTaskModalOpen;
      const key = e.key.toLowerCase();

      switch (key) {
        // SPACE — Toggle play/pause.
        case ' ': {
          if (isTyping) return;
          const timerStarted = initialTimeSet > 0 && totalSeconds > 0;
          if (timerStarted || isActive) {
            e.preventDefault(); // Prevent page scroll only when handled.
            togglePause();
          }
          return;
        }

        // ESCAPE — Close the topmost open modal/panel (Focus Mode first).
        case 'escape': {
          if (isFocusModeActive) {
            onToggleFocusMode();
          } else if (isSettingsPanelOpen) {
            setIsSettingsPanelOpen(false);
          } else if (isTaskModalOpen) {
            setIsTaskModalOpen(false);
          }
          return;
        }

        // R — Reset the timer.
        case 'r': {
          if (isTyping || anyModalOpen) return;
          if (initialTimeSet > 0) {
            resetTimer();
          }
          return;
        }

        // S — Stop the timer with confirmation.
        case 's': {
          if (isTyping || anyModalOpen) return;
          if (isActive) {
            handleStopWithConfirmation();
          }
          return;
        }

        // M — Toggle mini mode.
        case 'm': {
          if (isTyping || anyModalOpen) return;
          setIsMiniMode(!isMiniMode);
          return;
        }

        // 1 — Switch to the Timer tab.
        case '1': {
          if (isTyping || anyModalOpen || isMiniMode) return;
          setActiveTab('timer');
          return;
        }

        // 2 — Switch to the Focus tab.
        case '2': {
          if (isTyping || anyModalOpen || isMiniMode) return;
          setActiveTab('focus');
          return;
        }

        // F — Toggle Focus Mode (distraction-free overlay).
        case 'f': {
          if (isTyping || anyModalOpen) return;
          e.preventDefault();
          onToggleFocusMode();
          return;
        }

        default:
          return;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    isActive,
    totalSeconds,
    initialTimeSet,
    togglePause,
    resetTimer,
    handleStopWithConfirmation,
    isSettingsPanelOpen,
    setIsSettingsPanelOpen,
    isTaskModalOpen,
    setIsTaskModalOpen,
    activeTab,
    setActiveTab,
    isMiniMode,
    setIsMiniMode,
    isFocusModeActive,
    onToggleFocusMode,
  ]);
}
