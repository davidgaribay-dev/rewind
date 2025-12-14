import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

/**
 * Hook to detect and track system theme preference
 */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if dark mode is enabled on mount
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return theme;
}
