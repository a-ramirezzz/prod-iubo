// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Translates common Supabase error messages for user-facing alerts, via the i18n system.
 * Combines all known error patterns from login and signup flows.
 * @param errorMsg - The original error message from Supabase
 * @param t - Translation function that resolves an i18n key to the localized string
 * @returns The translated message, or the original if not recognized
 */
export function translateSupabaseError(errorMsg: string, t: (key: string) => string): string {
  const msg = errorMsg.toLowerCase();

  // Duplicate user / email errors
  if (msg.includes('user already registered') || msg.includes('duplicate key value')) {
    if (msg.includes('username')) {
      return t('auth.errors.usernameAlreadyTaken');
    }
    return t('auth.errors.emailAlreadyRegistered');
  }

  // Login credential errors
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return t('auth.errors.invalidCredentials');
  }
  if (msg.includes('user not found')) {
    return t('auth.errors.userNotFound');
  }

  // Email confirmation
  if (msg.includes('email not confirmed') || msg.includes('confirm your email')) {
    return t('auth.errors.emailNotConfirmed');
  }

  // Network
  if (msg.includes('network error')) {
    return t('auth.errors.networkError');
  }

  // Password
  if (msg.includes('password')) {
    return t('auth.errors.passwordError');
  }

  return errorMsg;
}
