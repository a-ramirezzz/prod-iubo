// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/FocusTab.tsx
'use client';

import type { ComponentProps } from 'react';
import FocusSection from '@/components/FocusSection/FocusSection';

/**
 * FocusTab is the feature composition for the Focus (Pomodoro cycle) tab: the
 * cycle status, daily log, statistics and task breakdown.
 *
 * Note: usePomodoroStats and the pomodoro engine live in page.tsx and are passed
 * down as props. Their data also feeds the Settings panel, which can be opened
 * from the Timer tab, so those hooks must stay mounted regardless of the active
 * tab. This component owns the presentation only.
 *
 * The `id="onboarding-focus"` target lives on the Focus tab button in page.tsx's
 * tab bar, so it stays there — not here.
 */
type FocusTabProps = ComponentProps<typeof FocusSection>;

export default function FocusTab(props: FocusTabProps) {
  return <FocusSection {...props} />;
}
