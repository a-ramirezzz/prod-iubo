// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/page.tsx
'use client';

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useEffect, useCallback } from 'react';
import styles from '@/app/Page.module.css';

// Custom Hooks for Core Logic
import { useTimerController } from '@/hooks/useTimerController';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePomodoroStats } from '@/hooks/usePomodoroStats';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSyncQueue } from '@/hooks/useSyncQueue';
import { useAchievements } from '@/hooks/useAchievements';
import { useSettings } from '@/context/SettingsContext';
import { usePipTimer } from '@/hooks/usePipTimer';
import { useHorizontalPipTimer } from '@/hooks/useHorizontalPipTimer';
import { useAuth } from '@/context/AuthContext';
import { useLocale } from '@/app/lib/i18n';
import { useRouter } from 'next/navigation';

// UI Component Imports
import ProjectBranding from '@/components/ProjectBranding/ProjectBranding';
import SettingsButton from '@/components/SettingsButton/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel';
import VisualNotification from '@/components/Notification/Notification';
import TimerTab from './TimerTab';
import FocusTab from './FocusTab';
import OnboardingTour from '@/app/components/OnboardingTour/OnboardingTour';
import LocaleSync from './LocaleSync';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import { ConnectionIndicator } from '@/app/components/ConnectionIndicator';
import { ShortcutsModal } from '@/app/components/ShortcutsModal';
import { SyncDetailsPanel } from '@/app/components/SyncDetailsPanel';
import FocusMode from '@/app/components/FocusMode/FocusMode';
import AchievementNotification from '@/app/components/AchievementNotification/AchievementNotification';
import AchievementsTab from '@/app/components/AchievementsTab/AchievementsTab';

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

  // Name of the first incomplete task, shown as "current task" in the horizontal PiP window.
  const currentTaskText = tasks.find(task => !task.completed)?.text;

  // Timer + Pomodoro engine orchestration.
  const {
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    togglePause,
    resetTimer,
    stopTimer,
    customHoursInput,
    setCustomHoursInput,
    customMinutesInput,
    setCustomMinutesInput,
    pomodoroEngine,
    handleStartTimer,
    handleCustomStart,
    handleStopWithConfirmation,
    handleFocusStartWork,
    handleFocusStartBreak,
    showInvalidTimeModal,
    setShowInvalidTimeModal,
    showStopConfirm,
    setShowStopConfirm,
    showVisualNotification,
    setShowVisualNotification,
  } = useTimerController({
    enableDesktopNotifications: !!settings.enable_desktop_notifications,
    confirmOnStop: settings.confirm_on_stop,
    currentTaskText,
    userId: user?.id ?? null,
    notificationSoundEnabled: !!settings.notification_sound_enabled,
    volume: settings.volume,
  });

  // Productivity statistics shared between the Focus tab and Settings panel.
  const pomodoroStats = usePomodoroStats(
    user?.id ?? null,
    pomodoroEngine.totalPomodorosToday
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

  // Integrate the Document Picture-in-Picture horizontal timer hook (separate, real-HTML floating window)
  const { portal: horizontalPipPortal } = useHorizontalPipTimer(
    settings.horizontal_pip_enabled,
    timeParts,
    isActive,
    currentTaskText,
    settings.theme_mode,
    { onPipModeDisabled: () => updateSettings({ horizontal_pip_enabled: false }) }
  );

  // Global keyboard shortcuts for power-user productivity.
  useKeyboardShortcuts({
    isActive,
    totalSeconds,
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
   * Auto-exit Focus Mode once the session ends: either the Pomodoro cycle
   * falls back to idle, or the countdown reaches zero and stops.
   */
  useEffect(() => {
    if (!focusModeActive) return;
    const sessionEnded =
      pomodoroEngine.currentPhase === 'idle' || (totalSeconds === 0 && !isActive);
    if (sessionEnded) {
      setFocusModeActive(false);
    }
  }, [focusModeActive, pomodoroEngine.currentPhase, totalSeconds, isActive]);

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
  const showTimerView = isMiniMode || activeTab === 'timer';

  // Compact "MM:SS" (or "HH:MM:SS" past an hour) string for Focus Mode's big
  // display — same formatting rule already used for the browser tab title.
  const focusModeTimeDisplay =
    timeParts.hours === '00'
      ? `${timeParts.minutes}:${timeParts.seconds}`
      : `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`;

  // Focus-tab CTAs also switch back to the timer view.
  const onFocusStartWork = () => {
    handleFocusStartWork();
    setActiveTab('timer');
  };
  const onFocusStartBreak = () => {
    handleFocusStartBreak();
    setActiveTab('timer');
  };

  return (
    <>
    <main className={`${styles.mainContainer} ${styles.pageWrapper} ${styles.miniModeTransition} ${isMiniMode ? styles.miniModeActive : ''}`}>
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
      {!isMiniMode && activeTab === 'focus' && (
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
          statsLoading={pomodoroStats.loading}
          statsRevalidating={pomodoroStats.isRevalidating}
          statsError={pomodoroStats.loadError}
          onStartWork={onFocusStartWork}
          onStartBreak={onFocusStartBreak}
        />
        </ErrorBoundary>
      )}

      {/* Achievements tab: gamification badges catalog, read-only */}
      {!isMiniMode && activeTab === 'achievements' && (
        <ErrorBoundary>
          <AchievementsTab
            unlockedIds={achievements.unlockedIds}
            allAchievements={achievements.allAchievements}
            progress={achievements.progress}
            loading={achievements.loading}
          />
        </ErrorBoundary>
      )}

      {showTimerView && (
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
      onOpenSyncDetails={() => setShowSyncDetails(true)}
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
        currentPhase={pomodoroEngine.currentPhase}
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
    </>
  );
}
