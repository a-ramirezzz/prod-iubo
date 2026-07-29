// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

// -----------------------------------------------------------------------------
// Mock strategy
// -----------------------------------------------------------------------------
// usePomodoroStats is a *pure calculation* hook wrapped around a single Supabase
// read: it fetches the last 30 days of completed `work` sessions and derives
// todaySessions / weekTotal / taskBreakdown / streak / weeklyData in memory.
//
// So the only thing we mock is the Supabase client. `mockResponse` is the
// { data, error } the query chain resolves to; each test sets it before render.
// The query chain (.from().select().eq().eq().eq().gte().order()) is a builder
// that returns itself until .order(), which resolves the promise — mirroring the
// real supabase-js fluent API the hook `await`s.
//
// Dates are built RELATIVE TO REAL `new Date()` (the hook's own notion of "now"),
// using local-time day offsets, so "today"/"yesterday" stay in sync with what the
// hook computes regardless of the machine's timezone. No fake timers: they would
// freeze waitFor's polling, exactly as the useSupabaseQuery reference test avoids.
// -----------------------------------------------------------------------------

let mockResponse: { data: unknown; error: unknown } = { data: [], error: null };

const orderMock = vi.fn(() => Promise.resolve(mockResponse));
const builder = {
  select: vi.fn(() => builder),
  eq: vi.fn(() => builder),
  gte: vi.fn(() => builder),
  order: orderMock,
};
const fromMock = vi.fn(() => builder);

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ from: fromMock })),
}));

import { usePomodoroStats } from '@/app/hooks/usePomodoroStats';

const USER = 'mock-user-id';
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * A completed-session row shaped like the hook's SELECT
 * (`completed_at, task_text, duration_minutes`).
 */
function createMockSession(
  overrides: Partial<{
    completed_at: string;
    task_text: string | null;
    duration_minutes: number;
  }> = {}
) {
  return {
    completed_at: overrides.completed_at ?? new Date().toISOString(),
    task_text: overrides.task_text ?? null,
    duration_minutes: overrides.duration_minutes ?? 25,
  };
}

/** Local midnight of "today", matching the hook's `setHours(0,0,0,0)`. */
function todayMidnight() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * ISO timestamp for a session `n` local days ago at a given local hour.
 * Built off local midnight + hour so it lands squarely inside the intended
 * calendar day (no timezone edge ambiguity).
 */
