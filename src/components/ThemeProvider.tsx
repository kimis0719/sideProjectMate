'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light';

interface ThemeContextType {
  theme: Theme;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 라이트모드 고정 — 다크모드 지원하지 않음
    document.documentElement.classList.remove('dark');
    localStorage.removeItem('theme');
    setMounted(true);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: 'light', mounted }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
