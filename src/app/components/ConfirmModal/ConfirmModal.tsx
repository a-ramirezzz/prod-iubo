"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './ConfirmModal.module.css';
import { useLocale } from '@/app/lib/i18n';
import { useBackdropVariants, useScaleFadeVariants } from '@/app/lib/motion';

interface ConfirmModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The message to display */
  message: string;
  /** Emoji or text icon displayed above the message */
  icon?: string;
  /** Mode: 'alert' shows only an OK button, 'confirm' shows Cancel + Confirm */
  mode?: 'alert' | 'confirm';
  /** Label for the confirm/OK button (default: "Aceptar") */
  confirmLabel?: string;
  /** Label for the cancel button (default: "Cancelar") */
  cancelLabel?: string;
  /** Whether the confirm action is destructive — shows red button (default: false) */
  destructive?: boolean;
  /** Called when the user confirms */
  onConfirm: () => void;
  /** Called when the user cancels (only used in 'confirm' mode) */
  onCancel?: () => void;
}

/**
 * A reusable modal component that replaces native alert() and window.confirm().
 * Matches the PROD-UIBO visual design language.
 */
const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  message,
  icon,
  mode = 'alert',
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const { t } = useLocale();
  const resolvedConfirmLabel = confirmLabel ?? t('app.confirmModal.defaultConfirm');
  const resolvedCancelLabel = cancelLabel ?? t('app.confirmModal.defaultCancel');
  const confirmRef = useRef<HTMLButtonElement>(null);
  const backdropVariants = useBackdropVariants();
  const modalVariants = useScaleFadeVariants();

  // Auto-focus the confirm button when the modal opens
  useEffect(() => {
    if (visible && confirmRef.current) {
      confirmRef.current.focus();
    }
  }, [visible]);

  // Close on Escape key
  useEffect(() => {
    if (!visible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mode === 'confirm' && onCancel) {
          onCancel();
        } else {
          onConfirm();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [visible, mode, onCancel, onConfirm]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className={styles.backdrop}
          onClick={mode === 'confirm' ? onCancel : onConfirm}
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
        >
          <motion.div
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={modalVariants}
          >
            {icon && <span className={styles.icon}>{icon}</span>}
            <p className={styles.message}>{message}</p>
            <div className={styles.actions}>
              {mode === 'confirm' && (
                <button className={styles.btnCancel} onClick={onCancel}>
                  {resolvedCancelLabel}
                </button>
              )}
              <button
                ref={confirmRef}
                className={destructive ? styles.btnDestructive : styles.btnConfirm}
                onClick={onConfirm}
              >
                {resolvedConfirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
