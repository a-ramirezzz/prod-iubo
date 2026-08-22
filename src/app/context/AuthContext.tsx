"use client";
import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from '@/app/lib/supabase/client';
import { clearUserData } from '@/app/lib/offlineDb';
import type { User } from "@supabase/supabase-js";

/**
 * AuthContext provides the authenticated user object (or null if not logged in)
 * and listens to authentication state changes globally.
 *
 * It also distinguishes a session that died on its own (token expired and could
 * not be refreshed) from a voluntary logout, exposing `sessionExpired` so the UI
 * can surface an appropriate message.
 */
interface AuthContextType {
  user: User | null;
  loading: boolean;
  sessionExpired: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  sessionExpired: false,
  signOut: async () => {},
});

/**
 * AuthProvider wraps the app and manages authentication state using Supabase.
 * It listens to auth state changes and updates the user accordingly.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Tracks whether the user had an active session, so a later SIGNED_OUT can be
  // recognized as a session that ended (rather than a never-authenticated state).
  const wasAuthenticatedRef = useRef(false);
  // Set immediately before a user-initiated signOut so the resulting SIGNED_OUT
  // event is not misread as an expiration.
  const isVoluntaryLogoutRef = useRef(false);

  /**
   * Ends the current session voluntarily. Flags the logout as user-initiated so
   * the SIGNED_OUT event it triggers does not set `sessionExpired`.
   */
  const signOut = useCallback(async () => {
    isVoluntaryLogoutRef.current = true;
    const userId = user?.id;
    await supabase.auth.signOut();
    if (userId) {
      await clearUserData(userId);
    }
  }, [user, supabase]);

  useEffect(() => {
    // Fast initial hydration from localStorage — no network round-trip
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        wasAuthenticatedRef.current = true;
      } else {
        setUser(null);
      }
      setLoading(false);
    };
    getSession();

    // Keep session updated on login, logout, and token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        // Session ended without the user asking for it, while a session existed:
        // treat it as an expiration (token expired and couldn't be refreshed).
        if (wasAuthenticatedRef.current && !isVoluntaryLogoutRef.current) {
          setSessionExpired(true);
        }
        isVoluntaryLogoutRef.current = false;
        wasAuthenticatedRef.current = false;
        setUser(null);
        return;
      }

      // Any event carrying a valid session means we're authenticated again.
      if (session?.user) {
        wasAuthenticatedRef.current = true;
        setSessionExpired(false);
      }
      setUser(session?.user ?? null);
    });

    // Cleanup listener on unmount
    return () => {
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Memoized: this context wraps the entire app (above SettingsProvider), so an
  // unmemoized value object would re-render every consumer whenever AuthProvider's
  // parent re-renders, even when auth state itself hasn't changed.
  const value = useMemo(
    () => ({ user, loading, sessionExpired, signOut }),
    [user, loading, sessionExpired, signOut]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * useAuth hook for accessing the authenticated user and loading state.
 * @returns { user, loading, sessionExpired, signOut }
 */
export function useAuth() {
  return useContext(AuthContext);
}
