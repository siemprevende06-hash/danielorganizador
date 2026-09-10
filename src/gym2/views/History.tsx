import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGym } from "../store";
import { MONTHS, DAYS, todayISO } from "../lib/format";
import { workoutDetailSheet, WorkoutRow } from "../components/sheets";
import { cn } from "@/lib/utils";
import type { Workout } from "../lib/types";

/** Grilla de calendario del mes: cada día entrenado se resalta y al tocar abre el detalle. */
function MonthCalendar({ mm, monthWorkouts }: { mm: string; monthWorkouts: Workout[] }) {
  const S = useGym().S;
  const [y, m] = mm.split("-").map(Number);
  const firstDow = new Date(y, m - 1, 1).getDay();
  const lastD = new Date(y, m, 0).getDate();
  const today = todayISO();
  const byDay = useMemo(() => {
    const map: Record<string, { id: string }[]> = {};
    monthWorkouts.forEach((w) => {
      (map[w.d] = map[w.d] || []).push(w);
    });
    return map;
  }, [monthWorkouts]);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: lastD }, (_, i) => i + 1),
  ];
  return (
    <div className="mb-3 rounded-2xl border bg-card p-3 shadow-sm">
      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-semibold uppercase text-muted-foreground">
        {DAYS.map((d, i) => (
          <div key={i} className="py-0.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={i} />;
          const iso = `${mm}-${String(day).padStart(2, "0")}`;
          const ws = byDay[iso];
          const done = !!ws && ws.length > 0;
          const isToday = iso === today;
          return (
            <button
              key={i}
              type="button"
              disabled={!done}
              onClick={() => {
                const w = S.workouts.find((x) => x.id === (ws && ws[0]?.id));
                if (w) workoutDetailSheet(w);
              }}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg py-1.5 text-sm font-medium transition-colors",
                done
                  ? "bg-primary/15 text-primary hover:bg-primary/25"
                  : "text-muted-foreground hover:bg-accent",
                isToday && "ring-1 ring-primary"
              )}
            >
              <span>{day}</span>
              {done && <span className="h-1 w-1 rounded-full bg-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function History() {
  const S = useGym().S;
  const today = new Date();
  const [o, setO] = useState(0);
  const m = (today.getMonth() + o) % 12;
  const y = today.getFullYear() + Math.floor((today.getMonth() + o) / 12);
  const mm = "YYYY-MM"
    .replace("YYYY", String(y))
    .replace("MM", String(m + 1).padStart(2, "0"));
  const monthWorkouts = useMemo(
    () =>
      S.workouts
        .filter((w) => w.d.startsWith(mm))
        .sort((a, b) => (a.d < b.d ? 1 : -1)),
    [S.workouts, mm]
  );

  return (
    <div className="mx-auto w-full max-w-lg px-4 pb-32 lg:max-w-4xl lg:px-6">
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Historial</h1>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mes anterior"
            onClick={() => setO(o - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-24 text-center text-sm font-bold capitalize">
            {MONTHS[m]} {y}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Mes siguiente"
            disabled={o >= 0}
            onClick={() => setO(o + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <MonthCalendar mm={mm} monthWorkouts={monthWorkouts} />

      {monthWorkouts.length ? (
        <div className="divide-y divide-border rounded-2xl border bg-card">
          {monthWorkouts.map((w) => (
            <WorkoutRow
              key={w.id}
              w={w}
              onClick={() => workoutDetailSheet(w)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border py-10 text-center">
          <CalendarX2 className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            No hay entrenamientos este mes. ¡Es hora de cambiar eso!
          </p>
        </div>
      )}
    </div>
  );
}