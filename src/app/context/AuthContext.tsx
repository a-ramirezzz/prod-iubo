"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
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
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the current session/user on mount
    const getSession = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user ?? null);
      setLoading(false);
    };
    getSession();

    // Listen for auth state changes (login, logout, refresh)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    // Cleanup listener on unmount
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

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