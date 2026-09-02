// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/page.tsx
'use client';

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import styles from '@/app/Page.module.css';
import tabTransitionStyles from '@/app/components/TabTransition/TabTransition.module.css';

// Custom Hooks for Core Logic
import { useTimerController } from '@/hooks/useTimerController';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePomodoroStats, type StatsPeriod } from '@/hooks/usePomodoroStats';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useAchievements } from '@/hooks/useAchievements';
import { useSettings } from '@/context/SettingsContext';
import { usePipTimer } from '@/hooks/usePipTimer';
import { useHorizontalPipTimer } from '@/hooks/useHorizontalPipTimer';
import { useSystemTheme } from '@/hooks/useSystemTheme';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/app/lib/i18n';
import { useRouter } from 'next/navigation';

// UI Component Imports
import ProjectBranding from '@/components/ProjectBranding/ProjectBranding';
import SettingsButton from '@/components/SettingsButton/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel';
import VisualNotification from '@/components/Notification/Notification';
import TimerTab from './TimerTab';
import OnboardingTour from '@/app/components/OnboardingTour/OnboardingTour';
import ContextualHintsManager from '@/app/components/ContextualTooltip/ContextualHintsManager';
import LocaleSync from './LocaleSync';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { ConnectionIndicator } from '@/app/components/ConnectionIndicator';
import { ShortcutsModal } from '@/app/components/ShortcutsModal';
import { SyncDetailsPanel } from '@/app/components/SyncDetailsPanel';
import FocusMode from '@/app/components/FocusMode/FocusMode';
import AchievementNotification from '@/app/components/AchievementNotification/AchievementNotification';

// Lazily loaded: only the visible tab's component needs to be on the wire.
// The hooks that feed these tabs stay mounted in this page unconditionally —
// only the presentational component is deferred.
const FocusTab = dynamic(() => import('./FocusTab'), {
  loading: () => <div className={styles.tabLoadingPlaceholder}>Loading…</div>,
});
const AchievementsTab = dynamic(() => import('@/app/components/AchievementsTab/AchievementsTab'), {
  loading: () => <div className={styles.tabLoadingPlaceholder}>Loading…</div>,
});

/**
 * HomePage is the main component of the application, serving as the central hub
 * for all primary user interactions. It integrates timer logic, task management,
 * and user settings to create a cohesive productivity experience.
 */
