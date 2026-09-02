// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * =================================================================
 * src/app/types/realtime.types.ts
 * -----------------------------------------------------------------
 * Typed shapes for Supabase Realtime `postgres_changes` payloads.
 *
 * `TaskRow` is derived from the generated `database.types.ts`
 * (`Database['public']['Tables']['tasks']['Row']`) so it stays in sync
 * with the actual `tasks` table schema.
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
import type { TaskRow } from './tables';

export type { TaskRow };

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
