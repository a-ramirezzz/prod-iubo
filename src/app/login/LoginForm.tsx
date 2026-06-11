"use client";
import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/app/lib/supabase/client';
import { translateSupabaseError } from '@/app/lib/errors';
import landingStyles from "@/app/LandingPage.module.css";
import Notification from "@/app/components/Notification/Notification";

/**
 * LoginForm Component
 *
 * Renders a login form for existing users, including validation and integration
 * with a server action to authenticate the user using Supabase Auth.
 */
export default function LoginForm({ hideLinks = false }: { hideLinks?: boolean }) {
  const supabase = createClient();
  // Form state hooks for each input field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAppLoading, setShowAppLoading] = useState(false);
  const router = useRouter();
  const [notification, setNotification] = useState<{ visible: boolean; message: string; icon: React.ReactNode }>({ visible: false, message: '', icon: null });

  // SVG icons
  const iconWarning = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#f59e42"/>
      <path d="M24 14V28" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="24" cy="34" r="2.5" fill="#fff"/>
    </svg>
  );
  const iconError = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#E53935"/>
      <path d="M17 17L31 31M31 17L17 31" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  /**
   * Validates the form fields before submission.
   * @returns Error message string or null if valid
   */
  const validate = () => {
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return "Correo electrónico inválido.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    return null;
  };

  /**
   * Handles form submission, authenticates the user with Supabase, and manages UI feedback.
   * Redirects to the main app page on successful login.
   * @param e React.FormEvent
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setNotification({ visible: true, message: validationError, icon: iconError });
      return;
    }
    setLoading(true);
    // Authenticate the user directly in the client
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      // Check for unconfirmed email error (Supabase error message may vary)
      const translated = translateSupabaseError(error.message);
      if (translated === 'Por favor confirma tu correo electrónico.') {
        setNotification({ visible: true, message: translated, icon: iconWarning });
      } else {
        setNotification({ visible: true, message: translated, icon: iconError });
      }
    } else {
      // Show loading overlay before redirecting to the main app page
      setShowAppLoading(true);
      setTimeout(() => {
        router.push("/app");
      }, 1200);
    }
  };

  return (
    <>
      <Notification
        message={notification.message}
        visible={notification.visible}
        icon={notification.icon}
        duration={3000}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
      {/* App loading overlay (same as landing page) */}
      {showAppLoading && (
        <div className={landingStyles.loadingOverlay}>
          <div className={landingStyles.spinnerWrapper}>
            <div className={landingStyles.spinner}></div>
            <span className={landingStyles.loadingText}>Cargando aplicación…</span>
          </div>
        </div>
      )}
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <div className={styles.formTitle}>Iniciar Sesión</div>
        {/* Error message display */}
        {/* Email input */}
        <input
          className={styles.input}
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
        {/* Password input */}
        <input
          className={styles.input}
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />
        {/* Submit button */}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
        {/* Link to signup page */}
        {!hideLinks && (
        <Link className={styles.link} href="/signup">
          ¿No tienes cuenta? Regístrate
        </Link>
        )}
      </form>
    </>
  );
} 