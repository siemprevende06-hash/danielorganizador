import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarX2, ChevronLeft, ChevronRight } from "lucide-react";
import { useGym } from "../store";
import { MONTHS } from "../lib/format";
import { workoutDetailSheet, WorkoutRow } from "../components/sheets";

const weeksOfMonth = (y: number, m: number) => {
  const weeks: { ws: number; we: number }[] = [];
  const month = new Date(y, m, 1);
  const lastD = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= lastD; d += 7) {
    const ws = d;
    let we = d + 6;
    if (we > lastD) we = lastD;
    weeks.push({ ws, we });
  }
  return weeks;
};

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

  const weeks = weeksOfMonth(y, m);
  const fill = (d: number) => String(d).padStart(2, "0");

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

      <div className="mb-3 flex flex-wrap gap-1.5">
        {weeks.map((wk, i) => {
          const count = monthWorkouts.filter(
            (w) =>
              w.d >= `${mm}-${fill(wk.ws)}` &&
              w.d <= `${mm}-${fill(wk.we)}`
          ).length;
          return (
            <span
              key={i}
              className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
            >
              Semana {i + 1}: {count}
            </span>
          );
        })}
      </div>

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