"use client";
import React, { useState, useTransition } from "react";
import styles from "./SignupForm.module.css";
import Link from "next/link";
import { supabase } from "@/app/lib/supabaseClient";
import { signUp } from "./actions";

/**
 * SignupForm Component
 *
 * Renders a registration form for new users, including validation and integration
 * with a server action to create the user in Supabase Auth and the database.
 */
export default function SignupForm() {
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
  const [isPending, startTransition] = useTransition();

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
    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) return "Teléfono inválido.";
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
      setError(validationError);
      return;
    }
    setLoading(true);
    // Call the server action to register the user
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
      setError(result.error);
    } else if (result?.success) {
      setSuccess(result.success);
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
      <button className={styles.button} type="submit" disabled={loading || isPending}>
        {loading || isPending ? "Registrando..." : "Registrarse"}
      </button>
      {/* Link to login page */}
      <Link className={styles.link} href="/login">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </form>
  );
} 