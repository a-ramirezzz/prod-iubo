// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useProductivityFeature.ts
'use client';

import { useState } from 'react';
import { usePomodoroStats, type PomodoroStats, type StatsPeriod } from '@/hooks/usePomodoroStats';

export interface UseProductivityFeatureParams {
  userId: string | null;
  /** Bumps the stats refetch whenever a new pomodoro completes today. */
  totalPomodorosToday: number;
  initialStatsPeriod?: StatsPeriod;
}

/** 365-day productivity stats plus the client-side period filter that scopes them. */
export interface UseProductivityFeatureReturn extends PomodoroStats {
  statsPeriod: StatsPeriod;
  setStatsPeriod: (period: StatsPeriod) => void;
}

/**
 * useProductivityFeature is the single entry point for the Productivity/Stats
 * feature. It owns the selected stats period (client-side filter over the
 * hook's already-fetched 365-day session list) and wraps usePomodoroStats,
 * so page.tsx mounts one hook for all stats data shown in the Focus tab and
 * the Settings panel.
 */
export function useProductivityFeature({
  userId,
  totalPomodorosToday,
  initialStatsPeriod = '30d',
}: UseProductivityFeatureParams): UseProductivityFeatureReturn {
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>(initialStatsPeriod);

  const stats = usePomodoroStats(userId, totalPomodorosToday, statsPeriod);

  return {
    ...stats,
    statsPeriod,
    setStatsPeriod,
  };
}
