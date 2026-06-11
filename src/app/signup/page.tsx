// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// Signup page route for the application. Renders the SignupForm component for user registration.
import React from 'react';
import type { Metadata } from 'next';
import AuthTabs from "../components/AuthTabs/AuthTabs";

export const metadata: Metadata = {
  title: 'Registro — PROD-UIBO',
  description: 'Crea tu cuenta en PROD-UIBO y comienza a gestionar tu tiempo con la técnica Pomodoro.',
};

export default function SignupPage() {
  return (
    <AuthTabs />
  );
} 