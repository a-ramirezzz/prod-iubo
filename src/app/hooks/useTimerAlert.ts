/**
 * =================================================================
 * src/app/hooks/useTimerAlert.ts
 * -----------------------------------------------------------------
 * This custom hook encapsulates the logic for alerting the user
 * when a timer session finishes. It handles both audio and native
 * browser notifications.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import { useRef, useCallback, useEffect } from 'react';
import { useAudio } from '@/hooks/useAudio';

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage user alerts (sound and notifications) for the timer.
 * @param enableDesktopNotifications - Whether to show browser notifications when the timer ends.
 * @returns {object} An object containing the `triggerAlert` function.
 */
export const useTimerAlert = (enableDesktopNotifications: boolean = false) => {
  // -----------------------------------------------------------------
  // State and Refs
  // We use refs to store instances that should persist across renders
  // without causing re-renders themselves (like timers).
  // -----------------------------------------------------------------

  // No settings are threaded in here (matching the previous unconditional,
  // full-volume `new Audio(...).play()` behavior) — useAudio's defaults
  // (enabled: true, volume: 1) reproduce that exactly.
  const { playSound, stopSound } = useAudio();
  const notificationRef = useRef<Notification | null>(null);
  const soundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------------------------------
  // Memoized Functions
  // Using useCallback to ensure these functions have a stable identity
  // across renders, preventing unnecessary re-renders.
  // -----------------------------------------------------------------

  /**
   * Stops all alert activities: pauses the sound and clears any pending playback.
   */
  const stopAlert = useCallback(() => {
    stopSound();
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
    }
  }, [stopSound]);

  /**
   * Shows a native browser notification.
   */
  const showNotification = useCallback((
    title: string = '¡Tiempo cumplido!',
    body: string = 'Tu sesión de productividad ha finalizado.'
  ) => {
    const notificationTitle = title;
    const notificationOptions: NotificationOptions = {
      body,
      icon: '/favicon.ico',
    };

    notificationRef.current = new Notification(notificationTitle, notificationOptions);

    // Add event listeners to stop the sound if the user interacts with the notification.
    notificationRef.current.onclick = () => {
      stopAlert();
      notificationRef.current?.close();
    };
    notificationRef.current.onclose = () => {
      stopAlert();
    };
  }, [stopAlert]);
  
  /**
   * Plays the alert sound a fixed number of times with a delay.
   * This uses chained setTimeouts for a more robust sequence than setInterval.
   */
  const playAlertSound = useCallback((maxPlays: number = 3) => {
    stopAlert(); // Stop any previous alert before starting a new one.

    const delay = 2500; // 2.5 seconds between plays

    const playRepeatedly = (playCount: number) => {
      if (playCount <= 0) return;

      playSound('timer-alert');

      // Schedule the next play.
      soundTimeoutRef.current = setTimeout(() => {
        playRepeatedly(playCount - 1);
      }, delay);
    };

    playRepeatedly(maxPlays);
  }, [playSound, stopAlert]);

  /**
   * The main function exposed by the hook. It coordinates playing the
   * sound and showing the notification, handling permissions as needed.
   */
  const triggerAlert = useCallback(async () => {
    playAlertSound();

    if (!enableDesktopNotifications) return;

    if (Notification.permission === 'granted') {
      showNotification();
    } else if (Notification.permission !== 'denied') {
      // If we don't have permission yet, request it.
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification();
      }
    }
  }, [playAlertSound, showNotification, enableDesktopNotifications]);

  /**
   * Alert for completing a full Pomodoro cycle (4 pomodoros).
   * Plays the sound once and shows a dedicated long-break notification.
   */
  const triggerLongBreakAlert = useCallback(async () => {
    playAlertSound(1);

    if (!enableDesktopNotifications) return;

    const title = '¡Ciclo completo!';
    const body = 'Completaste 4 pomodoros. Toma una pausa larga de 15–30 minutos. ¡Lo mereces!';

    if (Notification.permission === 'granted') {
      showNotification(title, body);
    } else if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification(title, body);
      }
    }
  }, [playAlertSound, showNotification, enableDesktopNotifications]);

  // -----------------------------------------------------------------
  // Lifecycle Management
  // -----------------------------------------------------------------
  
  /**
   * Effect to clean up any running alerts when the component that
   * uses this hook unmounts. This is crucial to prevent memory leaks
   * and "ghost" sounds.
   */
  useEffect(() => {
    // The returned function is the cleanup function.
    return () => {
      stopAlert();
    };
  }, [stopAlert]); // Dependency on stopAlert ensures cleanup has access to the latest function.

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  return { triggerAlert, triggerLongBreakAlert };
};
