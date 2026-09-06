import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTextSection } from '@/hooks/useTextSection';

type CoversMap = Record<string, string>;

interface PageCoversContextValue {
  covers: CoversMap;
  setCover: (path: string, url: string) => void;
  removeCover: (path: string) => void;
  getCover: (path: string) => string | undefined;
}

const PageCoversContext = createContext<PageCoversContextValue | null>(null);

export function PageCoversProvider({ children }: { children: ReactNode }) {
  const { data, setData } = useTextSection<CoversMap>('page_covers', {});

  const value = useMemo<PageCoversContextValue>(
    () => ({
      covers: data || {},
      setCover: (path, url) => {
        setData((prev) => ({ ...(prev || {}), [path]: url }));
      },
      removeCover: (path) => {
        setData((prev) => {
          const next = { ...(prev || {}) };
          delete next[path];
          return next;
        });
      },
      getCover: (path) => data?.[path],
    }),
    [data, setData]
  );

  return <PageCoversContext.Provider value={value}>{children}</PageCoversContext.Provider>;
}

export function usePageCovers() {
  const ctx = useContext(PageCoversContext);
  if (!ctx) throw new Error('usePageCovers debe usarse dentro de PageCoversProvider');
  return ctx;
}