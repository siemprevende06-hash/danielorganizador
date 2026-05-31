import { useEffect } from 'react';

export function useAutoTheme() {
  useEffect(() => {
    const updateTheme = () => {
      const hour = new Date().getHours();
      const isDark = hour < 6 || hour >= 20;
      document.documentElement.classList.toggle('dark', isDark);
    };

    updateTheme();
    const interval = setInterval(updateTheme, 60000);
    return () => clearInterval(interval);
  }, []);
}
