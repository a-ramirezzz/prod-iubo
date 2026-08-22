"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "../../login/LoginForm";
import SignupForm from "../../signup/SignupForm";
import LanguageSwitch from "../LanguageSwitch/LanguageSwitch";
import { useLocale } from "@/app/lib/i18n";
import { useCrossfadeVariants } from "@/app/lib/motion";
import styles from "./AuthTabs.module.css";

/**
 * AuthTabs Component
 *
 * Renders a card with tabs to switch between Login and Signup forms.
 * Remembers the active tab using sessionStorage while the app is open.
 */
const TAB_KEY = "authTabActive";

export default function AuthTabs() {
  const { t } = useLocale();
  const crossfade = useCrossfadeVariants();
  // 0 = Login, 1 = Signup
  const [activeTab, setActiveTab] = useState(0);

  // Load tab state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(TAB_KEY);
    if (stored === "1") setActiveTab(1);
  }, []);

  // Persist tab state to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(TAB_KEY, String(activeTab));
  }, [activeTab]);

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.orb1} aria-hidden="true" />
      <div className={styles.orb2} aria-hidden="true" />
      <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", zIndex: 2 }}>
        <LanguageSwitch />
      </div>
      <div className={styles.authCardWrapper}>
      <div className={styles.tabsContainer}>
        <button
          className={activeTab === 0 ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab(0)}
          type="button"
        >
          {t("auth.tabs.login")}
        </button>
        <button
          className={activeTab === 1 ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab(1)}
          type="button"
        >
          {t("auth.tabs.signup")}
        </button>
      </div>
      <div className={styles.tabContent}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={crossfade}
          >
            {activeTab === 0 ? <LoginForm hideLinks /> : <SignupForm hideLinks />}
          </motion.div>
        </AnimatePresence>
      </div>
      </div>
    </div>
  );
} 