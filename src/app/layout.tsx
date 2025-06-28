import './globals.css'; 
import { SettingsProvider } from '@/context/SettingsContext'; 
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper';

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
export const metadata = {
  // Basic page information
  title: 'Prod-UIBO',
  description: 'Temporizador de productividad personalizable con técnica Pomodoro. Gestiona tu tiempo y mantén el enfoque con temas inmersivos y sonidos ambientales.',
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
    apple: '/favicon.png',          // iOS home screen icon
  },
  
  // Open Graph metadata for social media sharing
  openGraph: {
    title: 'Prod-UIBO - Temporizador de Productividad',
    description: 'Temporizador de productividad personalizable con técnica Pomodoro',
    type: 'website',
    locale: 'es_ES',
  },
  
  // Twitter Card metadata for Twitter sharing
  twitter: {
    card: 'summary_large_image',
    title: 'Prod-UIBO - Temporizador de Productividad',
    description: 'Temporizador de productividad personalizable con técnica Pomodoro',
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
    <html lang="es">
      {/* Head section with favicon links for maximum browser compatibility */}
      <head>
        <link rel="icon" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
      </head>
      
      {/* Body with context providers and theme wrapper */}
      <body>
        {/* Settings Provider - Manages application-wide settings state */}
        <SettingsProvider>
          {/* Theme Wrapper - Handles dynamic theme switching and styling */}
          <ThemeWrapper>
            {/* Page content - Rendered children components */}
            {children}
          </ThemeWrapper>
        </SettingsProvider>
      </body>
    </html>
  );
} 