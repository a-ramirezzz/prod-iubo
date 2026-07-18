// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// Reset-password page route. Landing page for the recovery email link where the user sets a new password.
import React from 'react';
import type { Metadata } from 'next';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Nueva contraseña — PROD-UIBO',
  description: 'Establece una nueva contraseña para tu cuenta PROD-UIBO.',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
