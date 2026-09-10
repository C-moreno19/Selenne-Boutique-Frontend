import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): ResolvedTheme =>
  window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const leerThemeInicial = (): ThemePreference => {
  try {
    const guardado = localStorage.getItem('_selenne_theme');
    if (guardado === 'light' || guardado === 'dark' || guardado === 'system') return guardado;
  } catch {}
  return 'system';
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemePreference>(leerThemeInicial);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(() => getSystemTheme());

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const handler = (e: MediaQueryListEvent) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', handler);
    return () => mq.removeEventListener?.('change', handler);
  }, []);

  const resolvedTheme: ResolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = (next: ThemePreference) => {
    setThemeState(next);
    try { localStorage.setItem('_selenne_theme', next); } catch {}
  };

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de ThemeProvider');
  }
  return context;
};
