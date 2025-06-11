// app/components/CustomTimeInput/CustomTimeInput.tsx

import styles from './CustomTimeInput.module.css';
interface CustomTimeInputProps {
  hours: string;
  onHoursChange: (value: string) => void;
  minutes: string;
  onMinutesChange: (value: string) => void;
  onStart: () => void;
  disabled: boolean;
  inputsDisabled: boolean;
}

export default function CustomTimeInput({
  hours, onHoursChange, minutes, onMinutesChange, onStart, disabled, inputsDisabled
}: CustomTimeInputProps) {
  return (
    <div className={styles.customInputContainer}>
      <input
        type="number"
        placeholder="HH"
        min="0"
        max="72"
        value={hours}
        onChange={(e) => onHoursChange(e.target.value)}
        className={`${styles.customInput} ${styles.customInputHours}`}
        disabled={inputsDisabled}
        title="Horas (0-72)"
      />
      <span className={styles.customInputSeparator}>:</span>
      <input
        type="number"
        placeholder="MM"
        min="0"
        max="59"
        value={minutes}
        onChange={(e) => onMinutesChange(e.target.value)}
        className={`${styles.customInput} ${styles.customInputMinutes}`}
        disabled={inputsDisabled}
        title="Minutos (0-59)"
      />
      <button
        onClick={onStart}
        className="button"
        disabled={disabled}
      >
        Iniciar
      </button>
    </div>
  );
}