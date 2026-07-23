"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import Image from 'next/image';
import styles from '@/app/LandingPage.module.css';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from '@/app/lib/i18n';
import LanguageSwitch from '@/components/LanguageSwitch/LanguageSwitch';

export default function LandingPage() {
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

  // Scroll-triggered reveal
  useEffect(() => {
    const els = document.querySelectorAll('[data-reveal]');
    els.forEach(el => el.classList.add(styles.reveal));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
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
    <div className={styles.container}>
      {/* Language switcher - floats over the hero, always accessible */}
      <div className={styles.langSwitchFloat}>
        <LanguageSwitch />
      </div>
      {/* BETA Badge */}
      <div className={styles.betaBadge} title={t('landing.hero.badgeTooltip')}>
        {t('landing.hero.badge')}
      </div>
      {/* Hero Section */}
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

      {/* Introduction Section - Project explanation and Pomodoro technique */}
      <section className={styles.section} id="informacion">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('landing.intro.title')}</h2>
          {/* Project description paragraphs */}
          <div className={styles.introText}>
            <p>{t('landing.intro.paragraph1')}</p>
            <p>{t('landing.intro.paragraph2')}</p>
          </div>

          <div className={styles.introHighlight}>
            <span className={styles.introHighlightIcon}>💡</span>
            <p>{t('landing.intro.highlightPrefix')}<strong>{t('landing.intro.highlightStrong')}</strong>{t('landing.intro.highlightSuffix')}</p>
          </div>

          {/* Pomodoro Technique Section - Educational content with interactive elements */}
          <div className={styles.pomodoroSection}>
            {/* Section header with animated icon */}
            <h3 className={styles.pomodoroTitle}>
              <span className={styles.pomodoroIcon}>🍅</span>
              {t('landing.pomodoro.title')}
            </h3>
            {/* Introduction to Pomodoro technique */}
            <p className={styles.pomodoroIntro}>
              {t('landing.pomodoro.intro')}
            </p>

            {/* Step-by-step Pomodoro process */}
            <div className={styles.pomodoroSteps}>
              {[0, 1, 2, 3].map((i) => (
                <div className={styles.pomodoroStep} data-reveal key={i}>
                  <div className={styles.stepNumber}>{i + 1}</div>
                  <div className={styles.stepContent}>
                    <h4>{t(`landing.pomodoro.steps.${i}.title`)}</h4>
                    <p>{t(`landing.pomodoro.steps.${i}.description`)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Benefits of Pomodoro technique */}
            <div className={styles.pomodoroBenefits}>
              <h4>{t('landing.pomodoro.benefitsTitle')}</h4>
              <div className={styles.benefitsGrid}>
                {['🎯', '⏰', '🧠', '📈'].map((icon, i) => (
                  <div className={styles.benefitItem} key={i}>
                    <span className={styles.benefitIcon}>{icon}</span>
                    <span>{t(`landing.pomodoro.benefits.${i}`)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Main product capabilities */}
      <section className={styles.section} id="caracteristicas">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('landing.features.title')}</h2>
          <div className={styles.featuresGrid}>
            {/* Feature 1: Immersive Personalization */}
            <div className={styles.featureCard} data-reveal>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for personalization */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="currentColor"/>
                  <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('landing.features.cards.0.title')}</h3>
              <p className={styles.featureDescription}>
                {t('landing.features.cards.0.description')}
              </p>
            </div>
            
            {/* Feature 2: Ambient Sounds */}
            <div className={styles.featureCard} data-reveal>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for audio/sound */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" fill="currentColor"/>
                  <path d="M10 19C8.9 19 8 18.1 8 17C8 15.9 8.9 15 10 15C11.1 15 12 15.9 12 17C12 18.1 11.1 19 10 19Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('landing.features.cards.1.title')}</h3>
              <p className={styles.featureDescription}>
                {t('landing.features.cards.1.description')}
              </p>
            </div>
            
            {/* Feature 3: Total Flexibility */}
            <div className={styles.featureCard} data-reveal>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for list/tasks */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
                  <path d="M7 7H17V9H7V7Z" fill="currentColor"/>
                  <path d="M7 11H17V13H7V11Z" fill="currentColor"/>
                  <path d="M7 15H14V17H7V15Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>{t('landing.features.cards.2.title')}</h3>
              <p className={styles.featureDescription}>
                {t('landing.features.cards.2.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Section - Application screenshots and demos */}
      <section className={styles.section} id="galeria">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('landing.gallery.title')}</h2>
          <div className={styles.gallery}>
            {/* Static theme screenshot */}
            <div className={styles.galleryItem} data-reveal>
              <div className={styles.imageContainer}>
                <Image
                  src="/captura-estatico.png"
                  alt={t('landing.gallery.staticThemeAlt')}
                  width={600}
                  height={400}
                  className={styles.galleryImage}
                />
                <div className={styles.imageOverlay}>
                  <span>{t('landing.gallery.staticTheme')}</span>
                </div>
              </div>
            </div>
            
            {/* Animated theme video demo */}
            <div className={styles.galleryItem} data-reveal>
              <div className={styles.videoContainer}>
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={styles.galleryVideo}
                >
                  {/* Multiple video formats for browser compatibility */}
                  <source src="/captura-animado.mp4" type="video/mp4" />
                  <source src="/captura-animado.webm" type="video/webm" />
                  {t('landing.gallery.videoFallback')}
                </video>
                <div className={styles.videoOverlay}>
                  <span className={styles.videoLabel}>{t('landing.gallery.animatedTheme')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Status Section - Current development state */}
      <section className={styles.section} id="estado">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('landing.status.title')}</h2>
          <div className={styles.betaNotice}>
            <span className={styles.betaNoticeBadge}>{t('landing.status.betaBadge')}</span>
            <span>{t('landing.status.betaNotice')}</span>
          </div>
          <ul className={styles.statusList}>
            {['🚀', '⚙️', '🔜'].map((icon, i) => (
              <li data-reveal key={i}><span className={styles.statusIcon}>{icon}</span>{t(`landing.status.items.${i}`)}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Roadmap Section - Upcoming features and improvements */}
      <section className={styles.section} id="roadmap">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>{t('landing.roadmap.title')}</h2>
          <div className={styles.roadmapWrapper}>
            <div className={styles.roadmapGrid}>
              {[
                { i: 0, done: true },
                { i: 1, done: true },
                { i: 2, done: false },
                { i: 3, done: false },
              ].map(({ i, done }) => (
                <div
                  className={styles.roadmapItem + ' ' + (done ? styles.roadmapDone : styles.roadmapNext)}
                  data-reveal
                  key={i}
                >
                  <span className={styles.roadmapIcon}>{done ? '✔️' : '🔜'}</span>
                  <span>{t(`landing.roadmap.items.${i}.title`)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer Section - Redesigned */}
      <footer className={styles.footer}>
        <div className={styles.footerMain}>
          {/* Left: Branding, description, social */}
          <div className={styles.footerLeft}>
            <div className={styles.footerBrand}>
              <Image src="/favicon.png" alt={t('landing.footer.logoAlt')} width={36} height={36} className={styles.footerLogo} />
              <div>
                <div className={styles.footerTitle}>{t('landing.footer.brand')} <span className={styles.footerBy}>{t('landing.footer.brandBy')}</span></div>
              </div>
            </div>
            <p className={styles.footerDesc}>
              {t('landing.footer.description')}
            </p>
            <div className={styles.footerSocials}>
              <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={styles.socialIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M7 2C4.23858 2 2 4.23858 2 7V17C2 19.7614 4.23858 22 7 22H17C19.7614 22 22 19.7614 22 17V7C22 4.23858 19.7614 2 17 2H7ZM12 7C14.7614 7 17 9.23858 17 12C17 14.7614 14.7614 17 12 17C9.23858 17 7 14.7614 7 12C7 9.23858 9.23858 7 12 7ZM19 7.5C19.2761 7.5 19.5 7.27614 19.5 7C19.5 6.72386 19.2761 6.5 19 6.5C18.7239 6.5 18.5 6.72386 18.5 7C18.5 7.27614 18.7239 7.5 19 7.5Z" fill="currentColor"/></svg>
              </a>
              <a href="https://x.com/" target="_blank" rel="noopener noreferrer" aria-label="X" className={styles.socialIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M17.53 2H21.5L14.36 10.39L22.74 21.5H16.08L10.98 14.93L5.19 21.5H1.21L8.78 12.61L0.75 2H7.58L12.18 7.97L17.53 2ZM16.36 19.5H18.19L6.5 4.5H4.54L16.36 19.5Z" fill="currentColor"/></svg>
              </a>
            </div>
          </div>

          {/* Center: Mini Roadmap */}
          <div className={styles.footerCenter}>
            <div className={styles.footerMiniRoadmapTitle}>{t('landing.footer.miniRoadmapTitle')}</div>
            <div className={styles.footerMiniRoadmap}>
              {[
                { i: 0, done: true },
                { i: 1, done: true },
                { i: 2, done: false },
                { i: 3, done: false },
              ].map(({ i, done }) => (
                <div
                  className={styles.roadmapItem + ' ' + (done ? styles.roadmapDone : styles.roadmapNext)}
                  key={i}
                >
                  <span className={styles.roadmapIcon}>{done ? '✔️' : '🔜'}</span>
                  <span>{t(`landing.footer.miniRoadmapItems.${i}`)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Navigation menu */}
          <div className={styles.footerRight}>
            <nav className={styles.footerNav} aria-label={t('landing.footer.navAria')}>
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>{t('landing.footer.navLinks.inicio')}</a>
              <a href="#informacion" onClick={e => handleScroll(e, 'informacion')}>{t('landing.footer.navLinks.informacion')}</a>
              <a href="#caracteristicas" onClick={e => handleScroll(e, 'caracteristicas')}>{t('landing.footer.navLinks.caracteristicas')}</a>
              <a href="#galeria" onClick={e => handleScroll(e, 'galeria')}>{t('landing.footer.navLinks.galeria')}</a>
              <a href="#estado" onClick={e => handleScroll(e, 'estado')}>{t('landing.footer.navLinks.estado')}</a>
              <a href="#roadmap" onClick={e => handleScroll(e, 'roadmap')}>{t('landing.footer.navLinks.roadmap')}</a>
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>{t('landing.footer.navLinks.app')}</a>
            </nav>
          </div>
        </div>
        {/* Bottom: Copyright and legal links */}
        <div className={styles.footerBottom}>
          <div className={styles.footerCopyright}>
            {t('landing.footer.copyright')}
          </div>
          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerLegalLink}>{t('landing.footer.legal.privacy')}</a>
            <a href="#" className={styles.footerLegalLink}>{t('landing.footer.legal.terms')}</a>
            <a href="#" className={styles.footerLegalLink}>{t('landing.footer.legal.cookies')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 