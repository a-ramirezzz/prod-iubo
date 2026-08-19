// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/hooks/useAudio.ts
'use client';

/**
 * =================================================================
 * useAudio — centralized Web Audio playback
 * -----------------------------------------------------------------
 * Single home for every sound the app plays: the synthesized
 * notification chime, the legacy mp3 timer alert, and the looping
 * ambient background tracks. Consolidates what used to be a module-
 * level AudioContext singleton (lib/notificationSound.ts) plus two
 * separate <audio>/Audio() based players (useTimerAlert.ts,
 * AmbientSoundPlayer.tsx) into one hook.
 *
 * The AudioContext is created lazily on first playback, never on
 * mount, so it's always the result of a real user interaction
 * (starting a timer, picking an ambient track) and never trips
 * browser autoplay policies. If AudioContext isn't supported at all,
 * every method below becomes a silent no-op.
 * =================================================================
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { sounds as ambientSounds } from '@/app/lib/sounds';

interface UseAudioOptions {
  /** Gates one-shot playback (playSound). Defaults to true so callers
   *  that don't have a notification setting (e.g. the legacy timer
   *  alert, which has always played unconditionally) keep working. */
  notificationSoundEnabled?: boolean;
  /** Initial/controlled volume (0..1) applied to file-based sounds
   *  and ambient playback. Defaults to 1 (full volume), matching the
   *  old HTMLAudioElement default that was never explicitly set. */
  volume?: number;
}

interface UseAudioReturn {
  /** Plays a one-shot sound effect by id (notification chime, timer alert). */
  playSound: (soundId: string) => void;
  /** Stops whatever one-shot sound is currently playing, if any. */
  stopSound: () => void;
  /** Starts (or switches to) a looping ambient background track. */
  startAmbient: (soundId: string) => void;
  /** Stops the ambient background track. */
  stopAmbient: () => void;
  /** Volume control (0 to 1), applied to file-based and ambient sources. */
  setVolume: (volume: number) => void;
  volume: number;
  /** Whether one-shot sound playback is enabled (from settings). */
  isEnabled: boolean;
}

/** File-backed sound ids, mapped to their /public path. Built from the
 *  ambient sound catalog plus the standalone timer-alert file — the
 *  synthesized 'notification-chime' has no file and is handled separately. */
const SOUND_FILES: Record<string, string> = {
  'timer-alert': '/simple-notification-152054.mp3',
  ...Object.fromEntries(ambientSounds.map((s) => [s.id, s.src])),
};

export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { notificationSoundEnabled = true, volume: initialVolume = 1 } = options;

  const [volume, setVolumeState] = useState(initialVolume);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, AudioBuffer>>(new Map());
  const oneShotSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const ambientSoundIdRef = useRef<string | null>(null);

  // Follow the caller's volume prop (e.g. settings.volume from context).
  useEffect(() => {
    setVolumeState(initialVolume);
  }, [initialVolume]);

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume;
    }
  }, [volume]);

  const getContext = useCallback((): { ctx: AudioContext; gain: GainNode } | null => {
    try {
      if (typeof window === 'undefined') return null;
      const AudioContextCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return null;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContextCtor();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.gain.value = volume;
        gainNodeRef.current.connect(audioContextRef.current.destination);
      }
      if (audioContextRef.current.state === 'suspended') {
        // Fire-and-forget: resume may reject without a user gesture.
        audioContextRef.current.resume().catch(() => {});
      }
      return { ctx: audioContextRef.current, gain: gainNodeRef.current as GainNode };
    } catch {
      return null;
    }
  }, [volume]);

  const getBuffer = useCallback(async (ctx: AudioContext, soundId: string): Promise<AudioBuffer | null> => {
    const cached = bufferCacheRef.current.get(soundId);
    if (cached) return cached;

    const src = SOUND_FILES[soundId];
    if (!src) return null;

    const response = await fetch(src);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
    bufferCacheRef.current.set(soundId, audioBuffer);
    return audioBuffer;
  }, []);

  /** Synthesized two-tone "ding-ding" chime — no audio file involved.
   *  Kept on its own gain path straight to destination (bypassing the
   *  master gain node) so its envelope matches the original
   *  lib/notificationSound.ts implementation exactly. */
  const playChime = useCallback((ctx: AudioContext) => {
    const now = ctx.currentTime;
    const peak = Math.max(0.0001, volume * 0.3);

    const playTone = (frequency: number, startAt: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const toneGain = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      toneGain.gain.setValueAtTime(peak, startAt);
      toneGain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      oscillator.connect(toneGain);
      toneGain.connect(ctx.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
    };

    playTone(830, now, 0.12);
    playTone(1050, now + 0.13, 0.15);
  }, [volume]);

  const playSound = useCallback((soundId: string) => {
    if (!notificationSoundEnabled) return;

    try {
      const context = getContext();
      if (!context) return;
      const { ctx, gain } = context;

      if (soundId === 'notification-chime') {
        playChime(ctx);
        return;
      }

      getBuffer(ctx, soundId)
        .then((buffer) => {
          if (!buffer) return;
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(gain);
          source.onended = () => {
            if (oneShotSourceRef.current === source) {
              oneShotSourceRef.current = null;
            }
          };
          oneShotSourceRef.current = source;
          source.start(0);
        })
        .catch(() => {
          // Audio must never crash the app — swallow fetch/decode failures.
        });
    } catch {
      // Swallow synchronous failures too.
    }
  }, [notificationSoundEnabled, getContext, getBuffer, playChime]);

  const stopSound = useCallback(() => {
    try {
      oneShotSourceRef.current?.stop();
    } catch {
      // Already stopped/ended — ignore.
    }
    oneShotSourceRef.current = null;
  }, []);

  const startAmbient = useCallback((soundId: string) => {
    if (soundId === ambientSoundIdRef.current) return;

    try {
      const context = getContext();
      if (!context) return;
      const { ctx, gain } = context;

      try {
        ambientSourceRef.current?.stop();
      } catch {
        // Already stopped — ignore.
      }
      ambientSourceRef.current = null;
      ambientSoundIdRef.current = soundId;

      getBuffer(ctx, soundId)
        .then((buffer) => {
          // Bail if another startAmbient/stopAmbient call landed first.
          if (!buffer || ambientSoundIdRef.current !== soundId) return;
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.connect(gain);
          source.start(0);
          ambientSourceRef.current = source;
        })
        .catch(() => {
          // Audio must never crash the app — swallow fetch/decode failures.
        });
    } catch {
      // Swallow synchronous failures too.
    }
  }, [getContext, getBuffer]);

  const stopAmbient = useCallback(() => {
    try {
      ambientSourceRef.current?.stop();
    } catch {
      // Already stopped — ignore.
    }
    ambientSourceRef.current = null;
    ambientSoundIdRef.current = null;
  }, []);

  const setVolume = useCallback((next: number) => {
    setVolumeState(next);
  }, []);

  // Cleanup on unmount: stop any playing sources, close the context, clear cache.
  useEffect(() => {
    const bufferCache = bufferCacheRef.current;
    return () => {
      try {
        oneShotSourceRef.current?.stop();
        ambientSourceRef.current?.stop();
        audioContextRef.current?.close();
      } catch {
        // Already stopped/closed — ignore.
      }
      bufferCache.clear();
    };
  }, []);

  return {
    playSound,
    stopSound,
    startAmbient,
    stopAmbient,
    setVolume,
    volume,
    isEnabled: notificationSoundEnabled,
  };
}
