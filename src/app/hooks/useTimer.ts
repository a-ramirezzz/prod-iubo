// src/app/hooks/useTimer.ts
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTimerAlert } from './useTimerAlert';
import { formatTime } from '../lib/time';

export const useTimer = () => {
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [initialTimeSet, setInitialTimeSet] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { triggerAlert } = useTimerAlert();

  useEffect(() => {
    if (isActive && totalSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTotalSeconds((prev) => prev - 1);
      }, 1000);
    } else if (totalSeconds === 0 && isActive) {
      clearInterval(intervalRef.current!);
      setIsActive(false);
      triggerAlert();
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, totalSeconds, triggerAlert]);

  const startTimer = (minutesTotal: number) => {
    if (minutesTotal <= 0) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    const seconds = minutesTotal * 60;
    setTotalSeconds(seconds);
    setInitialTimeSet(seconds);
    setIsActive(true);
  };

  const togglePause = () => {
    if (totalSeconds > 0) {
      setIsActive(!isActive);
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setTotalSeconds(initialTimeSet);
  };

  const stopTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsActive(false);
    setTotalSeconds(0);
    setInitialTimeSet(0);
  };

  // El hook devuelve todo lo que el componente necesita para funcionar
  return {
    timeParts: formatTime(totalSeconds),
    isActive,
    totalSeconds,
    initialTimeSet,
    startTimer,
    togglePause,
    resetTimer,
    stopTimer,
  };
};