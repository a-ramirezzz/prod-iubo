import type { Metadata } from 'next';
import './globals.css';
import { SettingsProvider } from '@/context/SettingsContext';
import { AuthProvider } from '@/context/AuthContext';
import { LocaleProvider } from '@/app/lib/i18n';
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper';
import { ErrorBoundary, ErrorFallback } from '@/app/components/ErrorBoundary';
import { Inter } from 'next/font/google';
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-anton',
});

/**
 * Root Layout Component
 * 
 * This is the main layout component that wraps all pages in the application.
 * It provides:
 * - Global metadata and SEO optimization
 * - Favicon configuration
 * - Settings context provider
 * - Theme wrapper for dynamic theming
 * - HTML structure and language settings
 * 
 * The layout ensures consistent structure across all pages and provides
 * necessary context providers for the application state management.
 */

/**
 * Application Metadata Configuration
 * 
 * Comprehensive metadata setup for SEO, social sharing, and browser compatibility.
 * Includes Open Graph tags for social media sharing and Twitter Cards support.
 */
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
};

const APP_TITLE = 'PROD-UIBO | Pomodoro Timer & Task Manager';
const APP_DESCRIPTION = 'Boost your productivity with customizable Pomodoro sessions, task management, achievements, and ambient themes. Free, open source, works offline.';

export const metadata: Metadata = {
  // metadataBase is required for relative image paths (e.g. og-image.png) to
  // resolve to absolute URLs that social platforms can actually fetch.
  metadataBase: new URL('https://prod-iubo.vercel.app'),

  // Basic page information
  title: APP_TITLE,
  description: APP_DESCRIPTION,
  keywords: 'productividad, pomodoro, temporizador, enfoque, gestión de tiempo, tareas',

  // Author and creator information
  authors: [{ name: 'Alan Rodrigo Ramírez Luna' }],
  creator: 'Alan Rodrigo Ramírez Luna',
  publisher: 'Prod-UIBO',

  // Browser behavior settings
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },

  // Favicon configuration for different platforms
  icons: {
    icon: '/favicon.png',           // Standard favicon
    shortcut: '/favicon.png',       // Legacy browser support
    apple: '/icons/icon-192.png',   // iOS home screen icon
  },

  // Web App Manifest for PWA installability
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PROD-UIBO',
  },

  // Open Graph metadata for social media sharing
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    alternateLocale: 'en_US',
    url: 'https://prod-iubo.vercel.app',
    siteName: 'PROD-UIBO',
    title: APP_TITLE,
    description: APP_DESCRIPTION,
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'PROD-UIBO — Pomodoro Timer & Task Manager',
      },
    ],
  },

  // Twitter Card metadata for Twitter sharing
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: 'Boost your productivity with customizable Pomodoro sessions, task management, achievements, and ambient themes.',
    images: ['/og-image.png'],
  },
};

/**
 * Root Layout Component
 * 
 * @param children - React components to be rendered within the layout
 * @returns JSX element with the complete page structure
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={inter.variable} suppressHydrationWarning>
      {/* Head section with favicon links for maximum browser compatibility */}
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      
      {/* Body with context providers and theme wrapper */}
      <body>
        {/* Locale Provider - Manages i18n locale (landing + app) */}
        <LocaleProvider>
          {/* Auth Provider - Manages authentication state globally */}
          <AuthProvider>
            {/* Settings Provider - Manages application-wide settings state */}
            <SettingsProvider>
              {/* Theme Wrapper - Handles dynamic theme switching and styling */}
              <ThemeWrapper>
                {/* Root-level catch-all boundary. Inside providers so the
                    fallback can access i18n; ErrorFallback also self-guards
                    with hardcoded Spanish if context is unavailable. */}
                <ErrorBoundary
                  fallback={<ErrorFallback error={null} level="root" />}
                >
                  {/* Page content - Rendered children components */}
                  {children}
                </ErrorBoundary>
              </ThemeWrapper>
            </SettingsProvider>
          </AuthProvider>
        </LocaleProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
} 