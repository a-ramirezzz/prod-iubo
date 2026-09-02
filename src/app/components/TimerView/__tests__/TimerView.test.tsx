// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import type { ComponentProps } from 'react';
import type { Task } from '@/app/types';

expect.extend(toHaveNoViolations);

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

import TimerView from '../TimerView';

function makeDefaultProps(overrides: Record<string, unknown> = {}) {
  return {
    timeParts: { hours: '00', minutes: '24', seconds: '59' },
    isActive: false,
    totalSeconds: 1499,
    initialTimeSet: 0,
    togglePause: vi.fn(),
    resetTimer: vi.fn(),
    stopTimer: vi.fn(),
    handleStartTimer: vi.fn(),
    handleCustomStart: vi.fn(),
    handleStopWithConfirmation: vi.fn(),
    customHoursInput: '',
    setCustomHoursInput: vi.fn(),
    customMinutesInput: '',
    setCustomMinutesInput: vi.fn(),
    isMiniMode: false,
    setIsMiniMode: vi.fn(),
    onEnterFocusMode: vi.fn(),
    tasks: [] as Task[],
    tasksLoading: false,
    handleAddTask: vi.fn(),
    handleToggleTask: vi.fn(),
    handleDeleteTask: vi.fn(),
    handleReorderTasks: vi.fn(),
    isTaskModalOpen: false,
    setIsTaskModalOpen: vi.fn(),
    showInvalidTimeModal: false,
    setShowInvalidTimeModal: vi.fn(),
    showStopConfirm: false,
    setShowStopConfirm: vi.fn(),
    ...overrides,
  };
}

function renderTimerView(overrides: Record<string, unknown> = {}) {
  const props = makeDefaultProps(overrides);
  const result = render(<TimerView {...(props as ComponentProps<typeof TimerView>)} />);
  return { ...result, props };
}

