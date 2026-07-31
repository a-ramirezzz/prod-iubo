import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { SyncQueueEntry } from '../offlineDb';

// -----------------------------------------------------------------------------
// Supabase mock — a chainable, thenable query builder.
// -----------------------------------------------------------------------------
let mutationError: { message: string } | null = null;
const insertMock = vi.fn();
const updateMock = vi.fn();
const deleteMock = vi.fn();
const upsertMock = vi.fn();

const makeBuilder = () => {
  const builder: Record<string, unknown> = {};
  builder.eq = vi.fn(() => builder);
  builder.insert = (...args: unknown[]) => {
    insertMock(...args);
    return Promise.resolve({ error: mutationError });
  };
  builder.update = (...args: unknown[]) => {
    updateMock(...args);
    return builder;
  };
  builder.delete = (...args: unknown[]) => {
    deleteMock(...args);
    return builder;
  };
  builder.upsert = (...args: unknown[]) => {
    upsertMock(...args);
    return Promise.resolve({ error: mutationError });
  };
  builder.then = (resolve: (v: { error: unknown }) => unknown) =>
    resolve({ error: mutationError });
  return builder;
};

const fromMock = vi.fn(() => makeBuilder());
vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ from: fromMock })),
}));

// -----------------------------------------------------------------------------
// offlineDb mock — an in-memory stand-in for the syncQueue store.
// -----------------------------------------------------------------------------
let queue: SyncQueueEntry[] = [];

const getPendingQueueEntriesMock = vi.fn(async (userId: string) =>
  queue.filter((e) => e.userId === userId && (e.status === 'pending' || e.status === 'failed'))
);
const updateQueueEntryStatusMock = vi.fn(
  async (id: number, status: SyncQueueEntry['status'], error?: string, retryCount?: number) => {
    const entry = queue.find((e) => e.id === id);
    if (!entry) return;
    entry.status = status;
    if (error !== undefined) entry.lastError = error;
    if (retryCount !== undefined) entry.retryCount = retryCount;
  }
);
const removeQueueEntryMock = vi.fn(async (id: number) => {
  queue = queue.filter((e) => e.id !== id);
});

vi.mock('@/app/lib/offlineDb', () => ({
  getPendingQueueEntries: (...args: [string]) => getPendingQueueEntriesMock(...args),
  updateQueueEntryStatus: (
    ...args: [number, SyncQueueEntry['status'], string?, number?]
  ) => updateQueueEntryStatusMock(...args),
  removeQueueEntry: (...args: [number]) => removeQueueEntryMock(...args),
}));

import { processSyncQueue } from '../syncProcessor';

const USER = 'user-1';

function makeEntry(overrides: Partial<SyncQueueEntry> = {}): SyncQueueEntry {
  return {
    id: overrides.id ?? queue.length + 1,
    operation: 'insert',
    table: 'tasks',
    data: { id: 't1', text: 'Task' },
    status: 'pending',
    createdAt: new Date().toISOString(),
    userId: USER,
    retryCount: 0,
    ...overrides,
  };
}

describe('processSyncQueue', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    queue = [];
    mutationError = null;
    insertMock.mockClear();
    updateMock.mockClear();
    deleteMock.mockClear();
    upsertMock.mockClear();
    fromMock.mockClear();
    getPendingQueueEntriesMock.mockClear();
    updateQueueEntryStatusMock.mockClear();
    removeQueueEntryMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns zero counts when the queue is empty', async () => {
    const result = await processSyncQueue(USER);
    expect(result).toEqual({ processed: 0, failed: 0, remaining: 0 });
  });

  it('processes a pending insert and removes it from the queue', async () => {
    queue.push(makeEntry({ id: 1, operation: 'insert', data: { id: 't1', text: 'A' } }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 1, failed: 0, remaining: 0 });
    expect(insertMock).toHaveBeenCalledWith({ id: 't1', text: 'A' });
    expect(queue).toHaveLength(0);
  });

  it('applies filters as .eq() calls for update and delete operations', async () => {
    queue.push(
      makeEntry({
        id: 1,
        operation: 'update',
        data: { completed: true },
        filters: { id: 't1' },
      })
    );

    await processSyncQueue(USER);

    expect(updateMock).toHaveBeenCalledWith({ completed: true });
    expect(fromMock).toHaveBeenCalledWith('tasks');
  });

  it('processes entries strictly in FIFO order', async () => {
    const order: string[] = [];
    queue.push(makeEntry({ id: 1, data: { id: 'first' } }));
    queue.push(makeEntry({ id: 2, data: { id: 'second' } }));
    insertMock.mockImplementation((payload: { id: string }) => order.push(payload.id));

    await processSyncQueue(USER);

    expect(order).toEqual(['first', 'second']);
  });

  it('retries a failed entry without marking it permanently failed before MAX_RETRIES', async () => {
    mutationError = { message: 'temporary failure' };
    queue.push(makeEntry({ id: 1, retryCount: 0 }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 0, failed: 0, remaining: 1 });
    expect(queue[0].status).toBe('pending');
    expect(queue[0].retryCount).toBe(1);
  });

  it('marks an entry permanently failed after MAX_RETRIES', async () => {
    mutationError = { message: 'still failing' };
    queue.push(makeEntry({ id: 1, retryCount: 2 })); // next failure -> retryCount 3 >= MAX_RETRIES

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 0, failed: 1, remaining: 0 });
    expect(queue[0].status).toBe('failed');
    expect(queue[0].retryCount).toBe(3);
  });

  it('only processes entries belonging to the given user', async () => {
    queue.push(makeEntry({ id: 1, userId: 'other-user' }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 0, failed: 0, remaining: 0 });
    expect(insertMock).not.toHaveBeenCalled();
  });
});
