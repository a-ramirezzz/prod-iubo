/**
 * =================================================================
 * src/app/lib/offlineDb.ts
 * -----------------------------------------------------------------
 * IndexedDB mirror of the user's Supabase data (sessions, tasks,
 * settings), used as a read-only fallback when the network is
 * unavailable. See offlineSync.ts for the network-first/cache-fallback
 * coordinator that calls into this module.
 *
 * Best-effort only: every export is wrapped in try/catch. IndexedDB can
 * fail (private browsing, storage quota, corrupted DB) and none of that
 * should ever crash the app — Supabase remains the source of truth.
 * =================================================================
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';
import { logWarn } from '@/app/lib/logger';
import type { Task, AppSettings } from '@/app/types';
import type { SessionRow } from '@/app/types/session';

const DB_NAME = 'prod-uibo-offline';
const DB_VERSION = 2;

/** Shape of the `pomodoro_sessions` rows as selected by usePomodoroStats. */
export type CachedSessionRow = Pick<
  SessionRow,
  'completed_at' | 'started_at' | 'task_text' | 'duration_minutes' | 'session_type'
>;

interface StoredSessionRow extends CachedSessionRow {
  id: string;
  user_id: string;
}

interface StoredTask extends Task {
  user_id: string;
}

/** A queued Supabase mutation, replayed by syncProcessor.ts once back online. */
export interface SyncQueueEntry {
  id?: number; // auto-increment
  operation: 'insert' | 'update' | 'delete' | 'upsert';
  table: 'pomodoro_sessions' | 'tasks' | 'user_settings';
  data: Record<string, unknown>; // the payload to send
  filters?: Record<string, unknown>; // .eq() filters for update/delete
  status: 'pending' | 'processing' | 'failed';
  createdAt: string; // ISO timestamp
  userId: string;
  retryCount: number; // starts at 0
  lastError?: string; // last error message if failed
}

interface OfflineDBSchema extends DBSchema {
  sessions: {
    key: string;
    value: StoredSessionRow;
    indexes: { 'by-user': string; 'by-date': string };
  };
  tasks: {
    key: string;
    value: StoredTask;
    indexes: { 'by-user': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
  meta: {
    key: string;
    value: { timestamp: string; user_id: string };
  };
  syncQueue: {
    key: number;
    value: SyncQueueEntry;
    indexes: { 'by-status': string; 'by-timestamp': string };
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineDBSchema>> | null = null;

function getDb(): Promise<IDBPDatabase<OfflineDBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDBSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-user', 'user_id');
          sessionStore.createIndex('by-date', 'completed_at');
        }
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-user', 'user_id');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
        // Version 1 → 2: add syncQueue store.
        if (!db.objectStoreNames.contains('syncQueue')) {
          const queueStore = db.createObjectStore('syncQueue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('by-status', 'status');
          queueStore.createIndex('by-timestamp', 'createdAt');
        }
      },
    });
    // If opening fails, don't keep serving the same rejected promise forever —
    // let the next call try again (e.g. after a transient quota error clears).
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

function metaKey(store: string, userId: string): string {
  return `${store}::${userId}`;
}

async function clearByUserIndex<StoreName extends 'sessions' | 'tasks'>(
  db: IDBPDatabase<OfflineDBSchema>,
  storeName: StoreName,
  userId: string,
): Promise<void> {
  const tx = db.transaction(storeName, 'readwrite');
  const index = tx.store.index('by-user');
  let cursor = await index.openCursor(IDBKeyRange.only(userId));
  while (cursor) {
    await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
}

// ── Sessions ──

export async function cacheSessions(
  userId: string,
  sessions: CachedSessionRow[],
): Promise<void> {
  try {
    const db = await getDb();
    await clearByUserIndex(db, 'sessions', userId);
    const tx = db.transaction('sessions', 'readwrite');
    await Promise.all(
      sessions.map((session, index) =>
        tx.store.put({
          ...session,
          id: `${userId}::${session.completed_at}::${index}`,
          user_id: userId,
        }),
      ),
    );
    await tx.done;
    await updateSyncTimestamp('sessions', userId);
  } catch (err) {
    logWarn('Failed to cache sessions', {
      operation: 'cacheSessions',
      userId,
      metadata: { error: String(err) },
    });
  }
}

/** Returns null when nothing has ever been synced for this user (vs. an empty list once it has). */
export async function getCachedSessions(userId: string): Promise<CachedSessionRow[] | null> {
  try {
    const synced = await getSyncTimestamp('sessions', userId);
    if (!synced) return null;
    const db = await getDb();
    const rows = await db.getAllFromIndex('sessions', 'by-user', userId);
    return rows
      .map(({ completed_at, started_at, task_text, duration_minutes, session_type }) => ({
        completed_at,
        started_at,
        task_text,
        duration_minutes,
        session_type,
      }))
      .sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1));
  } catch (err) {
    logWarn('Failed to read cached sessions', {
      operation: 'getCachedSessions',
      userId,
      metadata: { error: String(err) },
    });
    return null;
  }
}

