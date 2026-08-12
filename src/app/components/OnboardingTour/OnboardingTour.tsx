// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// components/OnboardingTour/OnboardingTour.tsx
'use client';

import { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import { useLocale } from '@/app/lib/i18n';
import styles from './OnboardingTour.module.css';

interface OnboardingTourProps {
  onComplete: () => void;
}

type TooltipPosition = 'bottom' | 'top' | 'left' | 'right';

interface TourStep {
  targetId: string; // ID of the DOM element to highlight
  position: TooltipPosition;
}

const STEPS: TourStep[] = [
  { targetId: 'onboarding-timer', position: 'bottom' },
  { targetId: 'onboarding-tasks', position: 'top' },
  { targetId: 'onboarding-focus', position: 'bottom' },
];

// Visual gap between the highlighted element and the tooltip / cutout padding.
const PADDING = 8;
const GAP = 16;
const TOOLTIP_WIDTH = 320;
const VIEWPORT_MARGIN = 12;

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Computes fixed-position styles for the tooltip so it sits near the target
 * according to the requested side, while clamping to the viewport so it never
 * overflows off-screen on small devices.
 */
export function calculatePosition(rect: Rect, position: TooltipPosition): React.CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let top = 0;
  let left = 0;

  switch (position) {
    case 'bottom':
      top = rect.top + rect.height + PADDING + GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      break;
    case 'top':
      // Anchored from the bottom so the tooltip grows upward away from the target.
      top = rect.top - PADDING - GAP;
      left = rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2;
      return {
        left: clamp(left, VIEWPORT_MARGIN, vw - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
        bottom: Math.max(VIEWPORT_MARGIN, vh - top),
        width: `min(${TOOLTIP_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
      };
    case 'left':
      top = rect.top + rect.height / 2;
      left = rect.left - PADDING - GAP - TOOLTIP_WIDTH;
      break;
    case 'right':
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width + PADDING + GAP;
      break;
  }

  return {
    top: clamp(top, VIEWPORT_MARGIN, vh - VIEWPORT_MARGIN),
    left: clamp(left, VIEWPORT_MARGIN, vw - TOOLTIP_WIDTH - VIEWPORT_MARGIN),
    width: `min(${TOOLTIP_WIDTH}px, calc(100vw - ${VIEWPORT_MARGIN * 2}px))`,
  };
}

export function clamp(value: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * OnboardingTour renders a 3-step guided tour that highlights the timer, task
 * list and Focus tab for first-time users. It draws a dimmed backdrop with a
 * "cutout" around the current target (via a large box-shadow) and a tooltip
 * with localized copy, step dots, and skip / next / finish actions.
 */
export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const { t } = useLocale();

  const step = STEPS[currentStep];

  // Measure the current target and keep it in sync on scroll / resize.
  const measure = useCallback(() => {
    const el = typeof document !== 'undefined'
      ? document.getElementById(step.targetId)
      : null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    // Bring the target into view if it is off-screen (e.g. tasks lower on page).
    el.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
  }, [step.targetId]);

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

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  // If the target for this step is missing, skip it rather than blocking the UI.
  if (!rect) return null;

  const tooltipStyle = calculatePosition(rect, step.position);
  const isLast = currentStep === STEPS.length - 1;

  return (
    <div
      className={styles.root}
      role="dialog"
      aria-modal="true"
      aria-live="polite"
      aria-labelledby="onboarding-tour-message"
    >
      {/* Highlight cutout: the huge box-shadow acts as the dimmed backdrop, with
          the element bounds forming the "hole". Clicking the backdrop skips. */}
      <div
        className={styles.highlight}
        onClick={handleSkip}
        style={{
          top: rect.top - PADDING,
          left: rect.left - PADDING,
          width: rect.width + PADDING * 2,
          height: rect.height + PADDING * 2,
        }}
      />

      {/* Tooltip */}
      <div className={styles.tooltip} style={tooltipStyle}>
        <p id="onboarding-tour-message" className={styles.message}>
          {t(`onboarding.steps.${currentStep}.message`)}
        </p>
        <div className={styles.footer}>
          <div className={styles.dots}>
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`${styles.dot} ${i === currentStep ? styles.dotActive : ''}`}
              />
            ))}
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.skipBtn} onClick={handleSkip}>
              {t('onboarding.skip')}
            </button>
            <button type="button" className={styles.nextBtn} onClick={handleNext}>
              {isLast ? t('onboarding.finish') : t('onboarding.next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
