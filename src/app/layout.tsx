// app/layout.tsx

// =================================================================
// SECTION: Imports
// =================================================================
import type { Metadata, Viewport } from 'next';
import { Anton } from 'next/font/google';
import './globals.css';

// Component and Provider Imports
import { SettingsProvider } from './context/SettingsContext';
import ThemeWrapper from './components/ThemeWrapper/ThemeWrapper';
import AmbientSoundPlayer from './components/AmbientSoundPlayer/AmbientSoundPlayer';

// Asset Imports
import icon from './prod-iubo.png';


// =================================================================
// SECTION: Font Configuration
// =================================================================

// Configures the 'Anton' font from Google Fonts using next/font.
// This optimizes the font and makes it available globally via a CSS variable.
export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton', // Assigns the font to a CSS variable
});


// =================================================================
// SECTION: Metadata and Viewport
// =================================================================

// Defines the static metadata for the application, crucial for SEO and sharing.
export const metadata: Metadata = {
  title: 'Prod-UIBO - Reloj de Productividad Inteligente',
  description: 'Maximiza tu enfoque y gestiona tu tiempo eficazmente con Prod-UIBO, tu reloj de productividad personalizable.',
  applicationName: 'Prod-UIBO',
  keywords: ['productividad', 'reloj', 'temporizador', 'gestión del tiempo', 'enfoque', 'UIBO', 'Prod-UIBO', 'timer', 'pomodoro'],
  authors: [{ name: '@rodrigobeta (Alan Rodrigo Ramirez Luna)', url: 'https://your-website.com' }],
  creator: '@rodrigobeta (Alan Rodrigo Ramirez Luna)',
  publisher: 'Alan Rodrigo Ramirez Luna',

  icons: {
    icon: icon.src,
    apple: icon.src,
  },

  openGraph: {
    type: 'website',
    url: 'https://your-app-domain.com',
    title: 'Prod-UIBO - Reloj de Productividad Inteligente',
    description: 'Maximiza tu enfoque y gestiona tu tiempo eficazmente con Prod-UIBO.',
    siteName: 'Prod-UIBO',
    images: [
      {
        url: '/prod-iubo.png',
        width: 256,
        height: 256,
        alt: 'Logo de Prod-UIBO',
      },
    ],
  },

  twitter: {
    card: 'summary',
    title: 'Prod-UIBO - Reloj de Productividad Inteligente',
    description: 'Maximiza tu enfoque y gestiona tu tiempo eficazmente con Prod-UIBO.',
    images: ['/prod-iubo.png'],
  },
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
// SECTION: Root Layout Component
// =================================================================

/**
 * RootLayout is the main server component that wraps the entire application.
 * It sets up the global HTML structure, applies the primary font, and
 * initializes all global context providers.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to be rendered.
 * @returns {JSX.Element} The root layout of the application.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <html lang="es" className={anton.variable}>
        <body>
          {/* ThemeWrapper applies dynamic theme classes based on user settings */}
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
          
          {/* AmbientSoundPlayer is a global component that handles background audio */}
          <AmbientSoundPlayer/>
        </body>
      </html>
    </SettingsProvider>
  );
}
