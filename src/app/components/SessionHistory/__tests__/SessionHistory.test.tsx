// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { SessionRow } from '@/app/types/session';
import type { DateFilter } from '@/app/hooks/useSessionHistory';

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key, locale: 'en' }),
}));

const useSessionHistoryMock = vi.fn();

vi.mock('@/app/hooks/useSessionHistory', () => ({
  useSessionHistory: (...args: unknown[]) => useSessionHistoryMock(...args),
}));

import SessionHistory from '../SessionHistory';

const USER = 'user-1';

function makeSession(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: '1',
    started_at: '2026-08-05T10:00:00Z',
    completed_at: '2026-08-05T10:25:00Z',
    duration_minutes: 25,
    session_type: 'work',
    task_text: 'Study React',
    completed: true,
    ...overrides,
  };
}

function mockReturn(overrides: Partial<ReturnType<typeof baseReturn>> = {}) {
  const value = { ...baseReturn(), ...overrides };
  useSessionHistoryMock.mockReturnValue(value);
  return value;
}

function baseReturn() {
  return {
    sessions: [] as SessionRow[],
    isLoading: false,
    error: null as string | null,
    dateFilter: '30d' as DateFilter,
    setDateFilter: vi.fn(),
    page: 0,
    totalPages: 0,
    goToPage: vi.fn(),
    nextPage: vi.fn(),
    prevPage: vi.fn(),
    hasNextPage: false,
    hasPrevPage: false,
  };
}

describe('SessionHistory', () => {
  beforeEach(() => {
    useSessionHistoryMock.mockReset();
    mockReturn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when userId is null', () => {
    const { container } = render(<SessionHistory userId={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows loading state while fetching', () => {
    mockReturn({ isLoading: true, sessions: [] });
    render(<SessionHistory userId={USER} />);
    expect(screen.getByRole('status')).toBeTruthy();
  });

  it('shows empty state when no sessions match filter', () => {
    mockReturn({ isLoading: false, sessions: [], totalPages: 0 });
    render(<SessionHistory userId={USER} />);
    expect(screen.getByText('focus.history.empty')).toBeTruthy();
  });

  it('renders session rows with correct data', () => {
    mockReturn({ sessions: [makeSession()] });
    render(<SessionHistory userId={USER} />);
    expect(screen.getAllByText(/25/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByText((_, node) => node?.textContent === '25 focus.history.minutes').length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText('Study React').length).toBeGreaterThan(0);
  });

  it('shows dash or placeholder for sessions without task', () => {
    mockReturn({ sessions: [makeSession({ task_text: null })] });
    render(<SessionHistory userId={USER} />);
    expect(screen.getAllByText('focus.history.noTask').length).toBeGreaterThan(0);
  });

  it('renders date filter pills and active state', () => {
    mockReturn({ dateFilter: '30d' });
    render(<SessionHistory userId={USER} />);
    const group = screen.getByRole('group');
    const buttons = group.querySelectorAll('button');
    expect(buttons.length).toBe(4);
    const active = screen.getByText('focus.history.filter30d');
    expect(active.getAttribute('aria-pressed')).toBe('true');
  });

  it('calls setDateFilter when a filter pill is clicked', () => {
    const setDateFilter = vi.fn();
    mockReturn({ setDateFilter });
    render(<SessionHistory userId={USER} />);
    fireEvent.click(screen.getByText('focus.history.filter7d'));
    expect(setDateFilter).toHaveBeenCalledWith('7d');
  });

  it('shows pagination when totalPages > 1', () => {
    mockReturn({
      sessions: [makeSession()],
      totalPages: 3,
      page: 1,
      hasNextPage: true,
      hasPrevPage: true,
    });
    render(<SessionHistory userId={USER} />);
    const prev = screen.getByText('focus.history.prev');
    const next = screen.getByText('focus.history.next');
    expect(prev.hasAttribute('disabled')).toBe(false);
    expect(next.hasAttribute('disabled')).toBe(false);
    expect(screen.getByText('focus.history.pageOf')).toBeTruthy();
  });

  it('hides pagination when totalPages <= 1', () => {
    mockReturn({ sessions: [makeSession()], totalPages: 1 });
    render(<SessionHistory userId={USER} />);
    expect(screen.queryByText('focus.history.prev')).toBeNull();
    expect(screen.queryByText('focus.history.next')).toBeNull();
  });

  it('calls nextPage/prevPage on pagination button clicks', () => {
    const nextPage = vi.fn();
    const prevPage = vi.fn();
    mockReturn({
      sessions: [makeSession()],
      totalPages: 3,
      page: 1,
      hasNextPage: true,
      hasPrevPage: true,
      nextPage,
      prevPage,
    });
    render(<SessionHistory userId={USER} />);
    fireEvent.click(screen.getByText('focus.history.next'));
    expect(nextPage).toHaveBeenCalled();
    fireEvent.click(screen.getByText('focus.history.prev'));
    expect(prevPage).toHaveBeenCalled();
  });
});
