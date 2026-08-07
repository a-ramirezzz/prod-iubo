// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('@/app/lib/i18n', () => ({
  useLocale: () => ({ t: (key: string) => key }),
}));

import OnboardingTour, { calculatePosition, clamp } from '../OnboardingTour';

describe('clamp (pure function)', () => {
  it('returns value when within bounds', () => {
    expect(clamp(50, 0, 100)).toBe(50);
  });

  it('returns min when value is below', () => {
    expect(clamp(-10, 0, 100)).toBe(0);
  });

  it('returns max when value is above', () => {
    expect(clamp(150, 0, 100)).toBe(100);
  });

  it('handles edge case where value equals min', () => {
    expect(clamp(0, 0, 100)).toBe(0);
  });

  it('handles edge case where value equals max', () => {
    expect(clamp(100, 0, 100)).toBe(100);
  });
});

describe('calculatePosition (pure function)', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: 1024, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 768, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
  });

  it('positions tooltip below target when there is space', () => {
    const rect = { top: 100, left: 400, width: 200, height: 50 };
    const style = calculatePosition(rect, 'bottom');
    expect(style.top).toBe(100 + 50 + 8 + 16);
  });

  it('positions tooltip above target when no space below', () => {
    const rect = { top: 700, left: 400, width: 200, height: 50 };
    const style = calculatePosition(rect, 'top');
    expect(style.top).toBeUndefined();
    expect(style.bottom).toBeDefined();
    expect(Number(style.bottom)).toBeGreaterThanOrEqual(12);
  });

  it('clamps tooltip to viewport edges horizontally', () => {
    const rect = { top: 100, left: 1000, width: 50, height: 50 };
    const style = calculatePosition(rect, 'bottom');
    expect(Number(style.left)).toBeLessThanOrEqual(1024 - 320 - 12);
    expect(Number(style.left)).toBeGreaterThanOrEqual(12);
  });

  it('handles target at top-left corner', () => {
    const rect = { top: 0, left: 0, width: 10, height: 10 };
    const style = calculatePosition(rect, 'bottom');
    expect(Number(style.left)).toBeGreaterThanOrEqual(12);
    expect(Number(style.top)).toBeGreaterThanOrEqual(12);
  });
});

describe('OnboardingTour component', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
    document.body.innerHTML = `
      <div id="onboarding-timer" style="width: 100px; height: 40px;"></div>
      <div id="onboarding-tasks" style="width: 100px; height: 40px;"></div>
      <div id="onboarding-focus" style="width: 100px; height: 40px;"></div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('renders the first step content on mount', () => {
    render(<OnboardingTour onComplete={vi.fn()} />);
    expect(screen.getByText('onboarding.steps.0.message')).toBeTruthy();
  });

  it('advances to next step on "Next" button click', () => {
    render(<OnboardingTour onComplete={vi.fn()} />);
    fireEvent.click(screen.getByText('onboarding.next'));
    expect(screen.getByText('onboarding.steps.1.message')).toBeTruthy();
  });

  it('calls onComplete on the last step', () => {
    const onComplete = vi.fn();
    render(<OnboardingTour onComplete={onComplete} />);
    fireEvent.click(screen.getByText('onboarding.next'));
    fireEvent.click(screen.getByText('onboarding.next'));
    expect(screen.getByText('onboarding.finish')).toBeTruthy();
    fireEvent.click(screen.getByText('onboarding.finish'));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renders skip/close button', () => {
    render(<OnboardingTour onComplete={vi.fn()} />);
    expect(screen.getByText('onboarding.skip')).toBeTruthy();
  });
});