describe('TimerView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should have no accessibility violations', async () => {
    const { container } = renderTimerView({ timeParts: { hours: '00', minutes: '24', seconds: '59' } });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  }, 20_000);

  describe('timer display', () => {
    it('renders the formatted time display', () => {
      renderTimerView({ timeParts: { hours: '00', minutes: '24', seconds: '59' } });
      expect(screen.getByText('24')).toBeTruthy();
      expect(screen.getByText('59')).toBeTruthy();
    });

    it('renders "00:00" when timer is at zero', () => {
      renderTimerView({ timeParts: { hours: '00', minutes: '00', seconds: '00' } });
      expect(screen.getAllByText('00').length).toBe(3);
    });
  });

  describe('controls', () => {
    it('calls handleStartTimer when a preset button is clicked', () => {
      const handleStartTimer = vi.fn();
      renderTimerView({ handleStartTimer });
      fireEvent.click(screen.getByText('25 min'));
      expect(handleStartTimer).toHaveBeenCalledWith(25);
    });

    it('does not render pause/reset/stop controls before a time is set', () => {
      renderTimerView({ initialTimeSet: 0 });
      expect(screen.queryByLabelText('app.timer.controls.stopAria')).toBeNull();
    });

    it('calls togglePause when the pause button is clicked (running state)', () => {
      const togglePause = vi.fn();
      renderTimerView({ initialTimeSet: 1500, isActive: true, togglePause });
      fireEvent.click(screen.getByLabelText('app.timer.controls.pauseAria'));
      expect(togglePause).toHaveBeenCalledTimes(1);
    });

    it('calls togglePause when the resume button is clicked (paused state)', () => {
      const togglePause = vi.fn();
      renderTimerView({ initialTimeSet: 1500, isActive: false, totalSeconds: 800, togglePause });
      fireEvent.click(screen.getByLabelText('app.timer.controls.resumeAria'));
      expect(togglePause).toHaveBeenCalledTimes(1);
    });

    it('calls handleStopWithConfirmation when the stop button is clicked', () => {
      const handleStopWithConfirmation = vi.fn();
      renderTimerView({ initialTimeSet: 1500, isActive: true, handleStopWithConfirmation });
      fireEvent.click(screen.getByLabelText('app.timer.controls.stopAria'));
      expect(handleStopWithConfirmation).toHaveBeenCalledTimes(1);
    });

    it('shows the stop confirmation modal when showStopConfirm is true', () => {
      renderTimerView({ initialTimeSet: 1500, isActive: true, showStopConfirm: true });
      expect(screen.getByText('app.timer.confirmStop.message')).toBeTruthy();
    });

    it('confirming the stop modal calls stopTimer and closes the modal', () => {
      const stopTimer = vi.fn();
      const setShowStopConfirm = vi.fn();
      renderTimerView({
        initialTimeSet: 1500,
        isActive: true,
        showStopConfirm: true,
        stopTimer,
        setShowStopConfirm,
      });
      fireEvent.click(screen.getByText('app.timer.confirmStop.confirm'));
      expect(stopTimer).toHaveBeenCalledTimes(1);
      expect(setShowStopConfirm).toHaveBeenCalledWith(false);
    });

    it('cancelling the stop modal only closes it, without stopping the timer', () => {
      const stopTimer = vi.fn();
      const setShowStopConfirm = vi.fn();
      renderTimerView({
        initialTimeSet: 1500,
        isActive: true,
        showStopConfirm: true,
        stopTimer,
        setShowStopConfirm,
      });
      fireEvent.click(screen.getByText('app.confirmModal.defaultCancel'));
      expect(stopTimer).not.toHaveBeenCalled();
      expect(setShowStopConfirm).toHaveBeenCalledWith(false);
    });

    it('calls resetTimer when the reset button is clicked', () => {
      const resetTimer = vi.fn();
      renderTimerView({ initialTimeSet: 1500, isActive: true, resetTimer });
      fireEvent.click(screen.getByLabelText('app.timer.controls.resetAria'));
      expect(resetTimer).toHaveBeenCalledTimes(1);
    });
  });

  describe('mini mode', () => {
    it('renders the mini mode toggle button', () => {
      renderTimerView({ isMiniMode: false });
      expect(screen.getByText('app.timer.miniMode')).toBeTruthy();
    });

    it('calls setIsMiniMode with the toggled value when clicked', () => {
      const setIsMiniMode = vi.fn();
      renderTimerView({ isMiniMode: false, setIsMiniMode });
      fireEvent.click(screen.getByText('app.timer.miniMode'));
      expect(setIsMiniMode).toHaveBeenCalledWith(true);
    });

    it('hides the setup controls and task section when isMiniMode is true', () => {
      renderTimerView({ isMiniMode: true });
      expect(screen.getByText('app.timer.fullView')).toBeTruthy();
      expect(screen.queryByText('25 min')).toBeNull();
      expect(screen.queryByText('app.tasks.sectionTitle')).toBeNull();
    });
  });

  describe('custom time input', () => {
    it('shows the invalid time modal when showInvalidTimeModal is true', () => {
      renderTimerView({ showInvalidTimeModal: true });
      expect(screen.getByText('app.timer.invalidTime')).toBeTruthy();
    });

    it('dismissing the invalid time modal calls setShowInvalidTimeModal(false)', () => {
      const setShowInvalidTimeModal = vi.fn();
      renderTimerView({ showInvalidTimeModal: true, setShowInvalidTimeModal });
      fireEvent.click(screen.getByText('app.confirmModal.defaultConfirm'));
      expect(setShowInvalidTimeModal).toHaveBeenCalledWith(false);
    });

    it('calls setCustomHoursInput/setCustomMinutesInput as the user types', () => {
      const setCustomHoursInput = vi.fn();
      const setCustomMinutesInput = vi.fn();
      renderTimerView({ setCustomHoursInput, setCustomMinutesInput });
      fireEvent.change(screen.getByLabelText('app.timer.customInput.hoursAria'), {
        target: { value: '2' },
      });
      expect(setCustomHoursInput).toHaveBeenCalledWith('2');
      fireEvent.change(screen.getByLabelText('app.timer.customInput.minutesAria'), {
        target: { value: '30' },
      });
      expect(setCustomMinutesInput).toHaveBeenCalledWith('30');
    });

    it('calls handleCustomStart when the custom start button is clicked and enabled', () => {
      const handleCustomStart = vi.fn();
      renderTimerView({ customHoursInput: '1', customMinutesInput: '', handleCustomStart });
      fireEvent.click(screen.getByLabelText('app.timer.customInput.startAria'));
      expect(handleCustomStart).toHaveBeenCalledTimes(1);
    });

    it('disables the custom start button when both custom inputs are empty', () => {
      renderTimerView({ customHoursInput: '', customMinutesInput: '' });
      expect(
        (screen.getByLabelText('app.timer.customInput.startAria') as HTMLButtonElement).disabled
      ).toBe(true);
    });
  });

  describe('conditional rendering', () => {
    it('shows a loading message instead of the task list while tasks are loading and empty', () => {
      renderTimerView({ tasksLoading: true, tasks: [] });
      expect(screen.getByText('app.tasks.loading')).toBeTruthy();
    });

    it('renders the task list once tasks are available, even if still "loading"', () => {
      const tasks: Task[] = [{ id: '1', text: 'Study React', completed: false, position: 0 }];
      renderTimerView({ tasksLoading: true, tasks });
      expect(screen.queryByText('app.tasks.loading')).toBeNull();
      expect(screen.getByText('Study React')).toBeTruthy();
    });

    it('shows the focus mode button when initialTimeSet is greater than zero', () => {
      renderTimerView({ initialTimeSet: 1500 });
      expect(screen.getByLabelText('app.focusMode.enter (F)')).toBeTruthy();
    });

    it('hides the focus mode button when idle with no time set', () => {
      renderTimerView({ initialTimeSet: 0 });
      expect(screen.queryByLabelText('app.focusMode.enter (F)')).toBeNull();
    });
  });
});
