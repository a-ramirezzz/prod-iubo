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

export interface SessionRow {
  completed_at: string;
  task_text: string | null;
  duration_minutes: number;
}

export interface PomodoroStats {
  todaySessions: SessionRow[];
  weekTotal: number;
  weeklyData: { label: string; count: number; isToday: boolean }[];
  streak: number;
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

        const { data, error } = await createClient()
          .from('pomodoro_sessions')
          .select('completed_at, task_text, duration_minutes')
          .eq('user_id', userId)
          .eq('session_type', 'work')
          .eq('completed', true)
          .gte('completed_at', monthAgo.toISOString())
          .order('completed_at', { ascending: false });

        if (cancelled) return;
        if (error || !data) {
          setLoadError(true);
          return;
        }

        const rows = data as SessionRow[];
        const now = new Date();

        const todayMidnight = new Date();
        todayMidnight.setHours(0, 0, 0, 0);
        setTodaySessions(
          rows.filter((r) => new Date(r.completed_at) >= todayMidnight)
        );

        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        setWeekTotal(
          rows.filter((r) => new Date(r.completed_at) >= weekAgo).length
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

  return { todaySessions, weekTotal, weeklyData, streak, loading, loadError };
}
