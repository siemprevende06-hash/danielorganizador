import { useEffect, useCallback } from 'react';

const THEME_KEY = 'theme-mode';

type ThemeMode = 'light' | 'dark';

function getStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {}
  return 'dark';
}

function applyTheme(mode: ThemeMode) {
  if (mode === 'light') {
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
  }
}

export function useAutoTheme() {
  useEffect(() => {
    const mode = getStoredMode();
    applyTheme(mode);
  }, []);

  const toggleTheme = useCallback(() => {
    const current = getStoredMode();
    const next: ThemeMode = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
  }, []);

  const isDark = document.documentElement.classList.contains('dark');

  return { toggleTheme, isDark };
}
