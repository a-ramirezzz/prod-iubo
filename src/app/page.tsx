"use client";

import Link from 'next/link';
import Image from 'next/image';
import styles from '@/app/LandingPage.module.css';

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
  return (
    <div className={styles.container}>
      {/* Hero Section - Main call-to-action area */}
      <section className={styles.hero}>
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
          <Link href="/app" className={styles.heroButton}>
            Comenzar Ahora
          </Link>
        </div>
      </section>

      {/* Introduction Section - Project explanation and Pomodoro technique */}
      <section className={styles.section}>
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
      <section className={styles.section}>
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
                Desde temporizadores predefinidos hasta entrada manual y una lista de tareas integrada. Incluye un "Modo Mini" para una vista compacta y sin distracciones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Gallery Section - Application screenshots and demos */}
      <section className={styles.section}>
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
      <section className={styles.section}>
        <div className={styles.content}>
          <h2 className={styles.sectionTitle}>Estado Actual</h2>
          <ul className={styles.statusList}>
            {/* Software version status */}
            <li>Software: Versión 1.0 funcional y desplegada. La aplicación web es completamente operativa.</li>
            {/* Implemented features */}
            <li>Características Implementadas: Sistema de temporizador completo (iniciar, pausar, resetear, detener), gestión de tareas, y un panel de configuración robusto con ajustes generales, sistema de temas (estáticos y animados) y control de sonidos de fondo con volumen.</li>
            {/* Technical stack information */}
            <li>Código Fuente: El proyecto está construido con Next.js y TypeScript, siguiendo las mejores prácticas de desarrollo. El código está completamente refactorizado y documentado en inglés.</li>
          </ul>
        </div>
      </section>

      {/* Footer Section - Call-to-action and project links */}
      <footer className={styles.footer}>
        <div className={styles.content}>
          <p className={styles.footerText}>¿Interesado en el proyecto?</p>
          <div className={styles.footerButtons}>
            {/* GitHub repository link */}
            <a 
              href="https://github.com/rodrigobeta/prod-iubo" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.footerButton}
            >
              Ver en GitHub
            </a>
            {/* Application access link */}
            <Link href="/app" className={styles.footerButton}>
              Usar la Aplicación
            </Link>
          </div>
          {/* Copyright information */}
          <p className={styles.copyright}>© 2024 Alan Rodrigo Ramírez Luna</p>
        </div>
      </footer>
    </div>
  );
} 