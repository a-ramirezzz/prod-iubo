// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

import FocusMode from '../FocusMode';

function renderFocusMode(overrides: Partial<React.ComponentProps<typeof FocusMode>> = {}) {
  const props = {
    timeDisplay: '24:59',
    isRunning: true,
    currentPhase: 'work',
    taskText: 'Build tests',
    onToggleTimer: vi.fn(),
    onExit: vi.fn(),
    ...overrides,
  };
  const result = render(<FocusMode {...props} />);
  return { ...result, props };
}

describe('FocusMode', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the timer display prominently', () => {
    renderFocusMode();
    expect(screen.getByText('24:59')).toBeTruthy();
  });

  it('renders the current task text', () => {
    renderFocusMode();
    expect(screen.getByText('Build tests')).toBeTruthy();
  });

  it('does not render task area when taskText is null', () => {
    renderFocusMode({ taskText: null });
    expect(screen.queryByText('Build tests')).toBeNull();
  });

  it('renders phase label for work phase', () => {
    renderFocusMode({ currentPhase: 'work' });
    expect(screen.getByText('app.focusMode.work')).toBeTruthy();
  });

  it('renders phase label for short break', () => {
    renderFocusMode({ currentPhase: 'short_break' });
    expect(screen.getByText('app.focusMode.shortBreak')).toBeTruthy();
  });

  it('calls onToggleTimer when play/pause button is clicked', () => {
    const onToggleTimer = vi.fn();
    renderFocusMode({ onToggleTimer });
    fireEvent.click(screen.getByRole('button', { name: 'app.focusMode.pause' }));
    expect(onToggleTimer).toHaveBeenCalledTimes(1);
  });

  it('calls onExit when exit is triggered', () => {
    const onExit = vi.fn();
    renderFocusMode({ onExit });
    fireEvent.click(screen.getByRole('button', { name: 'app.focusMode.title' }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('has correct accessibility attributes', () => {
    renderFocusMode();
    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    const playPause = screen.getByRole('button', { name: 'app.focusMode.pause' });
    expect(playPause.getAttribute('aria-label')).toBe('app.focusMode.pause');
  });

  it('shows exit hint initially then hides after timeout', () => {
    vi.useFakeTimers();
    try {
      renderFocusMode();
      const hint = screen.getByText('app.focusMode.exitHint', { selector: 'span' });
      expect(hint.className).toMatch(/exitHintVisible/);
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(hint.className).not.toMatch(/exitHintVisible/);
    } finally {
      vi.useRealTimers();
    }
  });

  it('cleans up timers on unmount', () => {
    vi.useFakeTimers();
    try {
      const { unmount } = renderFocusMode();
      unmount();
      expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });
});
