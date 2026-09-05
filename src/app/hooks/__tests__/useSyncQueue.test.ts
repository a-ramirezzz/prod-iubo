// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

let realtimeStatus: 'connected' | 'disconnected' | 'reconnecting' = 'connected';
vi.mock('@/app/hooks/useRealtimeStatus', () => ({
  useRealtimeStatus: () => ({ status: realtimeStatus, lastConnectedAt: null }),
}));

const processSyncQueueMock = vi.fn();
vi.mock('@/app/lib/syncProcessor', () => ({
  processSyncQueue: (...args: unknown[]) => processSyncQueueMock(...args),
}));

const getQueueSizeMock = vi.fn();
const getFailedQueueSizeMock = vi.fn();
vi.mock('@/app/lib/offlineDb', () => ({
  getQueueSize: (...args: unknown[]) => getQueueSizeMock(...args),
  getFailedQueueSize: (...args: unknown[]) => getFailedQueueSizeMock(...args),
}));

import { useSyncQueue } from '../useSyncQueue';

const USER = 'user-1';

describe('useSyncQueue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    realtimeStatus = 'connected';
    processSyncQueueMock.mockReset().mockResolvedValue({ processed: 0, failed: 0, remaining: 0 });
    getQueueSizeMock.mockReset().mockResolvedValue(0);
    getFailedQueueSizeMock.mockReset().mockResolvedValue(0);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not sync on initial mount even though status starts "connected"', async () => {
    renderHook(() => useSyncQueue(USER));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(processSyncQueueMock).not.toHaveBeenCalled();
  });

  it('triggers a sync after reconnecting (status transitions back to "connected")', async () => {
    realtimeStatus = 'disconnected';
    const { rerender } = renderHook(() => useSyncQueue(USER));

    realtimeStatus = 'connected';
    rerender();

    // Sync is debounced by SYNC.RECONNECT_STABILIZE_MS after reconnecting.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(processSyncQueueMock).toHaveBeenCalledWith(USER);
    expect(processSyncQueueMock).toHaveBeenCalledTimes(1);
  });

  it('does not trigger a sync while merely staying disconnected or reconnecting', async () => {
    realtimeStatus = 'disconnected';
    const { rerender } = renderHook(() => useSyncQueue(USER));

    realtimeStatus = 'reconnecting';
    rerender();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(processSyncQueueMock).not.toHaveBeenCalled();
  });

  it('refreshes pending/failed counts after a reconnect-triggered sync completes', async () => {
    realtimeStatus = 'disconnected';
    getQueueSizeMock.mockResolvedValue(5);
    getFailedQueueSizeMock.mockResolvedValue(2);
    processSyncQueueMock.mockResolvedValue({ processed: 3, failed: 2, remaining: 0 });

    const { rerender, result } = renderHook(() => useSyncQueue(USER));
    realtimeStatus = 'connected';
    rerender();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });

    expect(result.current.pendingCount).toBe(3);
    expect(result.current.failedCount).toBe(2);
    expect(result.current.lastSyncResult).toEqual({ processed: 3, failed: 2, remaining: 0 });
  });

  it('does not start a second sync while one is already in flight', async () => {
    let resolveSync: (v: { processed: number; failed: number; remaining: number }) => void;
    processSyncQueueMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSync = resolve;
      })
    );

    const { result } = renderHook(() => useSyncQueue(USER));

    await act(async () => {
      void result.current.syncNow();
      void result.current.syncNow();
    });

    expect(processSyncQueueMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveSync({ processed: 0, failed: 0, remaining: 0 });
      await Promise.resolve();
    });
  });
});
