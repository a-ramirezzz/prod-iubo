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

// UI Component Imports
import ProjectBranding from '@/components/ProjectBranding/ProjectBranding';
import TimerDisplay from '@/components/TimerDisplay/TimerDisplay';
import PresetButtons from '@/components/PresetButtons/PresetButtons';
import CustomTimeInput from '@/components/CustomTimeInput/CustomTimeInput';
import TimerControls from '@/components/TimerControls/TimerControls';
import TaskList from '@/components/TaskList/TaskList';
import SettingsButton from '@/components/SettingsButton/SettingsButton';
import SettingsPanel from '@/components/SettingsPanel/SettingsPanel';

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
  const { settings } = useSettings();

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
  } = useTimer();

  const {
    tasks,
    currentTaskInput,
    setCurrentTaskInput,
    handleAddTask,
    handleToggleTask,
    handleDeleteTask,
  } = useTaskManager();

  // Local UI state for this page
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // =================================================================
  // SECTION: Effects
  // =================================================================

  /**
   * Effect to synchronize the mini-mode state with the global settings.
   * Runs whenever the `startInMiniMode` setting changes.
   */
  useEffect(() => {
    setIsMiniMode(settings.startInMiniMode);
  }, [settings.startInMiniMode]);

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
      // NOTE: Consider replacing alert() with a custom modal for better UX.
      alert('Por favor, ingresa un tiempo válido.');
    }
  }, [customHoursInput, customMinutesInput, startTimer]);
  
  /**
   * Stops and resets the timer, showing a confirmation dialog if the
   * user has enabled this setting.
   */
  const handleStopWithConfirmation = useCallback(() => {
    if (settings.confirmOnStop) {
      // NOTE: Consider replacing window.confirm() with a custom modal.
      if (window.confirm('¿Estás seguro de que quieres detener y reiniciar el temporizador?')) {
        stopTimer();
      }
    } else {
      stopTimer();
    }
  }, [settings.confirmOnStop, stopTimer]);

  // =================================================================
  // SECTION: Render Logic
  // =================================================================
  
  // Boolean to determine if the timer setup controls should be shown.
  const showSetupControls = !isMiniMode;
  
  // Boolean to determine if the initial instruction text should be shown.
  const showInstructionText = !isMiniMode && totalSeconds === 0 && !isActive && initialTimeSet === 0;

  return (
    <main className={`${styles.mainContainer} ${isMiniMode ? styles.miniModeActive : ''}`}>
      {showSetupControls && <ProjectBranding />}
      
      {/* Main Timer Display */}
      <div className='timerDisplay'>
        <TimerDisplay timeParts={timeParts} />
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
          <form onSubmit={handleAddTask} className={styles.taskForm}>
            <input
              type="text"
              value={currentTaskInput}
              onChange={(e) => setCurrentTaskInput(e.target.value)}
              placeholder="Escribe una nueva tarea..."
              className={styles.taskInput}
              disabled={isActive}
            />
            <button type="submit" className="button" disabled={isActive || currentTaskInput.trim() === ''}>
              Añadir Tarea
            </button>
          </form>
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
    </main>
  );
}
