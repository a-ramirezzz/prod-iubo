"use client";
import React, { useState } from "react";
import styles from "./SignupForm.module.css";
import Link from "next/link";
import { signUp } from "./actions";
import { translateSupabaseError } from '@/app/lib/errors';
import Notification from "@/app/components/Notification/Notification";

/**
 * SignupForm Component
 *
 * Renders a registration form for new users, including validation and integration
 * with a server action to create the user in Supabase Auth and the database.
 */
export default function SignupForm({ hideLinks = false }: { hideLinks?: boolean }) {
  // Form state hooks for each input field
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{ visible: boolean; message: string; icon: React.ReactNode }>({ visible: false, message: '', icon: null });

  // SVG icons
  const iconSuccess = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#48c6ef"/>
      <path d="M15 25.5L21 31.5L33 19.5" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
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
    if (username.length < 3) return "El usuario debe tener al menos 3 caracteres.";
    if (!firstName.trim()) return "El nombre es obligatorio.";
    if (!lastName.trim()) return "El apellido es obligatorio.";
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return "Correo electrónico inválido.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    if (phone && !/^\+?[1-9]\d{6,14}$/.test(phone)) return "Teléfono inválido. Usa formato internacional, ej: +5215551234567";
    return null;
  };

  /**
   * Handles form submission, calls the server action, and manages UI feedback.
   * @param e React.FormEvent
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    const validationError = validate();
    if (validationError) {
      setNotification({ visible: true, message: validationError, icon: iconError });
      return;
    }
    setLoading(true);

    // Pre-submission check to see if the email already exists.
    // This provides immediate feedback to the user without waiting for the full signup process to fail.
    try {
      const emailCheckResponse = await fetch('/api/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Read the JSON body of the response a single time.
      const responseData = await emailCheckResponse.json();

      // Handle cases where the API responds with a non-2xx status (e.g., 500).
      if (!emailCheckResponse.ok) {
        // If the response is not OK, throw an error with the message from the API.
        throw new Error(responseData.error || 'Failed to check email existence.');
      }

      if (responseData.exists) {
        setNotification({ visible: true, message: 'El correo electrónico ya está registrado.', icon: iconWarning });
        setLoading(false);
        return; // Stop the submission process.
      }
    } catch (apiError) { // The 'any' type is removed here for type safety.
      // Type-safe error handling. Check if the caught object is an instance of Error.
      if (apiError instanceof Error) {
        console.error("API error during email check:", apiError.message);
      } else {
        console.error("An unexpected API error occurred during email check:", apiError);
      }
      // Show a generic error to the user and stop the submission.
      setNotification({ visible: true, message: 'No se pudo verificar el correo en este momento. Inténtalo de nuevo.', icon: iconError });
      setLoading(false);
      return;
    }

    // Call the server action to register the user.
    // Supabase will handle the final check for duplicate emails as a fallback.
    const result = await signUp({
      username,
      firstName,
      lastName,
      email,
      phone,
      password,
    });
    setLoading(false);
    if (result?.error) {
      const translated = translateSupabaseError(result.error);
      // Show warning icon if it's a duplicate user error, else error icon
      if (translated.includes("ya está registrado") || translated.includes("ya está en uso")) {
        setNotification({ visible: true, message: translated, icon: iconWarning });
      } else {
        setNotification({ visible: true, message: translated, icon: iconError });
      }
    } else if (result?.success) {
      setSuccess(result.success);
      setNotification({
        visible: true,
        message: "¡Registro exitoso! Por favor, revisa tu correo electrónico para confirmar el email.",
        icon: iconSuccess,
      });
      // Reset form fields on success
      setUsername("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setConfirmPassword("");
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
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>Registro</div>
      {/* Error message display */}
      {error && <div className={styles.error}>{error}</div>}
      {/* Success message display */}
      {success && <div style={{ color: '#48c6ef', background: 'rgba(72,198,239,0.08)', borderRadius: 6, padding: '0.5rem 1rem', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
      {/* Username input */}
      <input
        className={styles.input}
        type="text"
        placeholder="Usuario"
        value={username}
        onChange={e => setUsername(e.target.value)}
        required
        autoComplete="username"
        minLength={3}
      />
      {/* First name input */}
      <input
        className={styles.input}
        type="text"
        placeholder="Primer nombre(s)"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        required
        autoComplete="given-name"
      />
      {/* Last name input */}
      <input
        className={styles.input}
        type="text"
        placeholder="Apellido"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        required
        autoComplete="family-name"
      />
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
      {/* Phone input (optional) */}
      <input
        className={styles.input}
        type="tel"
        placeholder="Teléfono (opcional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        autoComplete="tel"
      />
      {/* Password input */}
      <input
        className={styles.input}
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="new-password"
        minLength={6}
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
      />
      {/* Submit button */}
        <button className={styles.button} type="submit" disabled={loading}>
          {loading ? "Registrando..." : "Registrarse"}
      </button>
      {/* Link to login page */}
        {!hideLinks && (
      <Link className={styles.link} href="/login">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
        )}
    </form>
    </>
  );
} 