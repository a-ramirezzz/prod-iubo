// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Translates common Supabase error messages to Spanish for user-facing alerts.
 * Combines all known error patterns from login and signup flows.
 * @param errorMsg - The original error message from Supabase
 * @returns The translated message in Spanish, or the original if not recognized
 */
export function translateSupabaseError(errorMsg: string): string {
  const msg = errorMsg.toLowerCase();

  // Duplicate user / email errors
  if (msg.includes('user already registered') || msg.includes('duplicate key value')) {
    if (msg.includes('username')) {
      return 'El nombre de usuario ya está en uso. Por favor, elige otro.';
    }
    return 'El correo electrónico ya está registrado.';
  }

  // Login credential errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'Correo electrónico o contraseña incorrectos.';
  }
  if (msg.includes('user not found')) {
    return 'Usuario no encontrado.';
  }

  // Email confirmation
  if (msg.includes('email not confirmed') || msg.includes('confirm your email')) {
    return 'Por favor confirma tu correo electrónico.';
  }

  // Network
  if (msg.includes('network error')) {
    return 'Error de red. Intenta de nuevo más tarde.';
  }

  // Password
  if (msg.includes('password')) {
    return 'La contraseña es incorrecta o no cumple los requisitos.';
  }

  return errorMsg;
}
