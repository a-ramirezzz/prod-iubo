// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
'use server';

import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/app/lib/supabase/server';
import { logError } from '@/app/lib/logger';

export interface DeleteAccountResult {
  success: boolean;
  error?: string;
}

/**
 * Permanently deletes the authenticated user's account from auth.users.
 * All table data (settings, tasks, sessions, achievements) is removed via
 * ON DELETE CASCADE foreign keys — see src/database/migrations/001_create_tables.sql.
 */
export async function deleteAccount(): Promise<DeleteAccountResult> {
  const supabase = await createServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (!user || authError) {
    return { success: false, error: 'Not authenticated' };
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await adminClient.auth.admin.deleteUser(user.id);

  if (error) {
    logError(error, { operation: 'deleteAccount', userId: user.id });
    return { success: false, error: error.message };
  }

  return { success: true };
}
