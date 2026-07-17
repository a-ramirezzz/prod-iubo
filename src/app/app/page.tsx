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
import { useTimer } from '@/hooks/useTimer';
import { useTimerAlert } from '@/hooks/useTimerAlert';
import { usePomodoroEngine } from '@/hooks/usePomodoroEngine';
import { usePomodoroStats } from '@/hooks/usePomodoroStats';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSettings } from '@/context/SettingsContext';
import { usePipTimer } from '@/hooks/usePipTimer';
import { useHorizontalPipTimer } from '@/hooks/useHorizontalPipTimer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// UI Component Imports
import ProjectBranding from '@/components/ProjectBranding/ProjectBranding';
import TimerDisplay from '@/components/TimerDisplay/TimerDisplay';
import PresetButtons from '@/components/PresetButtons/PresetButtons';
import CustomTimeInput from '@/components/CustomTimeInput/CustomTimeInput';
import TimerControls from '@/components/TimerControls/TimerControls';
import TaskList from '@/components/TaskList/TaskList';
import SettingsButton from '@/components/SettingsButton/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel';
import VisualNotification from '@/components/Notification/Notification';
import TaskModal from '@/components/TaskList/TaskModal';
import ConfirmModal from '@/app/components/ConfirmModal/ConfirmModal';
import FocusSection from '@/components/FocusSection/FocusSection';

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

  // Dedicated alert instance for the "cycle complete" (long break) notification.
  const { triggerLongBreakAlert } = useTimerAlert(!!settings.enable_desktop_notifications);

  // Pomodoro cycle state machine (tracks phases, cycle count and daily stats).
  const pomodoroEngine = usePomodoroEngine(user?.id ?? null, {
    onCycleComplete: triggerLongBreakAlert,
  });

  // Productivity statistics shared between the Focus tab and Settings panel.
  const pomodoroStats = usePomodoroStats(
    user?.id ?? null,
    pomodoroEngine.totalPomodorosToday
  );

  // Core application logic from custom hooks
  const {
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    // Available for future use (e.g. a "Timer restored" toast).
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    timerRestored,
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  } = useTimer(!!settings.enable_desktop_notifications, () => {
    // Advance the Pomodoro cycle when the countdown finishes naturally.
    if (pomodoroEngine.currentPhase === 'work') {
      pomodoroEngine.completeSession(currentTaskText ?? null);
    } else if (
      pomodoroEngine.currentPhase === 'short_break' ||
      pomodoroEngine.currentPhase === 'long_break'
    ) {
      pomodoroEngine.completeBreak();
    }
  });

  const {
    tasks,
    loading: tasksLoading,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
    handleReorderTasks,
  } = useTaskManager(user?.id ?? null);

  // Local UI state for this page
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [showVisualNotification, setShowVisualNotification] = useState(false);
  // State to control the visibility of the task objectives modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [showInvalidTimeModal, setShowInvalidTimeModal] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
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

  // Name of the first incomplete task, shown as "current task" in the horizontal PiP window.
  const currentTaskText = tasks.find(task => !task.completed)?.text;

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

  // Effect to show visual notification when the timer ends
  useEffect(() => {
    if (initialTimeSet > 0 && totalSeconds === 0 && !isActive) {
      setShowVisualNotification(true);
    }
  }, [initialTimeSet, totalSeconds, isActive]);

  // =================================================================
  // SECTION: Event Handlers
  // =================================================================
  
  /**
   * Starts the countdown and, when appropriate, registers the start of
   * a Pomodoro work session in the cycle engine.
   */
  const handleStartTimer = useCallback((minutes: number) => {
    startTimer(minutes);
    if (pomodoroEngine.currentPhase === 'idle' || pomodoroEngine.currentPhase === 'work') {
      pomodoroEngine.startWorkSession(minutes * 60);
    }
  }, [startTimer, pomodoroEngine]);

  /**
   * CTA from the Focus tab: starts a standard 25-minute Pomodoro.
   */
  const handleFocusStartWork = useCallback(() => {
    pomodoroEngine.startWorkSession(25 * 60);
    startTimer(25);
    setActiveTab('timer');
  }, [pomodoroEngine, startTimer]);

  /**
   * CTA from the Focus tab: starts the earned break (5 or 15 minutes).
   */
  const handleFocusStartBreak = useCallback(() => {
    const minutes = pomodoroEngine.currentPhase === 'long_break' ? 15 : 5;
    pomodoroEngine.startBreak();
    startTimer(minutes);
    setActiveTab('timer');
  }, [pomodoroEngine, startTimer]);

  /**
   * Starts the timer with a custom duration provided by the user.
   * Validates the input before starting.
   */
  const handleCustomStart = useCallback(() => {
    const hours = parseInt(customHoursInput, 10) || 0;
    const minutes = parseInt(customMinutesInput, 10) || 0;
    const totalMinutesToStart = (hours * 60) + minutes;

    if (totalMinutesToStart > 0) {
      handleStartTimer(totalMinutesToStart);
      setCustomHoursInput('');
      setCustomMinutesInput('');
    } else {
      setShowInvalidTimeModal(true);
    }
  }, [customHoursInput, customMinutesInput, handleStartTimer]);
  
  /**
   * Stops and resets the timer, showing a confirmation dialog if the
   * user has enabled this setting.
   */
  const handleStopWithConfirmation = useCallback(() => {
    if (settings.confirm_on_stop) {
      setShowStopConfirm(true);
    } else {
      stopTimer();
    }
  }, [settings.confirm_on_stop, stopTimer]);

  // =================================================================
  // SECTION: Render Logic
  // =================================================================
  
  // Boolean to determine if the timer setup controls should be shown.
  const showSetupControls = !isMiniMode;
  
  // Boolean to determine if the initial instruction text should be shown.
  const showInstructionText = !isMiniMode && totalSeconds === 0 && !isActive && initialTimeSet === 0;

  // Mini mode is timer-only: it hides the tab bar and locks to the timer view.
  const showTimerView = isMiniMode || activeTab === 'timer';

  return (
    <main className={`${styles.mainContainer} ${styles.pageWrapper} ${styles.miniModeTransition} ${isMiniMode ? styles.miniModeActive : ''}`}>
      <ConfirmModal
        visible={showInvalidTimeModal}
        message="Por favor, ingresa un tiempo válido."
        icon="⏱️"
        mode="alert"
        onConfirm={() => setShowInvalidTimeModal(false)}
      />
      <ConfirmModal
        visible={showStopConfirm}
        message="¿Estás seguro de que quieres detener y reiniciar el temporizador?"
        icon="⏹️"
        mode="confirm"
        confirmLabel="Detener"
        destructive={true}
        onConfirm={() => {
          stopTimer();
          setShowStopConfirm(false);
        }}
        onCancel={() => setShowStopConfirm(false)}
      />
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
          statsLoading={pomodoroStats.loading}
          statsError={pomodoroStats.loadError}
          onStartWork={handleFocusStartWork}
          onStartBreak={handleFocusStartBreak}
        />
      )}

      {showTimerView && (
      <>
      {/* Main Timer Display */}
      <div className='timerDisplay'>
        <TimerDisplay timeParts={timeParts} isActive={isActive} remainingSeconds={totalSeconds} />
      </div>

      {/* Timer Setup Controls (Presets and Custom Input) */}
      {showSetupControls && (
        <>
          <div className='presetButtons'>
            <PresetButtons onSetTime={handleStartTimer} disabled={isActive} />
          </div>
          <div className='customInputContainer'>
            <CustomTimeInput
              hours={customHoursInput}
              onHoursChange={setCustomHoursInput}
              minutes={customMinutesInput}
              onMinutesChange={setCustomMinutesInput}
              onStart={handleCustomStart}
              inputsDisabled={isActive}
              disabled={isActive || (!customHoursInput && !customMinutesInput)}
            />
          </div>
        </>
      )}

      {/* Core Timer Controls (Start, Pause, Stop) */}
      <TimerControls
        isActive={isActive}
        initialTimeSet={initialTimeSet}
        totalSeconds={totalSeconds}
        onTogglePause={togglePause}
        onReset={resetTimer}
        onStop={handleStopWithConfirmation}
      />

      {/* UI Mode Toggles */}
      <div className={styles.miniModeButtonContainer}>
        <button onClick={() => setIsMiniMode(!isMiniMode)} className="button">
          {isMiniMode ? 'Vista Completa' : 'Modo Mini'}
        </button>
      </div>
      </>
      )}

      {/* Task Management Section */}
      {showSetupControls && showTimerView && (
        <div className={styles.taskSection}>
          <h2 className={styles.taskSectionTitle}>Tareas de la Sesión</h2>
          {/* Button to open the objectives modal */}
          <button
            className={styles.openTaskModalButton}
            onClick={() => setIsTaskModalOpen(true)}
            aria-label="Abrir objetivos de hoy"
            type="button"
          >
            <span className={styles.pulse}></span>
            <svg
              width="38"
              height="38"
              viewBox="0 0 38 38"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={styles.animatedIcon}
            >
              <circle cx="19" cy="19" r="17" stroke="#1e88e5" fill="#1e88e5" opacity="0.15"/>
              <path d="M27 11.5a2.5 2.5 0 0 1 3.5 3.5L16 29l-5 1 1-5L27 11.5z" fill="#fff" />
              <path d="M25 13.5l3.5 3.5" stroke="#1e88e5" />
            </svg>
          </button>
          {/* Modal for today's objectives */}
          <TaskModal
            isOpen={isTaskModalOpen}
            onClose={() => setIsTaskModalOpen(false)}
            tasks={tasks}
            onAddTask={handleAddTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={handleReorderTasks}
          />
          {/* TaskList displays the current session tasks */}
          {tasksLoading && tasks.length === 0 ? (
            <p style={{ textAlign: 'center', opacity: 0.6 }}>Cargando tareas...</p>
          ) : (
            <TaskList
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              inputDisabled={isActive}
            />
          )}
        </div>
      )}

      {/* Initial User Instruction */}
      {showInstructionText && showTimerView && (
        <p className={styles.instructionText}>
          Selecciona un tiempo predefinido o ingresa un tiempo personalizado para comenzar.
        </p>
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
