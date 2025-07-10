import React, { useEffect, useState } from 'react';
import styles from './CelebrationEffect.module.css';

// Configuration constants
const PARTICLE_COUNT = 15;
const ANIMATION_DURATION = 3000;
const MAX_DELAY = 0.5;

interface CelebrationEffectProps {
  /** Controls whether the celebration effect is active */
  isActive: boolean;
  /** Callback fired when celebration animation completes */
  onComplete?: () => void;
}

export default function CelebrationEffect({ isActive, onComplete }: CelebrationEffectProps) {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  useEffect(() => {
    if (isActive) {
      // Create fire particles with random positions and delays
      const newParticles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // Random X position
        y: Math.random() * 100, // Random Y position
        delay: Math.random() * MAX_DELAY // Random delay for staggered animation
      }));
      
      setParticles(newParticles);

      // Clean up after animation duration
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
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={styles.fireParticle}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`
          }}
        >
          🔥
        </div>
      ))}
    </div>
  );
} 