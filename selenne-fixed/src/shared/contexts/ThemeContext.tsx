import React, { createContext, useContext, useEffect, ReactNode } from 'react';

// El modo oscuro fue retirado del sitio: el tema queda fijo en "light" y este
// contexto solo existe para no romper los componentes que aún lo consumen.
type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  const value: ThemeContextType = {
    theme: 'light',
    resolvedTheme: 'light',
    setTheme: () => {},
    toggleTheme: () => {},
  };

  return (
    <ThemeContext.Provider value={value}>
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
