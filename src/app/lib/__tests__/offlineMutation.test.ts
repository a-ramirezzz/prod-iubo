import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const addToSyncQueueMock = vi.fn().mockResolvedValue(undefined);
vi.mock('@/app/lib/offlineDb', () => ({
  addToSyncQueue: (...args: unknown[]) => addToSyncQueueMock(...args),
}));

import { executeOrQueue } from '../offlineMutation';

const BASE_OPTIONS = {
  table: 'tasks' as const,
  operation: 'insert' as const,
  data: { id: '1', text: 'Task' },
  userId: 'user-1',
};

describe('executeOrQueue', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    addToSyncQueueMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns success without queueing when the mutation succeeds', async () => {
    const result = await executeOrQueue(
      async () => ({ error: null }),
      BASE_OPTIONS
    );

    expect(result).toEqual({ queued: false, error: null });
    expect(addToSyncQueueMock).not.toHaveBeenCalled();
  });

  it('surfaces a data error without queueing it', async () => {
    const dataError = { message: 'duplicate key value violates unique constraint', code: '23505' };

    const result = await executeOrQueue(
      async () => ({ error: dataError }),
      BASE_OPTIONS
    );

    expect(result).toEqual({ queued: false, error: dataError });
    expect(addToSyncQueueMock).not.toHaveBeenCalled();
  });

  it('does not queue a PostgREST data error (e.g. no rows found)', async () => {
    const pgrstError = { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' };

    const result = await executeOrQueue(
      async () => ({ error: pgrstError }),
      BASE_OPTIONS
    );

    expect(result.queued).toBe(false);
    expect(addToSyncQueueMock).not.toHaveBeenCalled();
  });

  it('queues the mutation when the resolved error looks network-related', async () => {
    const networkError = { message: 'NetworkError when attempting to fetch resource' };

    const result = await executeOrQueue(
      async () => ({ error: networkError }),
      BASE_OPTIONS
    );

    expect(result).toEqual({ queued: true, error: null });
    expect(addToSyncQueueMock).toHaveBeenCalledWith(BASE_OPTIONS);
  });

  it('queues the mutation when the fetch itself throws', async () => {
    const result = await executeOrQueue(
      async () => {
        throw new TypeError('Failed to fetch');
      },
      BASE_OPTIONS
    );

    expect(result).toEqual({ queued: true, error: null });
    expect(addToSyncQueueMock).toHaveBeenCalledWith(BASE_OPTIONS);
  });

  it('while online, calls Supabase directly and succeeds without touching the queue', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const supabaseFn = vi.fn().mockResolvedValue({ error: null });

    const result = await executeOrQueue(supabaseFn, BASE_OPTIONS);

    expect(supabaseFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ queued: false, error: null });
    expect(addToSyncQueueMock).not.toHaveBeenCalled();
  });

  it('while online, queues the mutation when Supabase reports a network error', async () => {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    const networkError = { message: 'Failed to fetch' };
    const supabaseFn = vi.fn().mockResolvedValue({ error: networkError });

    const result = await executeOrQueue(supabaseFn, BASE_OPTIONS);

    expect(supabaseFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ queued: true, error: null });
    expect(addToSyncQueueMock).toHaveBeenCalledWith(BASE_OPTIONS);
  });

  it('while offline, still attempts the call but queues on the resulting exception', async () => {
    // executeOrQueue has no separate offline branch — offline mutations are
    // queued because the underlying fetch() rejects, same as any other
    // network-level failure. This documents that navigator.onLine alone
    // doesn't short-circuit the call.
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    const supabaseFn = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));

    const result = await executeOrQueue(supabaseFn, BASE_OPTIONS);

    expect(supabaseFn).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ queued: true, error: null });
    expect(addToSyncQueueMock).toHaveBeenCalledWith(BASE_OPTIONS);
  });

  it('queued mutations carry the correct table, operation, payload, and userId metadata', async () => {
    const options = {
      table: 'pomodoro_sessions' as const,
      operation: 'upsert' as const,
      data: { id: 's1', duration_minutes: 25 },
      filters: { id: 's1' },
      userId: 'user-42',
    };

    await executeOrQueue(
      async () => {
        throw new TypeError('Failed to fetch');
      },
      options
    );

    expect(addToSyncQueueMock).toHaveBeenCalledWith(options);
  });

  it('preserves FIFO order when multiple mutations are queued in sequence', async () => {
    const calls: unknown[] = [];
    addToSyncQueueMock.mockImplementation((entry: unknown) => {
      calls.push(entry);
      return Promise.resolve();
    });

    for (const id of ['a', 'b', 'c']) {
      await executeOrQueue(
        async () => {
          throw new TypeError('Failed to fetch');
        },
        { ...BASE_OPTIONS, data: { id } }
      );
    }

    expect(calls.map((c) => (c as { data: { id: string } }).data.id)).toEqual(['a', 'b', 'c']);
  });
});