// ── Tasks ──

export async function cacheTasks(userId: string, tasks: Task[]): Promise<void> {
  try {
    const db = await getDb();
    await clearByUserIndex(db, 'tasks', userId);
    const tx = db.transaction('tasks', 'readwrite');
    await Promise.all(
      tasks.map((task) => tx.store.put({ ...task, user_id: userId })),
    );
    await tx.done;
    await updateSyncTimestamp('tasks', userId);
  } catch (err) {
    logWarn('Failed to cache tasks', {
      operation: 'cacheTasks',
      userId,
      metadata: { error: String(err) },
    });
  }
}

/** Returns null when nothing has ever been synced for this user (vs. an empty list once it has). */
export async function getCachedTasks(userId: string): Promise<Task[] | null> {
  try {
    const synced = await getSyncTimestamp('tasks', userId);
    if (!synced) return null;
    const db = await getDb();
    const rows = await db.getAllFromIndex('tasks', 'by-user', userId);
    return rows
      .map(({ id, text, completed, position }) => ({ id, text, completed, position }))
      .sort((a, b) => a.position - b.position);
  } catch (err) {
    logWarn('Failed to read cached tasks', {
      operation: 'getCachedTasks',
      userId,
      metadata: { error: String(err) },
    });
    return null;
  }
}

// ── Settings ──

export async function cacheSettings(userId: string, settings: AppSettings): Promise<void> {
  try {
    const db = await getDb();
    await db.put('settings', settings, userId);
    await updateSyncTimestamp('settings', userId);
  } catch (err) {
    logWarn('Failed to cache settings', {
      operation: 'cacheSettings',
      userId,
      metadata: { error: String(err) },
    });
  }
}

export async function getCachedSettings(userId: string): Promise<AppSettings | null> {
  try {
    const db = await getDb();
    const settings = await db.get('settings', userId);
    return settings ?? null;
  } catch (err) {
    logWarn('Failed to read cached settings', {
      operation: 'getCachedSettings',
      userId,
      metadata: { error: String(err) },
    });
    return null;
  }
}

// ── Meta (sync timestamps) ──

export async function updateSyncTimestamp(store: string, userId: string): Promise<void> {
  try {
    const db = await getDb();
    await db.put(
      'meta',
      { timestamp: new Date().toISOString(), user_id: userId },
      metaKey(store, userId),
    );
  } catch (err) {
    logWarn('Failed to update sync timestamp', {
      operation: 'updateSyncTimestamp',
      userId,
      metadata: { store, error: String(err) },
    });
  }
}

export async function getSyncTimestamp(store: string, userId: string): Promise<string | null> {
  try {
    const db = await getDb();
    const entry = await db.get('meta', metaKey(store, userId));
    return entry?.timestamp ?? null;
  } catch (err) {
    logWarn('Failed to read sync timestamp', {
      operation: 'getSyncTimestamp',
      userId,
      metadata: { store, error: String(err) },
    });
    return null;
  }
}

// ── Sync queue ──

