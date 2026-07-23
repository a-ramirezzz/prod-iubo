// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// components/TimerView/TimerView.tsx
'use client';

import styles from '@/app/Page.module.css';

import TimerDisplay from '@/components/TimerDisplay/TimerDisplay';
import PresetButtons from '@/components/PresetButtons/PresetButtons';
import CustomTimeInput from '@/components/CustomTimeInput/CustomTimeInput';
import TimerControls from '@/components/TimerControls/TimerControls';
import TaskList from '@/components/TaskList/TaskList';
import TaskModal from '@/components/TaskList/TaskModal';
import ConfirmModal from '@/app/components/ConfirmModal/ConfirmModal';
import { useLocale } from '@/app/lib/i18n';

import type { Task } from '@/app/types';

interface TimeParts {
  hours: string;
  minutes: string;
  seconds: string;
}

interface TimerViewProps {
  // Timer
  timeParts: TimeParts;
  isActive: boolean;
  totalSeconds: number;
  initialTimeSet: number;
  togglePause: () => void;
  resetTimer: () => void;
  stopTimer: () => void;
  handleStartTimer: (minutes: number) => void;
  handleCustomStart: () => void;
  handleStopWithConfirmation: () => void;
  // Custom input
  customHoursInput: string;
  setCustomHoursInput: (value: string) => void;
  customMinutesInput: string;
  setCustomMinutesInput: (value: string) => void;
  // Mini mode
  isMiniMode: boolean;
  setIsMiniMode: (value: boolean) => void;
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  handleAddTask: (text: string) => void;
  handleToggleTask: (id: string) => void;
  handleDeleteTask: (id: string) => void;
  handleReorderTasks: (tasks: Task[]) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (value: boolean) => void;
  // Modal states
  showInvalidTimeModal: boolean;
  setShowInvalidTimeModal: (value: boolean) => void;
  showStopConfirm: boolean;
  setShowStopConfirm: (value: boolean) => void;
}

/**
 * TimerView encapsulates the entire classic timer tab: the countdown display,
 * setup controls, timer controls, mini-mode toggle, task section and the
 * timer-specific confirmation modals.
 */
export default function TimerView({
  timeParts,
  isActive,
  totalSeconds,
  initialTimeSet,
  togglePause,
  resetTimer,
  stopTimer,
  handleStartTimer,
  handleCustomStart,
  handleStopWithConfirmation,
  customHoursInput,
  setCustomHoursInput,
  customMinutesInput,
  setCustomMinutesInput,
  isMiniMode,
  setIsMiniMode,
  tasks,
  tasksLoading,
  handleAddTask,
  handleToggleTask,
  handleDeleteTask,
  handleReorderTasks,
  isTaskModalOpen,
  setIsTaskModalOpen,
  showInvalidTimeModal,
  setShowInvalidTimeModal,
  showStopConfirm,
  setShowStopConfirm,
}: TimerViewProps) {
  const { t } = useLocale();

  // Boolean to determine if the timer setup controls should be shown.
  const showSetupControls = !isMiniMode;

  // Boolean to determine if the initial instruction text should be shown.
  const showInstructionText =
    !isMiniMode && totalSeconds === 0 && !isActive && initialTimeSet === 0;

  return (
    <>
      <ConfirmModal
        visible={showInvalidTimeModal}
        message={t('app.timer.invalidTime')}
        icon="⏱️"
        mode="alert"
        onConfirm={() => setShowInvalidTimeModal(false)}
      />
      <ConfirmModal
        visible={showStopConfirm}
        message={t('app.timer.confirmStop.message')}
        icon="⏹️"
        mode="confirm"
        confirmLabel={t('app.timer.confirmStop.confirm')}
        destructive={true}
        onConfirm={() => {
          stopTimer();
          setShowStopConfirm(false);
        }}
        onCancel={() => setShowStopConfirm(false)}
      />

      {/* Main Timer Display */}
      <div id="onboarding-timer" className='timerDisplay'>
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
          {isMiniMode ? t('app.timer.fullView') : t('app.timer.miniMode')}
        </button>
      </div>

      {/* Task Management Section */}
      {showSetupControls && (
        <div id="onboarding-tasks" className={styles.taskSection}>
          <h2 className={styles.taskSectionTitle}>{t('app.tasks.sectionTitle')}</h2>
          {/* Button to open the objectives modal */}
          <button
            className={styles.openTaskModalButton}
            onClick={() => setIsTaskModalOpen(true)}
            aria-label={t('app.tasks.openModalAria')}
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
            <p style={{ textAlign: 'center', opacity: 0.6 }}>{t('app.tasks.loading')}</p>
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
      {showInstructionText && (
        <p className={styles.instructionText}>
          {t('app.timer.instruction')}
        </p>
      )}
    </>
  );
}
