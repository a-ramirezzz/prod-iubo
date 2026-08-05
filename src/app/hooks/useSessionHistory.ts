// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * =================================================================
 * src/app/hooks/useSessionHistory.ts
 * -----------------------------------------------------------------
 * Paginated, filterable history of completed `pomodoro_sessions` rows
 * for the Session History sub-section of the Focus tab. Unlike
 * usePomodoroStats (last 30 days, no pagination), this hook queries
 * a page at a time and supports a configurable date range.
 * =================================================================
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import type { SessionRow } from '@/app/types/session';

export type DateFilter = '7d' | '30d' | '90d' | 'all';

const DATE_FILTER_DAYS: Record<Exclude<DateFilter, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

interface UseSessionHistoryOptions {
  userId: string | null;
  pageSize?: number;
}

interface UseSessionHistoryReturn {
  sessions: SessionRow[];
  isLoading: boolean;
  error: string | null;
  dateFilter: DateFilter;
  setDateFilter: (filter: DateFilter) => void;
  page: number;
  totalPages: number;
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export function useSessionHistory({
  userId,
  pageSize = 10,
}: UseSessionHistoryOptions): UseSessionHistoryReturn {
  const [dateFilter, setDateFilterState] = useState<DateFilter>('30d');
  const [page, setPage] = useState(0);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let query = createClient()
          .from('pomodoro_sessions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .eq('completed', true)
          .order('completed_at', { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (dateFilter !== 'all') {
          const since = new Date();
          since.setUTCDate(since.getUTCDate() - DATE_FILTER_DAYS[dateFilter]);
          since.setUTCHours(0, 0, 0, 0);
          query = query.gte('completed_at', since.toISOString());
        }

        const { data, error: queryError, count } = await query;
        if (queryError) throw queryError;
        if (cancelled) return;

        setSessions((data ?? []) as SessionRow[]);
        setTotalCount(count ?? 0);
      } catch {
        if (!cancelled) {
          setError('Failed to load session history');
          setSessions([]);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [userId, dateFilter, page, pageSize]);

  const setDateFilter = (filter: DateFilter) => {
    setDateFilterState(filter);
    setPage(0);
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  const goToPage = (target: number) => {
    setPage(Math.min(Math.max(target, 0), totalPages - 1));
  };
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);

  return {
    sessions,
    isLoading,
    error,
    dateFilter,
    setDateFilter,
    page,
    totalPages,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: page < totalPages - 1,
    hasPrevPage: page > 0,
  };
}
