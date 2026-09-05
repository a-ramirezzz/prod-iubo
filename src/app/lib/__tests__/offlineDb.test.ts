import 'fake-indexeddb/auto';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { AppSettings, Task } from '@/app/types';
import type { CachedSessionRow } from '../offlineDb';

const USER = 'user-1';

const SETTINGS: AppSettings = {
  is_pro: false,
  start_in_mini_mode: false,
  confirm_on_stop: true,
  pip_mode_enabled: false,
  horizontal_pip_enabled: false,
  language: 'es',
  enable_desktop_notifications: false,
  notification_sound_enabled: true,
  theme_mode: 'system',
  selected_theme_id: 'default',
  background_sound: 'none',
  volume: 0.5,
  daily_pomodoro_goal: 8,
  has_seen_onboarding: true,
};

function makeSession(overrides: Partial<CachedSessionRow> = {}): CachedSessionRow {
  return {
    completed_at: '2026-01-01T10:00:00.000Z',
    started_at: '2026-01-01T09:30:00.000Z',
    task_text: 'Focus session',
    duration_minutes: 25,
    session_type: 'work',
    ...overrides,
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 't1',
    text: 'Write tests',
    completed: false,
    position: 0,
    ...overrides,
  };
}

// `getDb()` memoizes its connection promise at module scope, so importing the
// module fresh for every test (via vi.resetModules) gives each test a clean
// fake-indexeddb database instead of bleeding state across tests.
async function importOfflineDb() {
  return await import('../offlineDb');
}