export default function HomePage() {
  // =================================================================
  // SECTION: State and Hooks
  // =================================================================

  // Global settings from context
  const { settings, updateSettings, loading: settingsLoading } = useSettings();

  // Mark the onboarding tour as seen so it never shows again (persists to Supabase).
  const handleOnboardingComplete = useCallback(() => {
    updateSettings({ has_seen_onboarding: true });
  }, [updateSettings]);

  const { t } = useLocale();

  const { user, loading: authLoading, sessionExpired } = useAuth();

  // Task management for the current session.
  const {
    tasks,
    loading: tasksLoading,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleReorderTasks,
  } = useTaskManager(user?.id ?? null, !!settings.notification_sound_enabled);

  // Auto-syncs queued offline mutations once the connection is back.
  const {
    pendingCount: syncPendingCount,
    failedCount: syncFailedCount,
    isSyncing,
    lastSyncResult,
    syncNow,
  } = useSyncQueue(user?.id ?? null);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  // Memoized so the memoized ConnectionIndicator doesn't re-render on every timer tick.
  const onOpenSyncDetails = useCallback(() => setShowSyncDetails(true), []);

  // Name of the first incomplete task, shown as "current task" in the horizontal PiP window.
  const currentTaskText = tasks.find(task => !task.completed)?.text;

  // Timer + Pomodoro engine orchestration.
  const {
    stopTimer,
    customHoursInput,
    setCustomHoursInput,
    customMinutesInput,
    setCustomMinutesInput,
    pomodoroEngine,
    handleStartTimer,
    handleCustomStart,
    handleStopWithConfirmation,
    handleConfirmStop,
    handleFocusStartWork,
    handleFocusStartBreak,
    showInvalidTimeModal,
    setShowInvalidTimeModal,
    showStopConfirm,
    setShowStopConfirm,
    showVisualNotification,
    setShowVisualNotification,
    // Stopwatch mode
    timerMode,
    canSwitchTimerMode,
    handleSetTimerMode,
    handleStartStopwatch,
    handleCompleteStopwatch,
    // Mode-aware display values (whichever of Pomodoro/Stopwatch is active)
    displayTimeParts: timeParts,
    displayIsActive: isActive,
    displayTotalSeconds: totalSeconds,
    displayInitialTimeSet: initialTimeSet,
    displayTogglePause: togglePause,
    displayResetTimer: resetTimer,
  } = useTimerController({
    enableDesktopNotifications: !!settings.enable_desktop_notifications,
    confirmOnStop: settings.confirm_on_stop,
    currentTaskText,
    userId: user?.id ?? null,
    notificationSoundEnabled: !!settings.notification_sound_enabled,
    volume: settings.volume,
  });

  // Selected window for the task breakdown and StatsMetricsGrid (client-side filter
  // over the hook's already-fetched 365-day session list — not persisted).
  const [statsPeriod, setStatsPeriod] = useState<StatsPeriod>('30d');

  // Productivity statistics shared between the Focus tab and Settings panel.
  const pomodoroStats = usePomodoroStats(
    user?.id ?? null,
    pomodoroEngine.totalPomodorosToday,
    statsPeriod
  );

  // Gamification: evaluates progress against achievement thresholds and
  // surfaces newly unlocked ones as a toast notification.
  const achievements = useAchievements({
    userId: user?.id ?? null,
    currentStreak: pomodoroStats.streak,
    totalPomodorosToday: pomodoroEngine.totalPomodorosToday,
    hapticsEnabled: !!settings.notification_sound_enabled,
  });

  // Local UI state for this page
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  // State to control the visibility of the task objectives modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // Active tab: classic timer view, the Focus (Pomodoro cycle) view, or Achievements.
  const [activeTab, setActiveTab] = useState<'timer' | 'focus' | 'achievements'>('timer');
  // The tab actually rendered on screen. Lags behind `activeTab` by one fade-out
  // cycle so the outgoing tab's content stays mounted (and visible) while it
  // animates out, instead of being swapped in the same frame.
  const [displayedTab, setDisplayedTab] = useState<'timer' | 'focus' | 'achievements'>('timer');
  const [tabTransitionPhase, setTabTransitionPhase] = useState<'idle' | 'exiting' | 'entering'>('idle');
  const tabTransitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabTransitionFrameRef = useRef<number | null>(null);
  // Keyboard shortcuts help modal, opened via `?` or the Settings panel.
  const [showShortcuts, setShowShortcuts] = useState(false);
  // Distraction-free fullscreen overlay, toggled via `F` or the TimerView button.
  const [focusModeActive, setFocusModeActive] = useState(false);
  const toggleFocusMode = useCallback(() => {
    setFocusModeActive(prev => !prev);
  }, []);

  // Integrate PiP timer hook (returns refs for canvas, video, and background video)
  const { canvasRef, videoRef, backgroundVideoRef } = usePipTimer(timeParts, settings, {
    onPipModeDisabled: () => updateSettings({ pip_mode_enabled: false }),
  });

  // Resolved OS preference, only consulted when theme_mode is 'system'
  const systemTheme = useSystemTheme();
  const effectiveThemeMode = settings.theme_mode === 'system' ? systemTheme : settings.theme_mode;

  // Integrate the Document Picture-in-Picture horizontal timer hook (separate, real-HTML floating window)
  const { portal: horizontalPipPortal } = useHorizontalPipTimer(
    settings.horizontal_pip_enabled,
    timeParts,
    isActive,
    currentTaskText,
    effectiveThemeMode,
    { onPipModeDisabled: () => updateSettings({ horizontal_pip_enabled: false }) }
  );

  // useKeyboardShortcuts' SPACE handler requires `totalSeconds > 0` to resume
  // a paused-but-started session — true for a countdown (it starts high), but
  // a Stopwatch paused within its first second still reads 0. Fudge a floor
  // of 1 only for this hook, only in that state, so keyboard resume still works.
  const keyboardTotalSeconds =
    timerMode === 'stopwatch' && initialTimeSet > 0 ? Math.max(totalSeconds, 1) : totalSeconds;

  // Global keyboard shortcuts for power-user productivity.
  useKeyboardShortcuts({
    isActive,
    totalSeconds: keyboardTotalSeconds,
    initialTimeSet,
    togglePause,
    resetTimer,
    handleStopWithConfirmation,
    isSettingsPanelOpen,
    setIsSettingsPanelOpen,
    isTaskModalOpen,
    setIsTaskModalOpen,
    activeTab,
    setActiveTab,
    isMiniMode,
    setIsMiniMode,
    isFocusModeActive: focusModeActive,
    onToggleFocusMode: toggleFocusMode,
  });

  const router = useRouter();

  // Redirect to /login if not authenticated. If the session expired on its own,
  // pass ?reason=expired so the login page can explain what happened.
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(sessionExpired ? '/login?reason=expired' : '/login');
    }
  }, [authLoading, user, sessionExpired, router]);

  // =================================================================
  // SECTION: Effects
  // =================================================================

  /**
   * Effect to synchronize the mini-mode state with the global settings.
   * Runs whenever the `startInMiniMode` setting changes.
   */
  useEffect(() => {
    setIsMiniMode(settings.start_in_mini_mode);
  }, [settings.start_in_mini_mode]);

  /**
   * Global `?` (Shift+/) shortcut to open the keyboard shortcuts help modal.
   * Ignored while typing in a form field so it never hijacks text entry.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '?') return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement | null)?.isContentEditable) return;
      e.preventDefault();
      setShowShortcuts(true);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Drives the fade + slide transition between tabs. `displayedTab` (what's
   * actually rendered) is kept in sync with `activeTab` (what the user
   * picked) with a short lag: fade the current content out, swap the
   * content once it's invisible, then fade the new content in. Skipped
   * entirely for users who prefer reduced motion.
   */
  useEffect(() => {
    if (activeTab === displayedTab) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      setDisplayedTab(activeTab);
      setTabTransitionPhase('idle');
      return;
    }

    setTabTransitionPhase('exiting');
    tabTransitionTimeoutRef.current = setTimeout(() => {
      setDisplayedTab(activeTab);
      setTabTransitionPhase('entering');
      tabTransitionFrameRef.current = requestAnimationFrame(() => {
        setTabTransitionPhase('idle');
      });
    }, 200);

    return () => {
      if (tabTransitionTimeoutRef.current) clearTimeout(tabTransitionTimeoutRef.current);
    };
  }, [activeTab, displayedTab]);

  // Clean up any pending timeout/frame on unmount.
  useEffect(() => {
    return () => {
      if (tabTransitionTimeoutRef.current) clearTimeout(tabTransitionTimeoutRef.current);
      if (tabTransitionFrameRef.current) cancelAnimationFrame(tabTransitionFrameRef.current);
    };
  }, []);

  /**
   * Auto-exit Focus Mode once the session ends: either the Pomodoro cycle
   * falls back to idle, or the countdown reaches zero and stops.
   */
  useEffect(() => {
    if (!focusModeActive) return;
    // The Stopwatch never touches `currentPhase` (it stays 'idle' the whole
    // session), so its own end condition is "no session in progress" instead.
    const sessionEnded =
      timerMode === 'stopwatch'
        ? initialTimeSet === 0
        : pomodoroEngine.currentPhase === 'idle' || (totalSeconds === 0 && !isActive);
    if (sessionEnded) {
      setFocusModeActive(false);
    }
  }, [focusModeActive, timerMode, pomodoroEngine.currentPhase, totalSeconds, isActive, initialTimeSet]);

  /**
   * Effect to request notification permissions from the user upon
   * the component's initial mount.
   */
  useEffect(() => {
    // Check if the Notification API is available and permission hasn't been granted/denied yet.
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []); // Empty dependency array ensures this runs only once.

  // =================================================================
  // SECTION: Render Logic
  // =================================================================

  // Boolean to determine if the timer setup controls should be shown.
  const showSetupControls = !isMiniMode;

  // Mini mode is timer-only: it hides the tab bar and locks to the timer view.
  // Uses `displayedTab` (not `activeTab`) so the outgoing tab keeps rendering
  // while it fades out.
  const showTimerView = isMiniMode || displayedTab === 'timer';

  // className applied to whichever tab's content is on screen, driving the
  // fade + slide transition as `tabTransitionPhase` moves through its states.
  const tabContentClassName = [
    tabTransitionStyles.tabContent,
    tabTransitionPhase === 'exiting' ? tabTransitionStyles.tabContentExiting : '',
    tabTransitionPhase === 'entering' ? tabTransitionStyles.tabContentEntering : '',
  ]
    .filter(Boolean)
    .join(' ');

  // Compact "MM:SS" (or "HH:MM:SS" past an hour) string for Focus Mode's big
  // display — same formatting rule already used for the browser tab title.
  const focusModeTimeDisplay =
    timeParts.hours === '00'
      ? `${timeParts.minutes}:${timeParts.seconds}`
      : `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`;

  // Focus-tab CTAs also switch back to the timer view. Memoized (useCallback) so
  // the memoized FocusTab doesn't re-render on every timer tick from page.tsx.
  const onFocusStartWork = useCallback(() => {
    handleFocusStartWork();
    setActiveTab('timer');
  }, [handleFocusStartWork]);
  const onFocusStartBreak = useCallback(() => {
    handleFocusStartBreak();
    setActiveTab('timer');
  }, [handleFocusStartBreak]);

  return (
    <>
    <main id="main-content" tabIndex={-1} className={`${styles.mainContainer} ${styles.pageWrapper} ${styles.miniModeTransition} ${isMiniMode ? styles.miniModeActive : ''}`}>
      <LocaleSync />
      {showSetupControls && <ProjectBranding />}

      {/* Tab navigation (hidden in mini mode, which is timer-only) */}
      {!isMiniMode && (
        <div className={styles.tabBar} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timer'}
            className={`${styles.tabButton} ${activeTab === 'timer' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('timer')}
          >
            {t('app.tabs.timer')}
          </button>
          <button
            type="button"
            id="onboarding-focus"
            data-contextual-hint="contextual-hint-stats"
            role="tab"
            aria-selected={activeTab === 'focus'}
            className={`${styles.tabButton} ${activeTab === 'focus' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('focus')}
          >
            {t('app.tabs.focus')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'achievements'}
            className={`${styles.tabButton} ${activeTab === 'achievements' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('achievements')}
          >
            {t('app.tabs.achievements')}
          </button>
        </div>
      )}

      {/* Focus tab: Pomodoro cycle status, daily log and statistics */}
      {!isMiniMode && displayedTab === 'focus' && (
        <div className={tabContentClassName}>
        <ErrorBoundary>
        <FocusTab
          userId={user?.id ?? null}
          totalPomodorosToday={pomodoroEngine.totalPomodorosToday}
          cycleCount={pomodoroEngine.cycleCount}
          currentPhase={pomodoroEngine.currentPhase}
          dailyPomodoroGoal={settings.daily_pomodoro_goal}
          todaySessions={pomodoroStats.todaySessions}
          weekTotal={pomodoroStats.weekTotal}
          weeklyData={pomodoroStats.weeklyData}
          streak={pomodoroStats.streak}
          taskBreakdown={pomodoroStats.taskBreakdown}
          dailyCounts={pomodoroStats.dailyCounts}
          bestDayOfWeek={pomodoroStats.bestDayOfWeek}
          peakHour={pomodoroStats.peakHour}
          longestStreak={pomodoroStats.longestStreak}
          averageDaily={pomodoroStats.averageDaily}
          totalSessions={pomodoroStats.totalSessions}
          totalMinutes={pomodoroStats.totalMinutes}
          periodSessions={pomodoroStats.periodSessions}
          statsPeriod={statsPeriod}
          onStatsPeriodChange={setStatsPeriod}
          statsLoading={pomodoroStats.loading}
          statsRevalidating={pomodoroStats.isRevalidating}
          statsError={pomodoroStats.loadError}
          onStartWork={onFocusStartWork}
          onStartBreak={onFocusStartBreak}
        />
        </ErrorBoundary>
        </div>
      )}

      {/* Achievements tab: gamification badges catalog, read-only */}
      {!isMiniMode && displayedTab === 'achievements' && (
        <div className={tabContentClassName}>
        <ErrorBoundary>
          <AchievementsTab
            unlockedIds={achievements.unlockedIds}
            allAchievements={achievements.allAchievements}
            progress={achievements.progress}
            loading={achievements.loading}
          />
        </ErrorBoundary>
        </div>
      )}

      {showTimerView && (
        <div className={isMiniMode ? undefined : tabContentClassName}>
        <ErrorBoundary>
        <TimerTab
          timeParts={timeParts}
          isActive={isActive}
          totalSeconds={totalSeconds}
          initialTimeSet={initialTimeSet}
          togglePause={togglePause}
          resetTimer={resetTimer}
          stopTimer={stopTimer}
          handleStartTimer={handleStartTimer}
          handleCustomStart={handleCustomStart}
          handleStopWithConfirmation={handleStopWithConfirmation}
          timerMode={timerMode}
          canSwitchTimerMode={canSwitchTimerMode}
          onSetTimerMode={handleSetTimerMode}
          handleStartStopwatch={handleStartStopwatch}
          handleCompleteStopwatch={handleCompleteStopwatch}
          customHoursInput={customHoursInput}
          setCustomHoursInput={setCustomHoursInput}
          customMinutesInput={customMinutesInput}
          setCustomMinutesInput={setCustomMinutesInput}
          isMiniMode={isMiniMode}
          setIsMiniMode={setIsMiniMode}
          onEnterFocusMode={() => setFocusModeActive(true)}
          tasks={tasks}
          tasksLoading={tasksLoading}
          handleAddTask={handleAddTask}
          handleToggleTask={handleToggleTask}
          handleDeleteTask={handleDeleteTask}
          handleReorderTasks={handleReorderTasks}
          isTaskModalOpen={isTaskModalOpen}
          setIsTaskModalOpen={setIsTaskModalOpen}
          showInvalidTimeModal={showInvalidTimeModal}
          setShowInvalidTimeModal={setShowInvalidTimeModal}
          showStopConfirm={showStopConfirm}
          setShowStopConfirm={setShowStopConfirm}
        />
        </ErrorBoundary>
        </div>
      )}

      {/* Hidden canvas and video for Picture-in-Picture floating timer */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: 320,
          height: 120,
          pointerEvents: 'none',
        }}
      />
      {/* Hidden video element used as PiP source (receives canvas stream) */}
      <video
        ref={videoRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: 320,
          height: 120,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Hidden background video element for animated themes in PiP */}
      <video
        ref={backgroundVideoRef}
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: 1600,
          height: 600,
          pointerEvents: 'none',
        }}
        tabIndex={-1}
        aria-hidden="true"
      />
      {/* Portal target lives inside the separate Document PiP window, not in this DOM tree */}
      {horizontalPipPortal}
    </main>

    {/* Fixed-position elements live outside <main> — an ancestor with an active/filled
        `transform` (the pageFadeIn animation) turns `position: fixed` descendants into
        elements positioned relative to that ancestor instead of the viewport. */}

    {/* App-level Realtime connection status: fixed banner, non-blocking,
        hidden while connected. Kept outside ErrorBoundaries so it still
        shows if a tab crashes. */}
    <ConnectionIndicator
      pendingCount={syncPendingCount}
      isSyncing={isSyncing}
      failedCount={syncFailedCount}
      lastSyncedCount={lastSyncResult?.processed ?? 0}
      onOpenSyncDetails={onOpenSyncDetails}
    />

    <SettingsButton onClick={() => setIsSettingsPanelOpen(true)} />

    <SettingsPanel
      isOpen={isSettingsPanelOpen}
      onClose={() => setIsSettingsPanelOpen(false)}
      onOpenShortcuts={() => {
        setIsSettingsPanelOpen(false);
        setShowShortcuts(true);
      }}
      pomodoroStats={{
        totalPomodorosToday: pomodoroEngine.totalPomodorosToday,
        cycleCount: pomodoroEngine.cycleCount,
        currentPhase: pomodoroEngine.currentPhase,
        dailyPomodoroGoal: settings.daily_pomodoro_goal,
        streak: pomodoroStats.streak,
        weekTotal: pomodoroStats.weekTotal,
      }}
    />

    {/* Visual notification centered on screen */}
    <VisualNotification
      message={t('app.notification.timeUp')}
      visible={showVisualNotification}
      onClose={() => setShowVisualNotification(false)}
      duration={3500}
    />

    {/* Achievement unlocked toast (floating, independent of tab content) */}
    <AchievementNotification
      achievement={achievements.newlyUnlocked}
      onDismiss={achievements.dismissNotification}
    />

    {/* Distraction-free fullscreen overlay (opened via `F` or the TimerView button) */}
    {focusModeActive && (
      <FocusMode
        timeDisplay={focusModeTimeDisplay}
        isRunning={isActive}
        currentPhase={timerMode === 'stopwatch' ? 'stopwatch' : pomodoroEngine.currentPhase}
        taskText={currentTaskText ?? null}
        onToggleTimer={togglePause}
        onExit={() => setFocusModeActive(false)}
      />
    )}

    {/* Keyboard shortcuts help modal (opened via `?` or the Settings panel) */}
    <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

    <SyncDetailsPanel
      isOpen={showSyncDetails}
      onClose={() => setShowSyncDetails(false)}
      userId={user?.id ?? null}
      onSyncNow={syncNow}
    />

    {/* First-run onboarding tour: only for authenticated users who haven't seen it yet */}
    {!authLoading && user && !settingsLoading && !settings.has_seen_onboarding && (
      <OnboardingTour onComplete={handleOnboardingComplete} />
    )}

    {/* Independent, context-triggered hints — complements the tour above, never shown at the same time */}
    {!authLoading && user && !settingsLoading && settings.has_seen_onboarding && (
      <ContextualHintsManager
        isActive={isActive}
        initialTimeSet={initialTimeSet}
        totalPomodorosToday={pomodoroEngine.totalPomodorosToday}
        activeTab={activeTab}
        isSettingsPanelOpen={isSettingsPanelOpen}
        taskCount={tasks.length}
        tasksLoading={tasksLoading}
      />
    )}
    </>
  );
}
