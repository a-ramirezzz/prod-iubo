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
import { useTaskManager } from '@/hooks/useTaskManager';
import { useSettings } from '@/context/SettingsContext';
import { usePipTimer } from '@/hooks/usePipTimer';
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

  // Core application logic from custom hooks
  const {
    timeParts,
    isActive,
    totalSeconds,
    initialTimeSet,
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  } = useTimer(!!settings.enable_desktop_notifications);

  const {
    tasks,
    setTasks, // Import setTasks to allow global task updates from the modal
    handleToggleTask,
    handleDeleteTask,
  } = useTaskManager();

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

  // Mapea settings de snake_case a camelCase para AppSettings
  const settingsCamel = {
    startInMiniMode: settings.start_in_mini_mode,
    confirmOnStop: settings.confirm_on_stop,
    pipModeEnabled: settings.pip_mode_enabled,
    language: settings.language,
    themeMode: settings.theme_mode,
    selectedThemeId: settings.selected_theme_id,
    backgroundSound: settings.background_sound,
    volume: settings.volume,
    enableDesktopNotifications: settings.enable_desktop_notifications,
    alwaysOnTop: false, 
  };

  // Integrate PiP timer hook (returns refs for canvas, video, and background video)
  const { canvasRef, videoRef, backgroundVideoRef } = usePipTimer(timeParts, settingsCamel, {
    onPipModeDisabled: () => updateSettings({ pip_mode_enabled: false }),
  });

  const { user, loading: authLoading } = useAuth();
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
   * Starts the timer with a custom duration provided by the user.
   * Validates the input before starting.
   */
  const handleCustomStart = useCallback(() => {
    const hours = parseInt(customHoursInput, 10) || 0;
    const minutes = parseInt(customMinutesInput, 10) || 0;
    const totalMinutesToStart = (hours * 60) + minutes;

    if (totalMinutesToStart > 0) {
      startTimer(totalMinutesToStart);
      setCustomHoursInput('');
      setCustomMinutesInput('');
    } else {
      setShowInvalidTimeModal(true);
    }
  }, [customHoursInput, customMinutesInput, startTimer]);
  
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
      
      {/* Main Timer Display */}
      <div className='timerDisplay'>
        <TimerDisplay timeParts={timeParts} isActive={isActive} remainingSeconds={totalSeconds} />
      </div>

      {/* Timer Setup Controls (Presets and Custom Input) */}
      {showSetupControls && (
        <>
          <div className='presetButtons'>
            <PresetButtons onSetTime={startTimer} disabled={isActive} />
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

      {/* Task Management Section */}
      {showSetupControls && (
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
            onAddTask={(text: string) => {
              // Add a new task to the global task list
              if (text.trim() === '') return;
              setTasks(prev => [
                ...prev,
                {
                  id: crypto.randomUUID(),
                  text: text.trim(),
                  completed: false,
                },
              ]);
            }}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onReorderTasks={setTasks}
          />
          {/* TaskList displays the current session tasks */}
          <TaskList
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            inputDisabled={isActive}
          />
        </div>
      )}

      {/* Initial User Instruction */}
      {showInstructionText && (
        <p className={styles.instructionText}>
          Selecciona un tiempo predefinido o ingresa un tiempo personalizado para comenzar.
        </p>
      )}

      {/* Settings Panel Trigger and Component */}
      <div className='settingsButton'>
        <SettingsButton onClick={() => setIsSettingsPanelOpen(true)} />
      </div>
      
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={() => setIsSettingsPanelOpen(false)} />
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
    </main>
  );
}
