import React, { useEffect } from 'react';
import styles from './Notification.module.css';
import { useLocale } from '@/app/lib/i18n';

interface NotificationProps {
  message: string;
  visible: boolean;
  onClose: () => void;
  duration?: number; // ms
  icon?: React.ReactNode; // Optional icon to display
}

/**
 * Notification component
 * Shows a centered notification with a message, icon, and auto-dismiss.
 * @param message - The message to display
 * @param visible - Whether the notification is visible
 * @param onClose - Callback when notification should close
 * @param duration - Duration in ms before auto-close (default: 8000)
 * @param icon - Optional icon to display before the message
 */
const Notification: React.FC<NotificationProps> = ({ message, visible, onClose, duration = 8000, icon }) => {
  const { t } = useLocale();
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    <div className={styles.notification} role="alert" aria-live="assertive">
      {icon && <span className={styles.icon}>{icon}</span>}
      {message}
      <button
        className={styles.buttonAccept}
        onClick={onClose}
        tabIndex={0}
        aria-label={t('app.notification.acceptAria')}
        autoFocus
      >
        {t('app.notification.accept')}
      </button>
    </div>
  );
};

export default Notification; 