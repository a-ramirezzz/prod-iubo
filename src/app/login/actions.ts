"use server";
import { createClient } from '@/app/lib/supabase/client';

/**
 * Server Action: Authenticates a user using Supabase Auth.
 * - Verifies the user's email and password.
 * - Creates a secure session if credentials are valid.
 *
 * @param formData - Login credentials from the login form
 * @returns Success or error message for the client
 */
export async function signIn(formData: {
  email: string;
  password: string;
}) {
  const supabase = createClient();
  // Call Supabase Auth to sign in with email and password
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  // Handle authentication errors
  if (error) {
    return { error: error.message };
  }

  // Success: user is authenticated
  return { success: true };
} 