"use client";
import React, { useState, useTransition } from "react";
import styles from "./LoginForm.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "./actions";

/**
 * LoginForm Component
 *
 * Renders a login form for existing users, including validation and integration
 * with a server action to authenticate the user using Supabase Auth.
 */
export default function LoginForm() {
  // Form state hooks for each input field
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
   * Handles form submission, calls the server action, and manages UI feedback.
   * Redirects to the main app page on successful login.
   * @param e React.FormEvent
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setLoading(true);
    // Call the server action to authenticate the user
    const result = await signIn({
      email,
      password,
    });
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      // Redirect to the main app page on successful login
      router.push("/app");
    }
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>Iniciar Sesión</div>
      {/* Error message display */}
      {error && <div className={styles.error}>{error}</div>}
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
      <button className={styles.button} type="submit" disabled={loading || isPending}>
        {loading || isPending ? "Ingresando..." : "Ingresar"}
      </button>
      {/* Link to signup page */}
      <Link className={styles.link} href="/signup">
        ¿No tienes cuenta? Regístrate
      </Link>
    </form>
  );
} 