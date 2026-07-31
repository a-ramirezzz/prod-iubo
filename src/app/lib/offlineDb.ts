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

const DB_NAME = 'prod-uibo-offline';
const DB_VERSION = 1;

/** Shape of the `pomodoro_sessions` rows as selected by usePomodoroStats. */
export interface CachedSessionRow {
  completed_at: string;
  task_text: string | null;
  duration_minutes: number;
}

interface StoredSessionRow extends CachedSessionRow {
  id: string;
  user_id: string;
}

interface StoredTask extends Task {
  user_id: string;
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
      .map(({ completed_at, task_text, duration_minutes }) => ({
        completed_at,
        task_text,
        duration_minutes,
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
  } catch (err) {
    logWarn('Failed to clear user data', {
      operation: 'clearUserData',
      userId,
      metadata: { error: String(err) },
    });
  }
}
