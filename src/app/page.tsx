// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './Page.module.css';

// --- 1. Importamos nuestros hooks, incluyendo el de ajustes ---
import { useTimer } from './hooks/useTimer';
import { useTaskManager } from './hooks/useTaskManager';
import { useSettings } from './context/SettingsContext'; // Hook para acceder a los ajustes

// Importamos los componentes necesarios
import ProjectBranding from './components/ProjectBranding/ProjectBranding';
import TimerDisplay from './components/TimerDisplay/TimerDisplay';
import PresetButtons from './components/PresetButtons/PresetButtons';
import CustomTimeInput from './components/CustomTimeInput/CustomTimeInput';
import TimerControls from './components/TimerControls/TimerControls';
import TaskList from './components/TaskList/TaskList';
import SettingsButton from './components/SettingsButton/SettingsButton';
import SettingsPanel from './components/SettingsPanel/SettingsPanel';

export default function HomePage() {
  // --- Obtenemos la configuración global ---
  const { settings } = useSettings();

  // --- Usamos los hooks para obtener la lógica y el estado ---
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

  // Estados que son puramente de la UI se quedan en el componente
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [customMinutesInput, setCustomMinutesInput] = useState('');
  const [isMiniMode, setIsMiniMode] = useState(false); // El valor inicial será sobrescrito por el ajuste
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

  // --- APLICAR AJUSTES ---
  // Efecto para establecer el modo mini según la configuración guardada
  useEffect(() => {
    setIsMiniMode(settings.startInMiniMode);
  }, [settings.startInMiniMode]);

  // Pedir permiso para notificaciones al cargar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCustomStart = () => {
    const hours = parseInt(customHoursInput, 10);
    const minutes = parseInt(customMinutesInput, 10);
    const totalMinutesToStart = (isNaN(hours) ? 0 : hours * 60) + (isNaN(minutes) ? 0 : minutes);

    if (totalMinutesToStart > 0) {
      startTimer(totalMinutesToStart);
      setCustomHoursInput('');
      setCustomMinutesInput('');
    } else {
      alert('Por favor, ingresa un tiempo válido.');
    }
  };
  
  // Función que maneja el botón "Stop" considerando la configuración del usuario
  const handleStopWithConfirmation = () => {
    if (settings.confirmOnStop) {
      if (window.confirm('¿Estás seguro de que quieres detener y reiniciar el temporizador?')) {
        stopTimer();
      }
    } else {
      stopTimer();
    }
  };

  return (
    <main className={`${styles.mainContainer} ${isMiniMode ? styles.miniModeActive : ''}`}>
      {!isMiniMode && <ProjectBranding />}
      
      <div className='timerDisplay'>
        <TimerDisplay timeParts={timeParts} />
      </div>

      {!isMiniMode && (
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

      <TimerControls
        isActive={isActive}
        initialTimeSet={initialTimeSet}
        totalSeconds={totalSeconds}
        onTogglePause={togglePause}
        onReset={resetTimer}
        onStop={handleStopWithConfirmation} // Usamos la nueva función con confirmación
      />

      <div className={styles.miniModeButtonContainer}>
        <button onClick={() => setIsMiniMode(!isMiniMode)} className="button">
          {isMiniMode ? 'Vista Completa' : 'Modo Mini'}
        </button>
      </div>

      {!isMiniMode && (
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

      {!isMiniMode && totalSeconds === 0 && !isActive && initialTimeSet === 0 && (
        <p className={styles.instructionText}>
          Selecciona un tiempo predefinido o ingresa un tiempo personalizado para comenzar.
        </p>
      )}

      <div className='settingsButton'>
        <SettingsButton onClick={() => setIsSettingsPanelOpen(true)} />
      </div>
      
      <SettingsPanel isOpen={isSettingsPanelOpen} onClose={() => setIsSettingsPanelOpen(false)} />
    </main>
  );
}
