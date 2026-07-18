"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
import React, { useEffect, useState } from "react";
import styles from "../login/LoginForm.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from '@/app/lib/supabase/client';
import { translateSupabaseError } from '@/app/lib/errors';
import Notification from "@/app/components/Notification/Notification";

/**
 * ResetPasswordForm Component
 *
 * Landing form for the password recovery email link. Supabase redirects here
 * with recovery tokens in the URL fragment; the browser client picks them up
 * and emits a PASSWORD_RECOVERY auth event, establishing a temporary session.
 * With that session the user can call updateUser to set a new password.
 */
export default function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // null = still verifying the recovery token, true = valid session, false = invalid/expired link
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(null);
  const [notification, setNotification] = useState<{ visible: boolean; message: string; icon: React.ReactNode }>({ visible: false, message: '', icon: null });

  // SVG icons (same visual language as LoginForm/SignupForm)
  const iconSuccess = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#48c6ef"/>
      <path d="M15 25.5L21 31.5L33 19.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const iconError = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#E53935"/>
      <path d="M17 17L31 31M31 17L17 31" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  // Detect the recovery session. The browser client parses the URL fragment on
  // load and fires a PASSWORD_RECOVERY event once the temporary session exists.
  // If no such session appears within a few seconds, treat the link as invalid.
  useEffect(() => {
    let settled = false;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        settled = true;
        setRecoveryReady(true);
      }
    });

    // Fallback: the event may have fired before the listener attached, so also
    // check for an already-established session directly.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && !settled) {
        settled = true;
        setRecoveryReady(true);
      }
    });

    const timeout = setTimeout(() => {
      if (!settled) setRecoveryReady(false);
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  /**
   * Validates the password fields before submission.
   * @returns Error message string or null if valid
   */
  const validate = () => {
    if (!password || !confirmPassword) return "Ambos campos son obligatorios.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    return null;
  };

  /**
   * Handles form submission, updating the user's password via Supabase.
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
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setNotification({ visible: true, message: translateSupabaseError(error.message), icon: iconError });
    } else {
      setDone(true);
      setNotification({
        visible: true,
        message: "Contraseña actualizada correctamente.",
        icon: iconSuccess,
      });
      setTimeout(() => {
        router.push("/app");
      }, 2000);
    }
  };

  const pageWrapperStyle: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
    padding: "2rem 1rem",
  };

  // Verifying the recovery token.
  if (recoveryReady === null) {
    return (
      <div style={pageWrapperStyle}>
        <div className={styles.formContainer}>
          <div className={styles.formTitle}>Verificando enlace…</div>
          <div className={styles.formSubtitle}>Un momento, por favor.</div>
        </div>
      </div>
    );
  }

  // Invalid or expired recovery link — do not render the password form.
  if (recoveryReady === false) {
    return (
      <div style={pageWrapperStyle}>
        <div className={styles.formContainer}>
          <div className={styles.formTitle}>Enlace no válido</div>
          <div className={styles.formSubtitle}>
            Este enlace ha expirado o no es válido. Solicita uno nuevo.
          </div>
          <Link className={styles.link} href="/forgot-password">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={pageWrapperStyle}>
      <Notification
        message={notification.message}
        visible={notification.visible}
        icon={notification.icon}
        duration={3000}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <div className={styles.formTitle}>Nueva contraseña</div>
        <div className={styles.formSubtitle}>
          Ingresa y confirma tu nueva contraseña.
        </div>
        {/* New password input */}
        <input
          className={styles.input}
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
          disabled={done}
        />
        {/* Confirm password input */}
        <input
          className={styles.input}
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
          disabled={done}
        />
        {/* Submit button */}
        <button className={styles.button} type="submit" disabled={loading || done}>
          {loading ? "Actualizando..." : "Actualizar contraseña"}
        </button>
        {/* Link back to login */}
        <Link className={styles.link} href="/login">
          Volver a iniciar sesión
        </Link>
      </form>
    </div>
  );
}
