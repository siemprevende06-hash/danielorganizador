import { useEffect, useCallback } from 'react';

const THEME_KEY = 'theme-mode';

type ThemeMode = 'auto' | 'light' | 'dark';

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'auto') return stored;
  } catch {}
  return 'auto';
}

function applyTheme(mode: ThemeMode) {
  if (mode === 'light') {
    document.documentElement.classList.remove('dark');
  } else if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    // auto: based on time
    const hour = new Date().getHours();
    const isDark = hour < 6 || hour >= 20;
    document.documentElement.classList.toggle('dark', isDark);
  }
}

export function useAutoTheme() {
  // Apply auto theme on initial load
  useEffect(() => {
    const mode = getStoredMode();
    applyTheme(mode);

    // If auto, update every minute
    if (mode === 'auto') {
      const interval = setInterval(() => applyTheme('auto'), 60000);
      return () => clearInterval(interval);
    }
  }, []);

  const isDark = document.documentElement.classList.contains('dark');

  const toggleTheme = useCallback(() => {
    const current = getStoredMode();
    let next: ThemeMode;
    if (current === 'auto') {
      // If currently dark, switch to light. If light, switch to dark.
      const currentlyDark = document.documentElement.classList.contains('dark');
      next = currentlyDark ? 'light' : 'dark';
    } else if (current === 'light') {
      next = 'dark';
    } else {
      next = 'light';
    }
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  const currentMode = getStoredMode();
  const isManual = currentMode !== 'auto';
  const effectiveDark = document.documentElement.classList.contains('dark');

  return { toggleTheme, currentMode, isManual, isDark: effectiveDark };
}
