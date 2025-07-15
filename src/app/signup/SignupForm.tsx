"use client";
import React, { useState } from "react";
import styles from "./SignupForm.module.css";
import Link from "next/link";

export default function SignupForm() {
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const validate = () => {
    if (username.length < 3) return "El usuario debe tener al menos 3 caracteres.";
    if (!firstName.trim()) return "El nombre es obligatorio.";
    if (!lastName.trim()) return "El apellido es obligatorio.";
    if (!email.match(/^[^@\s]+@[^@\s]+\.[^@\s]+$/)) return "Correo electrónico inválido.";
    if (password.length < 6) return "La contraseña debe tener al menos 6 caracteres.";
    if (password !== confirmPassword) return "Las contraseñas no coinciden.";
    // Teléfono opcional, pero si se ingresa, validar formato simple
    if (phone && !/^\+?[0-9\s-]{7,15}$/.test(phone)) return "Teléfono inválido.";
    return null;
  };

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
    // Aquí irá la lógica de registro con Supabase
    setTimeout(() => {
      setLoading(false);
      setSuccess("Registro simulado exitoso. (Aquí irá la integración real con Supabase)");
    }, 1200);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>Registro</div>
      {error && <div className={styles.error}>{error}</div>}
      {success && <div style={{ color: '#48c6ef', background: 'rgba(72,198,239,0.08)', borderRadius: 6, padding: '0.5rem 1rem', marginBottom: '1rem', textAlign: 'center' }}>{success}</div>}
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
      <input
        className={styles.input}
        type="text"
        placeholder="Primer nombre(s)"
        value={firstName}
        onChange={e => setFirstName(e.target.value)}
        required
        autoComplete="given-name"
      />
      <input
        className={styles.input}
        type="text"
        placeholder="Apellido"
        value={lastName}
        onChange={e => setLastName(e.target.value)}
        required
        autoComplete="family-name"
      />
      <input
        className={styles.input}
        type="email"
        placeholder="Correo electrónico"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      <input
        className={styles.input}
        type="tel"
        placeholder="Teléfono (opcional)"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        autoComplete="tel"
      />
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
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Registrando..." : "Registrarse"}
      </button>
      <Link className={styles.link} href="/login">
        ¿Ya tienes cuenta? Inicia sesión
      </Link>
    </form>
  );
} 