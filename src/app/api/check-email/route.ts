import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { createRateLimiter } from '@/app/lib/rate-limit';

const { isRateLimited } = createRateLimiter(60 * 1000, 5);

/**
 * API route to check if an email is already registered in the system.
 * This route uses the Supabase Admin client to securely query the database via an RPC function.
 *
 * @param {Request} request - The incoming request object, expected to have a JSON body with an 'email' property.
 * @returns {NextResponse} - A JSON response indicating if the email exists or an error.
 */
export async function POST(request: Request) {
  // Rate limiting by IP
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Intenta de nuevo en un momento.' },
      { status: 429 }
    );
  }

  const { email } = await request.json();

  // Validate the incoming request body.
  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required and must be a string.' }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Securely fail if the service role key is not available. This is a critical server configuration.
  if (!serviceRoleKey) {
    console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY is not set. The server cannot perform admin tasks.");
    return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
  }

  // Create a Supabase admin client with the service_role key for privileged access.
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { persistSession: false } } // No need to persist session for a server-side admin client.
  );

  // Call the 'email_exists' RPC function in the database.
  // This is a secure and efficient way to check for existence without retrieving user data.
  const { data, error } = await supabaseAdmin.rpc('email_exists', {
    email_to_check: email,
  });

  if (error) {
    console.error('Supabase RPC error while checking email:', error.message);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }

  // The 'data' returned by the RPC function is the boolean result.
  return NextResponse.json({ exists: data });
}
