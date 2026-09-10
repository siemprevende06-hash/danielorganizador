import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Home as HomeIcon,
  Dumbbell,
  CalendarDays,
  Search,
  BarChart3,
  History as HistoryIcon,
} from "lucide-react";
import { GymProvider } from "../gym2/store";
import { UIProvider } from "../gym2/components/SheetStack";
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

function GymApp() {
  const [tab, setTab] = useState("home");
  const [planRoutine, setPlanRoutine] = useState<string | null>(null);

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
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex w-full">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors",
                tab === t.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => onGo(t.id)}
            >
              <t.icon className="h-5 w-5" />
              {t.label}
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
      </UIProvider>
    </GymProvider>
  );
}
