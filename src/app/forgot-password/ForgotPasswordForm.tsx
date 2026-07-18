"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
import React, { useState } from "react";
import styles from "../login/LoginForm.module.css";
import Link from "next/link";
import { createClient } from '@/app/lib/supabase/client';
import { translateSupabaseError } from '@/app/lib/errors';
import Notification from "@/app/components/Notification/Notification";

/**
 * ForgotPasswordForm Component
 *
 * Renders a form that lets a user request a password recovery email via
 * Supabase Auth. On success the user receives an email with a link that
 * redirects to the /reset-password page where a new password can be set.
 */
export default function ForgotPasswordForm() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
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

  /**
   * Validates the email field before submission.
   * @returns Error message string or null if valid
   */
  const validate = () => {
    if (!email.trim()) return "El correo electrónico es obligatorio.";
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return "Correo electrónico inválido.";
    return null;
  };

  /**
   * Handles form submission, requesting a recovery email from Supabase.
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
    // Send the recovery email. The redirect points to the page where the
    // user can set a new password once the recovery session is established.
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      setNotification({ visible: true, message: translateSupabaseError(error.message), icon: iconError });
    } else {
      setSent(true);
      setNotification({
        visible: true,
        message: "Te enviamos un enlace de recuperación. Revisa tu correo electrónico.",
        icon: iconSuccess,
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
        padding: "2rem 1rem",
      }}
    >
      <Notification
        message={notification.message}
        visible={notification.visible}
        icon={notification.icon}
        duration={3000}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
      <form className={styles.formContainer} onSubmit={handleSubmit}>
        <div className={styles.formTitle}>Recuperar contraseña</div>
        <div className={styles.formSubtitle}>
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </div>
        {/* Email input */}
        <input
          className={styles.input}
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={sent}
        />
        {/* Submit button */}
        <button className={styles.button} type="submit" disabled={loading || sent}>
          {loading ? "Enviando..." : sent ? "Enlace enviado" : "Enviar enlace"}
        </button>
        {/* Link back to login */}
        <Link className={styles.link} href="/login">
          Volver a iniciar sesión
        </Link>
      </form>
    </div>
  );
}
