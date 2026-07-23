"use client";
import { useLocale } from "@/app/lib/i18n";
import styles from "./LanguageSwitch.module.css";

export default function LanguageSwitch() {
  const { locale, setLocale } = useLocale();

  return (
    <div className={styles.switcher} role="group" aria-label="Idioma / Language">
      <button
        className={`${styles.btn} ${locale === "es" ? styles.active : ""}`}
        onClick={() => setLocale("es")}
        aria-pressed={locale === "es"}
      >
        ES
      </button>
      <button
        className={`${styles.btn} ${locale === "en" ? styles.active : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
    </div>
  );
}
