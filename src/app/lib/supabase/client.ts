// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for use in browser (client components).
 * Uses cookies for session storage so the server can access the session.
 * Call this function each time you need a client — it is lightweight
 * and reuses the underlying connection.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
