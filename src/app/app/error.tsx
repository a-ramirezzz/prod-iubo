"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[PROD-UIBO] Unhandled error:", error);
  }, [error]);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#111827",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif",
      padding: "2rem",
      textAlign: "center",
    }}>
      <div style={{
        fontSize: "3rem",
        marginBottom: "1rem",
      }}>
        ⚠️
      </div>
      <h1 style={{
        fontSize: "1.5rem",
        fontWeight: 700,
        marginBottom: "0.75rem",
        background: "linear-gradient(90deg, #EF4444, #3B82F6)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
      }}>
        Algo salió mal
      </h1>
      <p style={{
        color: "rgba(255,255,255,0.6)",
        fontSize: "1rem",
        maxWidth: "400px",
        marginBottom: "2rem",
        lineHeight: 1.6,
      }}>
        Ocurrió un error inesperado. Puedes intentar recargar o volver al inicio.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "0.75rem 2rem",
            background: "linear-gradient(135deg, #3B82F6, #60A5FA)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Reintentar
        </button>
        <Link
          href="/login"
          style={{
            padding: "0.75rem 2rem",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "10px",
            fontSize: "0.95rem",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
