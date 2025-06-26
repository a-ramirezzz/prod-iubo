import './globals.css'; // Make sure this path is correct
import { SettingsProvider } from '@/context/SettingsContext'; // Use '@' for absolute paths
import ThemeWrapper from '@/components/ThemeWrapper/ThemeWrapper'; // Use '@' for absolute paths

export const metadata = {
  title: 'Prod-UIBO',
  description: 'Temporizador de productividad y gestor de tareas',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SettingsProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </SettingsProvider>
      </body>
    </html>
  );
} 