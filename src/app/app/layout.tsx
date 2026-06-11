// app/layout.tsx

// =================================================================
// SECTION: Imports
// =================================================================
import type { Metadata, Viewport } from 'next';
import '@/app/globals.css';

// Component and Provider Imports
import { SettingsProvider } from '@/context/SettingsContext';
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper';
import AmbientSoundPlayer from '@/components/AmbientSoundPlayer/AmbientSoundPlayer';
import { Anton } from 'next/font/google';

const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
});

// =================================================================
// SECTION: Font Configuration
// =================================================================

// Configures the 'Anton' font from Google Fonts using next/font.
// This optimizes the font and makes it available globally via a CSS variable.


// =================================================================
// SECTION: Metadata and Viewport
// =================================================================

// Defines the metadata specific to the authenticated app area.
// Global SEO fields (icons, openGraph, twitter, etc.) live in the root layout.
export const metadata: Metadata = {
  title: 'Mi Espacio — PROD-UIBO',
  description: 'Tu temporizador de productividad personalizable con temas visuales y sonidos ambientales.',
};

// Defines the viewport configuration for responsive behavior and theme colors.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f0f0f0' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'dark light',
};


// =================================================================
// SECTION: App Layout Component
// =================================================================

/**
 * AppLayout is the layout component for the /app route.
 * It sets up the HTML structure, applies the Anton font, and
 * initializes all necessary context providers.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @returns {JSX.Element} The app layout of the application.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={anton.variable}>
      <SettingsProvider>
        <ThemeWrapper>
          {children}
          <AmbientSoundPlayer />
        </ThemeWrapper>
      </SettingsProvider>
    </div>
  );
}
