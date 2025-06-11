// src/app/components/TimerDisplay/TimerDisplay.tsx

import type { TimeParts } from '../../types'; 
import styles from './TimerDisplay.module.css';

interface TimerDisplayProps {
  timeParts: TimeParts;
}

export default function TimerDisplay({ timeParts }: TimerDisplayProps) {
  return (
    <div className={styles.timerDisplay}>
      {/* Horas */}
      <span key={'h-' + timeParts.hours} className={styles.timeSegment}>
        {timeParts.hours}
      </span>
      
      <span>:</span>
      
      {/* Minutos */}
      <span key={'m-' + timeParts.minutes} className={styles.timeSegment}>
        {timeParts.minutes}
      </span>
      
      <span>:</span>
      
      {/* Segundos */}
      <span key={'s-' + timeParts.seconds} className={styles.timeSegment}>
        {timeParts.seconds}
      </span>
    </div>
  );
}