import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useTextSection } from '@/hooks/useTextSection';

/** Normaliza una ruta para que "/tasks/" y "/tasks" sean la misma entrada. */
function normalizePath(path: string): string {
  const clean = (path || '/').split('?')[0].split('#')[0];
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

interface QuickAccessContextValue {
  /** Rutas marcadas, en el orden en que se añadieron. */
  paths: string[];
  isQuickAccess: (path: string) => boolean;
  addQuickAccess: (path: string) => void;
  removeQuickAccess: (path: string) => void;
  /** Devuelve true si la ruta quedó añadida y false si se quitó. */
  toggleQuickAccess: (path: string) => boolean;
}

const QuickAccessContext = createContext<QuickAccessContextValue | null>(null);

export function QuickAccessProvider({ children }: { children: ReactNode }) {
  const { data, setData } = useTextSection<string[]>('quick_access_pages', []);

  const paths = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const raw of data || []) {
      const path = normalizePath(raw);
      if (!seen.has(path)) {
        seen.add(path);
        result.push(path);
      }
    }
    return result;
  }, [data]);

  const isQuickAccess = useCallback(
    (path: string) => paths.includes(normalizePath(path)),
    [paths],
  );

  const addQuickAccess = useCallback(
    (path: string) => {
      const target = normalizePath(path);
      setData(prev => {
        const current = (prev || []).map(normalizePath);
        if (current.includes(target)) return current;
        return [...current, target];
      });
    },
    [setData],
  );

  const removeQuickAccess = useCallback(
    (path: string) => {
      const target = normalizePath(path);
      setData(prev => (prev || []).map(normalizePath).filter(item => item !== target));
    },
    [setData],
  );

  const toggleQuickAccess = useCallback(
    (path: string) => {
      const target = normalizePath(path);
      const willAdd = !paths.includes(target);
      if (willAdd) addQuickAccess(target);
      else removeQuickAccess(target);
      return willAdd;
    },
    [paths, addQuickAccess, removeQuickAccess],
  );

  const value = useMemo<QuickAccessContextValue>(
    () => ({ paths, isQuickAccess, addQuickAccess, removeQuickAccess, toggleQuickAccess }),
    [paths, isQuickAccess, addQuickAccess, removeQuickAccess, toggleQuickAccess],
  );

  return <QuickAccessContext.Provider value={value}>{children}</QuickAccessContext.Provider>;
}

export function useQuickAccess() {
  const ctx = useContext(QuickAccessContext);
  if (!ctx) throw new Error('useQuickAccess debe usarse dentro de QuickAccessProvider');
  return ctx;
}
