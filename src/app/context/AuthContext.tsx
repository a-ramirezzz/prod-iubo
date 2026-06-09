"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from '@/app/lib/supabase/client';
import type { User } from "@supabase/supabase-js";

/**
 * AuthContext provides the authenticated user object (or null if not logged in)
 * and listens to authentication state changes globally.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

/**
 * AuthProvider wraps the app and manages authentication state using Supabase.
 * It listens to auth state changes and updates the user accordingly.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fast initial hydration from localStorage — no network round-trip
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setLoading(false);
      console.log('[AuthContext] Initial user (from session):', session?.user ?? null);
    };
    getSession();

    // Keep session updated on login, logout, and token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      console.log('[AuthContext] Auth state changed:', _event, session?.user);
    });

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    console.log('[AuthContext] user state changed:', user, 'loading:', loading);
  }, [user, loading]);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook for accessing the authenticated user and loading state.
 * @returns { user, loading }
 */
export function useAuth() {
  return useContext(AuthContext);
} 