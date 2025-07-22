"use client";
import React, { useState, useEffect } from "react";
import LoginForm from "../../login/LoginForm";
import SignupForm from "../../signup/SignupForm";
import styles from "./AuthTabs.module.css";

/**
 * AuthTabs Component
 *
 * Renders a card with tabs to switch between Login and Signup forms.
 * Remembers the active tab using sessionStorage while the app is open.
 */
const TAB_KEY = "authTabActive";

export default function AuthTabs() {
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
    <div className={styles.authCardWrapper}>
      <div className={styles.tabsContainer}>
        <button
          className={activeTab === 0 ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab(0)}
          type="button"
        >
          Iniciar sesión
        </button>
        <button
          className={activeTab === 1 ? styles.tabActive : styles.tab}
          onClick={() => setActiveTab(1)}
          type="button"
        >
          Registrarse
        </button>
      </div>
      <div className={styles.tabContent}>
        {activeTab === 0 ? <LoginForm hideLinks /> : <SignupForm hideLinks />}
      </div>
    </div>
  );
} 