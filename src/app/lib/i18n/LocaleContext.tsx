"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import esMessages from "./es.json";
import enMessages from "./en.json";

type Locale = "es" | "en";
type Messages = typeof esMessages;

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  syncLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const messages: Record<Locale, Messages> = { es: esMessages, en: enMessages };

const LocaleContext = createContext<LocaleContextType>({
  locale: "es",
  setLocale: () => {},
  syncLocale: () => {},
  t: (key: string) => key,
});

/**
 * Resolves a dot-notation key like "landing.hero.cta" against the messages object.
 * For array access, use numeric keys: "landing.pomodoro.steps.0.title"
 */
function resolve(obj: unknown, path: string): string {
  const result = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && acc !== null) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
  return typeof result === "string" ? result : path;
}

/**
 * LocaleProvider reads the initial locale from either:
 * - The `initialLocale` prop (from settings.language in the app)
 * - localStorage "locale" key (for the landing page)
 * - Falls back to "es"
 *
 * It also syncs <html lang="..."> on every locale change.
 */
export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("locale");
      if (stored === "es" || stored === "en") return stored;
    }
    return "es";
  });

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      localStorage.setItem("locale", newLocale);
    }
  }, []);

  const syncLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Don't write to localStorage — the app persists via Supabase
  }, []);

  // Sync <html lang> and the `locale` cookie so the server (generateMetadata
  // in the root layout) can read the language preference on the next request.
  useEffect(() => {
    document.documentElement.lang = locale;
    document.cookie = `locale=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  const t = useCallback(
    (key: string) => resolve(messages[locale], key),
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, syncLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
