import Link from 'next/link';
import styles from '@/app/LandingPage.module.css';

export default function LandingPage() {
  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>Bienvenido a Prod-UIBO</h1>
        <p className={styles.subtitle}>Tu espacio para la productividad y el enfoque.</p>
        <Link href="/app" className={styles.ctaButton}>
          Entrar a la Aplicación
        </Link>
      </div>
    </main>
  );
} 