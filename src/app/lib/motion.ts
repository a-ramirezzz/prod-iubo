// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/lib/motion.ts
"use client";

// Shared Framer Motion presets for modal/toast/tab microinteractions.
// Every hook here consults `useReducedMotion()` so callers never repeat the
// prefers-reduced-motion check: when it's on, transitions collapse to 0s
// (elements still show/hide, they just don't glide).

import { useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';

/** Backdrop fade used behind modal-like overlays. */
export function useBackdropVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, transition: { duration: reduced ? 0 : 0.15, ease: 'easeIn' } },
    visible: { opacity: 1, transition: { duration: reduced ? 0 : 0.2, ease: 'easeOut' } },
  };
}

/** Fade + scale-up, for centered modals (ConfirmModal, TaskModal). */
export function useScaleFadeVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, scale: reduced ? 1 : 0.95, transition: { duration: reduced ? 0 : 0.15, ease: 'easeIn' } },
    visible: { opacity: 1, scale: 1, transition: { duration: reduced ? 0 : 0.2, ease: 'easeOut' } },
  };
}

/** Slide in from the right + fade, for the Settings drawer. */
export function useSlideFromRightVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, x: reduced ? 0 : '100%', transition: { duration: reduced ? 0 : 0.2, ease: 'easeIn' } },
    visible: { opacity: 1, x: 0, transition: { duration: reduced ? 0 : 0.25, ease: 'easeOut' } },
  };
}

/** Slide down from above + fade, for the centered toast Notification. */
export function useSlideFromTopVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduced ? '-50%' : 'calc(-50% - 100%)', transition: { duration: reduced ? 0 : 0.15, ease: 'easeIn' } },
    visible: { opacity: 1, y: '-50%', transition: { duration: reduced ? 0 : 0.2, ease: 'easeOut' } },
  };
}

/** Subtle crossfade for tab/section content swaps (AnimatePresence mode="wait"). */
export function useCrossfadeVariants(distance = 0): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, y: reduced ? 0 : distance, transition: { duration: reduced ? 0 : 0.15 } },
    visible: { opacity: 1, y: 0, transition: { duration: reduced ? 0 : 0.15 } },
  };
}

/** Spring-in scale, for celebratory bursts. */
export function usePopInVariants(): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: { opacity: 0, scale: reduced ? 1 : 0 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: reduced ? { duration: 0 } : { type: 'spring', stiffness: 400, damping: 20 },
    },
  };
}

/** Fade + slight translate toward the anchor, for ContextualTooltip. */
export function useContextualTooltipVariants(position: 'top' | 'bottom' | 'left' | 'right'): Variants {
  const reduced = useReducedMotion();
  const offset = reduced ? 0 : 8;
  const delta: Record<typeof position, { x: number; y: number }> = {
    top: { x: 0, y: offset },
    bottom: { x: 0, y: -offset },
    left: { x: offset, y: 0 },
    right: { x: -offset, y: 0 },
  };
  const { x, y } = delta[position];
  return {
    hidden: { opacity: 0, x, y, transition: { duration: reduced ? 0 : 0.15, ease: 'easeIn' } },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration: reduced ? 0 : 0.2, ease: 'easeOut' } },
  };
}

/** Stagger container for a grid/list of cards animating in one after another. */
export function useStaggerContainerVariants(staggerDelay = 0.05): Variants {
  const reduced = useReducedMotion();
  return {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : staggerDelay } },
  };
}

/** whileTap scale-down props for primary action buttons; a no-op under reduced motion. */
export function useTapScaleProps(): { whileTap?: { scale: number } } {
  const reduced = useReducedMotion();
  return reduced ? {} : { whileTap: { scale: 0.97 } };
}
