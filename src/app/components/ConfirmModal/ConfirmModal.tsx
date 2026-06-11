"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import React, { useEffect, useRef } from 'react';
import styles from './ConfirmModal.module.css';

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
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  const confirmRef = useRef<HTMLButtonElement>(null);

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

  if (!visible) return null;

  return (
    <div className={styles.backdrop} onClick={mode === 'confirm' ? onCancel : onConfirm}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <p className={styles.message}>{message}</p>
        <div className={styles.actions}>
          {mode === 'confirm' && (
            <button className={styles.btnCancel} onClick={onCancel}>
              {cancelLabel}
            </button>
          )}
          <button
            ref={confirmRef}
            className={destructive ? styles.btnDestructive : styles.btnConfirm}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
