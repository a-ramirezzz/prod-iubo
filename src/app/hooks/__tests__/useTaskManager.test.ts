// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';

// Configurable results for the Supabase mock.
let selectResult: { data: unknown[] | null; error: unknown } = { data: [], error: null };
let insertResult: { error: unknown } = { error: null };

const insertMock = vi.fn(() => Promise.resolve(insertResult));

const makeBuilder = () => {
  const builder: Record<string, unknown> = {};
  const chain = () => builder;
  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.order = vi.fn(chain);
  builder.insert = insertMock;
  builder.update = vi.fn(chain);
  builder.delete = vi.fn(chain);
  // Thenable: resolves to the current select/mutation result.
  builder.then = (resolve: (v: unknown) => unknown) => resolve(selectResult);
  return builder;
};

const channelMock = {
  on: vi.fn(() => channelMock),
  subscribe: vi.fn(() => channelMock),
};

const mockSupabase = {
  from: vi.fn(() => makeBuilder()),
  channel: vi.fn(() => channelMock),
  removeChannel: vi.fn(),
};

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Default to "nothing cached yet" so existing network-path assertions are
// unaffected; individual tests override to exercise the offline fallback.
const cacheTasksMock = vi.fn().mockResolvedValue(undefined);
const getCachedTasksMock = vi.fn().mockResolvedValue(null);
vi.mock('@/app/lib/offlineDb', () => ({
  cacheTasks: (...args: unknown[]) => cacheTasksMock(...args),
  getCachedTasks: (...args: unknown[]) => getCachedTasksMock(...args),
}));

import { useTaskManager } from '@/app/hooks/useTaskManager';

const USER = 'user-123';

describe('useTaskManager', () => {
  beforeEach(() => {
    selectResult = { data: [], error: null };
    insertResult = { error: null };
    insertMock.mockClear();
    mockSupabase.from.mockClear();
    cacheTasksMock.mockClear().mockResolvedValue(undefined);
    getCachedTasksMock.mockClear().mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with empty tasks and loading true, then finishes loading', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    expect(result.current.tasks).toEqual([]);
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
  });

  it('handleAddTask adds a task optimistically', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('New task');
    });
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe('New task');
    expect(result.current.tasks[0].completed).toBe(false);
    expect(result.current.tasks[0].position).toBe(0);
  });

  it('handleAddTask ignores empty strings', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('');
      result.current.handleAddTask('   ');
    });
    expect(result.current.tasks).toEqual([]);
  });

  it('handleToggleTask toggles completed state', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('Task');
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.handleToggleTask(id);
    });
    expect(result.current.tasks[0].completed).toBe(true);
    act(() => {
      result.current.handleToggleTask(id);
    });
    expect(result.current.tasks[0].completed).toBe(false);
  });

  it('handleDeleteTask removes the task', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('Task');
    });
    const id = result.current.tasks[0].id;
    act(() => {
      result.current.handleDeleteTask(id);
    });
    expect(result.current.tasks).toEqual([]);
  });

  it('handleReorderTasks updates positions', async () => {
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('A');
      result.current.handleAddTask('B');
      result.current.handleAddTask('C');
    });
    const [a, b, c] = result.current.tasks;
    act(() => {
      result.current.handleReorderTasks([c, a, b]);
    });
    expect(result.current.tasks[0].text).toBe('C');
    expect(result.current.tasks[0].position).toBe(0);
    expect(result.current.tasks[1].text).toBe('A');
    expect(result.current.tasks[1].position).toBe(1);
    expect(result.current.tasks[2].text).toBe('B');
    expect(result.current.tasks[2].position).toBe(2);
  });

  it('reverts optimistic add on Supabase error', async () => {
    insertResult = { error: { message: 'DB error' } };
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('Fail task');
    });
    await waitFor(() => {
      expect(result.current.tasks).toEqual([]);
    });
  });

  it('mirrors a successful initial fetch into the offline cache', async () => {
    selectResult = { data: [{ id: 't1', text: 'A', completed: false, position: 0 }], error: null };
    renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(cacheTasksMock).toHaveBeenCalled());
    expect(cacheTasksMock).toHaveBeenCalledWith(USER, [
      { id: 't1', text: 'A', completed: false, position: 0 },
    ]);
  });

  it('falls back to cached tasks when the initial fetch fails', async () => {
    selectResult = { data: null, error: { message: 'offline' } };
    getCachedTasksMock.mockResolvedValue([
      { id: 't1', text: 'Cached task', completed: false, position: 0 },
    ]);
    const { result } = renderHook(() => useTaskManager(USER));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.tasks).toEqual([
      { id: 't1', text: 'Cached task', completed: false, position: 0 },
    ]);
  });

  it('skips Supabase calls when userId is null', async () => {
    const { result } = renderHook(() => useTaskManager(null));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => {
      result.current.handleAddTask('Local task');
    });
    expect(insertMock).not.toHaveBeenCalled();
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].text).toBe('Local task');
  });
});
