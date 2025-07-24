import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * API route to check if an email is already registered.
 * This route uses the Supabase Admin client to securely query the auth.users table.
 *
 * @param {Request} request - The incoming request object, expected to have a JSON body with an 'email' property.
 * @returns {NextResponse} - A JSON response indicating if the email exists or an error.
 */
export async function POST(request: Request) {
  // --- DEBUG: Log when the API route is hit ---
  console.log("API route /api/check-email hit.");

  // --- DEBUG: Check if environment variables are loaded on the server ---
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  console.log(`SERVICE_ROLE_KEY is ${serviceRoleKey ? 'loaded' : 'MISSING!'}`);

  const { email } = await request.json();

  // Validate the incoming request body
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required and must be a string.' }, { status: 400 });
  }

  // Securely fail if the service role key is not available.
  if (!serviceRoleKey) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set in .env.local. The server cannot perform admin tasks.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Create a Supabase client with the service_role key for admin privileges.
  // This should be stored securely in environment variables.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } } // No need to persist session for an admin client
  );

  // Call the 'email_exists' RPC function in the database.
  // This is a secure and efficient way to check for existence without retrieving user data.
  const { data, error } = await supabaseAdmin.rpc('email_exists', {
    email_to_check: email,
  });

  // --- DEBUG: Log the result from the RPC call ---
  console.log("RPC call result:", { data, error: error?.message });

  if (error) {
    console.error('Supabase RPC error while checking email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // The 'data' returned by the RPC function is the boolean result.
  return NextResponse.json({ exists: data });
}
