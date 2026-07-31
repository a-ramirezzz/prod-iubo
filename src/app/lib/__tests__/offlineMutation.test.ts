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
});
