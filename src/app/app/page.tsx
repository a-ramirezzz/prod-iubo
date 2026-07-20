// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/page.tsx
'use client';

// =================================================================
// SECTION: Imports
// =================================================================

import { useState, useEffect } from 'react';
import styles from '@/app/Page.module.css';

// Custom Hooks for Core Logic
import { useTimerController } from '@/hooks/useTimerController';
import { usePomodoroStats } from '@/hooks/usePomodoroStats';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSettings } from '@/context/SettingsContext';
import { usePipTimer } from '@/hooks/usePipTimer';
import { useHorizontalPipTimer } from '@/hooks/useHorizontalPipTimer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// UI Component Imports
import ProjectBranding from '@/components/ProjectBranding/ProjectBranding';
import SettingsButton from '@/components/SettingsButton/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel';
import VisualNotification from '@/components/Notification/Notification';
import FocusSection from '@/components/FocusSection/FocusSection';
import TimerView from '@/components/TimerView/TimerView';

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
  const { settings, updateSettings } = useSettings();

  const { user, loading: authLoading } = useAuth();

  // Task management for the current session.
  const {
    tasks,
    loading: tasksLoading,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleReorderTasks,
  } = useTaskManager(user?.id ?? null);

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
  });

  // Productivity statistics shared between the Focus tab and Settings panel.
  const pomodoroStats = usePomodoroStats(
    user?.id ?? null,
    pomodoroEngine.totalPomodorosToday
  );

  // Local UI state for this page
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  // State to control the visibility of the task objectives modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  // Active tab: classic timer view or the Focus (Pomodoro cycle) view.
  const [activeTab, setActiveTab] = useState<'timer' | 'focus'>('timer');

  // Mapea settings de snake_case a camelCase para AppSettings
  const settingsCamel = {
    startInMiniMode: settings.start_in_mini_mode,
    confirmOnStop: settings.confirm_on_stop,
    pipModeEnabled: settings.pip_mode_enabled,
    horizontalPipEnabled: settings.horizontal_pip_enabled,
    language: settings.language,
    themeMode: settings.theme_mode,
    selectedThemeId: settings.selected_theme_id,
    backgroundSound: settings.background_sound,
    volume: settings.volume,
    enableDesktopNotifications: settings.enable_desktop_notifications,
    dailyPomodoroGoal: settings.daily_pomodoro_goal,
    alwaysOnTop: false,
  };

  // Integrate PiP timer hook (returns refs for canvas, video, and background video)
  const { canvasRef, videoRef, backgroundVideoRef } = usePipTimer(timeParts, settingsCamel, {
    onPipModeDisabled: () => updateSettings({ pip_mode_enabled: false }),
  });

  // Integrate the Document Picture-in-Picture horizontal timer hook (separate, real-HTML floating window)
  const { portal: horizontalPipPortal } = useHorizontalPipTimer(
    settingsCamel.horizontalPipEnabled,
    timeParts,
    isActive,
    currentTaskText,
    settingsCamel.themeMode,
    { onPipModeDisabled: () => updateSettings({ horizontal_pip_enabled: false }) }
  );

  const router = useRouter();

  // Redirect to /login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

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
    <main className={`${styles.mainContainer} ${styles.pageWrapper} ${styles.miniModeTransition} ${isMiniMode ? styles.miniModeActive : ''}`}>
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
            Temporizador
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'focus'}
            className={`${styles.tabButton} ${activeTab === 'focus' ? styles.tabButtonActive : ''}`}
            onClick={() => setActiveTab('focus')}
          >
            Focus
          </button>
        </div>
      )}

      {/* Focus tab: Pomodoro cycle status, daily log and statistics */}
      {!isMiniMode && activeTab === 'focus' && (
        <FocusSection
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
          statsError={pomodoroStats.loadError}
          onStartWork={onFocusStartWork}
          onStartBreak={onFocusStartBreak}
        />
      )}

      {showTimerView && (
        <TimerView
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
      )}

      {/* Settings Panel Trigger and Component */}
      <div className='settingsButton'>
        <SettingsButton onClick={() => setIsSettingsPanelOpen(true)} />
      </div>

      <SettingsPanel
        isOpen={isSettingsPanelOpen}
        onClose={() => setIsSettingsPanelOpen(false)}
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
        message={"¡Tiempo cumplido!\nTu sesión de productividad ha finalizado."}
        visible={showVisualNotification}
        onClose={() => setShowVisualNotification(false)}
        duration={3500}
      />
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
  );
}
