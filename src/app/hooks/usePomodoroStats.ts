/**
 * =================================================================
 * src/app/hooks/usePomodoroStats.ts
 * -----------------------------------------------------------------
 * Shared hook that fetches the last 365 days of `pomodoro_sessions`
 * and derives productivity statistics (today's log, week total,
 * streak, the 7-day chart data and the yearly activity heatmap).
 * Used by both FocusSection and the SettingsPanel (via page.tsx) so
 * both display real stats.
 *
 * Stale-while-revalidate: cached sessions (IndexedDB) are shown
 * immediately when present, while a fresh Supabase fetch runs in the
 * background and silently replaces them on success. `loading` only
 * means "nothing to show yet" (first-time user); `isRevalidating`
 * means "showing cached data while a background refresh is in
 * flight".
 * =================================================================
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { cacheSessions, getCachedSessions } from '@/app/lib/offlineDb';
import type { SessionRow as FullSessionRow } from '@/app/types/session';

export type SessionRow = Pick<
  FullSessionRow,
  'completed_at' | 'task_text' | 'duration_minutes'
>;

export interface TaskBreakdown {
  taskName: string;
  count: number;
  totalMinutes: number;
}

export interface PomodoroStats {
  todaySessions: SessionRow[];
  weekTotal: number;
  weeklyData: { label: string; count: number; isToday: boolean }[];
  streak: number;
  taskBreakdown: TaskBreakdown[];
  dailyCounts: Record<string, number>;
  bestDayOfWeek: { day: number; count: number };
  peakHour: { hour: number; count: number };
  longestStreak: number;
  averageDaily: number;
  totalSessions: number;
  totalMinutes: number;
  loading: boolean;
  isRevalidating: boolean;
  loadError: boolean;
}

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** Local-time `YYYY-MM-DD` key, also used by ActivityHeatmap to align on the same day boundaries. */
export const localDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function usePomodoroStats(
  userId: string | null,
  totalPomodorosToday: number
): PomodoroStats {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRevalidating, setIsRevalidating] = useState(false);
  const [loadError, setLoadError] = useState(false);

  /**
   * Show cached sessions instantly (if any), then refresh from Supabase
   * in the background. On mount and whenever userId / totalPomodorosToday
   * change.
   */
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    const loadStats = async () => {
      setLoadError(false);

      const cached = await getCachedSessions(userId);
      if (cancelled) return;

      const hasCache = cached !== null && cached.length > 0;
      if (hasCache) {
        setSessions(cached);
        setLoading(false);
        setIsRevalidating(true);
      } else {
        setLoading(true);
        setIsRevalidating(false);
      }

      try {
        const yearAgo = new Date();
        yearAgo.setUTCDate(yearAgo.getUTCDate() - 365);
        yearAgo.setUTCHours(0, 0, 0, 0);

        const { data, error } = await createClient()
          .from('pomodoro_sessions')
          .select('completed_at, task_text, duration_minutes')
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('completed_at', yearAgo.toISOString())
          .order('completed_at', { ascending: false });

        if (cancelled) return;

        if (error || !data) {
          if (!hasCache) setLoadError(true);
          return;
        }

        const rows = data as SessionRow[];
        await cacheSessions(userId, rows);
        if (cancelled) return;
        setSessions(rows);
      } catch {
        if (!cancelled && !hasCache) setLoadError(true);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setIsRevalidating(false);
        }
      }
    };

    loadStats();
    return () => {
      cancelled = true;
    };
  }, [userId, totalPomodorosToday]);

  const todaySessions = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    return sessions.filter((r) => new Date(r.completed_at) >= todayMidnight);
  }, [sessions]);

  const weekRows = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return sessions.filter((r) => new Date(r.completed_at) >= weekAgo);
  }, [sessions]);

  const weekTotal = weekRows.length;

  // Task breakdown (last 7 days): top 5 tasks by pomodoro count.
  const taskBreakdown = useMemo(() => {
    const byTask = new Map<string, TaskBreakdown>();
    weekRows.forEach((r) => {
      const taskName = r.task_text ?? 'Sin tarea';
      const entry = byTask.get(taskName);
      if (entry) {
        entry.count += 1;
        entry.totalMinutes += r.duration_minutes;
      } else {
        byTask.set(taskName, {
          taskName,
          count: 1,
          totalMinutes: r.duration_minutes,
        });
      }
    });
    return [...byTask.values()].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [weekRows]);

  // Streak: consecutive days (backwards from today) with >= 1 pomodoro.
  const streak = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const daysWithSessions = new Set(
      sessions.map((r) => localDateStr(new Date(r.completed_at)))
    );
    let streakCount = 0;
    for (let i = 0; i < 30; i++) {
      const day = new Date(todayMidnight.getTime() - i * 24 * 60 * 60 * 1000);
      if (daysWithSessions.has(localDateStr(day))) {
        streakCount++;
      } else if (i === 0) {
        continue; // Today without sessions yet doesn't break the streak.
      } else {
        break;
      }
    }
    return streakCount;
  }, [sessions]);

  // Last 7 days: daily completed pomodoro counts (oldest → today).
  const weeklyData = useMemo(() => {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);
    const countByDay = new Map<string, number>();
    sessions.forEach((r) => {
      const key = localDateStr(new Date(r.completed_at));
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    });
    const todayKey = localDateStr(todayMidnight);
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(todayMidnight.getTime() - i * 24 * 60 * 60 * 1000);
      const key = localDateStr(day);
      weekly.push({
        label: DAY_NAMES[day.getDay()],
        count: countByDay.get(key) ?? 0,
        isToday: key === todayKey,
      });
    }
    return weekly;
  }, [sessions]);

  // Full-range daily counts (up to 365 days), keyed by local YYYY-MM-DD —
  // feeds the ActivityHeatmap.
  const dailyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    sessions.forEach((r) => {
      const key = localDateStr(new Date(r.completed_at));
      counts[key] = (counts[key] ?? 0) + 1;
    });
    return counts;
  }, [sessions]);

  // Historical best day-of-week (0=Sun..6=Sat, matches Date#getDay()), across the full fetch window.
  const bestDayOfWeek = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    sessions.forEach((r) => {
      counts[new Date(r.completed_at).getDay()] += 1;
    });
    let bestDay = 0;
    for (let d = 1; d < 7; d++) {
      if (counts[d] > counts[bestDay]) bestDay = d;
    }
    return { day: bestDay, count: counts[bestDay] };
  }, [sessions]);

  // Hour of day (0-23) with the most completed sessions historically.
  const peakHour = useMemo(() => {
    const counts = new Array(24).fill(0);
    sessions.forEach((r) => {
      counts[new Date(r.completed_at).getHours()] += 1;
    });
    let bestHour = 0;
    for (let h = 1; h < 24; h++) {
      if (counts[h] > counts[bestHour]) bestHour = h;
    }
    return { hour: bestHour, count: counts[bestHour] };
  }, [sessions]);

  // Longest-ever run of consecutive days with >= 1 session (not just the current streak).
  const longestStreak = useMemo(() => {
    if (sessions.length === 0) return 0;
    const uniqueDays = [
      ...new Set(sessions.map((r) => localDateStr(new Date(r.completed_at)))),
    ].sort();
    let longest = 1;
    let current = 1;
    for (let i = 1; i < uniqueDays.length; i++) {
      // Date-only strings parse as UTC midnight, so this diff is DST-safe.
      const diffDays =
        (new Date(uniqueDays[i]).getTime() - new Date(uniqueDays[i - 1]).getTime()) /
        (24 * 60 * 60 * 1000);
      current = diffDays === 1 ? current + 1 : 1;
      longest = Math.max(longest, current);
    }
    return longest;
  }, [sessions]);

  // Average sessions per day that had at least one session (not per calendar day).
  const averageDaily = useMemo(() => {
    const uniqueDayCount = new Set(
      sessions.map((r) => localDateStr(new Date(r.completed_at)))
    ).size;
    if (uniqueDayCount === 0) return 0;
    return Math.round((sessions.length / uniqueDayCount) * 10) / 10;
  }, [sessions]);

  const totalSessions = useMemo(() => sessions.length, [sessions]);

  const totalMinutes = useMemo(
    () => sessions.reduce((sum, r) => sum + r.duration_minutes, 0),
    [sessions]
  );

  return {
    todaySessions,
    weekTotal,
    weeklyData,
    streak,
    taskBreakdown,
    dailyCounts,
    bestDayOfWeek,
    peakHour,
    longestStreak,
    averageDaily,
    totalSessions,
    totalMinutes,
    loading,
    isRevalidating,
    loadError,
  };
}
