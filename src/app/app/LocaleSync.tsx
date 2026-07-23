"use client";
import { useEffect } from "react";
import { useSettings } from "@/app/context/SettingsContext";
import { useLocale } from "@/app/lib/i18n";

/**
 * Bridges the user's persisted `settings.language` (Supabase) into the
 * LocaleProvider. Renders nothing; lives inside the app where both
 * useSettings and useLocale are available.
 */
export default function LocaleSync() {
  const { settings, loading } = useSettings();
  const { syncLocale } = useLocale();

  useEffect(() => {
    if (!loading && settings.language) {
      syncLocale(settings.language);
    }
  }, [settings.language, loading, syncLocale]);

  return null;
}
