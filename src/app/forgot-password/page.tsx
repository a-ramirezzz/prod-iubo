// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// Forgot-password page route. Renders the ForgotPasswordForm so users can request a recovery email.
import React from 'react';
import type { Metadata } from 'next';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar contraseña — PROD-UIBO',
  description: 'Solicita un enlace para restablecer la contraseña de tu cuenta PROD-UIBO.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
