// app/hooks/useTimerAlert.ts
import { useRef } from 'react';

export const useTimerAlert = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopAlert = () => {
    // Detiene la reproducción del sonido
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    // Detiene las repeticiones futuras
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
  };

  const playSound = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/simple-notification-152054.mp3');
    }

    let playCount = 0;
    const maxPlays = 3;

    stopAlert();

    const playAudioRepeatedly = () => {
      if (playCount < maxPlays) {
        audioRef.current?.play().catch(e => console.error("Error al reproducir audio:", e));
        playCount++;
      } else {
        stopAlert();
      }
    };

    playAudioRepeatedly(); 
    audioIntervalRef.current = setInterval(playAudioRepeatedly, 2500);
  };

  const showNotification = () => {
    const notificationTitle = '¡Tiempo cumplido!';
    const notificationOptions: NotificationOptions = {
      body: 'Tu sesión de productividad ha finalizado.',
      icon: '/favicon.ico', // Puedes usar tu propio ícono
    };

    // Crea la notificación
    notificationRef.current = new Notification(notificationTitle, notificationOptions);

    // Cuando el usuario haga clic en la notificación, detén el sonido
    notificationRef.current.onclick = () => {
      stopAlert();
      notificationRef.current?.close();
    };
    
    // También detén el sonido si el usuario cierra la notificación
    notificationRef.current.onclose = () => {
        stopAlert();
    };
  };

  const triggerAlert = async () => {
    // 1. Reproducir el sonido
    playSound();

    // 2. Gestionar la notificación
    if (Notification.permission === 'granted') {
      showNotification();
    } else if (Notification.permission !== 'denied') {
      // Si no tenemos permiso, lo solicitamos
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification();
      }
    }
  };

  return { triggerAlert };
};