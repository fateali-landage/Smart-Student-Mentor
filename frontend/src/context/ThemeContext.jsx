/**
 * ThemeContext.jsx — SmartMentor Theme Context
 * ──────────────────────────────────────────────
 * Manages dark/light mode with:
 *  - localStorage persistence
 *  - System preference initialization
 *  - `isDark` convenience boolean
 *  - Toggles the `dark` class on <html>
 */

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // ── Initialize from localStorage or system preference ──────────────────────
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored === 'dark' || stored === 'light') return stored;
      // Fall back to OS preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  // ── Apply dark class and persist on change ──────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // ── Listen to OS preference changes (when no manual override yet) ───────────
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      // Only follow OS if the user hasn't manually set a preference
      const stored = localStorage.getItem('theme');
      if (!stored) setTheme(e.matches ? 'dark' : 'light');
    };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ── Toggle ──────────────────────────────────────────────────────────────────
  const toggleTheme = () =>
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  // ── Convenience ─────────────────────────────────────────────────────────────
  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}

export default ThemeContext;
