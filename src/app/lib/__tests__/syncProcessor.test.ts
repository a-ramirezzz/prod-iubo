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

  it('processes every item in a multi-entry queue when all succeed', async () => {
    queue.push(makeEntry({ id: 1, data: { id: 't1' } }));
    queue.push(makeEntry({ id: 2, operation: 'update', filters: { id: 't1' }, data: { completed: true } }));
    queue.push(makeEntry({ id: 3, operation: 'delete', filters: { id: 't2' }, data: {} }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 3, failed: 0, remaining: 0 });
    expect(queue).toHaveLength(0);
  });

  it('keeps a failing item pending (for retry) but still processes the rest of the queue', async () => {
    // processSyncQueue has no early-exit on failure: each entry is handled
    // independently via its own try/catch, so one failure never blocks
    // entries queued after it.
    let call = 0;
    fromMock.mockImplementation(() => {
      call++;
      const builder = makeBuilder();
      if (call === 1) {
        builder.insert = () => Promise.resolve({ error: { message: 'network error: failed to fetch' } });
      }
      return builder;
    });
    queue.push(makeEntry({ id: 1, data: { id: 'first' } }));
    queue.push(makeEntry({ id: 2, data: { id: 'second' } }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 1, failed: 0, remaining: 1 });
    expect(queue.find((e) => e.id === 1)).toMatchObject({ status: 'pending', retryCount: 1 });
    expect(queue.find((e) => e.id === 2)).toBeUndefined(); // removed: succeeded
  });

  it('discards an entry once it has failed MAX_RETRIES times across repeated sync attempts', async () => {
    mutationError = { message: 'still failing' };
    queue.push(makeEntry({ id: 1, retryCount: 0 }));

    let result = await processSyncQueue(USER);
    expect(result).toEqual({ processed: 0, failed: 0, remaining: 1 });
    expect(queue[0].retryCount).toBe(1);

    result = await processSyncQueue(USER);
    expect(queue[0].retryCount).toBe(2);

    result = await processSyncQueue(USER);
    expect(result).toEqual({ processed: 0, failed: 1, remaining: 0 });
    expect(queue[0].status).toBe('failed');
    expect(queue[0].retryCount).toBe(3);
  });

  it('retries a non-network (data) error the same way as any other failure — syncProcessor does not special-case error type', async () => {
    // Unlike offlineMutation's isNetworkError check (which decides whether to
    // queue in the first place), syncProcessor treats every thrown error
    // identically once an entry is already queued: retry until MAX_RETRIES.
    mutationError = { message: 'duplicate key value violates unique constraint' };
    queue.push(makeEntry({ id: 1, retryCount: 2 }));

    const result = await processSyncQueue(USER);

    expect(result).toEqual({ processed: 0, failed: 1, remaining: 0 });
    expect(queue[0].status).toBe('failed');
    // Thrown Postgrest-style error objects aren't `instanceof Error`, so the
    // processor's `error instanceof Error ? error.message : String(error)`
    // falls through to String(error) rather than extracting `.message`.
    expect(queue[0].lastError).toBe('[object Object]');
  });
});
