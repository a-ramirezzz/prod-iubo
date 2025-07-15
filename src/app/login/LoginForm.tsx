"use client";
import React, { useState } from "react";
import styles from "./LoginForm.module.css";
import Link from "next/link";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Aquí irá la lógica de autenticación con Supabase
    setTimeout(() => {
      setLoading(false);
      setError("Funcionalidad de login aún no implementada.");
    }, 1000);
  };

  return (
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.formTitle}>Iniciar Sesión</div>
      {error && <div className={styles.error}>{error}</div>}
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
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoComplete="current-password"
      />
      <button className={styles.button} type="submit" disabled={loading}>
        {loading ? "Ingresando..." : "Ingresar"}
      </button>
      <Link className={styles.link} href="/signup">
        ¿No tienes cuenta? Regístrate
      </Link>
    </form>
  );
} 