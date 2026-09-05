// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/SettingsPanel/SettingsPanel.tsx

// React and hooks
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
// Styles
import styles from './SettingsPanel.module.css';
import { useBackdropVariants, useSlideFromRightVariants, useCrossfadeVariants } from '@/app/lib/motion';
// Context for global settings
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
// Theme and sound data
import { themes } from '../../lib/themes';
import ThemeCard from '../ThemeCard/ThemeCard';
import { sounds, noSound } from '../../lib/sounds';
import { useRouter } from 'next/navigation';
import ConfirmModal from '@/app/components/ConfirmModal/ConfirmModal';
import { useHorizontalPipTimer } from '@/app/hooks/useHorizontalPipTimer';
import { useDataExport } from '@/app/hooks/useDataExport';
import { useSystemTheme } from '@/app/hooks/useSystemTheme';
import { useLocale } from '@/app/lib/i18n';
import Link from 'next/link';
import Notification from '@/app/components/Notification/Notification';
import { createClient } from '@/app/lib/supabase/client';
import { clearUserData } from '@/app/lib/offlineDb';
import { logError } from '@/app/lib/logger';
import { deleteAccount } from '@/app/app/actions/deleteAccount';
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_ORDER,
  SHORTCUT_LABEL_KEYS,
  formatKeyLabel,
  isModifierKey,
  ShortcutId,
} from '@/app/lib/keyboardShortcuts';

// Props for the SettingsPanel component
interface SettingsPanelProps {
  isOpen: boolean; // Whether the panel is open
  onClose: () => void; // Function to close the panel
  // Opens the keyboard shortcuts help modal (owned by the page)
  onOpenShortcuts?: () => void;
  // Read-only Pomodoro stats snapshot shown in the Focus section
  pomodoroStats?: {
    totalPomodorosToday: number;
    cycleCount: number;
    currentPhase: string;
    dailyPomodoroGoal: number;
    streak: number;
    weekTotal: number;
  };
}

// Phase indicator dot colors for the Focus stats snapshot (labels are localized in-component)
const PHASE_COLORS: Record<string, string> = {
  work: 'var(--brand-color-uibo, #1e88e5)',
  short_break: '#f5b942',
  long_break: '#4caf50',
  idle: 'var(--text-color-disabled, #888)',
};

// Type for the active section — English keys used as logic identifiers
type SectionKey = 'general' | 'themes' | 'sounds' | 'focus' | 'keyboardShortcuts' | 'privacy';

// Icon definitions for each section, keyed by SectionKey
const ICONS: Record<SectionKey, React.ReactNode> = {
  general: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M5 14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1" /></svg>
  ),
  themes: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
  ),
  sounds: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
  ),
  focus: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
  ),
  keyboardShortcuts: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" /></svg>
  ),
  privacy: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /></svg>
  ),
};

// Menu items for the sidebar
const MENU_ITEMS: SectionKey[] = ['general', 'themes', 'sounds', 'focus', 'keyboardShortcuts', 'privacy'];

/**
 * SettingsPanel component
 * Displays a modal panel for user settings, including general options, themes, and sounds.
 */
