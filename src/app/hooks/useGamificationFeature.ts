// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// hooks/useGamificationFeature.ts
'use client';

import { useAchievements, type UseAchievementsReturn } from '@/hooks/useAchievements';

export interface UseGamificationFeatureParams {
  userId: string | null;
  currentStreak: number;
  totalPomodorosToday: number;
  /** Whether to vibrate when a new achievement unlocks. */
  hapticsEnabled?: boolean;
}

/** Achievements catalog, unlock progress, and the one-at-a-time unlock notification queue. */
export type UseGamificationFeatureReturn = UseAchievementsReturn;

/**
 * useGamificationFeature is the single entry point for the Gamification
 * feature. It wraps useAchievements, which evaluates the user's progress
 * against achievement thresholds and surfaces newly unlocked ones.
 */
export function useGamificationFeature(
  params: UseGamificationFeatureParams
): UseGamificationFeatureReturn {
  return useAchievements(params);
}
