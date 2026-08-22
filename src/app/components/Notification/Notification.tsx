import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Notification.module.css';
import { useLocale } from '@/app/lib/i18n';
import { useSlideFromTopVariants } from '@/app/lib/motion';

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
  const variants = useSlideFromTopVariants();
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.notification}
          role="alert"
          aria-live="assertive"
          style={{ x: '-50%' }}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={variants}
        >
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
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification; 