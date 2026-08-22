// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/ContextualTooltip/ContextualHintsManager.tsx
'use client';

import { useEffect, useState } from 'react';
import { useContextualHints } from '@/app/hooks/useContextualHints';
import ContextualTooltip from './ContextualTooltip';

const FIRST_SESSION_DONE_KEY = 'contextual_hints_first_session_done';

type HintId = 'firstSession' | 'checkStats' | 'customizeSettings' | 'manageTasks';

interface ContextualHintsManagerProps {
  /** Whether the timer is currently running (a session is in progress). */
  isActive: boolean;
  /** Non-zero once a duration has been picked for the current/last session. */
  initialTimeSet: number;
  /** Pomodoros completed today — used to detect the very first completed session. */
  totalPomodorosToday: number;
  /** Currently selected app tab; switching to 'focus' counts as "checking stats". */
  activeTab: 'timer' | 'focus' | 'achievements';
  /** Whether the Settings panel is open right now. */
  isSettingsPanelOpen: boolean;
  /** Current session task list. */
  taskCount: number;
  tasksLoading: boolean;
}

/**
 * Orchestrates the four contextual onboarding tooltips: computes which single
 * trigger condition is active (if any) and renders at most one tooltip at a
 * time, by priority (firstSession > checkStats > customizeSettings >
 * manageTasks). Complements OnboardingTour rather than replacing it — uses a
 * separate localStorage key so the two dismissal systems never collide.
 */
export default function ContextualHintsManager({
  isActive,
  initialTimeSet,
  totalPomodorosToday,
  activeTab,
  isSettingsPanelOpen,
  taskCount,
  tasksLoading,
}: ContextualHintsManagerProps) {
  const { shouldShow, dismiss } = useContextualHints();

  const [firstSessionDone, setFirstSessionDone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(FIRST_SESSION_DONE_KEY) === '1';
  });

  // Flip the flag permanently the first time a pomodoro is completed.
  useEffect(() => {
    if (totalPomodorosToday >= 1 && !firstSessionDone) {
      setFirstSessionDone(true);
      try {
        window.localStorage.setItem(FIRST_SESSION_DONE_KEY, '1');
      } catch {
        // Storage unavailable — the flag just won't persist across reloads.
      }
    }
  }, [totalPomodorosToday, firstSessionDone]);

  // Starting a session satisfies tooltip 1 even before it completes.
  useEffect(() => {
    if (isActive) dismiss('firstSession');
  }, [isActive, dismiss]);

  // Switching to the Focus tab is how stats are checked in this app.
  useEffect(() => {
    if (activeTab === 'focus') dismiss('checkStats');
  }, [activeTab, dismiss]);

  // Adding the first task satisfies tooltip 4.
  useEffect(() => {
    if (taskCount > 0) dismiss('manageTasks');
  }, [taskCount, dismiss]);

  const candidates: { id: HintId; active: boolean; targetId: string; position: 'top' | 'bottom' | 'left' | 'right' }[] = [
    {
      id: 'firstSession',
      active: !firstSessionDone && !isActive && initialTimeSet === 0,
      targetId: 'contextual-hint-start',
      position: 'bottom',
    },
    {
      id: 'checkStats',
      active: firstSessionDone,
      targetId: 'contextual-hint-stats',
      position: 'bottom',
    },
    {
      id: 'customizeSettings',
      active: isSettingsPanelOpen,
      targetId: 'contextual-hint-settings',
      position: 'left',
    },
    {
      id: 'manageTasks',
      active: !tasksLoading && taskCount === 0,
      targetId: 'contextual-hint-tasks',
      position: 'top',
    },
  ];

  const active = candidates.find(c => c.active && shouldShow(c.id));
  if (!active) return null;

  return (
    <ContextualTooltip
      key={active.id}
      id={active.id}
      targetId={active.targetId}
      content={`onboarding.contextual.${active.id}`}
      position={active.position}
      onDismiss={() => dismiss(active.id)}
      autoDismissMs={active.id === 'customizeSettings' ? 5000 : undefined}
    />
  );
}
