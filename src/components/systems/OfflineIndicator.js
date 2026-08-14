import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Wifi, WifiOff, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";
import { isOnline } from "@/lib/isOnline";
export const OfflineIndicator = () => {
    const [online, setOnline] = useState(isOnline());
    const [pending, setPending] = useState(0);
    useEffect(() => {
        const refresh = async () => setPending(await getQueueSize());
        refresh();
        const onOnline = async () => {
            setOnline(true);
            await flushQueue();
            refresh();
        };
        const onOffline = () => setOnline(false);
        window.addEventListener("online", onOnline);
        window.addEventListener("offline", onOffline);
        const t = setInterval(refresh, 5000);
        return () => {
            window.removeEventListener("online", onOnline);
            window.removeEventListener("offline", onOffline);
            clearInterval(t);
        };
    }, []);
    if (online && pending === 0) {
        return (_jsxs(Badge, { variant: "outline", className: "gap-1 text-[10px] h-5", children: [_jsx(Wifi, { className: "h-3 w-3 text-success" }), " Online"] }));
    }
    if (!online) {
        return (_jsxs(Badge, { variant: "outline", className: "gap-1 text-[10px] h-5 border-warning text-warning", children: [_jsx(WifiOff, { className: "h-3 w-3" }), " Offline ", pending > 0 && `· ${pending} en cola`] }));
    }
    return (_jsxs(Badge, { variant: "outline", className: "gap-1 text-[10px] h-5 border-info text-info", children: [_jsx(CloudOff, { className: "h-3 w-3" }), " Sincronizando \u00B7 ", pending] }));
};
