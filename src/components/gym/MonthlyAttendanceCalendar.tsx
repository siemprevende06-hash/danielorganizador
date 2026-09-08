import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronLeft, ChevronRight, Dumbbell, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DayDetails {
  date: string;
  exercises: { name: string; sets: number; reps: number[]; weightKg: number }[];
  sessions: { id: string; duration_minutes: number | null; tipo: string }[];
  hasWorkout: boolean;
}

export function MonthlyAttendanceCalendar() {
  const [month, setMonth] = useState(new Date());
  const [dayMap, setDayMap] = useState<Map<string, DayDetails>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const start = format(startOfMonth(month), "yyyy-MM-dd");
      const end = format(endOfMonth(month), "yyyy-MM-dd");

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("log_date, weight_kg, reps_per_set, weights_per_set, sets_completed, exercise:workout_exercises(name)")
        .gte("log_date", start)
        .lte("log_date", end)
        .order("log_date");

      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("id, started_at, duration_minutes, tipo")
        .gte("started_at", start + "T00:00:00")
        .lte("started_at", end + "T23:59:59")
        .order("started_at");

      const map = new Map<string, DayDetails>();

      (logs || []).forEach((l: any) => {
        const date = l.log_date;
        if (!map.has(date)) map.set(date, { date, exercises: [], sessions: [], hasWorkout: true });
        const reps = Array.isArray(l.reps_per_set) ? l.reps_per_set.filter((r: number) => typeof r === "number" && !isNaN(r)) : [];
        const weights = Array.isArray(l.weights_per_set) && l.weights_per_set.length === reps.length
          ? l.weights_per_set
          : reps.map(() => Number(l.weight_kg) || 0);
        const sets = reps.length || Number(l.sets_completed) || (reps.length ? reps.length : 0);
        const entry = map.get(date)!;
        entry.exercises.push({
          name: l.exercise?.name || "Ejercicio",
          sets,
          reps,
          weightKg: reps.reduce((acc: number, r: number, i: number) => acc + r * (weights[i] || 0), 0)
        });
      });

      (sessions || []).forEach((s: any) => {
        const date = format(parseISO(s.started_at), "yyyy-MM-dd");
        if (!map.has(date)) map.set(date, { date, exercises: [], sessions: [], hasWorkout: false });
        map.get(date)!.sessions.push({ id: s.id, duration_minutes: s.duration_minutes, tipo: s.tipo });
        map.get(date)!.hasWorkout = true;
      });

      // Sum volume into a display-friendly format
      map.forEach(d => {
        d.exercises.forEach(e => {});
      });

      setDayMap(map);
      setSelected(prev => (prev && map.has(prev) ? prev : null));
      setLoading(false);
    })();
  }, [month]);

  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const attendanceCount = Array.from(dayMap.values()).filter(d => d.hasWorkout).length;
  const weekdayCount = useMemo(() => {
    let count = 0;
    dayMap.forEach(d => {
      if (d.hasWorkout && d.sessions.length > 0) count++;
      else if (d.hasWorkout && d.exercises.length > 0) count++;
    });
    return count;
  }, [dayMap]);

  const selectedDetail = selected ? dayMap.get(selected) : null;

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              {format(month, "MMMM yyyy", { locale: es })}
            </h3>
            <Button size="icon" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          {loading ? (
            <span className="text-xs text-muted-foreground">Cargando...</span>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              {attendanceCount} días asistidos
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["L", "M", "X", "J", "V", "S", "D"].map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>
          ))}
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
            <div key={"empty" + i} />
          ))}
          {days.map(d => {
            const ds = format(d, "yyyy-MM-dd");
            const detail = dayMap.get(ds);
            const hit = !!detail?.hasWorkout;
            const today = isSameDay(d, new Date());
            const sel = selected === ds;
            return (
              <button
                key={ds}
                onClick={() => setSelected(sel ? null : ds)}
                title={hit ? detail!.exercises.length > 0 ? `${detail!.exercises.length} ejercicios` : "Asistencia registrada" : "No asistió"}
                className={cn(
                  "aspect-square rounded text-[10px] flex items-center justify-center transition-all",
                  hit ? "bg-primary text-primary-foreground font-bold hover:opacity-90" : "bg-muted/40 hover:bg-muted",
                  today && "ring-2 ring-primary ring-offset-1",
                  sel && "ring-2 ring-amber-400 ring-offset-1"
                )}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-primary" /> Asistí</span>
          <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-sm bg-muted" /> No asistí</span>
        </div>
      </Card>

      {selectedDetail && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              {format(parseISO(selected!), "EEEE d 'de' MMMM yyyy", { locale: es })}
            </h4>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setSelected(null)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {selectedDetail.sessions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {selectedDetail.sessions.map(s => (
                <Badge key={s.id} variant="outline" className="text-[10px] gap-1">
                  <Timer className="h-3 w-3" />
                  {s.duration_minutes ? `${s.duration_minutes} min` : "Sesión"}
                  <span className="capitalize">{s.tipo}</span>
                </Badge>
              ))}
            </div>
          )}

          {selectedDetail.exercises.length === 0 ? (
            selectedDetail.sessions.length > 0 ? (
              <p className="text-xs text-muted-foreground">Registraste asistencia este día pero aún no hay ejercicios detallados.</p>
            ) : (
              <p className="text-xs text-muted-foreground">No hay registro de entrenamiento este día.</p>
            )
          ) : (
            <div className="space-y-1.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Rutina realizada ({selectedDetail.exercises.length} ejercicios)</p>
              {selectedDetail.exercises.map((ex, i) => (
                <div key={i} className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-muted/50">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                    {ex.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {ex.sets} series · {ex.reps.join(", ")} reps{ex.weightKg > 0 ? ` · ${Math.round(ex.weightKg)} kg` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
