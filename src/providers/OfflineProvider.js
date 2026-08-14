import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";
import { isOnline } from "@/lib/isOnline";
import { WifiOff, RefreshCw, Clock } from "lucide-react";
const OfflineContext = createContext({
    isOnline: true,
    pendingMutations: 0,
    lastSync: null,
    flushNow: async () => { },
});
export const useOffline = () => useContext(OfflineContext);
export function OfflineProvider({ children }) {
    const [online, setOnline] = useState(isOnline());
    const [pendingMutations, setPendingMutations] = useState(0);
    const [lastSync, setLastSync] = useState(null);
    const [syncing, setSyncing] = useState(false);
    const refreshPending = useCallback(async () => {
        setPendingMutations(await getQueueSize());
    }, []);
    const flushNow = useCallback(async () => {
        if (syncing)
            return;
        setSyncing(true);
        try {
            const result = await flushQueue();
            if (result.ok > 0)
                setLastSync(new Date());
            await refreshPending();
        }
        finally {
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
        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible' && navigator.onLine) {
                flushNow();
            }
        };
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        document.addEventListener("visibilitychange", onVisibilityChange);
        if (!navigator.onLine)
            document.body.classList.add("app-offline");
        const t = setInterval(refreshPending, 10000);
        const healthCheck = setInterval(() => {
            const actual = navigator.onLine;
            if (actual !== online) {
                setOnline(actual);
                document.body.classList.toggle("app-offline", !actual);
                if (actual)
                    flushNow();
            }
        }, 5000);
        // Periodic sync every 60s when online
        const periodicSync = setInterval(() => {
            if (navigator.onLine)
                flushNow();
        }, 60000);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            document.removeEventListener("visibilitychange", onVisibilityChange);
            clearInterval(t);
            clearInterval(healthCheck);
            clearInterval(periodicSync);
        };
    }, [refreshPending, flushNow]);
    const showIndicator = !online || pendingMutations > 0 || syncing;
    return (_jsxs(OfflineContext.Provider, { value: { isOnline: online, pendingMutations, lastSync, flushNow }, children: [showIndicator && (_jsx("div", { className: "fixed top-3 right-3 z-[9999] flex gap-1.5", children: !online ? (_jsxs("div", { className: "flex items-center gap-1.5 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-full px-2.5 py-1 shadow-sm text-[10px] font-medium text-red-600 dark:text-red-400", children: [_jsx(WifiOff, { className: "h-3 w-3" }), _jsxs("span", { children: ["Sin conexi\u00F3n", pendingMutations > 0 ? ` · ${pendingMutations} pendientes` : ""] })] })) : syncing ? (_jsxs("div", { className: "flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-full px-2.5 py-1 shadow-sm text-[10px] font-medium text-blue-600 dark:text-blue-400", children: [_jsx(RefreshCw, { className: "h-3 w-3 animate-spin" }), _jsxs("span", { children: ["Sincronizando", pendingMutations > 0 ? ` · ${pendingMutations}` : ""] })] })) : pendingMutations > 0 ? (_jsxs("button", { onClick: flushNow, className: "flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-full px-2.5 py-1 shadow-sm hover:shadow-md transition-shadow text-[10px] font-medium text-amber-600 dark:text-amber-400", title: "Sincronizar cambios pendientes", children: [_jsx(Clock, { className: "h-3 w-3" }), _jsxs("span", { children: [pendingMutations, " pendientes"] })] })) : null })), children] }));
}