export default function SettingsPanel({ isOpen, onClose, onOpenShortcuts, pomodoroStats }: SettingsPanelProps) {
  const { user, signOut } = useAuth();
  const { t } = useLocale();
  // State for the currently active section
  const [activeSection, setActiveSection] = useState<SectionKey>('general');

  // Localized phase labels for the Focus stats snapshot
  const PHASE_LABELS: Record<string, string> = {
    work: t('settings.focus.phases.work'),
    short_break: t('settings.focus.phases.short_break'),
    long_break: t('settings.focus.phases.long_break'),
    idle: t('settings.focus.phases.idle'),
  };
  // Access settings and update functions from context
  const { settings, updateSettings, resetSettings, loading: settingsLoading } = useSettings();
  // OS preference, only consulted when theme_mode is 'system'
  const systemTheme = useSystemTheme();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showDeleteDataConfirm, setShowDeleteDataConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [privacyNotification, setPrivacyNotification] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  // Keyboard shortcut re-binding: which action (if any) is currently waiting
  // for the user's next keypress, plus an inline validation error keyed by action.
  const [capturingAction, setCapturingAction] = useState<ShortcutId | null>(null);
  const [shortcutError, setShortcutError] = useState<{ action: ShortcutId; message: string } | null>(null);
  const backdropVariants = useBackdropVariants();
  const panelVariants = useSlideFromRightVariants();
  const sectionVariants = useCrossfadeVariants(8);

  // Client-side data export (Pomodoro sessions + tasks) for the General section.
  const {
    exportJson,
    exportCsv,
    isExporting,
    error: exportError,
  } = useDataExport(user?.id ?? null, t('app.settings.exportError'));

  // Only used here to read feature support (`isSupported`); the window itself
  // is opened by the instance wired up in page.tsx with `enabled: true`.
  const { isSupported: isHorizontalPipSupported } = useHorizontalPipTimer(
    false,
    { hours: '00', minutes: '00', seconds: '00' },
    false,
    undefined
  );

  // Sincroniza el estado del toggle con el permiso de notificación del navegador
  useEffect(() => {
    if (!('Notification' in window) || !('permissions' in navigator)) return;

    // Función para actualizar el estado según el permiso
    const syncNotificationToggle = (permission: PermissionState) => {
      if (permission === 'granted' && !settings.enable_desktop_notifications) {
        updateSettings({ enable_desktop_notifications: true });
      } else if (permission === 'denied' && settings.enable_desktop_notifications) {
        updateSettings({ enable_desktop_notifications: false });
      }
    };

    // Consultar el permiso y escuchar cambios
    navigator.permissions.query({ name: 'notifications' as PermissionName }).then((permStatus) => {
      syncNotificationToggle(permStatus.state);
      const handler = () => syncNotificationToggle(permStatus.state);
      permStatus.addEventListener('change', handler);
      // Cleanup
      return () => permStatus.removeEventListener('change', handler);
    });
  }, [settings.enable_desktop_notifications, updateSettings]);

  // Lock page scroll behind the panel while it's open, so only the panel's
  // own internal scroll area responds to scrolling.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Prefetch the changelog route as soon as the panel opens, since its link is visible in the sidebar.
  useEffect(() => {
    if (isOpen) {
      router.prefetch('/changelog');
    }
  }, [isOpen, router]);

  // Handler for resetting all settings to default
  const handleResetClick = () => {
    setShowResetConfirm(true);
  };

  // Handler for logging out the user
  const handleLogout = async () => {
    setLoggingOut(true);
    // Voluntary logout: routed through the context so it is flagged as
    // user-initiated and not mistaken for a session expiration.
    await signOut();
    await resetSettings(); // Optionally reset settings state
    setLoggingOut(false);
    router.push('/');
  };

  // Deletes all of the user's sessions, tasks and achievements, then resets
  // settings to defaults. The user stays logged in with a clean slate.
  const handleDeleteAllData = async () => {
    if (!user) return;
    setIsDeletingData(true);
    try {
      const supabase = createClient();
      const [achievementsResult, sessionsResult, tasksResult] = await Promise.all([
        supabase.from('user_achievements').delete().eq('user_id', user.id),
        supabase.from('pomodoro_sessions').delete().eq('user_id', user.id),
        supabase.from('tasks').delete().eq('user_id', user.id),
      ]);
      const firstError = achievementsResult.error ?? sessionsResult.error ?? tasksResult.error;
      if (firstError) throw firstError;

      await resetSettings();
      await clearUserData(user.id);

      setShowDeleteDataConfirm(false);
      setPrivacyNotification({ visible: true, message: t('settings.dataDeleted') });
      // Force a full refresh so every in-memory cache (stats, tasks, achievements) reloads clean.
      window.location.reload();
    } catch (err) {
      logError(err, { operation: 'deleteAllMyData', userId: user.id });
      setPrivacyNotification({ visible: true, message: t('settings.deleteDataError') });
    } finally {
      setIsDeletingData(false);
    }
  };

  // Permanently deletes the user's account via the deleteAccount Server Action,
  // then signs out and redirects to the landing page.
  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        throw new Error(result.error ?? 'Unknown error');
      }
      setShowDeleteAccountConfirm(false);
      await signOut();
      router.push('/');
    } catch (err) {
      logError(err, { operation: 'deleteAccount', userId: user?.id });
      setPrivacyNotification({ visible: true, message: t('settings.deleteAccountError') });
      setIsDeletingAccount(false);
    }
  };

  // Captures the next keypress while a shortcut is being re-bound. Escape
  // cancels the capture instead of being assignable (it's reserved globally
  // for closing modals/panels).
  useEffect(() => {
    if (!capturingAction) return;
    const action = capturingAction;
    const handleCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.key === 'Escape') {
        setCapturingAction(null);
        return;
      }
      if (isModifierKey(e.key)) {
        // A bare modifier isn't a usable shortcut on its own — keep listening
        // for a real key instead of surfacing an error.
        return;
      }

      const current = settings.keyboard_shortcuts ?? DEFAULT_SHORTCUTS;
      const newKey = e.key.toLowerCase();
      const conflict = Object.entries(current).find(
        ([otherAction, key]) => otherAction !== action && key.toLowerCase() === newKey
      );
      if (conflict) {
        setShortcutError({ action, message: t('settings.duplicateKey') });
        setCapturingAction(null);
        return;
      }

      updateSettings({ keyboard_shortcuts: { ...current, [action]: e.key } });
      setShortcutError(null);
      setCapturingAction(null);
      setPrivacyNotification({ visible: true, message: t('settings.shortcutUpdated') });
    };
    window.addEventListener('keydown', handleCapture, true);
    return () => window.removeEventListener('keydown', handleCapture, true);
  }, [capturingAction, settings.keyboard_shortcuts, updateSettings, t]);

  const handleRestoreDefaultShortcuts = () => {
    setCapturingAction(null);
    setShortcutError(null);
    updateSettings({ keyboard_shortcuts: { ...DEFAULT_SHORTCUTS } });
  };

  // The effective light/dark mode after resolving 'system' against the OS preference.
  // Used to decide which static/animated themes to show, since Theme.mode is only 'light' | 'dark'.
  const effectiveThemeMode = settings.theme_mode === 'system' ? systemTheme : settings.theme_mode;

  // Handler for switching theme mode to 'light', 'dark', or 'system'
  const handleThemeChange = (newThemeMode: 'light' | 'dark' | 'system') => {
    if (newThemeMode === settings.theme_mode) return;
    // When changing to an explicit light/dark mode, also select the first static theme for it.
    // 'system' keeps the currently selected theme and only changes dark/light resolution.
    const resolvedMode = newThemeMode === 'system' ? systemTheme : newThemeMode;
    const defaultThemeForMode = themes.find(t => t.mode === resolvedMode && t.type === 'static');

    updateSettings({
      theme_mode: newThemeMode,
      selected_theme_id: newThemeMode === 'system'
        ? settings.selected_theme_id
        : (defaultThemeForMode ? defaultThemeForMode.id : settings.selected_theme_id)
    });
  };

  // Render the settings panel UI
  return (
    <AnimatePresence>
      {isOpen && (
      <>
      {/* Backdrop overlay */}
      <motion.div
        className={styles.backdrop}
        onClick={onClose}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={backdropVariants}
      ></motion.div>
      <motion.div
        className={styles.settingsPanel}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={panelVariants}
      >
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose} aria-label={t('settings.closeAria')}>✕</button>
        <div className={styles.panelContent}>
          {/* Sidebar navigation */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>{t('settings.title')}</h3>
            <nav>
              <ul>
                {MENU_ITEMS.map((item) => (
                  <li key={item}>
                    <button
                      className={`${styles.menuButton} ${activeSection === item ? styles.active : ''}`}
                      onClick={() => setActiveSection(item)}
                    >
                      <span className={styles.sidebarIcon}>{ICONS[item]}</span>
                      <span>{t(`settings.sections.${item}`)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
            <Link href="/changelog" className={styles.whatsNewLink}>
              <span>{t('settings.whatsNew')}</span>
              <span aria-hidden="true">↗</span>
            </Link>
          </aside>
          {/* Main content area */}
          <main className={styles.mainContentArea}>
            <h2 className={styles.sectionTitle}>{t(`settings.sections.${activeSection}`)}</h2>
            <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={sectionVariants}
            >

            {/* General Settings Section */}
            {activeSection === 'general' && (
              <div className={styles.settingsContainer}>
                {/* Start in Mini Mode toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="start-mini">{t('settings.general.miniMode')}</label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="start-mini"
                      type="checkbox"
                      checked={settings.start_in_mini_mode}
                      onChange={(e) => updateSettings({ start_in_mini_mode: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Confirm on Stop toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="confirm-stop">{t('settings.general.confirmStop')}</label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="confirm-stop"
                      type="checkbox"
                      checked={settings.confirm_on_stop}
                      onChange={(e) => updateSettings({ confirm_on_stop: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* PiP Floating Timer toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="pip-mode" className={!!settings.horizontal_pip_enabled ? styles.disabledLabel : undefined}>
                    {t('settings.general.pipClassic')}
                  </label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="pip-mode"
                      type="checkbox"
                      checked={!!settings.pip_mode_enabled}
                      disabled={!!settings.horizontal_pip_enabled}
                      onChange={e => {
                        // Safety net: Chrome only allows one native PiP surface per tab,
                        // so the horizontal PiP must be off before this one can be enabled.
                        if (settings.horizontal_pip_enabled) return;
                        updateSettings({ pip_mode_enabled: e.target.checked });
                      }}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {!!settings.horizontal_pip_enabled && (
                  <p className={styles.disabledLabel} style={{ fontSize: '0.8em', margin: '-8px 0 8px' }}>
                    {t('settings.general.pipClassicDisabledHint')}
                  </p>
                )}
                {/* Horizontal Document PiP Floating Timer toggle */}
                <div className={styles.settingItem}>
                  <label
                    htmlFor="horizontal-pip-mode"
                    className={(!isHorizontalPipSupported || !!settings.pip_mode_enabled) ? styles.disabledLabel : undefined}
                  >
                    {t('settings.general.pipHorizontal')}
                  </label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="horizontal-pip-mode"
                      type="checkbox"
                      checked={!!settings.horizontal_pip_enabled}
                      disabled={!isHorizontalPipSupported || !!settings.pip_mode_enabled}
                      onChange={e => {
                        // Safety net: Chrome only allows one native PiP surface per tab,
                        // so the canvas/video PiP must be off before this one can be enabled.
                        if (settings.pip_mode_enabled) return;
                        updateSettings({ horizontal_pip_enabled: e.target.checked });
                      }}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {!isHorizontalPipSupported && (
                  <p className={styles.disabledLabel} style={{ fontSize: '0.8em', margin: '-8px 0 8px' }}>
                    {t('settings.general.pipHorizontalBrowser')}
                  </p>
                )}
                {isHorizontalPipSupported && !!settings.pip_mode_enabled && (
                  <p className={styles.disabledLabel} style={{ fontSize: '0.8em', margin: '-8px 0 8px' }}>
                    {t('settings.general.pipHorizontalDisabledHint')}
                  </p>
                )}
                {/* Language selector */}
                <div className={styles.settingItem}>
                  <label htmlFor="language">{t('settings.general.language')}</label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => updateSettings({ language: e.target.value as 'es' | 'en' })}
                    className={styles.select}
                  >
                    <option value="es">{t('settings.general.languageEs')}</option>
                    <option value="en">{t('settings.general.languageEn')}</option>
                  </select>
                </div>
                {/* Desktop Notifications toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="desktop-notifications">{t('settings.general.desktopNotifications')}</label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="desktop-notifications"
                      type="checkbox"
                      checked={!!settings.enable_desktop_notifications}
                      onChange={(e) => updateSettings({ enable_desktop_notifications: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Notification sound toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="notification-sound">
                    {t('app.settings.notificationSound')}
                    <span className={styles.settingHint} style={{ display: 'block', fontSize: '0.8em', opacity: 0.7 }}>
                      {t('app.settings.notificationSoundDescription')}
                    </span>
                  </label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="notification-sound"
                      type="checkbox"
                      checked={!!settings.notification_sound_enabled}
                      onChange={(e) => updateSettings({ notification_sound_enabled: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Keyboard shortcuts help launcher */}
                {onOpenShortcuts && (
                  <div className={styles.settingItem}>
                    <label>{t('app.shortcuts.openShortcuts')}</label>
                    <button
                      type="button"
                      onClick={onOpenShortcuts}
                      className={styles.select}
                      style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M6 12h.01M10 12h.01M14 12h.01M18 12h.01M7 16h10" /></svg>
                      <span>⇧ /</span>
                    </button>
                  </div>
                )}
                {/* Reset settings button */}
                <div className={styles.resetSection} style={{ flexDirection: 'column', alignItems: 'center' }}>
                  <button onClick={handleResetClick} className={`${styles.resetButton} button button-stop`}>
                    {t('settings.general.resetSettings')}
                  </button>
                  {/* Logout button for ending the user session */}
                  <button
                    onClick={handleLogout}
                    className={`${styles.resetButton} button button-stop`}
                    style={{ marginTop: 16 }}
                    disabled={loggingOut}
                  >
                    {loggingOut ? t('settings.general.loggingOut') : t('settings.general.logout')}
                  </button>
                </div>

                {/* Export data section */}
                <div className={styles.exportSection}>
                  <h3 className={styles.subSectionTitle}>{t('app.settings.exportTitle')}</h3>
                  <p className={styles.settingsFocusHelperText} style={{ maxWidth: 'none' }}>
                    {t('app.settings.exportDescription')}
                  </p>
                  <div className={styles.exportButtons}>
                    <button
                      type="button"
                      className={styles.exportButton}
                      onClick={exportJson}
                      disabled={isExporting}
                    >
                      {isExporting ? t('app.settings.exportExporting') : t('app.settings.exportJson')}
                    </button>
                    <button
                      type="button"
                      className={styles.exportButton}
                      onClick={exportCsv}
                      disabled={isExporting}
                    >
                      {isExporting ? t('app.settings.exportExporting') : t('app.settings.exportCsv')}
                    </button>
                  </div>
                  {exportError && <p className={styles.exportError}>{exportError}</p>}
                </div>
              </div>
            )}

            {/* Themes Section */}
            {activeSection === 'themes' && (
              <div className={styles.settingsContainer}>
                {/* Theme mode switcher */}
                <div className={styles.settingItem}>
                  <label>{t('settings.themes.appearance')}</label>
                  <div className={styles.themeModeGroup} role="radiogroup" aria-label={t('settings.themes.appearance')}>
                    {(['light', 'system', 'dark'] as const).map(mode => (
                      <button
                        key={mode}
                        type="button"
                        role="radio"
                        aria-checked={settings.theme_mode === mode}
                        className={`${styles.themeModeButton} ${settings.theme_mode === mode ? styles.themeModeButtonActive : ''}`}
                        onClick={() => handleThemeChange(mode)}
                      >
                        {t(`settings.themes.${mode}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Static themes */}
                <h3 className={styles.subSectionTitle}>{t('settings.themes.static')}</h3>
                <div className={styles.themeGrid}>
                  {themes
                    .filter(theme => theme.mode === effectiveThemeMode && theme.type === 'static')
                    .map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={settings.selected_theme_id === theme.id}
                        onClick={() => !settingsLoading && updateSettings({ selected_theme_id: theme.id })}
                      />
                    ))}
                </div>

                {/* Animated themes */}
                <h3 className={styles.subSectionTitle}>{t('settings.themes.animated')}</h3>
                <div className={styles.themeGrid}>
                   {themes
                    .filter(theme => theme.mode === effectiveThemeMode && theme.type === 'animated')
                    .map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={settings.selected_theme_id === theme.id}
                        onClick={() => !settingsLoading && updateSettings({ selected_theme_id: theme.id })}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Sounds Section */}
            {activeSection === 'sounds' && (
              <div className={styles.settingsContainer}>
                {/* Background sound selection */}
                <h3 className={styles.subSectionTitle}>{t('settings.sounds.background')}</h3>

                <div className={styles.soundList}>
                  {[noSound, ...sounds].map((sound) => (
                    <button
                      key={sound.id}
                      className={`${styles.soundCard} ${settings.background_sound === sound.id ? styles.activeSound : ''}`}
                      onClick={() => updateSettings({ background_sound: sound.id })}
                      disabled={settingsLoading}
                    >
                      <div className={styles.soundIcon}>{sound.icon}</div>
                      <span>{t(sound.nameKey)}</span>
                    </button>
                  ))}
                </div>

                {/* Volume control */}
                <h3 className={styles.subSectionTitle}>{t('settings.sounds.volume')}</h3>
                <div className={styles.volumeControl}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        className={styles.volumeSlider}
                        onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                        disabled={settingsLoading}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                </div>
              </div>
            )}

            {/* Focus Section: daily goal setting + read-only Pomodoro stats snapshot */}
            {activeSection === 'focus' && (
              <div className={styles.settingsFocusContainer}>
                {/* Daily goal card */}
                <div className={styles.settingsFocusGoalCard}>
                  <label htmlFor="daily-pomodoro-goal" className={styles.settingsFocusGoalLabel}>
                    {t('settings.focus.dailyGoal')}
                  </label>
                  <input
                    id="daily-pomodoro-goal"
                    type="number"
                    min={1}
                    max={20}
                    step={1}
                    className={styles.settingsFocusGoalInput}
                    value={settings.daily_pomodoro_goal}
                    disabled={settingsLoading}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      if (Number.isNaN(parsed)) return;
                      const clamped = Math.min(20, Math.max(1, parsed));
                      updateSettings({ daily_pomodoro_goal: clamped });
                    }}
                  />
                  <p className={styles.settingsFocusHelperText}>
                    {t('settings.focus.dailyGoalHelper')}
                  </p>
                </div>

                {!pomodoroStats ? (
                  <p className={styles.settingsFocusEmpty}>
                    {t('settings.focus.statsUnavailable')}
                  </p>
                ) : (
                  <>
                    {/* Current session card */}
                    <div className={styles.settingsFocusSessionCard}>
                      <span className={styles.settingsFocusCardTitle}>{t('settings.focus.currentSession')}</span>
                      <div className={styles.settingsFocusPhase}>
                        <span
                          className={styles.settingsFocusPhaseDot}
                          style={{ backgroundColor: PHASE_COLORS[pomodoroStats.currentPhase] ?? PHASE_COLORS.idle }}
                        />
                        <span>{PHASE_LABELS[pomodoroStats.currentPhase] ?? PHASE_LABELS.idle}</span>
                      </div>

                      {/* Cycle progress dots (4 pomodoros per cycle) */}
                      <div className={styles.settingsFocusCycleDots}>
                        {[0, 1, 2, 3].map((i) => (
                          <span
                            key={i}
                            className={`${styles.settingsFocusCycleDot} ${i < pomodoroStats.cycleCount ? styles.settingsFocusCycleDotFilled : ''}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Stats grid */}
                    <div className={styles.settingsFocusStatsGrid}>
                      <div className={`${styles.settingsFocusStat} ${styles.settingsFocusStatPrimary}`}>
                        <span className={styles.settingsFocusStatLabel}>{t('settings.focus.pomodorosToday')}</span>
                        <span className={`${styles.settingsFocusStatValue} ${styles.settingsFocusStatValuePrimary}`}>
                          {pomodoroStats.totalPomodorosToday} / {pomodoroStats.dailyPomodoroGoal}
                        </span>
                        <div className={styles.settingsFocusProgressTrack}>
                          <div
                            className={styles.settingsFocusProgressFill}
                            style={{
                              width: `${Math.min(100, (pomodoroStats.totalPomodorosToday / Math.max(1, pomodoroStats.dailyPomodoroGoal)) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <div className={styles.settingsFocusStat}>
                        <span className={styles.settingsFocusStatLabel}>{t('settings.focus.thisWeek')}</span>
                        <span className={styles.settingsFocusStatValue}>{pomodoroStats.weekTotal}</span>
                      </div>
                      <div className={styles.settingsFocusStat}>
                        <span className={styles.settingsFocusStatLabel}>{t('settings.focus.streak')}</span>
                        <span className={styles.settingsFocusStatValue}>{pomodoroStats.streak} {t('settings.focus.streakDays')}</span>
                      </div>
                    </div>

                    <p className={styles.settingsFocusCta}>
                      {t('settings.focus.manageFocus')}
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Keyboard Shortcuts Section */}
            {activeSection === 'keyboardShortcuts' && (
              <div className={styles.settingsContainer}>
                {SHORTCUT_ORDER.map((action) => {
                  const currentKey = (settings.keyboard_shortcuts ?? DEFAULT_SHORTCUTS)[action] ?? DEFAULT_SHORTCUTS[action];
                  const isCapturing = capturingAction === action;
                  return (
                    <div key={action} className={styles.settingItem}>
                      <label>{t(SHORTCUT_LABEL_KEYS[action])}</label>
                      <div className={styles.shortcutControl}>
                        {shortcutError?.action === action && (
                          <span className={styles.shortcutErrorText} role="alert">
                            {shortcutError.message}
                          </span>
                        )}
                        <kbd className={styles.keyBadge}>{formatKeyLabel(currentKey)}</kbd>
                        <button
                          type="button"
                          className={styles.select}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setShortcutError(null);
                            setCapturingAction(isCapturing ? null : action);
                          }}
                          aria-label={`${t('settings.changeShortcut')}: ${t(SHORTCUT_LABEL_KEYS[action])}`}
                        >
                          {isCapturing ? t('settings.pressKey') : t('settings.changeShortcut')}
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className={styles.resetSection}>
                  <button onClick={handleRestoreDefaultShortcuts} className={`${styles.resetButton} button button-stop`}>
                    {t('settings.restoreDefaults')}
                  </button>
                </div>
              </div>
            )}

            {/* Data & Privacy Section */}
            {activeSection === 'privacy' && (
              <div className={styles.settingsContainer}>
                <div className={styles.privacyAction}>
                  <div>
                    <h3 className={styles.subSectionTitle} style={{ marginTop: 0 }}>{t('settings.exportData')}</h3>
                    <p className={styles.settingsFocusHelperText} style={{ maxWidth: 'none' }}>
                      {t('settings.exportDataDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.exportButton}
                    onClick={exportJson}
                    disabled={isExporting}
                  >
                    {isExporting ? t('app.settings.exportExporting') : t('settings.exportData')}
                  </button>
                </div>

                <div className={styles.privacyAction}>
                  <div>
                    <h3 className={styles.subSectionTitle} style={{ marginTop: 0 }}>{t('settings.deleteData')}</h3>
                    <p className={styles.settingsFocusHelperText} style={{ maxWidth: 'none' }}>
                      {t('settings.deleteDataDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.dangerButton}
                    onClick={() => setShowDeleteDataConfirm(true)}
                    disabled={isDeletingData}
                  >
                    {t('settings.deleteData')}
                  </button>
                </div>

                <div className={styles.privacyAction}>
                  <div>
                    <h3 className={styles.subSectionTitle} style={{ marginTop: 0 }}>{t('settings.deleteAccount')}</h3>
                    <p className={styles.settingsFocusHelperText} style={{ maxWidth: 'none' }}>
                      {t('settings.deleteAccountDesc')}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.dangerButtonStrong}
                    onClick={() => setShowDeleteAccountConfirm(true)}
                    disabled={isDeletingAccount}
                  >
                    {t('settings.deleteAccount')}
                  </button>
                </div>
              </div>
            )}
            </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </motion.div>
      <ConfirmModal
        visible={showResetConfirm}
        message={t('settings.general.resetConfirmMessage')}
        icon="🔄"
        mode="confirm"
        confirmLabel={t('settings.general.resetConfirmLabel')}
        destructive={true}
        onConfirm={async () => {
          await resetSettings();
          setShowResetConfirm(false);
        }}
        onCancel={() => setShowResetConfirm(false)}
      />
      <ConfirmModal
        visible={showDeleteDataConfirm}
        message={t('settings.deleteDataConfirm')}
        icon="⚠️"
        mode="confirm"
        confirmLabel={t('settings.deleteDataConfirmLabel')}
        destructive={true}
        onConfirm={handleDeleteAllData}
        onCancel={() => setShowDeleteDataConfirm(false)}
      />
      <ConfirmModal
        visible={showDeleteAccountConfirm}
        message={t('settings.deleteAccountConfirm')}
        icon="🛑"
        mode="confirm"
        confirmLabel={t('settings.deleteAccountConfirmLabel')}
        destructive={true}
        requireTypedConfirmation={t('settings.deleteAccountConfirmWord')}
        onConfirm={handleDeleteAccount}
        onCancel={() => setShowDeleteAccountConfirm(false)}
      />
      <Notification
        message={privacyNotification.message}
        visible={privacyNotification.visible}
        onClose={() => setPrivacyNotification({ visible: false, message: '' })}
        duration={4000}
      />
      </>
      )}
    </AnimatePresence>
  );
}
