// app/components/TimerControls/TimerControls.tsx

import styles from './TimerControls.module.css';

interface TimerControlsProps {
  isActive: boolean;
  initialTimeSet: number;
  totalSeconds: number;
  onTogglePause: () => void;
  onReset: () => void;
  onStop: () => void;
}

export default function TimerControls({
  isActive, initialTimeSet, totalSeconds, onTogglePause, onReset, onStop
}: TimerControlsProps) {
  if (initialTimeSet === 0) return null; 

  return (
    <div className={styles.controlsContainer}> 
      <button
        onClick={onTogglePause}
        className="button"
        disabled={totalSeconds === 0 && !isActive}
      >
        {isActive ? 'Pausar' : 'Reanudar'}
      </button>
      <button
        onClick={onReset}
        className="button button-reset"
      >
        Reiniciar
      </button>
      <button
        onClick={onStop}
        className="button button-stop"
      >
        Detener
      </button>
    </div>
  );
}