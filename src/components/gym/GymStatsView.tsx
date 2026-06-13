import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, TrendingUp, Dumbbell } from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ExerciseProgress {
  name: string;
  points: { date: string; weight: number; reps: number }[];
}

export function GymStatsView() {
  const [month, setMonth] = useState(new Date());
  const [workoutDates, setWorkoutDates] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState<ExerciseProgress[]>([]);
  const [totalSessions, setTotalSessions] = useState(0);

  useEffect(() => {
    (async () => {
      const start = format(startOfMonth(month), "yyyy-MM-dd");
      const end = format(endOfMonth(month), "yyyy-MM-dd");

      const { data: logs } = await supabase
        .from("exercise_logs")
        .select("log_date, weight_kg, reps_per_set, exercise:workout_exercises(name)")
        .gte("log_date", start).lte("log_date", end)
        .order("log_date");

      const dates = new Set<string>();
      const byEx: Record<string, ExerciseProgress> = {};
      (logs || []).forEach((l: any) => {
        dates.add(l.log_date);
        const name = l.exercise?.name || "Ejercicio";
        if (!byEx[name]) byEx[name] = { name, points: [] };
        const reps = Array.isArray(l.reps_per_set) ? l.reps_per_set.reduce((a: number, b: number) => a + b, 0) : 0;
        byEx[name].points.push({ date: l.log_date, weight: Number(l.weight_kg) || 0, reps });
      });
      setWorkoutDates(dates);
      setProgress(Object.values(byEx).slice(0, 6));
      setTotalSessions(dates.size);
    })();
  }, [month]);

  const days = eachDayOfInterval({ start: startOfMonth(month), end: endOfMonth(month) });

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="text-sm font-semibold capitalize flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />{format(month, "MMMM yyyy", { locale: es })}
            </h3>
            <Button size="icon" variant="ghost" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <span className="text-xs text-muted-foreground">{totalSessions} sesiones</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {["L", "M", "X", "J", "V", "S", "D"].map(d => <div key={d} className="text-center text-[10px] text-muted-foreground">{d}</div>)}
          {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => <div key={"e" + i} />)}
          {days.map(d => {
            const ds = format(d, "yyyy-MM-dd");
            const hit = workoutDates.has(ds);
            const today = isSameDay(d, new Date());
            return (
              <div key={ds} className={`aspect-square rounded text-[10px] flex items-center justify-center
                ${hit ? "bg-primary text-primary-foreground font-bold" : "bg-muted/40"}
                ${today ? "ring-2 ring-primary" : ""}`}>
                {d.getDate()}
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" />Progresión de ejercicios</h3>
        {progress.length === 0 ? (
          <p className="text-xs text-muted-foreground">Aún sin logs este mes.</p>
        ) : (
          <div className="space-y-3">
            {progress.map(p => {
              const max = Math.max(1, ...p.points.map(pt => pt.weight));
              return (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium flex items-center gap-1"><Dumbbell className="h-3 w-3" />{p.name}</span>
                    <span className="text-muted-foreground">{p.points.length} sesiones · máx {max}kg</span>
                  </div>
                  <div className="flex items-end gap-0.5 h-8">
                    {p.points.map((pt, i) => (
                      <div key={i} className="flex-1 bg-primary rounded-sm" title={`${pt.date}: ${pt.weight}kg`}
                        style={{ height: `${Math.max(10, (pt.weight / max) * 100)}%` }} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
