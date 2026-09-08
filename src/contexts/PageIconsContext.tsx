import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useTextSection } from '@/hooks/useTextSection';

type IconsMap = Record<string, string>;

interface PageIconsContextValue {
  icons: IconsMap;
  setIcon: (path: string, emoji: string) => void;
  removeIcon: (path: string) => void;
  getIcon: (path: string) => string | undefined;
}

const PageIconsContext = createContext<PageIconsContextValue | null>(null);

export function PageIconsProvider({ children }: { children: ReactNode }) {
  const { data, setData } = useTextSection<IconsMap>('page_icons', {});

  const value = useMemo<PageIconsContextValue>(
    () => ({
      icons: data || {},
      setIcon: (path, emoji) => {
        setData((prev) => ({ ...(prev || {}), [path]: emoji }));
      },
      removeIcon: (path) => {
        setData((prev) => {
          const next = { ...(prev || {}) };
          delete next[path];
          return next;
        });
      },
      getIcon: (path) => data?.[path],
    }),
    [data, setData]
  );

  return <PageIconsContext.Provider value={value}>{children}</PageIconsContext.Provider>;
}

export function usePageIcons() {
  const ctx = useContext(PageIconsContext);
  if (!ctx) throw new Error('usePageIcons debe usarse dentro de PageIconsProvider');
  return ctx;
}