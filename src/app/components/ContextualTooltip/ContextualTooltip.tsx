// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/ContextualTooltip/ContextualTooltip.tsx
'use client';

import { useEffect, useLayoutEffect, useCallback, useState } from 'react';
import type React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useLocale } from '@/app/lib/i18n';
import { useContextualTooltipVariants } from '@/app/lib/motion';
import { calculatePosition } from '@/app/components/OnboardingTour/OnboardingTour';
import styles from './ContextualTooltip.module.css';

export type ContextualTooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Some targets already carry an id used by OnboardingTour, so this also
// falls back to a `data-contextual-hint` attribute for those shared elements.
function getTargetElement(targetId: string): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  return (
    document.getElementById(targetId) ??
    document.querySelector<HTMLElement>(`[data-contextual-hint="${targetId}"]`)
  );
}

interface ContextualTooltipProps {
  /** Unique tooltip id, also used for the tooltip's DOM id (aria-describedby target). */
  id: string;
  /** DOM id of the element this tooltip points to. */
  targetId: string;
  /** i18n key for the tooltip's body text. */
  content: string;
  position: ContextualTooltipPosition;
  onDismiss: () => void;
  /** Auto-dismiss after this many ms, in addition to click-to-dismiss. */
  autoDismissMs?: number;
}

/**
 * A small, single-purpose floating tooltip anchored to a DOM element by id,
 * used for contextual onboarding hints (see useContextualHints). Unlike
 * OnboardingTour, each instance is independent, non-blocking and dismissed
 * for good once shown — there is no step sequence or backdrop.
 */
export default function ContextualTooltip({
  id,
  targetId,
  content,
  position,
  onDismiss,
  autoDismissMs,
}: ContextualTooltipProps) {
  const { t } = useLocale();
  const variants = useContextualTooltipVariants(position);
  const [rect, setRect] = useState<Rect | null>(null);
  const [mounted, setMounted] = useState(false);

  const measure = useCallback(() => {
    const el = getTargetElement(targetId);
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [targetId]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [measure]);

  // Link the target element to this tooltip for screen readers while it's shown.
  useEffect(() => {
    const el = getTargetElement(targetId);
    if (!el) return;
    const tooltipDomId = `contextual-tooltip-${id}`;
    const previous = el.getAttribute('aria-describedby');
    el.setAttribute('aria-describedby', tooltipDomId);
    return () => {
      if (previous) {
        el.setAttribute('aria-describedby', previous);
      } else {
        el.removeAttribute('aria-describedby');
      }
    };
  }, [id, targetId]);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timeout = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDismissMs]);

  // Mount after the first paint so the enter animation always plays.
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault();
      onDismiss();
    }
  };

  if (!rect || typeof document === 'undefined') return null;

  const tooltipDomId = `contextual-tooltip-${id}`;
  const tooltipStyle = calculatePosition(rect, position);

  return createPortal(
    <motion.div
      id={tooltipDomId}
      className={`${styles.tooltip} ${styles[`arrow-${position}`]}`}
      style={tooltipStyle}
      role="tooltip"
      aria-live="polite"
      initial="hidden"
      animate={mounted ? 'visible' : 'hidden'}
      exit="hidden"
      variants={variants}
      onClick={onDismiss}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <span className={styles.arrowShape} aria-hidden="true" />
      <p className={styles.message}>{t(content)}</p>
      <button
        type="button"
        className={styles.dismissButton}
        onClick={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
        aria-label={t('onboarding.contextual.dismissAria')}
      >
        ✕
      </button>
    </motion.div>,
    document.body
  );
}
