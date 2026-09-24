import React, { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = 'theme';

/** The stored choice, or light. Never throws: private mode and blocked site data both
 *  make localStorage unavailable, and a theme is not worth failing a render over. */
function storedTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Seeded from storage rather than hardcoded to 'light'. It used to be
  // `useState<Theme>('light')` with nothing written back, so a reload silently discarded the
  // choice -- the E2E test `profileDarkThemePersistsAcrossReload` fails on exactly that.
  // Read lazily so the very first render already has the right theme and the page does not
  // flash light before correcting itself.
  const [theme, setTheme] = useState<Theme>(storedTheme);

  // The `dark` class itself is still applied by App.tsx from this value; this provider owns
  // the value and its persistence, nothing else.
  const toggleTheme = () => {
    setTheme(prev => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(STORAGE_KEY, next); } catch { /* storage unavailable */ }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

 
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
