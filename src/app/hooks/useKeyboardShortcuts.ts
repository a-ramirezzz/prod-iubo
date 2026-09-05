// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useKeyboardShortcuts.ts
'use client';

import { useEffect } from 'react';
import { DEFAULT_SHORTCUTS, ShortcutId } from '@/app/lib/keyboardShortcuts';

/**
 * useKeyboardShortcuts registers global keyboard listeners for power-user
 * productivity. It is purely side-effect-based: no state, no return value.
 * Call it once from the main app page.
 *
 * The action → key mapping is customizable (see Settings > Keyboard Shortcuts)
 * and is passed in via `shortcuts`; any action missing from it falls back to
 * DEFAULT_SHORTCUTS. ESCAPE is not customizable — it always closes the
 * topmost open modal/panel (Focus Mode first, then settings, then tasks).
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
  activeTab: 'timer' | 'focus' | 'achievements';
  setActiveTab: (tab: 'timer' | 'focus' | 'achievements') => void;
  isMiniMode: boolean;
  setIsMiniMode: (mini: boolean) => void;
  // Focus mode
  isFocusModeActive: boolean;
  onToggleFocusMode: () => void;
  // Customizable action → key mapping. Defaults to DEFAULT_SHORTCUTS when omitted.
  shortcuts?: Record<string, string>;
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
  shortcuts = DEFAULT_SHORTCUTS,
}: UseKeyboardShortcutsParams) {
  useEffect(() => {
    const keyFor = (action: ShortcutId) => (shortcuts[action] ?? DEFAULT_SHORTCUTS[action]).toLowerCase();

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

      // ESCAPE — Close the topmost open modal/panel (Focus Mode first). Not customizable.
      if (key === 'escape') {
        if (isFocusModeActive) {
          onToggleFocusMode();
        } else if (isSettingsPanelOpen) {
          setIsSettingsPanelOpen(false);
        } else if (isTaskModalOpen) {
          setIsTaskModalOpen(false);
        }
        return;
      }

      // Toggle play/pause.
      if (key === keyFor('startPauseTimer')) {
        if (isTyping) return;
        const timerStarted = initialTimeSet > 0 && totalSeconds > 0;
        if (timerStarted || isActive) {
          e.preventDefault(); // Prevent page scroll only when handled.
          togglePause();
        }
        return;
      }

      // Reset the timer.
      if (key === keyFor('resetTimer')) {
        if (isTyping || anyModalOpen) return;
        if (initialTimeSet > 0) {
          resetTimer();
        }
        return;
      }

      // Stop the timer with confirmation.
      if (key === keyFor('stopTimer')) {
        if (isTyping || anyModalOpen) return;
        if (isActive) {
          handleStopWithConfirmation();
        }
        return;
      }

      // Toggle mini/widget mode.
      if (key === keyFor('toggleWidgetMode')) {
        if (isTyping || anyModalOpen) return;
        setIsMiniMode(!isMiniMode);
        return;
      }

      // Switch to the Timer tab.
      if (key === keyFor('switchTimerTab')) {
        if (isTyping || anyModalOpen || isMiniMode) return;
        setActiveTab('timer');
        return;
      }

      // Switch to the Focus tab.
      if (key === keyFor('switchFocusTab')) {
        if (isTyping || anyModalOpen || isMiniMode) return;
        setActiveTab('focus');
        return;
      }

      // Switch to the Achievements tab.
      if (key === keyFor('switchAchievementsTab')) {
        if (isTyping || anyModalOpen || isMiniMode) return;
        setActiveTab('achievements');
        return;
      }

      // Toggle Focus Mode (distraction-free overlay).
      if (key === keyFor('toggleFocusMode')) {
        if (isTyping || anyModalOpen) return;
        e.preventDefault();
        onToggleFocusMode();
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
    shortcuts,
  ]);
}
