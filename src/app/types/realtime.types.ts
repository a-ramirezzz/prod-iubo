// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * =================================================================
 * src/app/types/realtime.types.ts
 * -----------------------------------------------------------------
 * Typed shapes for Supabase Realtime `postgres_changes` payloads.
 *
 * There is no generated `database.types.ts` in this project, so the
 * row shape below mirrors the hand-written table interface already
 * used in `useTaskManager.ts`. If a generated Supabase types file is
 * ever added, `TaskRow` should be replaced with the equivalent
 * `Database['public']['Tables']['tasks']['Row']`.
 *
 * The payload aliases wrap `@supabase/supabase-js`'s own
 * `RealtimePostgresInsertPayload` / `UpdatePayload` / `DeletePayload`
 * (re-exported from `@supabase/realtime-js`) so they stay structurally
 * compatible with `RealtimeChannel.on(...)`'s overloads.
 * =================================================================
 */

import type {
  RealtimePostgresChangesPayload as SupabaseRealtimePostgresChangesPayload,
  RealtimePostgresInsertPayload,
  RealtimePostgresUpdatePayload,
  RealtimePostgresDeletePayload,
} from '@supabase/supabase-js';

/** Shape of a row in the `tasks` table as delivered by Realtime. */
export interface TaskRow {
  id: string;
  user_id: string;
  text: string;
  completed: boolean;
  position: number;
}

/** Map of table name -> row shape, for tables with Realtime subscriptions. */
export interface RealtimeTables {
  tasks: TaskRow;
}

export type TaskInsertPayload = RealtimePostgresInsertPayload<TaskRow>;
export type TaskUpdatePayload = RealtimePostgresUpdatePayload<TaskRow>;
export type TaskDeletePayload = RealtimePostgresDeletePayload<TaskRow>;

/** Typed `postgres_changes` payload (any event) for a given table. */
export type RealtimePostgresChangesPayload<T extends keyof RealtimeTables> =
  SupabaseRealtimePostgresChangesPayload<RealtimeTables[T]>;
