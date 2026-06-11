// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// Login page route for the application. Renders the LoginForm component for user authentication.
import React from 'react';
import type { Metadata } from 'next';
import AuthTabs from "../components/AuthTabs/AuthTabs";

export const metadata: Metadata = {
  title: 'Iniciar Sesión — PROD-UIBO',
  description: 'Inicia sesión en PROD-UIBO para acceder a tu temporizador de productividad personalizable.',
};

export default function LoginPage() {
  return (
    <AuthTabs />
  );
} 