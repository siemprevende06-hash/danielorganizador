import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";
import { isOnline } from "@/lib/isOnline";
import { WifiOff, Cloud, RefreshCw, Wifi } from "lucide-react";

interface OfflineContextValue {
  isOnline: boolean;
  pendingMutations: number;
  lastSync: Date | null;
  flushNow: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue>({
  isOnline: true,
  pendingMutations: 0,
  lastSync: null,
  flushNow: async () => {},
});

export const useOffline = () => useContext(OfflineContext);

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(isOnline());
  const [pendingMutations, setPendingMutations] = useState(0);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const refreshPending = useCallback(async () => {
    setPendingMutations(await getQueueSize());
  }, []);

  const flushNow = useCallback(async () => {
    const result = await flushQueue();
    if (result.ok > 0) setLastSync(new Date());
    await refreshPending();
  }, [refreshPending]);

  useEffect(() => {
    refreshPending();
    const onOnline = async () => {
      setOnline(true);
      await flushNow();
    };
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const t = setInterval(refreshPending, 10000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
    };
  }, [refreshPending, flushNow]);

  const showIndicator = !online || pendingMutations > 0;

  return (
    <OfflineContext.Provider value={{ isOnline: online, pendingMutations, lastSync, flushNow }}>
      {showIndicator && (
        <div className="fixed top-3 right-3 z-[9999]">
          {!online ? (
            <button
              onClick={flushNow}
              className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1 shadow-sm hover:shadow-md transition-shadow text-[10px] font-medium text-amber-600 dark:text-amber-400"
              title="Sin conexión"
            >
              <WifiOff className="h-3 w-3" />
              <span>Offline{pendingMutations > 0 ? ` · ${pendingMutations}` : ""}</span>
            </button>
          ) : (
            <button
              onClick={flushNow}
              className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-full px-2.5 py-1 shadow-sm hover:shadow-md transition-shadow text-[10px] font-medium text-blue-600 dark:text-blue-400"
              title="Sincronizando"
            >
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>{pendingMutations}</span>
            </button>
          )}
        </div>
      )}

      {children}
    </OfflineContext.Provider>
  );
}
