/**
 * =================================================================
 * src/app/hooks/usePomodoroStats.ts
 * -----------------------------------------------------------------
 * Shared hook that fetches the last 30 days of `pomodoro_sessions`
 * and derives productivity statistics (today's log, week total,
 * streak and the 7-day chart data). Used by both FocusSection and
 * the SettingsPanel (via page.tsx) so both display real stats.
 * =================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { fetchWithOfflineFallback } from '@/app/lib/offlineSync';
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
  loading: boolean;
  loadError: boolean;
}

export function usePomodoroStats(
  userId: string | null,
  totalPomodorosToday: number
): PomodoroStats {
  const [todaySessions, setTodaySessions] = useState<SessionRow[]>([]);
  const [weekTotal, setWeekTotal] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weeklyData, setWeeklyData] = useState<
    { label: string; count: number; isToday: boolean }[]
  >([]);
  const [taskBreakdown, setTaskBreakdown] = useState<TaskBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  /**
   * Fetch today's log and the last 30 days of sessions in a single
   * query on mount; derive week total, daily average and streak.
   */
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetchStats = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const monthAgo = new Date();
        monthAgo.setUTCDate(monthAgo.getUTCDate() - 30);
        monthAgo.setUTCHours(0, 0, 0, 0);

        const result = await fetchWithOfflineFallback<SessionRow[]>({
          fetchFn: async () => {
            const { data, error } = await createClient()
              .from('pomodoro_sessions')
              .select('completed_at, task_text, duration_minutes')
              .eq('user_id', userId)
              .eq('session_type', 'work')
              .eq('completed', true)
              .gte('completed_at', monthAgo.toISOString())
              .order('completed_at', { ascending: false });
            if (error) throw error;
            return (data ?? []) as SessionRow[];
          },
          cacheFn: (rows) => cacheSessions(userId, rows),
          getCacheFn: () => getCachedSessions(userId),
          operationName: 'fetchPomodoroStats',
        });

        if (cancelled) return;
        if (result.data === null) {
          setLoadError(true);
          return;
        }

        const rows = result.data;
        const now = new Date();

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        setTodaySessions(
          rows.filter((r) => new Date(r.completed_at) >= todayMidnight)
        );

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const weekRows = rows.filter(
          (r) => new Date(r.completed_at) >= weekAgo
        );
        setWeekTotal(weekRows.length);

        // Task breakdown (last 7 days): top 5 tasks by pomodoro count.
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
        setTaskBreakdown(
          [...byTask.values()].sort((a, b) => b.count - a.count).slice(0, 5)
        );

        // Streak: consecutive days (backwards from today) with >= 1 pomodoro.
        const localDateStr = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const daysWithSessions = new Set(
          rows.map((r) => localDateStr(new Date(r.completed_at)))
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
        setStreak(streakCount);

        // Last 7 days: daily completed pomodoro counts (oldest → today).
        const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        const countByDay = new Map<string, number>();
        rows.forEach((r) => {
          const key = localDateStr(new Date(r.completed_at));
          countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
        });
        const todayKey = localDateStr(todayMidnight);
        const weekly = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date(todayMidnight.getTime() - i * 24 * 60 * 60 * 1000);
          const key = localDateStr(day);
          weekly.push({
            label: dayNames[day.getDay()],
            count: countByDay.get(key) ?? 0,
            isToday: key === todayKey,
          });
        }
        setWeeklyData(weekly);
      } catch {
        if (!cancelled) setLoadError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => {
      cancelled = true;
    };
  }, [userId, totalPomodorosToday]);

  return {
    todaySessions,
    weekTotal,
    weeklyData,
    streak,
    taskBreakdown,
    loading,
    loadError,
  };
}
