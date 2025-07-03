import React, { useEffect } from 'react';
import styles from './Notification.module.css';

interface NotificationProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number; // ms
}

/**
 * Notification component
 * Shows a centered notification with a message and auto-dismiss.
 * @param message - The message to display
 * @param visible - Whether the notification is visible
 * @param onClose - Callback when notification should close
 * @param duration - Duration in ms before auto-close (default: 8000)
 */
const Notification: React.FC<NotificationProps> = ({ message, visible, onClose, duration = 8000 }) => {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={styles.notification} role="alert" aria-live="assertive">
      {message}
      <button
        className={styles.buttonAccept}
        onClick={onClose}
        tabIndex={0}
        aria-label="Aceptar y cerrar notificación"
        autoFocus
      >
        Aceptar
      </button>
    </div>
  );
};

export default Notification; 