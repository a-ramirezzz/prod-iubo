// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ComponentProps } from 'react';
import type { SessionRow, TaskBreakdown } from '@/app/hooks/usePomodoroStats';
import type { PomodoroPhase } from '@/app/hooks/usePomodoroEngine';

expect.extend(toHaveNoViolations);

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

vi.mock('@/app/components/SessionHistory/SessionHistory', () => ({
  default: () => <div data-testid="session-history-stub" />,
}));

import FocusSection from '../FocusSection';

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    completed_at: '2026-08-06T10:25:00Z',
    started_at: '2026-08-06T10:00:00Z',
    task_text: 'Study React',
    duration_minutes: 25,
    session_type: 'work',
    ...overrides,
  };
}

function makeDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'user-1',
    totalPomodorosToday: 0,
    cycleCount: 0,
    currentPhase: 'idle' as PomodoroPhase,
    dailyPomodoroGoal: 4,
    todaySessions: [] as SessionRow[],
    weekTotal: 0,
    weeklyData: [] as { label: string; count: number; isToday: boolean }[],
    streak: 0,
    taskBreakdown: [] as TaskBreakdown[],
    statsLoading: false,
    statsRevalidating: false,
    statsError: false,
    onStartWork: vi.fn(),
    onStartBreak: vi.fn(),
    ...overrides,
  };
}

function renderFocusSection(overrides: Record<string, unknown> = {}) {
  const props = makeDefaultProps(overrides);
  const result = render(<FocusSection {...(props as ComponentProps<typeof FocusSection>)} />);
  return { ...result, props };
}

describe('FocusSection', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('loading state', () => {
    it('shows loading skeletons when stats are loading', () => {
      const { container } = renderFocusSection({ statsLoading: true });
      expect(container.querySelectorAll('[class*="skeleton"]').length).toBeGreaterThan(0);
    });

    it('does not show stats content while loading', () => {
      renderFocusSection({ statsLoading: true, weekTotal: 15 });
      expect(screen.queryByText('focus.stats.thisWeek')).toBeNull();
      expect(screen.queryByText('15')).toBeNull();
    });
  });

  describe('error state', () => {
    it('shows an error message when statsError is true', () => {
      renderFocusSection({ statsError: true });
      expect(screen.getAllByText('focus.log.error').length).toBeGreaterThan(0);
    });
  });

  describe('loaded state', () => {
    it('should have no accessibility violations when loaded', async () => {
      const { container } = renderFocusSection({
        todaySessions: [
          makeSession({ task_text: 'Study React' }),
          makeSession({ task_text: 'Write tests' }),
        ],
        weekTotal: 15,
        streak: 5,
        taskBreakdown: [{ taskName: 'Study', count: 5, totalMinutes: 125 }],
      });
      // Higher timeout: the 365-day ActivityHeatmap grid adds enough DOM nodes
      // that axe's full scan can exceed the default 5s in CI.
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    }, 20000);

    it("renders today's session log entries", () => {
      renderFocusSection({
        todaySessions: [
          makeSession({ task_text: 'Study React' }),
          makeSession({ task_text: 'Write tests' }),
        ],
      });
      expect(screen.getByText('Study React')).toBeTruthy();
      expect(screen.getByText('Write tests')).toBeTruthy();
    });

    it('renders weekly total', () => {
      renderFocusSection({ weekTotal: 15 });
      expect(screen.getByText('15')).toBeTruthy();
    });

    it('renders current streak', () => {
      renderFocusSection({ streak: 5 });
      expect(screen.getByText('5 focus.stats.days')).toBeTruthy();
    });

    it('renders singular day label when streak is 1', () => {
      renderFocusSection({ streak: 1 });
      expect(screen.getByText('1 focus.stats.day')).toBeTruthy();
    });

    it('renders zero state correctly', () => {
      renderFocusSection({
        todaySessions: [],
        weekTotal: 0,
        streak: 0,
        taskBreakdown: [],
      });
      expect(screen.getByText('focus.log.empty')).toBeTruthy();
      expect(screen.getByText('focus.taskBreakdown.empty')).toBeTruthy();
      // Both the current-streak stat row and the StatsMetricsGrid's longest-streak
      // card render "0 focus.stats.days" at their zero defaults.
      expect(screen.getAllByText('0 focus.stats.days').length).toBeGreaterThan(0);
    });
  });

  describe('revalidation indicator', () => {
    it('shows the revalidating indicator when statsRevalidating is true', () => {
      renderFocusSection({ statsRevalidating: true, statsLoading: false });
      expect(screen.getByRole('status', { name: 'focus.stats.refreshing' })).toBeTruthy();
    });

    it('hides the revalidating indicator when not revalidating', () => {
      renderFocusSection({ statsRevalidating: false });
      expect(screen.queryByRole('status', { name: 'focus.stats.refreshing' })).toBeNull();
    });
  });

  describe('phase labels and CTA', () => {
    it('renders correct label for work phase', () => {
      renderFocusSection({ currentPhase: 'work' });
      expect(screen.getByText('focus.cycle.phases.work')).toBeTruthy();
      expect(screen.getByText('focus.cycle.cta.working')).toBeTruthy();
    });

    it('renders correct label for short break phase', () => {
      renderFocusSection({ currentPhase: 'short_break' });
      expect(screen.getByText('focus.cycle.phases.short_break')).toBeTruthy();
      expect(screen.getByText('focus.cycle.cta.shortBreak')).toBeTruthy();
    });

    it('renders correct label for idle phase', () => {
      renderFocusSection({ currentPhase: 'idle' });
      expect(screen.getByText('focus.cycle.phases.idle')).toBeTruthy();
      expect(screen.getByText('focus.cycle.cta.start')).toBeTruthy();
    });
  });

  describe('task breakdown', () => {
    it('renders task breakdown entries', () => {
      renderFocusSection({
        taskBreakdown: [
          { taskName: 'Study', count: 5, totalMinutes: 125 },
          { taskName: 'Code', count: 3, totalMinutes: 75 },
        ],
      });
      expect(screen.getByText('Study')).toBeTruthy();
      expect(screen.getByText('Code')).toBeTruthy();
      expect(screen.getByText('5 🍅')).toBeTruthy();
      expect(screen.getByText('3 🍅')).toBeTruthy();
    });

    it('renders empty state when there is no task breakdown', () => {
      renderFocusSection({ taskBreakdown: [] });
      expect(screen.getByText('focus.taskBreakdown.empty')).toBeTruthy();
    });
  });

  describe('session history integration', () => {
    it('renders the SessionHistory component', () => {
      renderFocusSection();
      expect(screen.getByTestId('session-history-stub')).toBeTruthy();
    });
  });
});
