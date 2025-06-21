// app/layout.tsx

import type { Metadata, Viewport } from 'next';
import './globals.css';
import icon from './prod-iubo.png';
import { SettingsProvider } from './context/SettingsContext';
import ThemeWrapper from './components/ThemeWrapper/ThemeWrapper';
import { Anton } from 'next/font/google';

export const anton = Anton({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-anton',
});

export const metadata: Metadata = {
  title: 'Prod-UIBO - Reloj de Productividad Inteligente',
  description: 'Maximiza tu enfoque y gestiona tu tiempo eficazmente con Prod-UIBO, tu reloj de productividad personalizable.',
  applicationName: 'Prod-UIBO',
  keywords: ['productividad', 'reloj', 'temporizador', 'gestión del tiempo', 'enfoque', 'UIBO', 'Prod-UIBO', 'timer', 'pomodoro'],
  authors: [{ name: '@rodrigobeta (Alan Rodrigo Ramirez Luna)', url: 'https://tu-web.com' }],
  creator: '@rodrigobeta (Alan Rodrigo Ramirez Luna)',
  publisher: 'Alan Rodrigo Ramirez Luna',

  icons: {
    icon: icon.src,
    apple: icon.src,
  },

  openGraph: {
    type: 'website',
    url: 'https://tu-dominio-prod-uibo.com',
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


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <SettingsProvider>
      <html lang="es" className={anton.variable}>
        <body>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </body>
      </html>
    </SettingsProvider>
  );
}
