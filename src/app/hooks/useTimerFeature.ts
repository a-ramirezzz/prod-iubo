// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useTimerFeature.ts
'use client';

import { useTimerController, type UseTimerControllerParams } from '@/hooks/useTimerController';

export type UseTimerFeatureParams = UseTimerControllerParams;

/** Everything page.tsx needs from the Timer feature: countdown/stopwatch state,
 *  Pomodoro cycle info, mode switching, custom-input state, and modal/notification flags. */
export type UseTimerFeatureReturn = ReturnType<typeof useTimerController>;

/**
 * useTimerFeature is the single entry point for the Timer feature. It wraps
 * useTimerController — which already orchestrates useTimer, usePomodoroEngine,
 * useStopwatch, useTimerAlert and useAudio — so page.tsx mounts one hook for
 * all timer/Pomodoro/stopwatch state and controls instead of wiring each
 * piece separately.
 */
export function useTimerFeature(params: UseTimerFeatureParams): UseTimerFeatureReturn {
  return useTimerController(params);
}
