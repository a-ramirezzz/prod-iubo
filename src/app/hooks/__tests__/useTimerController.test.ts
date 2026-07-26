// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// -----------------------------------------------------------------------------
// Mock strategy
// -----------------------------------------------------------------------------
// useTimerController is an orchestrator: it wires useTimer + usePomodoroEngine +
// useTimerAlert together. The actual countdown, the Supabase session persistence
// and the ≥20-minute pomodoro validation all live INSIDE those sub-hooks — the
// controller only decides *which* engine action to invoke and with what args.
//
// So we mock all three sub-hooks and assert on the controller's real contract:
//   - the onComplete callback it hands to useTimer routes to the right engine
//     action based on the current phase (completeSession vs completeBreak),
//   - its handlers call startTimer / startWorkSession / stopTimer correctly,
//   - its custom-input validation and stop-confirmation flags behave.
//
// `capturedOnComplete` lets a test fire the "timer reached 0" event by hand,
// and the shared `engineMock` / `timerMock` objects are mutated to drive state.
// -----------------------------------------------------------------------------

let capturedOnComplete: (() => void) | undefined;

const timerMock = {
  timeParts: { hours: '00', minutes: '25', seconds: '00' },
  isActive: false,
  totalSeconds: 0,
  initialTimeSet: 0,
  timerRestored: false,
  startTimer: vi.fn(),
  togglePause: vi.fn(),
  resetTimer: vi.fn(),
  stopTimer: vi.fn(),
};

const engineMock = {
  currentPhase: 'idle' as 'idle' | 'work' | 'short_break' | 'long_break',
  cycleCount: 0,
  totalPomodorosToday: 0,
  sessionStartedAt: null as Date | null,
  startWorkSession: vi.fn(),
  completeSession: vi.fn(),
  startBreak: vi.fn(),
  completeBreak: vi.fn(),
  resetCycle: vi.fn(),
};

const triggerLongBreakAlert = vi.fn();
const triggerAlert = vi.fn();

vi.mock('@/hooks/useTimer', () => ({
  useTimer: vi.fn((_enable: boolean, onComplete?: () => void) => {
    capturedOnComplete = onComplete;
    return timerMock;
  }),
}));

vi.mock('@/hooks/usePomodoroEngine', () => ({
  usePomodoroEngine: vi.fn(() => engineMock),
}));

vi.mock('@/hooks/useTimerAlert', () => ({
  useTimerAlert: vi.fn(() => ({ triggerAlert, triggerLongBreakAlert })),
}));

// The controller never touches Supabase directly (the engine does), but we mock
// the client defensively so nothing real is ever instantiated.
vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({ from: vi.fn() })),
}));

import { useTimerController } from '@/app/hooks/useTimerController';

const USER = 'user-123';

interface Params {
  enableDesktopNotifications?: boolean;
  confirmOnStop?: boolean;
  currentTaskText?: string | undefined;
  userId?: string | null;
}

const render = (params: Params = {}) =>
  renderHook(() =>
    useTimerController({
      enableDesktopNotifications: params.enableDesktopNotifications ?? false,
      confirmOnStop: params.confirmOnStop ?? false,
      currentTaskText: params.currentTaskText,
      userId: params.userId ?? USER,
    })
  );

