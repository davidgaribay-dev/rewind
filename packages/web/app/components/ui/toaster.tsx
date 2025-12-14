import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '../ThemeProvider';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme as 'light' | 'dark' | 'system'}
      position="bottom-right"
      richColors
    />
  );
}
