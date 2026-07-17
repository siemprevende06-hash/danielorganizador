import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";
import { isOnline } from "@/lib/isOnline";
import { WifiOff, RefreshCw, Wifi, CloudOff, Clock } from "lucide-react";

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
  const [syncing, setSyncing] = useState(false);

  const refreshPending = useCallback(async () => {
    setPendingMutations(await getQueueSize());
  }, []);

  const flushNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const result = await flushQueue();
      if (result.ok > 0) setLastSync(new Date());
      await refreshPending();
    } finally {
      setSyncing(false);
    }
  }, [refreshPending, syncing]);

  useEffect(() => {
    refreshPending();
    const onOnline = async () => {
      setOnline(true);
      document.body.classList.remove("app-offline");
      await flushNow();
    };
    const onOffline = () => {
      setOnline(false);
      document.body.classList.add("app-offline");
    };
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    if (!navigator.onLine) document.body.classList.add("app-offline");

    const t = setInterval(refreshPending, 10000);
    const healthCheck = setInterval(() => {
      const actual = navigator.onLine;
      if (actual !== online) {
        setOnline(actual);
        document.body.classList.toggle("app-offline", !actual);
        if (actual) flushNow();
      }
    }, 5000);

    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
      clearInterval(healthCheck);
    };
  }, [refreshPending, flushNow]);

  const showIndicator = !online || pendingMutations > 0 || syncing;

  return (
    <OfflineContext.Provider value={{ isOnline: online, pendingMutations, lastSync, flushNow }}>
      {showIndicator && (
        <div className="fixed top-3 right-3 z-[9999] flex gap-1.5">
          {!online ? (
            <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-full px-2.5 py-1 shadow-sm text-[10px] font-medium text-red-600 dark:text-red-400">
              <WifiOff className="h-3 w-3" />
              <span>Sin conexión{pendingMutations > 0 ? ` · ${pendingMutations} pendientes` : ""}</span>
            </div>
          ) : syncing ? (
            <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1 shadow-sm text-[10px] font-medium text-blue-600 dark:text-blue-400">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Sincronizando{pendingMutations > 0 ? ` · ${pendingMutations}` : ""}</span>
            </div>
          ) : pendingMutations > 0 ? (
            <button
              onClick={flushNow}
              className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1 shadow-sm hover:shadow-md transition-shadow text-[10px] font-medium text-amber-600 dark:text-amber-400"
              title="Sincronizar cambios pendientes"
            >
              <Clock className="h-3 w-3" />
              <span>{pendingMutations} pendientes</span>
            </button>
          ) : null}
        </div>
      )}

      {children}
    </OfflineContext.Provider>
  );
}
