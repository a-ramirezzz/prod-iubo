/**
 * =================================================================
 * src/app/hooks/useDataExport.ts
 * -----------------------------------------------------------------
 * Hook that fetches ALL of the current user's Pomodoro sessions and
 * tasks from Supabase and exports them client-side, either as a
 * single JSON file or as a ZIP of CSV files.
 * =================================================================
 */

'use client';

import { useState, useCallback } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { logError } from '@/app/lib/logger';
import {
  exportAsJson,
  exportAsCsvZip,
  type ExportData,
  type ExportableSession,
  type ExportableTask,
} from '@/app/lib/exportData';

export interface UseDataExportResult {
  exportJson: () => Promise<void>;
  exportCsv: () => Promise<void>;
  isExporting: boolean;
  error: string | null;
}

/**
 * @param userId - The authenticated user's id, or null when signed out.
 * @param errorMessage - Localized message shown when an export fails.
 */
export function useDataExport(
  userId: string | null,
  errorMessage: string
): UseDataExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Fetches every session and task for the user and assembles ExportData. */
  const fetchExportData = useCallback(async (): Promise<ExportData> => {
    const supabase = createClient();

    const [sessionsResult, tasksResult] = await Promise.all([
      supabase
        .from('pomodoro_sessions')
        .select('started_at, completed_at, duration_minutes, session_type, task_text')
        .eq('user_id', userId)
        .order('started_at', { ascending: true }),
      supabase
        .from('tasks')
        .select('text, completed, position, updated_at')
        .eq('user_id', userId)
        .order('position', { ascending: true }),
    ]);

    if (sessionsResult.error) throw sessionsResult.error;
    if (tasksResult.error) throw tasksResult.error;

    const sessions = (sessionsResult.data ?? []) as ExportableSession[];
    const tasks = (tasksResult.data ?? []) as ExportableTask[];

    return {
      sessions,
      tasks,
      exportedAt: new Date().toISOString(),
      totalSessions: sessions.length,
      totalTasks: tasks.length,
    };
  }, [userId]);

  const runExport = useCallback(
    async (deliver: (data: ExportData) => void | Promise<void>) => {
      if (!userId || isExporting) return;
      setError(null);
      setIsExporting(true);
      try {
        const data = await fetchExportData();
        await deliver(data);
      } catch (err) {
        logError(err, {
          operation: 'exportData',
          userId,
        });
        setError(errorMessage);
      } finally {
        setIsExporting(false);
      }
    },
    [userId, isExporting, fetchExportData, errorMessage]
  );

  const exportJson = useCallback(
    () => runExport((data) => exportAsJson(data)),
    [runExport]
  );

  const exportCsv = useCallback(
    () => runExport((data) => exportAsCsvZip(data)),
    [runExport]
  );

  return { exportJson, exportCsv, isExporting, error };
}
