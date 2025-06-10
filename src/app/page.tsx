'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './Page.module.css'; 
import { formatTime } from './lib/time'; 
import type { Task } from './types';
import customTimeInputStyles from './components/CustomTimeInput/CustomTimeInput.module.css';

// Componentes
import ProjectBranding from './components/ProjectBranding/ProjectBranding';
import TimerDisplay from './components/TimerDisplay/TimerDisplay';
import PresetButtons from './components/PresetButtons/PresetButtons';
import CustomTimeInput from './components/CustomTimeInput/CustomTimeInput';
import TimerControls from './components/TimerControls/TimerControls';
import TaskList from './components/TaskList/TaskList';
import SettingsButton from './components/SettingsButton/SettingsButton';
import SettingsPanel from './components/SettingsPanel/SettingsPanel';

// Hooks
import { useTimerAlert } from './hooks/useTimerAlert';

export default function HomePage() {
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [initialTimeSet, setInitialTimeSet] = useState<number>(0);
  const [customHoursInput, setCustomHoursInput] = useState<string>('');
  const [customMinutesInput, setCustomMinutesInput] = useState<string>('');
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentTaskInput, setCurrentTaskInput] = useState<string>('');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState<boolean>(false);

  const { triggerAlert } = useTimerAlert();

  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("Este navegador no soporta notificaciones de escritorio");
    } else if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isActive && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else if (totalSeconds === 0 && isActive) {
      clearInterval(intervalRef.current!);
      setIsActive(false);
      triggerAlert();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, totalSeconds, triggerAlert]);

  const toggleSettingsPanel = () => {
    setIsSettingsPanelOpen(!isSettingsPanelOpen);
  };

  const timeParts = formatTime(totalSeconds);

  const startTimer = (minutesTotal: number) => {
    if (minutesTotal <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const seconds = minutesTotal * 60;
    setTotalSeconds(seconds);
    setInitialTimeSet(seconds);
    setIsActive(true);
    setCustomHoursInput('');
    setCustomMinutesInput('');
  };

  const togglePause = () => setIsActive(!isActive);

  const resetTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTotalSeconds(initialTimeSet);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false); 
    setTotalSeconds(0);
    setInitialTimeSet(0);
    setCustomHoursInput('');
    setCustomMinutesInput('');
  };

  const handleCustomStart = () => {
    const hours = parseInt(customHoursInput, 10);
    const minutes = parseInt(customMinutesInput, 10);
    let totalMinutesToStart = 0;
    let alertMessage = "";

    if (customHoursInput) {
        if (isNaN(hours) || hours < 0 || hours > 72) {
            alertMessage += "Las horas deben ser un número entre 0 y 72.\n";
        } else {
            totalMinutesToStart += hours * 60;
        }
    } else if (!customMinutesInput) {
        alertMessage += "Por favor, ingresa horas o minutos.\n";
    }

    if (customMinutesInput) {
        if (isNaN(minutes) || minutes < 0 || minutes > 59) {
            alertMessage += "Los minutos deben ser un número entre 0 y 59.\n";
        } else {
            totalMinutesToStart += minutes;
        }
    } else if (!customHoursInput) {
    }

    if (alertMessage) {
        alert(alertMessage.trim());
        return;
    }
    if (totalMinutesToStart <= 0) {
        alert("El tiempo total debe ser mayor a 0 minutos.");
        return;
    }
    startTimer(totalMinutesToStart);
  };

  const handleAddTask = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (currentTaskInput.trim() === '') return;
    const newTask: Task = {
      id: Date.now().toString(),
      text: currentTaskInput.trim(),
      completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    setCurrentTaskInput('');
  };

  const handleToggleTask = (id: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
  };
  
  return (
    <main className={`${styles.mainContainer} ${isMiniMode ? styles.miniModeActive : ''}`}>
      {!isMiniMode && <ProjectBranding />}
      <TimerDisplay timeParts={timeParts} />
      {!isMiniMode && (
        <>
          <PresetButtons
            onSetTime={startTimer}
            disabled={isActive && totalSeconds > 0}
          />
          <CustomTimeInput
            hours={customHoursInput}
            onHoursChange={setCustomHoursInput}
            minutes={customMinutesInput}
            onMinutesChange={setCustomMinutesInput}
            onStart={handleCustomStart}
            inputsDisabled={isActive && totalSeconds > 0}
            disabled={ (isActive && totalSeconds > 0) || (!customHoursInput && !customMinutesInput)}
          />
        </>
      )}
      <TimerControls
        isActive={isActive}
        initialTimeSet={initialTimeSet}
        totalSeconds={totalSeconds}
        onTogglePause={togglePause}
        onReset={resetTimer}
        onStop={stopTimer}
      />

      {/* Botón para Modo Mini */}
      <div className={styles.miniModeButtonContainer}>
        <button
          onClick={() => setIsMiniMode(!isMiniMode)}
          className={styles.button}
        >
          {isMiniMode ? 'Vista Completa' : 'Modo Mini'}
        </button>
      </div>

      {/* Sección de Tareas */}
      {!isMiniMode && (
        <div className={styles.taskSection}>
          <h2 className={styles.taskSectionTitle}>Tareas de la Sesión</h2>
          <form onSubmit={handleAddTask} className={styles.taskForm}>
            <input
              type="text"
              value={currentTaskInput}
              onChange={(e) => setCurrentTaskInput(e.target.value)}
              placeholder="Escribe una nueva tarea..."
              className={`${styles.taskInput} ${customTimeInputStyles?.customInput || ''}`}
              disabled={(isActive && totalSeconds > 0)}
            />
            <button
              type="submit"
              className={styles.button}
              disabled={(isActive && totalSeconds > 0) || currentTaskInput.trim() === ''}
            >
              Añadir Tarea
            </button>
          </form>
          <TaskList
            tasks={tasks}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            inputDisabled={(isActive && totalSeconds > 0)}
          />
        </div>
      )}

      {!isMiniMode && totalSeconds === 0 && !isActive && initialTimeSet === 0 && (
        <p className={styles.instructionText}>
          Selecciona un tiempo predefinido o ingresa minutos personalizados para comenzar.
        </p>
      )}

      {/* BOTÓN DE CONFIGURACIÓN (Flotante) */}
      {!isMiniMode && <SettingsButton onClick={toggleSettingsPanel} />}
      
      {/* PANEL DE CONFIGURACIÓN (Deslizable) */}
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={toggleSettingsPanel} />
    </main>
  );
}