export async function addToSyncQueue(
  entry: Omit<SyncQueueEntry, 'id' | 'status' | 'retryCount' | 'createdAt'>,
): Promise<void> {
  try {
    const db = await getDb();
    await db.add('syncQueue', {
      ...entry,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    logWarn('Failed to add sync queue entry', {
      operation: 'addToSyncQueue',
      userId: entry.userId,
      metadata: { table: entry.table, mutation: entry.operation, error: String(err) },
    });
  }
}

/** Entries with status 'pending' or 'failed' (retryable), ordered by createdAt ASC. */
export async function getPendingQueueEntries(userId: string): Promise<SyncQueueEntry[]> {
  try {
    const db = await getDb();
    const all = await db.getAll('syncQueue');
    return all
      .filter(
        (entry) =>
          entry.userId === userId && (entry.status === 'pending' || entry.status === 'failed'),
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  } catch (err) {
    logWarn('Failed to read sync queue', {
      operation: 'getPendingQueueEntries',
      userId,
      metadata: { error: String(err) },
    });
    return [];
  }
}

export async function updateQueueEntryStatus(
  id: number,
  status: SyncQueueEntry['status'],
  error?: string,
  retryCount?: number,
): Promise<void> {
  try {
    const db = await getDb();
    const entry = await db.get('syncQueue', id);
    if (!entry) return;
    await db.put('syncQueue', {
      ...entry,
      status,
      lastError: error ?? entry.lastError,
      retryCount: retryCount ?? entry.retryCount,
    });
  } catch (err) {
    logWarn('Failed to update sync queue entry status', {
      operation: 'updateQueueEntryStatus',
      metadata: { id, status, error: String(err) },
    });
  }
}

export async function removeQueueEntry(id: number): Promise<void> {
  try {
    const db = await getDb();
    await db.delete('syncQueue', id);
  } catch (err) {
    logWarn('Failed to remove sync queue entry', {
      operation: 'removeQueueEntry',
      metadata: { id, error: String(err) },
    });
  }
}

/** Count of pending + failed entries for a user — useful for a UI badge (Step 4). */
export async function getQueueSize(userId: string): Promise<number> {
  const entries = await getPendingQueueEntries(userId);
  return entries.length;
}

/** Count of permanently failed entries (status === 'failed') for a user. */
export async function getFailedQueueSize(userId: string): Promise<number> {
  try {
    const db = await getDb();
    const all = await db.getAll('syncQueue');
    return all.filter((entry) => entry.userId === userId && entry.status === 'failed').length;
  } catch (err) {
    logWarn('Failed to read failed sync queue size', {
      operation: 'getFailedQueueSize',
      userId,
      metadata: { error: String(err) },
    });
    return 0;
  }
}

/** Clears all queued mutations for a user (on logout, or after a full sync). */
export async function clearSyncQueue(userId: string): Promise<void> {
  try {
    const db = await getDb();
    const all = await db.getAll('syncQueue');
    await Promise.all(
      all
        .filter((entry) => entry.userId === userId && entry.id !== undefined)
        .map((entry) => db.delete('syncQueue', entry.id as number)),
    );
  } catch (err) {
    logWarn('Failed to clear sync queue', {
      operation: 'clearSyncQueue',
      userId,
      metadata: { error: String(err) },
    });
  }
}

// ── Cleanup ──

/** Clears all cached data for a user — call on logout so a different user on the same device never sees stale data. */
export async function clearUserData(userId: string): Promise<void> {
  try {
    const db = await getDb();
    await clearByUserIndex(db, 'sessions', userId);
    await clearByUserIndex(db, 'tasks', userId);
    await db.delete('settings', userId);
    await Promise.all(
      (['sessions', 'tasks', 'settings'] as const).map((store) =>
        db.delete('meta', metaKey(store, userId)),
      ),
    );
    await clearSyncQueue(userId);
  } catch (err) {
    logWarn('Failed to clear user data', {
      operation: 'clearUserData',
      userId,
      metadata: { error: String(err) },
    });
  }
}
