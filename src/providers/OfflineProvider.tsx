import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";
import { isOnline } from "@/lib/isOnline";
import { WifiOff, Cloud, RefreshCw } from "lucide-react";

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
  const [isOnline, setIsOnline] = useState(isOnline());
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
      setIsOnline(true);
      await flushNow();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const t = setInterval(refreshPending, 10000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      clearInterval(t);
    };
  }, [refreshPending, flushNow]);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingMutations, lastSync, flushNow }}>
      {/* Global offline banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white text-center text-xs py-1.5 flex items-center justify-center gap-2">
          <WifiOff className="h-3 w-3" />
          <span>Sin conexión — los datos se sincronizarán automáticamente al reconectar</span>
          {pendingMutations > 0 && (
            <span className="font-bold">({pendingMutations} pendientes)</span>
          )}
        </div>
      )}
      {isOnline && pendingMutations > 0 && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground text-center text-xs py-1.5 flex items-center justify-center gap-2 cursor-pointer" onClick={flushNow}>
          <Cloud className="h-3 w-3" />
          <span>Sincronizando {pendingMutations} cambios pendientes</span>
          <RefreshCw className="h-3 w-3 animate-spin" />
        </div>
      )}
      {children}
    </OfflineContext.Provider>
  );
}
