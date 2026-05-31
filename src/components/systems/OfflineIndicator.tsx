import { useEffect, useState } from "react";
import { Wifi, WifiOff, Cloud, CloudOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { flushQueue, getQueueSize } from "@/lib/offlineQueue";

export const OfflineIndicator = () => {
  const [online, setOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
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
    return (
      <Badge variant="outline" className="gap-1 text-[10px] h-5">
        <Wifi className="h-3 w-3 text-success" /> Online
      </Badge>
    );
  }
  if (!online) {
    return (
      <Badge variant="outline" className="gap-1 text-[10px] h-5 border-warning text-warning">
        <WifiOff className="h-3 w-3" /> Offline {pending > 0 && `· ${pending} en cola`}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-[10px] h-5 border-info text-info">
      <CloudOff className="h-3 w-3" /> Sincronizando · {pending}
    </Badge>
  );
};
