import React, { useEffect, useState } from 'react';
import styles from './CelebrationEffect.module.css';

const EMOJI_SET = ['🔥','⭐','🎉','✨','💥','🏆','🎊','💫'];
const PARTICLE_COUNT = 28;
const ANIMATION_DURATION = 3500;

interface CelebrationEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export default function CelebrationEffect({ isActive, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Array<{
    id: number; emoji: string; x: number; y: number;
    delay: number; scale: number; rotation: number; drift: number;
  }>>([]);

  useEffect(() => {
    if (isActive) {
      const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        emoji: EMOJI_SET[Math.floor(Math.random() * EMOJI_SET.length)],
        x: Math.random() * 90 + 5,
        y: Math.random() * 80 + 10,
        delay: Math.random() * 0.8,
        scale: Math.random() * 0.8 + 0.8,
        rotation: Math.random() * 60 - 30,
        drift: Math.random() * 80 - 40,
      }));

      setParticles(newParticles);

      const timer = setTimeout(() => {
        setParticles([]);
        onComplete?.();
      }, ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div className={styles.celebrationContainer}>
      <div className={styles.flashOverlay} />
      <div className={styles.burstRing} />
      <div className={styles.burstRing2} />
      {particles.map((p) => (
        <div
          key={p.id}
          className={styles.particle}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            animationDelay: `${p.delay}s`,
            '--scale': p.scale,
            '--rotation': `${p.rotation}deg`,
            '--drift': `${p.drift}px`,
          } as React.CSSProperties}
        >
          {p.emoji}
        </div>
      ))}
    </div>
  );
}
