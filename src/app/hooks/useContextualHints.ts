// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/hooks/useContextualHints.ts
'use client';

import { useCallback, useState } from 'react';

// Separate localStorage key from OnboardingTour's own dismissal tracking
// (that one persists to Supabase via `has_seen_onboarding`), so the two
// systems never step on each other.
const STORAGE_KEY = 'contextual_hints_dismissed';

function readDismissed(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeDismissed(ids: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Storage unavailable (private mode, quota) — hints just won't persist.
  }
}

export interface UseContextualHints {
  dismissedIds: string[];
  shouldShow: (tooltipId: string) => boolean;
  dismiss: (tooltipId: string) => void;
}

/**
 * Tracks which contextual onboarding tooltips (see ContextualTooltip) have
 * been dismissed, persisted to localStorage so each tooltip shows at most
 * once per user/browser.
 */
export function useContextualHints(): UseContextualHints {
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => readDismissed());

  const shouldShow = useCallback(
    (tooltipId: string) => !dismissedIds.includes(tooltipId),
    [dismissedIds]
  );

  const dismiss = useCallback((tooltipId: string) => {
    setDismissedIds(prev => {
      if (prev.includes(tooltipId)) return prev;
      const next = [...prev, tooltipId];
      writeDismissed(next);
      return next;
    });
  }, []);

  return { dismissedIds, shouldShow, dismiss };
}
