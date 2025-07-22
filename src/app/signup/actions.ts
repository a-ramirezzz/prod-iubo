"use server";
import { supabase } from "@/app/lib/supabaseClient";

/**
 * Server Action: Registers a new user using Supabase Auth.
 * - Creates the user in the auth.users table.
 * - Triggers DB hooks to create profile and user_settings rows.
 * - Sends a confirmation email to the user.
 *
 * @param formData - User registration data from the signup form
 * @returns Success or error message for the client
 */
export async function signUp(formData: {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}) {
  // Call Supabase Auth to create a new user
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      // Custom user metadata to be stored in the user's profile
      data: {
        username: formData.username,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
      },
      // Redirect URL after email confirmation
      emailRedirectTo: process.env.NEXT_PUBLIC_SUPABASE_URL + "/login"
    }
  });

  // Debug: Log the response from Supabase
  console.log({ data, error });

  // Handle registration errors
  if (error) {
    return { error: error.message };
  }

  // Success: user must confirm their email
  return { success: "¡Registro exitoso! Revisa tu correo para confirmar tu cuenta." };
} 