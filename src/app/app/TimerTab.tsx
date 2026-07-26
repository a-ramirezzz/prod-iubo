// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/TimerTab.tsx
'use client';

import type { ComponentProps } from 'react';
import TimerView from '@/components/TimerView/TimerView';

/**
 * TimerTab is the feature composition for the classic timer tab. It renders the
 * timer display, setup controls, task section and timer-specific modals.
 *
 * Note: the stateful timer hooks (useTimerController, usePipTimer, useTaskManager…)
 * intentionally live in page.tsx and are passed down as props. They must stay
 * mounted across tab switches so the running timer, PiP window and task list are
 * not torn down when the user visits the Focus tab. This component owns the
 * presentation only.
 *
 * It returns a fragment (via TimerView) with no wrapper element, preserving the
 * `.mainContainer.miniModeActive > :is(…)` direct-child selectors in
 * Page.module.css.
 */
type TimerTabProps = ComponentProps<typeof TimerView>;

export default function TimerTab(props: TimerTabProps) {
  return <TimerView {...props} />;
}