function daysAgoAt(n: number, hour = 12): string {
  const d = new Date(todayMidnight().getTime() - n * DAY_MS);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const setData = (rows: unknown[]) => {
  mockResponse = { data: rows, error: null };
};

const render = (userId: string | null = USER, total = 0) =>
  renderHook(({ id, t }) => usePomodoroStats(id, t), {
    initialProps: { id: userId, t: total },
  });

/** Render and wait for the initial fetch/derivation to settle. */
async function renderSettled(userId: string | null = USER, total = 0) {
  const view = render(userId, total);
  await waitFor(() => expect(view.result.current.loading).toBe(false));
  return view;
}

describe('usePomodoroStats', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockResponse = { data: [], error: null };
    fromMock.mockClear();
    builder.select.mockClear();
    builder.eq.mockClear();
    builder.gte.mockClear();
    orderMock.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // Fetch contract
  // ===========================================================================

  it('should query pomodoro_sessions filtered to completed work sessions', async () => {
    setData([]);
    await renderSettled();

    expect(fromMock).toHaveBeenCalledWith('pomodoro_sessions');
    expect(builder.select).toHaveBeenCalledWith(
      'completed_at, task_text, duration_minutes'
    );
    expect(builder.eq).toHaveBeenCalledWith('user_id', USER);
    expect(builder.eq).toHaveBeenCalledWith('session_type', 'work');
    expect(builder.eq).toHaveBeenCalledWith('completed', true);
  });

  it('should not fetch and should stop loading when there is no user', async () => {
    const { result } = render(null);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(fromMock).not.toHaveBeenCalled();
    expect(result.current.todaySessions).toEqual([]);
    expect(result.current.weekTotal).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.taskBreakdown).toEqual([]);
    expect(result.current.loadError).toBe(false);
  });

  it('should set loadError when the query returns an error', async () => {
    mockResponse = { data: null, error: { message: 'boom' } };
    const { result } = await renderSettled();

    expect(result.current.loadError).toBe(true);
    expect(result.current.weekTotal).toBe(0);
  });

  // ===========================================================================
  // Core stats
  // ===========================================================================

  it('should return zero stats when user has no sessions', async () => {
    setData([]);
    const { result } = await renderSettled();

    expect(result.current.todaySessions).toEqual([]);
    expect(result.current.weekTotal).toBe(0);
    expect(result.current.streak).toBe(0);
    expect(result.current.taskBreakdown).toEqual([]);
    expect(result.current.loadError).toBe(false);
    // weeklyData is always a full 7-day window, even when empty.
    expect(result.current.weeklyData).toHaveLength(7);
    expect(
      result.current.weeklyData.every((d) => d.count === 0)
    ).toBe(true);
  });

  it("should correctly count today's completed sessions", async () => {
    setData([
      createMockSession({ completed_at: daysAgoAt(0, 9) }),
      createMockSession({ completed_at: daysAgoAt(0, 12) }),
      createMockSession({ completed_at: daysAgoAt(0, 15) }),
      createMockSession({ completed_at: daysAgoAt(1, 9) }),
      createMockSession({ completed_at: daysAgoAt(1, 12) }),
    ]);
    const { result } = await renderSettled();

    // 3 today, not 5.
    expect(result.current.todaySessions).toHaveLength(3);
  });

  it('should count the week total as sessions within the last 7 days', async () => {
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(2) }),
      createMockSession({ completed_at: daysAgoAt(5) }),
      // 10 days ago: inside the 30-day fetch window but outside the 7-day week.
      createMockSession({ completed_at: daysAgoAt(10) }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.weekTotal).toBe(3);
  });

  // ===========================================================================
  // Streak calculation
  // ===========================================================================

  it('should calculate a 3-day streak over consecutive days', async () => {
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(1) }),
      createMockSession({ completed_at: daysAgoAt(2) }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.streak).toBe(3);
  });

  it('should break the streak when a day is missed', async () => {
    // Today + two days ago, but yesterday missing.
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(2) }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.streak).toBe(1);
  });

  it('should not break the streak when today has no sessions yet', async () => {
    // Yesterday and the day before, but nothing today: streak counts the two
    // past days because "today with none" is skipped rather than breaking.
    setData([
      createMockSession({ completed_at: daysAgoAt(1) }),
      createMockSession({ completed_at: daysAgoAt(2) }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.streak).toBe(2);
  });

  it('should report a streak of 0 when the only sessions are older gaps', async () => {
    // Nothing today, nothing yesterday, one two days ago -> streak breaks at
    // yesterday's gap before it can count the day-2 session.
    setData([createMockSession({ completed_at: daysAgoAt(2) })]);
    const { result } = await renderSettled();

    expect(result.current.streak).toBe(0);
  });

  // ===========================================================================
  // Task breakdown
  // ===========================================================================

  it('should group sessions by task with counts and total minutes', async () => {
    setData([
      createMockSession({ task_text: 'Study', duration_minutes: 25 }),
      createMockSession({ task_text: 'Study', duration_minutes: 25 }),
      createMockSession({ task_text: 'Study', duration_minutes: 50 }),
      createMockSession({ task_text: 'Exercise', duration_minutes: 30 }),
      createMockSession({ task_text: 'Exercise', duration_minutes: 30 }),
      createMockSession({ task_text: null, duration_minutes: 25 }),
    ]);
    const { result } = await renderSettled();

    const bd = result.current.taskBreakdown;
    const study = bd.find((t) => t.taskName === 'Study');
    const exercise = bd.find((t) => t.taskName === 'Exercise');
    const none = bd.find((t) => t.taskName === 'Sin tarea');

    expect(study).toEqual({ taskName: 'Study', count: 3, totalMinutes: 100 });
    expect(exercise).toEqual({
      taskName: 'Exercise',
      count: 2,
      totalMinutes: 60,
    });
    // Null task_text is grouped under the "Sin tarea" bucket.
    expect(none).toEqual({ taskName: 'Sin tarea', count: 1, totalMinutes: 25 });
  });

  it('should sort the task breakdown by count descending', async () => {
    setData([
      createMockSession({ task_text: 'A' }),
      createMockSession({ task_text: 'B' }),
      createMockSession({ task_text: 'B' }),
      createMockSession({ task_text: 'B' }),
      createMockSession({ task_text: 'C' }),
      createMockSession({ task_text: 'C' }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.taskBreakdown.map((t) => t.taskName)).toEqual([
      'B',
      'C',
      'A',
    ]);
  });

  it('should cap the task breakdown at the top 5 tasks', async () => {
    setData([
      createMockSession({ task_text: 'T1' }),
      createMockSession({ task_text: 'T2' }),
      createMockSession({ task_text: 'T3' }),
      createMockSession({ task_text: 'T4' }),
      createMockSession({ task_text: 'T5' }),
      createMockSession({ task_text: 'T6' }),
      createMockSession({ task_text: 'T7' }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.taskBreakdown).toHaveLength(5);
  });

  it('should build the breakdown only from the last 7 days', async () => {
    setData([
      createMockSession({ task_text: 'Recent', completed_at: daysAgoAt(1) }),
      createMockSession({ task_text: 'Old', completed_at: daysAgoAt(10) }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.taskBreakdown.map((t) => t.taskName)).toEqual([
      'Recent',
    ]);
  });

  // ===========================================================================
  // Weekly chart data
  // ===========================================================================

  it('should produce 7 ordered daily buckets ending on today', async () => {
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(3) }),
    ]);
    const { result } = await renderSettled();

    const weekly = result.current.weeklyData;
    expect(weekly).toHaveLength(7);
    // Only the last bucket is "today", and it holds today's 2 sessions.
    expect(weekly[6].isToday).toBe(true);
    expect(weekly[6].count).toBe(2);
    expect(weekly.filter((d) => d.isToday)).toHaveLength(1);
    // The bucket 3 days back (index 3 of a 6..0 descending build) holds 1.
    expect(weekly[3].count).toBe(1);
    // Every bucket carries a day-name label.
    expect(weekly.every((d) => typeof d.label === 'string' && d.label)).toBe(
      true
    );
  });

  // ===========================================================================
  // Edge cases
  // ===========================================================================

  it('should place sessions on the correct side of the midnight boundary', async () => {
    // 23:59 "yesterday" vs 00:01 "today": only the after-midnight one is today.
    const beforeMidnight = new Date(todayMidnight().getTime() - 60 * 1000); // -1 min
    const afterMidnight = new Date(todayMidnight().getTime() + 60 * 1000); // +1 min
    setData([
      createMockSession({ completed_at: beforeMidnight.toISOString() }),
      createMockSession({ completed_at: afterMidnight.toISOString() }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.todaySessions).toHaveLength(1);
    expect(result.current.todaySessions[0].completed_at).toBe(
      afterMidnight.toISOString()
    );
  });

  it('should recalculate when the refetch trigger changes', async () => {
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(0) }),
    ]);
    const view = await renderSettled(USER, 0);
    expect(view.result.current.todaySessions).toHaveLength(2);

    // A new pomodoro bumps totalPomodorosToday, re-running the effect.
    setData([
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(0) }),
      createMockSession({ completed_at: daysAgoAt(0) }),
    ]);
    await act(async () => {
      view.rerender({ id: USER, t: 1 });
    });

    await waitFor(() =>
      expect(view.result.current.todaySessions).toHaveLength(3)
    );
    expect(orderMock).toHaveBeenCalledTimes(2);
  });

  it('should handle a single session cleanly across all derived values', async () => {
    setData([
      createMockSession({
        completed_at: daysAgoAt(0),
        task_text: 'Solo',
        duration_minutes: 25,
      }),
    ]);
    const { result } = await renderSettled();

    expect(result.current.todaySessions).toHaveLength(1);
    expect(result.current.weekTotal).toBe(1);
    expect(result.current.streak).toBe(1);
    expect(result.current.taskBreakdown).toEqual([
      { taskName: 'Solo', count: 1, totalMinutes: 25 },
    ]);
  });
});
