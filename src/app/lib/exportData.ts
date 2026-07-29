/**
 * =================================================================
 * src/app/lib/exportData.ts
 * -----------------------------------------------------------------
 * Pure TypeScript helpers for exporting the user's data (Pomodoro
 * sessions + tasks) client-side as JSON or a ZIP of CSV files.
 *
 * No React. Only the whitelisted fields defined below are ever
 * exported — user_id and internal database IDs are never included.
 * =================================================================
 */

import JSZip from 'jszip';

export interface ExportableSession {
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  session_type: string;
  task_text: string | null;
}

export interface ExportableTask {
  text: string;
  completed: boolean;
  position: number;
  updated_at: string | null;
}

export interface ExportData {
  sessions: ExportableSession[];
  tasks: ExportableTask[];
  exportedAt: string; // ISO timestamp
  totalSessions: number;
  totalTasks: number;
}

/**
 * Escapes a single CSV field. If the value contains a comma, quote or
 * newline, it is wrapped in double quotes and any internal quotes are
 * doubled. `null`/`undefined` become an empty field.
 */
function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Joins already-escaped fields into a CSV row. */
function toCsvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields.map(escapeCsvField).join(',');
}

/**
 * Serializes sessions as CSV.
 * Columns: started_at, completed_at, duration_minutes, session_type, task_text
 */
export function formatSessionsAsCsv(sessions: ExportableSession[]): string {
  const header = 'started_at,completed_at,duration_minutes,session_type,task_text';
  const rows = sessions.map((s) =>
    toCsvRow([s.started_at, s.completed_at, s.duration_minutes, s.session_type, s.task_text])
  );
  return [header, ...rows].join('\n');
}

/**
 * Serializes tasks as CSV.
 * Columns: text, completed, position, updated_at
 */
export function formatTasksAsCsv(tasks: ExportableTask[]): string {
  const header = 'text,completed,position,updated_at';
  const rows = tasks.map((t) =>
    toCsvRow([t.text, t.completed, t.position, t.updated_at])
  );
  return [header, ...rows].join('\n');
}

/** Builds the dated filename base, e.g. 'prod-uibo-export-2026-07-29'. */
function exportFilenameBase(): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `prod-uibo-export-${date}`;
}

/**
 * Triggers a browser download of the given blob using the standard
 * object-URL + anchor-click technique.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Exports the full data set as a single pretty-printed JSON file.
 */
export function exportAsJson(data: ExportData): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  triggerDownload(blob, `${exportFilenameBase()}.json`);
}

/**
 * Exports sessions and tasks as two CSV files bundled into a single ZIP.
 */
export async function exportAsCsvZip(data: ExportData): Promise<void> {
  const zip = new JSZip();
  zip.file('sessions.csv', formatSessionsAsCsv(data.sessions));
  zip.file('tasks.csv', formatTasksAsCsv(data.tasks));
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, `${exportFilenameBase()}.zip`);
}