describe('offlineDb', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    indexedDB = new IDBFactory();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sessions', () => {
    it('returns null when nothing has been cached yet', async () => {
      const { getCachedSessions } = await importOfflineDb();
      expect(await getCachedSessions(USER)).toBeNull();
    });

    it('stores sessions and retrieves them for the same user', async () => {
      const { cacheSessions, getCachedSessions } = await importOfflineDb();
      const sessions = [makeSession({ task_text: 'A' }), makeSession({ task_text: 'B' })];

      await cacheSessions(USER, sessions);
      const result = await getCachedSessions(USER);

      expect(result).toHaveLength(2);
      expect(result?.map((s) => s.task_text).sort()).toEqual(['A', 'B']);
    });

    it('does not leak sessions across users', async () => {
      const { cacheSessions, getCachedSessions } = await importOfflineDb();
      await cacheSessions(USER, [makeSession()]);

      expect(await getCachedSessions('other-user')).toBeNull();
    });

    it('replaces previously cached sessions for a user rather than appending', async () => {
      const { cacheSessions, getCachedSessions } = await importOfflineDb();
      await cacheSessions(USER, [makeSession({ task_text: 'old' })]);
      await cacheSessions(USER, [makeSession({ task_text: 'new' })]);

      const result = await getCachedSessions(USER);
      expect(result).toHaveLength(1);
      expect(result?.[0].task_text).toBe('new');
    });
  });

  describe('tasks', () => {
    it('returns null when nothing has been cached yet', async () => {
      const { getCachedTasks } = await importOfflineDb();
      expect(await getCachedTasks(USER)).toBeNull();
    });

    it('stores tasks and retrieves them ordered by position', async () => {
      const { cacheTasks, getCachedTasks } = await importOfflineDb();
      await cacheTasks(USER, [
        makeTask({ id: 't2', position: 1, text: 'Second' }),
        makeTask({ id: 't1', position: 0, text: 'First' }),
      ]);

      const result = await getCachedTasks(USER);
      expect(result?.map((t) => t.text)).toEqual(['First', 'Second']);
    });
  });

  describe('settings', () => {
    it('returns null when no settings have been cached', async () => {
      const { getCachedSettings } = await importOfflineDb();
      expect(await getCachedSettings(USER)).toBeNull();
    });

    it('stores and retrieves settings with the expected defaults intact', async () => {
      const { cacheSettings, getCachedSettings } = await importOfflineDb();
      await cacheSettings(USER, SETTINGS);

      expect(await getCachedSettings(USER)).toEqual(SETTINGS);
    });
  });

  describe('sync queue', () => {
    it('returns an empty array when the queue is empty', async () => {
      const { getPendingQueueEntries } = await importOfflineDb();
      expect(await getPendingQueueEntries(USER)).toEqual([]);
    });

    it('adds an entry with pending status, retryCount 0, and a createdAt timestamp', async () => {
      const { addToSyncQueue, getPendingQueueEntries } = await importOfflineDb();
      await addToSyncQueue({
        operation: 'insert',
        table: 'tasks',
        data: { id: 't1', text: 'Task' },
        userId: USER,
      });

      const entries = await getPendingQueueEntries(USER);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        operation: 'insert',
        table: 'tasks',
        status: 'pending',
        retryCount: 0,
        userId: USER,
      });
      expect(typeof entries[0].createdAt).toBe('string');
    });

    it('retrieves queued entries in FIFO order regardless of insertion timing', async () => {
      const { addToSyncQueue, getPendingQueueEntries } = await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '2' }, userId: USER });
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '3' }, userId: USER });

      const entries = await getPendingQueueEntries(USER);
      expect(entries.map((e) => (e.data as { id: string }).id)).toEqual(['1', '2', '3']);
    });

    it('excludes entries that are already processing', async () => {
      const { addToSyncQueue, getPendingQueueEntries, updateQueueEntryStatus } =
        await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      const [entry] = await getPendingQueueEntries(USER);
      await updateQueueEntryStatus(entry.id as number, 'processing');

      expect(await getPendingQueueEntries(USER)).toEqual([]);
    });

    it('includes failed entries as retryable alongside pending ones', async () => {
      const { addToSyncQueue, getPendingQueueEntries, updateQueueEntryStatus } =
        await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      const [entry] = await getPendingQueueEntries(USER);
      await updateQueueEntryStatus(entry.id as number, 'failed', 'boom', 3);

      const entries = await getPendingQueueEntries(USER);
      expect(entries).toHaveLength(1);
      expect(entries[0].status).toBe('failed');
      expect(entries[0].lastError).toBe('boom');
      expect(entries[0].retryCount).toBe(3);
    });

    it('removes a single entry by id', async () => {
      const { addToSyncQueue, getPendingQueueEntries, removeQueueEntry } = await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '2' }, userId: USER });
      const [first, second] = await getPendingQueueEntries(USER);

      await removeQueueEntry(first.id as number);

      const remaining = await getPendingQueueEntries(USER);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(second.id);
    });

    it('clears every queued entry for a user after a successful sync', async () => {
      const { addToSyncQueue, getPendingQueueEntries, clearSyncQueue } = await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      await addToSyncQueue({ operation: 'update', table: 'tasks', data: { id: '2' }, userId: USER });

      await clearSyncQueue(USER);

      expect(await getPendingQueueEntries(USER)).toEqual([]);
    });

    it('clearing the queue for one user leaves another user untouched', async () => {
      const { addToSyncQueue, getPendingQueueEntries, clearSyncQueue } = await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: 'other-user' });

      await clearSyncQueue(USER);

      expect(await getPendingQueueEntries(USER)).toEqual([]);
      expect(await getPendingQueueEntries('other-user')).toHaveLength(1);
    });

    it('reports queue size as pending + failed entries', async () => {
      const { addToSyncQueue, getQueueSize, getFailedQueueSize, getPendingQueueEntries, updateQueueEntryStatus } =
        await importOfflineDb();
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '2' }, userId: USER });
      const [, second] = await getPendingQueueEntries(USER);
      await updateQueueEntryStatus(second.id as number, 'failed', 'boom', 3);

      expect(await getQueueSize(USER)).toBe(2);
      expect(await getFailedQueueSize(USER)).toBe(1);
    });
  });

  describe('clearUserData', () => {
    it('removes sessions, tasks, settings, and the sync queue for a user', async () => {
      const {
        cacheSessions,
        cacheTasks,
        cacheSettings,
        addToSyncQueue,
        clearUserData,
        getCachedSessions,
        getCachedTasks,
        getCachedSettings,
        getPendingQueueEntries,
      } = await importOfflineDb();

      await cacheSessions(USER, [makeSession()]);
      await cacheTasks(USER, [makeTask()]);
      await cacheSettings(USER, SETTINGS);
      await addToSyncQueue({ operation: 'insert', table: 'tasks', data: { id: '1' }, userId: USER });

      await clearUserData(USER);

      expect(await getCachedSessions(USER)).toBeNull();
      expect(await getCachedTasks(USER)).toBeNull();
      expect(await getCachedSettings(USER)).toBeNull();
      expect(await getPendingQueueEntries(USER)).toEqual([]);
    });
  });
});
