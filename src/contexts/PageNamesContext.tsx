import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTextSection } from '@/hooks/useTextSection';

type NamesMap = Record<string, string>;

interface PageNamesContextValue {
  names: NamesMap;
  setPageName: (path: string, name: string) => void;
  removePageName: (path: string) => void;
  getPageName: (path: string) => string | undefined;
}

const PageNamesContext = createContext<PageNamesContextValue | null>(null);

export function PageNamesProvider({ children }: { children: ReactNode }) {
  const { data, setData } = useTextSection<NamesMap>('page_names', {});

  const value = useMemo<PageNamesContextValue>(
    () => ({
      names: data || {},
      setPageName: (path, name) => {
        setData((prev) => ({ ...(prev || {}), [path]: name }));
      },
      removePageName: (path) => {
        setData((prev) => {
          const next = { ...(prev || {}) };
          delete next[path];
          return next;
        });
      },
      getPageName: (path) => data?.[path],
    }),
    [data, setData]
  );

  return <PageNamesContext.Provider value={value}>{children}</PageNamesContext.Provider>;
}

export function usePageNames() {
  const ctx = useContext(PageNamesContext);
  if (!ctx) throw new Error('usePageNames debe usarse dentro de PageNamesProvider');
  return ctx;
}