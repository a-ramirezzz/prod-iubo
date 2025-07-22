"use client";

import Image from 'next/image';
import styles from '@/app/LandingPage.module.css';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Landing Page Component
 * 
 * This component serves as the main landing page for Prod-UIBO, featuring:
 * - Hero section with call-to-action
 * - Project introduction and Pomodoro technique explanation
 * - Feature highlights with interactive cards
 * - Visual gallery showcasing the application
 * - Project status and footer with links
 * 
 * The page is fully responsive and includes smooth animations
 * for enhanced user experience.
 */
export default function LandingPage() {
  const router = useRouter();

  // Smooth scroll handler for internal navigation
  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
    e.preventDefault();
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handler for CTA button with loading animation
  const handleStart = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    router.push('/login');
  };

  return (
    <div className={styles.container}>
      {/* BETA Badge */}
      <div className={styles.betaBadge} title="Esta aplicación está en fase BETA y aún no ha sido lanzada oficialmente.">
        BETA
      </div>
      {/* Loading Overlay */}
      {/* Hero Section - Main call-to-action area */}
      <section className={styles.hero} id="inicio">
        <div className={styles.heroContent}>
          {/* Brand title with color-coded styling */}
          <h1 className={styles.heroTitle}>
            <span className={styles.prodText}>PROD</span>
            <span className={styles.uiboText}>-UIBO</span>
          </h1>
          {/* Value proposition subtitle */}
          <p className={styles.heroSubtitle}>
            Un temporizador de productividad personalizable para máxima concentración.
          </p>
          {/* Primary call-to-action button */}
          <a href="/login" className={styles.heroButton} onClick={handleStart}>
            Comenzar Ahora
          </a>
          {/* Auth links */}
        </div>
        
        {/* Scroll indicator - invites users to explore more content */}
        <a 
          href="#informacion" 
          className={styles.scrollIndicator}
          onClick={e => handleScroll(e, 'informacion')}
          aria-label="Explorar más información sobre el proyecto"
        >
          <span className={styles.scrollIndicatorText}>Descubre más</span>
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
          <h2 className={styles.sectionTitle}>¿Qué es y por qué existe?</h2>
          {/* Project description paragraphs */}
          <div className={styles.introText}>
            <p>
              Prod-UIBO es un temporizador de productividad basado en la web, diseñado para ayudar a los usuarios a gestionar su tiempo y mantener el enfoque durante sesiones de trabajo o estudio. A diferencia de otros temporizadores, su núcleo es la personalización, permitiendo al usuario adaptar completamente el entorno visual y sonoro para crear un espacio de concentración ideal.
            </p>
            <p>
              La mayoría de las herramientas de productividad son funcionales pero visualmente aburridas, o son estéticas pero carecen de flexibilidad. Prod-UIBO nace de la necesidad de tener una herramienta que no obligue a elegir. El objetivo era crear un temporizador que no solo fuera un cronómetro, sino un verdadero entorno de trabajo personalizable que el usuario realmente disfrute usar, combinando un diseño moderno con una configuración detallada.
            </p>
          </div>

          {/* Pomodoro Technique Section - Educational content with interactive elements */}
          <div className={styles.pomodoroSection}>
            {/* Section header with animated icon */}
            <h3 className={styles.pomodoroTitle}>
              <span className={styles.pomodoroIcon}>🍅</span>
              La Técnica Pomodoro
            </h3>
            {/* Introduction to Pomodoro technique */}
            <p className={styles.pomodoroIntro}>
              Prod-UIBO implementa la famosa técnica Pomodoro, un método probado para maximizar la productividad y mantener el enfoque mental.
            </p>
            
            {/* Step-by-step Pomodoro process */}
            <div className={styles.pomodoroSteps}>
              {/* Step 1: Choose a task */}
              <div className={styles.pomodoroStep}>
                <div className={styles.stepNumber}>1</div>
                <div className={styles.stepContent}>
                  <h4>Elige una tarea</h4>
                  <p>Selecciona una actividad específica que requiera tu atención completa</p>
                </div>
              </div>
              
              {/* Step 2: 25-minute focus session */}
              <div className={styles.pomodoroStep}>
                <div className={styles.stepNumber}>2</div>
                <div className={styles.stepContent}>
                  <h4>25 minutos de concentración</h4>
                  <p>Ajusta el temporizador y trabaja sin interrupciones hasta que suene</p>
                </div>
              </div>
              
              {/* Step 3: Short break */}
              <div className={styles.pomodoroStep}>
                <div className={styles.stepNumber}>3</div>
                <div className={styles.stepContent}>
                  <h4>Pausa de 5 minutos</h4>
                  <p>Toma un descanso corto para recargar tu energía mental</p>
                </div>
              </div>
              
              {/* Step 4: Repeat cycle */}
              <div className={styles.pomodoroStep}>
                <div className={styles.stepNumber}>4</div>
                <div className={styles.stepContent}>
                  <h4>Repite el ciclo</h4>
                  <p>Después de 4 pomodoros, toma una pausa larga de 15-30 minutos</p>
                </div>
              </div>
            </div>

            {/* Benefits of Pomodoro technique */}
            <div className={styles.pomodoroBenefits}>
              <h4>Beneficios de la Técnica Pomodoro:</h4>
              <div className={styles.benefitsGrid}>
                {/* Benefit: Improved focus */}
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>🎯</span>
                  <span>Mejora el enfoque</span>
                </div>
                {/* Benefit: Time management */}
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>⏰</span>
                  <span>Gestión del tiempo</span>
                </div>
                {/* Benefit: Mental fatigue reduction */}
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>🧠</span>
                  <span>Reduce la fatiga mental</span>
                </div>
                {/* Benefit: Increased productivity */}
                <div className={styles.benefitItem}>
                  <span className={styles.benefitIcon}>📈</span>
                  <span>Aumenta la productividad</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Main product capabilities */}
      <section className={styles.section} id="caracteristicas">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Características Principales</h2>
          <div className={styles.featuresGrid}>
            {/* Feature 1: Immersive Personalization */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for personalization */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                  <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="currentColor"/>
                  <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Personalización Inmersiva</h3>
              <p className={styles.featureDescription}>
                Elige entre temas estáticos y fondos de video animados. Cada tema ajusta los colores de la interfaz y del texto para garantizar la legibilidad y crear una atmósfera única.
              </p>
            </div>
            
            {/* Feature 2: Ambient Sounds */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for audio/sound */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" fill="currentColor"/>
                  <path d="M10 19C8.9 19 8 18.1 8 17C8 15.9 8.9 15 10 15C11.1 15 12 15.9 12 17C12 18.1 11.1 19 10 19Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Sonidos Ambientales</h3>
              <p className={styles.featureDescription}>
                Integra un reproductor de sonidos de fondo (lluvia, música, etc.) con control de volumen para bloquear distracciones y mejorar la concentración.
              </p>
            </div>
            
            {/* Feature 3: Total Flexibility */}
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>
                {/* Custom SVG icon for list/tasks */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
                  <path d="M7 7H17V9H7V7Z" fill="currentColor"/>
                  <path d="M7 11H17V13H7V11Z" fill="currentColor"/>
                  <path d="M7 15H14V17H7V15Z" fill="currentColor"/>
                </svg>
              </div>
              <h3 className={styles.featureTitle}>Flexibilidad Total</h3>
              <p className={styles.featureDescription}>
                Desde temporizadores predefinidos hasta entrada manual y una lista de tareas integrada. Incluye un Modo Mini para una vista compacta y sin distracciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Section - Application screenshots and demos */}
      <section className={styles.section} id="galeria">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>El Proyecto en Acción</h2>
          <div className={styles.gallery}>
            {/* Static theme screenshot */}
            <div className={styles.galleryItem}>
              <div className={styles.imageContainer}>
                <Image
                  src="/captura-estatico.png"
                  alt="Captura de pantalla - Tema Estático"
                  width={600}
                  height={400}
                  className={styles.galleryImage}
                />
                <div className={styles.imageOverlay}>
                  <span>Tema Estático</span>
                </div>
              </div>
            </div>
            
            {/* Animated theme video demo */}
            <div className={styles.galleryItem}>
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
                  Tu navegador no soporta el elemento de video.
                </video>
                <div className={styles.videoOverlay}>
                  <span className={styles.videoLabel}>Tema Animado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Project Status Section - Current development state */}
      <section className={styles.section} id="estado">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Estado Actual</h2>
          <div className={styles.betaNotice}>
            <span className={styles.betaNoticeBadge}>BETA</span>
            <span>Esta aplicación está en fase de prueba y aún no ha sido lanzada oficialmente. Puede contener errores o cambios frecuentes.</span>
          </div>
          <ul className={styles.statusList}>
            {/* Software version status */}
            <li>Software: Versión 1.0 funcional y desplegada. La aplicación web es completamente operativa.</li>
            {/* Implemented features */}
            <li>Características Implementadas: Sistema de temporizador completo (iniciar, pausar, resetear, detener), gestión de tareas, y un panel de configuración robusto con ajustes generales, sistema de temas (estáticos y animados) y control de sonidos de fondo con volumen.</li>
            {/* Próxima funcionalidad */}
            <li>Próximamente: Sincronización en la nube para guardar tus tareas y configuraciones, y aplicación móvil para acceder a Prod-UIBO desde cualquier lugar.</li>
          </ul>
        </div>
      </section>

      {/* Roadmap Section - Upcoming features and improvements */}
      <section className={styles.section} id="roadmap">
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Roadmap</h2>
          <div className={styles.roadmapGrid}>
            <div className={styles.roadmapItem + ' ' + styles.roadmapDone}>
              <span className={styles.roadmapIcon}>✔️</span>
              <span>Temporizador Pomodoro</span>
            </div>
            <div className={styles.roadmapItem + ' ' + styles.roadmapDone}>
              <span className={styles.roadmapIcon}>✔️</span>
              <span>Sonidos ambientales</span>
            </div>
            <div className={styles.roadmapItem + ' ' + styles.roadmapNext}>
              <span className={styles.roadmapIcon}>🔜</span>
              <span>Sincronización en la nube</span>
            </div>
            <div className={styles.roadmapItem + ' ' + styles.roadmapNext}>
              <span className={styles.roadmapIcon}>🔜</span>
              <span>App móvil</span>
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
              <Image src="/favicon.png" alt="Prod-UIBO Logo" width={36} height={36} className={styles.footerLogo} />
              <div>
                <div className={styles.footerTitle}>PROD-UIBO <span className={styles.footerBy}>by Alan Rodrigo Ramírez</span></div>
              </div>
            </div>
            <p className={styles.footerDesc}>
              El compañero de productividad definitivo para quienes buscan lograr más, reducir el estrés y dominar su tiempo con la técnica Pomodoro y un entorno visual y sonoro totalmente personalizable.
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
            <div className={styles.footerMiniRoadmapTitle}>Mini Roadmap</div>
            <div className={styles.footerMiniRoadmap}>
              <div className={styles.roadmapItem + ' ' + styles.roadmapDone}>
                <span className={styles.roadmapIcon}>✔️</span>
                <span>Pomodoro</span>
              </div>
              <div className={styles.roadmapItem + ' ' + styles.roadmapDone}>
                <span className={styles.roadmapIcon}>✔️</span>
                <span>Sonidos</span>
              </div>
              <div className={styles.roadmapItem + ' ' + styles.roadmapNext}>
                <span className={styles.roadmapIcon}>🔜</span>
                <span>Nube</span>
              </div>
              <div className={styles.roadmapItem + ' ' + styles.roadmapNext}>
                <span className={styles.roadmapIcon}>🔜</span>
                <span>App móvil</span>
              </div>
            </div>
          </div>

          {/* Right: Navigation menu */}
          <div className={styles.footerRight}>
            <nav className={styles.footerNav} aria-label="Footer Navigation">
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>Inicio</a>
              <a href="#informacion" onClick={e => handleScroll(e, 'informacion')}>Información</a>
              <a href="#caracteristicas" onClick={e => handleScroll(e, 'caracteristicas')}>Características</a>
              <a href="#galeria" onClick={e => handleScroll(e, 'galeria')}>Galería</a>
              <a href="#estado" onClick={e => handleScroll(e, 'estado')}>Estado</a>
              <a href="#roadmap" onClick={e => handleScroll(e, 'roadmap')}>Roadmap</a>
              <a href="#inicio" onClick={e => handleScroll(e, 'inicio')}>Usar la Aplicación</a>
            </nav>
          </div>
        </div>
        {/* Bottom: Copyright and legal links */}
        <div className={styles.footerBottom}>
          <div className={styles.footerCopyright}>
            © 2024 Alan Rodrigo Ramírez Luna
          </div>
          <div className={styles.footerLegal}>
            <a href="#" className={styles.footerLegalLink}>Privacy Policy</a>
            <a href="#" className={styles.footerLegalLink}>Terms of Service</a>
            <a href="#" className={styles.footerLegalLink}>Cookie Policy</a>
          </div>
        </div>
      </footer>
    </div>
  );
} 