"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/lib/i18n';

export function HeroSection() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { t } = useLocale();

  const subtitle = t('landing.hero.subtitle');

  // Typewriter state
  const [typedText, setTypedText] = useState('');
  const [typingDone, setTypingDone] = useState(false);

  // Typewriter effect
  useEffect(() => {
    setTypedText('');
    setTypingDone(false);
    let i = 0;
    const interval = setInterval(() => {
      if (i < subtitle.length) {
        setTypedText(subtitle.slice(0, i + 1));
        i++;
      } else {
        setTypingDone(true);
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [subtitle]);

  // Canvas particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const PARTICLE_COUNT = 90;
    const CONNECTION_DIST = 120;

    type Particle = {
      x: number; y: number;
      vx: number; vy: number;
      r: number; opacity: number; color: string;
    };

    const blueColor = '59,130,246';
    const redColor = '239,68,68';

    function makeParticle(w: number, h: number): Particle {
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: 1 + Math.random() * 1.5,
        opacity: 0.2 + Math.random() * 0.5,
        color: Math.random() < 0.6 ? blueColor : redColor,
      };
    }

    let w = canvas.offsetWidth;
    let h = canvas.offsetHeight;
    canvas.width = w;
    canvas.height = h;

    let particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => makeParticle(w, h));
    let rafId: number;

    function draw() {
      ctx!.clearRect(0, 0, w, h);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.15;
            ctx!.beginPath();
            ctx!.strokeStyle = `rgba(${particles[i].color},${alpha})`;
            ctx!.lineWidth = 0.8;
            ctx!.moveTo(particles[i].x, particles[i].y);
            ctx!.lineTo(particles[j].x, particles[j].y);
            ctx!.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${p.color},${p.opacity})`;
        ctx!.fill();

        // Move
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();

    function onResize() {
      w = canvas!.offsetWidth;
      h = canvas!.offsetHeight;
      canvas!.width = w;
      canvas!.height = h;
      particles = Array.from({ length: PARTICLE_COUNT }, () => makeParticle(w, h));
    }

    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Smooth scroll handler for internal navigation
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for CTA button
  const handleStart = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <section className={styles.hero} id="inicio">
      {/* Particle canvas */}
      <canvas ref={canvasRef} className={styles.heroCanvas} aria-hidden="true" />

      {/* Decorative orbs */}
      <div className={styles.orbRed} aria-hidden="true" />
      <div className={styles.orbBlue} aria-hidden="true" />

      <div className={styles.heroContent}>
        <h1 className={styles.heroTitle}>
          <span className={styles.prodText}>PROD</span>
          <span className={styles.uiboText}>-UIBO</span>
        </h1>

        {/* Typewriter subtitle */}
        <p className={styles.heroSubtitle}>
          {typedText}
          {!typingDone && <span className={styles.typingCursor}>|</span>}
        </p>

        <a href="/login" className={styles.heroButton} onClick={handleStart}>
          {t('landing.hero.cta')}
        </a>

        {/* Stat badges */}
        <div className={styles.statBadges}>
          <span className={`${styles.statBadge} ${styles.statBadge1}`}>{t('landing.hero.stats.themes')}</span>
          <span className={`${styles.statBadge} ${styles.statBadge2}`}>{t('landing.hero.stats.sounds')}</span>
          <span className={`${styles.statBadge} ${styles.statBadge3}`}>{t('landing.hero.stats.free')}</span>
        </div>
      </div>

      {/* Scroll indicator */}
      <a
        href="#informacion"
        className={styles.scrollIndicator}
        onClick={e => handleScroll(e, 'informacion')}
        aria-label={t('landing.hero.scrollIndicatorAria')}
      >
        <span className={styles.scrollIndicatorText}>{t('landing.hero.scrollIndicator')}</span>
        <svg
          className={styles.scrollIndicatorArrow}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 10L12 15L17 10"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </section>
  );
}

export default HeroSection;
