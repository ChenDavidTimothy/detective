'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type ThemeContextType = {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with system preference, but we'll check localStorage
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);
  
  // Only run on client-side to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    // Check for stored preference
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    
    // If no stored preference, use system preference
    if (!storedTheme) {
      const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setThemeState(systemPreference);
      return;
    }
    
    setThemeState(storedTheme);
  }, []);
  
  // Update HTML element class when theme changes
  useEffect(() => {
    if (!mounted) return;
    
    const html = document.documentElement;
    
    if (theme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
    
    // Store preference
    localStorage.setItem('theme', theme);
  }, [theme, mounted]);
  
  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };
  
  // Avoid rendering children until after hydration to prevent mismatch
  if (!mounted) {
    return null;
  }
  
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use the theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}