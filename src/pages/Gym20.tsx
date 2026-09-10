import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  Home as HomeIcon,
  Dumbbell,
  CalendarDays,
  Search,
  BarChart3,
  History as HistoryIcon,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import { GymProvider, useGym } from "../gym2/store";
import { UIProvider } from "../gym2/components/SheetStack";
import { useSidebar } from "@/contexts/SidebarContext";
import { RestTimer } from "../gym2/components/RestTimer";
import Home from "../gym2/views/Home";
import WorkoutView from "../gym2/views/WorkoutView";
import PlanView from "../gym2/views/PlanView";
import RoutineEditView from "../gym2/views/RoutineEditView";
import Library from "../gym2/views/Library";
import Stats from "../gym2/views/Stats";
import History from "../gym2/views/History";

const TABS: {
  id: string;
  label: string;
  icon: typeof HomeIcon;
}[] = [
  { id: "home", label: "Inicio", icon: HomeIcon },
  { id: "workout", label: "Entrenar", icon: Dumbbell },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "library", label: "Ejercicios", icon: Search },
  { id: "stats", label: "Estadísticas", icon: BarChart3 },
  { id: "history", label: "Historial", icon: HistoryIcon },
];

function SyncIndicator() {
  const { sync } = useGym();
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!sync.syncing && online && !sync.lastSyncAt) return null;
  if (!sync.syncing && online) return null;

  return (
    <div className="fixed top-14 right-3 z-[9999] lg:top-3">
      {!online ? (
        <div className="flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-medium text-red-600 shadow-sm dark:border-red-800 dark:bg-red-950 dark:text-red-400">
          <WifiOff className="h-3 w-3" />
          <span>Offline — datos guardados local</span>
        </div>
      ) : sync.syncing ? (
        <div className="flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-medium text-blue-600 shadow-sm dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400">
          <RefreshCw className="h-3 w-3 animate-spin" />
          <span>Sincronizando…</span>
        </div>
      ) : null}
    </div>
  );
}

function GymApp() {
  const [tab, setTab] = useState("home");
  const [planRoutine, setPlanRoutine] = useState<string | null>(null);
  const { collapsed } = useSidebar();

  const onGo = (t: string) => {
    setTab(t);
    if (t !== "plan") setPlanRoutine(null);
  };

  return (
    <div className="flex min-h-[calc(100dvh-3rem)] flex-col">
      <main className="min-w-0 flex-1 pb-16">
        {tab === "home" && <Home onGo={onGo} />}
        {tab === "workout" && <WorkoutView onGo={onGo} />}
        {tab === "plan" &&
          (planRoutine ? (
            <RoutineEditView id={planRoutine} onBack={() => setPlanRoutine(null)} />
          ) : (
            <PlanView onEdit={(id) => setPlanRoutine(id)} />
          ))}
        {tab === "library" && <Library />}
        {tab === "stats" && <Stats />}
        {tab === "history" && <History />}
      </main>

      {/* bottom nav — always visible, only covers content area */}
      <nav
        className={cn(
          "fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur",
          collapsed ? "lg:left-14" : "lg:left-56"
        )}
      >
        <div className="mx-auto flex w-full">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onGo(t.id)}
            >
              <t.icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate whitespace-nowrap">{t.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function Gym20() {
  return (
    <GymProvider>
      <UIProvider>
        <GymApp />
        <RestTimer />
        <SyncIndicator />
      </UIProvider>
    </GymProvider>
  );
}