describe('useTimerController', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    capturedOnComplete = undefined;

    // Reset shared timer mock state.
    timerMock.isActive = false;
    timerMock.totalSeconds = 0;
    timerMock.initialTimeSet = 0;
    timerMock.startTimer.mockClear();
    timerMock.togglePause.mockClear();
    timerMock.resetTimer.mockClear();
    timerMock.stopTimer.mockClear();

    // Reset shared engine mock state.
    engineMock.currentPhase = 'idle';
    engineMock.cycleCount = 0;
    engineMock.startWorkSession.mockClear();
    engineMock.completeSession.mockClear();
    engineMock.startBreak.mockClear();
    engineMock.completeBreak.mockClear();
    engineMock.resetCycle.mockClear();

    triggerLongBreakAlert.mockClear();
    triggerAlert.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize in idle state with no active session', () => {
    const { result } = render();
    expect(result.current.isActive).toBe(false);
    expect(result.current.totalSeconds).toBe(0);
    expect(result.current.pomodoroEngine.currentPhase).toBe('idle');
    expect(result.current.showStopConfirm).toBe(false);
    expect(result.current.showInvalidTimeModal).toBe(false);
  });

  it('should start a work session when user selects a time and starts', () => {
    const { result } = render();
    act(() => {
      result.current.handleStartTimer(25);
    });
    expect(timerMock.startTimer).toHaveBeenCalledWith(25);
    // From idle, the engine begins a work session sized in seconds.
    expect(engineMock.startWorkSession).toHaveBeenCalledWith(25 * 60);
  });

  it('should advance the cycle (completeSession) when the work timer reaches 0', () => {
    engineMock.currentPhase = 'work';
    render({ currentTaskText: 'Write tests' });

    // Fire the "timer reached zero" event the controller handed to useTimer.
    act(() => {
      capturedOnComplete?.();
    });

    expect(engineMock.completeSession).toHaveBeenCalledWith('Write tests');
    expect(engineMock.completeBreak).not.toHaveBeenCalled();
  });

  it('should delegate session saving to the engine with the current task text', () => {
    engineMock.currentPhase = 'work';
    render({ currentTaskText: 'Deep work' });

    act(() => {
      capturedOnComplete?.();
    });

    // Persistence + the ≥20-min validation live in the engine; the controller's
    // job is to forward the completed work session (with its task label) to it.
    expect(engineMock.completeSession).toHaveBeenCalledTimes(1);
    expect(engineMock.completeSession).toHaveBeenCalledWith('Deep work');
  });

  it('should pass null task text (not save a labelled session) when none is set', () => {
    engineMock.currentPhase = 'work';
    render({ currentTaskText: undefined });

    act(() => {
      capturedOnComplete?.();
    });

    expect(engineMock.completeSession).toHaveBeenCalledWith(null);
  });

  it('should NOT complete a work session when a break timer reaches 0', () => {
    engineMock.currentPhase = 'short_break';
    render({ currentTaskText: 'Ignored' });

    act(() => {
      capturedOnComplete?.();
    });

    // A break ending must never persist a pomodoro — only end the break.
    expect(engineMock.completeSession).not.toHaveBeenCalled();
    expect(engineMock.completeBreak).toHaveBeenCalledTimes(1);
  });

  it('should show a confirmation instead of stopping when confirmOnStop is true', () => {
    const { result } = render({ confirmOnStop: true });
    act(() => {
      result.current.handleStopWithConfirmation();
    });
    expect(result.current.showStopConfirm).toBe(true);
    expect(timerMock.stopTimer).not.toHaveBeenCalled();
  });

  it('should stop immediately when confirmOnStop is false', () => {
    const { result } = render({ confirmOnStop: false });
    act(() => {
      result.current.handleStopWithConfirmation();
    });
    expect(timerMock.stopTimer).toHaveBeenCalledTimes(1);
    expect(result.current.showStopConfirm).toBe(false);
  });

  it('should start with a custom duration and clear the inputs on a valid entry', () => {
    const { result } = render();
    act(() => {
      result.current.setCustomHoursInput('1');
      result.current.setCustomMinutesInput('30');
    });
    act(() => {
      result.current.handleCustomStart();
    });
    // 1h30m => 90 minutes.
    expect(timerMock.startTimer).toHaveBeenCalledWith(90);
    expect(engineMock.startWorkSession).toHaveBeenCalledWith(90 * 60);
    expect(result.current.customHoursInput).toBe('');
    expect(result.current.customMinutesInput).toBe('');
    expect(result.current.showInvalidTimeModal).toBe(false);
  });

  it('should show the invalid-time modal and not start on an empty/zero custom entry', () => {
    const { result } = render();
    act(() => {
      result.current.handleCustomStart();
    });
    expect(result.current.showInvalidTimeModal).toBe(true);
    expect(timerMock.startTimer).not.toHaveBeenCalled();
    expect(engineMock.startWorkSession).not.toHaveBeenCalled();
  });

  it('should start the earned break at 15 min for a long break and 5 min otherwise', () => {
    // Long break earned.
    engineMock.currentPhase = 'long_break';
    const { result: longResult } = render();
    act(() => {
      longResult.current.handleFocusStartBreak();
    });
    expect(engineMock.startBreak).toHaveBeenCalledTimes(1);
    expect(timerMock.startTimer).toHaveBeenLastCalledWith(15);

    // Short break.
    timerMock.startTimer.mockClear();
    engineMock.currentPhase = 'short_break';
    const { result: shortResult } = render();
    act(() => {
      shortResult.current.handleFocusStartBreak();
    });
    expect(timerMock.startTimer).toHaveBeenLastCalledWith(5);
  });

  it('should follow a full Pomodoro cycle: work → short_break → work → long_break', () => {
    render({ currentTaskText: 'Cycle' });

    // Three work sessions each followed by a short break, then a 4th work
    // session that earns a long break. We drive the phase the way the engine
    // would, and assert the controller routes each completion correctly.
    for (let i = 0; i < 3; i++) {
      engineMock.currentPhase = 'work';
      act(() => capturedOnComplete?.());
      engineMock.currentPhase = 'short_break';
      act(() => capturedOnComplete?.());
    }
    // 4th work session -> long break earned.
    engineMock.currentPhase = 'work';
    act(() => capturedOnComplete?.());
    engineMock.currentPhase = 'long_break';
    act(() => capturedOnComplete?.());

    expect(engineMock.completeSession).toHaveBeenCalledTimes(4);
    expect(engineMock.completeBreak).toHaveBeenCalledTimes(4);
  });

  it('should not throw if the completion event fires after the component unmounts', () => {
    engineMock.currentPhase = 'work';
    const { unmount } = render({ currentTaskText: 'Late' });

    unmount();

    // A pending completion firing post-unmount must be a no-op crash-wise.
    expect(() => {
      act(() => {
        capturedOnComplete?.();
      });
    }).not.toThrow();
  });
});
