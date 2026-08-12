/**
 * =================================================================
 * src/app/hooks/useAchievements.ts
 * -----------------------------------------------------------------
 * Evaluates the user's progress (sessions, streak, tasks) against the
 * static achievement definitions in `lib/achievements.ts`, persists
 * newly unlocked ones to `user_achievements`, and exposes a one-at-a-
 * time notification queue for the toast UI.
 *
 * Achievement definitions live in code; the DB only stores which ones
 * a user has unlocked (append-only — no un-unlocking).
 * =================================================================
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { ACHIEVEMENTS, type AchievementDefinition } from '@/app/lib/achievements';
import { hapticFeedback } from '@/app/lib/haptic';

interface Progress {
  totalSessions: number;
  currentStreak: number;
  totalTasksCompleted: number;
}

interface UseAchievementsReturn {
  unlockedIds: Set<string>;
  allAchievements: AchievementDefinition[];
  newlyUnlocked: AchievementDefinition | null;
  dismissNotification: () => void;
  loading: boolean;
  progress: Progress;
}

function evaluate(progress: Progress, unlockedIds: Set<string>): AchievementDefinition[] {
  return ACHIEVEMENTS.filter((a) => {
    if (unlockedIds.has(a.id)) return false;
    switch (a.category) {
      case 'sessions':
        return progress.totalSessions >= a.threshold;
      case 'streak':
        return progress.currentStreak >= a.threshold;
      case 'tasks':
        return progress.totalTasksCompleted >= a.threshold;
    }
  });
}

export function useAchievements({
  userId,
  currentStreak,
  totalPomodorosToday,
  hapticsEnabled = false,
}: {
  userId: string | null;
  currentStreak: number;
  totalPomodorosToday: number;
  /** Whether to vibrate when a new achievement unlocks (mirrors notification_sound_enabled). */
  hapticsEnabled?: boolean;
}): UseAchievementsReturn {
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  // Queue of achievements unlocked this session, shown one at a time.
  const [queue, setQueue] = useState<AchievementDefinition[]>([]);

  // IDs currently being inserted, so a re-render mid-insert doesn't fire a duplicate.
  const pendingRef = useRef<Set<string>>(new Set());

  // Fetch which achievements this user already has unlocked.
  useEffect(() => {
    if (!userId) {
      setUnlockedIds(new Set());
      setLoading(false);
      return;
    }
    let cancelled = false;

    (async () => {
      setLoading(true);
      const { data, error } = await createClient()
        .from('user_achievements')
        .select('achievement_id, unlocked_at')
        .eq('user_id', userId);

      if (cancelled) return;
      if (!error && data) {
        setUnlockedIds(new Set(data.map((row) => row.achievement_id as string)));
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Fetch progress counts. Re-runs on userId change and whenever a new
  // pomodoro completes today (totalPomodorosToday), same refresh pattern
  // as usePomodoroStats.
  useEffect(() => {
    if (!userId) {
      setTotalSessions(0);
      setTotalTasksCompleted(0);
      return;
    }
    let cancelled = false;

    (async () => {
      const supabase = createClient();
      const [sessionsRes, tasksRes] = await Promise.all([
        supabase
          .from('pomodoro_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true),
        supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('completed', true),
      ]);

      if (cancelled) return;
      if (sessionsRes.count !== null) setTotalSessions(sessionsRes.count);
      if (tasksRes.count !== null) setTotalTasksCompleted(tasksRes.count);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, totalPomodorosToday]);

  // Evaluate progress against thresholds and unlock any newly eligible achievements.
  useEffect(() => {
    if (!userId || loading) return;

    const eligible = evaluate(
      { totalSessions, currentStreak, totalTasksCompleted },
      unlockedIds
    ).filter((a) => !pendingRef.current.has(a.id));

    if (eligible.length === 0) return;

    eligible.forEach((a) => pendingRef.current.add(a.id));

    (async () => {
      const supabase = createClient();
      const unlockedNow: AchievementDefinition[] = [];

      for (const achievement of eligible) {
        const { error } = await supabase.from('user_achievements').insert({
          user_id: userId,
          achievement_id: achievement.id,
          unlocked_at: new Date().toISOString(),
        });
        pendingRef.current.delete(achievement.id);
        if (!error) unlockedNow.push(achievement);
      }

      if (unlockedNow.length === 0) return;

      if (hapticsEnabled) {
        hapticFeedback([50, 100, 50, 100]);
      }

      setUnlockedIds((prev) => {
        const next = new Set(prev);
        unlockedNow.forEach((a) => next.add(a.id));
        return next;
      });
      setQueue((prev) => [...prev, ...unlockedNow]);
    })();
  }, [userId, loading, totalSessions, currentStreak, totalTasksCompleted, unlockedIds, hapticsEnabled]);

  const dismissNotification = useCallback(() => {
    setQueue((prev) => prev.slice(1));
  }, []);

  return {
    unlockedIds,
    allAchievements: ACHIEVEMENTS,
    newlyUnlocked: queue[0] ?? null,
    dismissNotification,
    loading,
    progress: { totalSessions, currentStreak, totalTasksCompleted },
  };
}
