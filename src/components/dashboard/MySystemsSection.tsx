import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Activity, BookOpen, Dumbbell, Languages, Music, Brain, Heart, Gamepad2 } from "lucide-react";

interface SystemSummary {
  id: string;
  label: string;
  icon: any;
  route?: string;
  todayValue: number;
  unit: string;
  weekTotal: number;
  streak: number;
  goal?: number;
  spark: number[];
}

const todayKey = () => new Date().toISOString().split("T")[0];

export function MySystemsSection() {
  const [systems, setSystems] = useState<SystemSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayKey();
      const start = format(subDays(new Date(), 6), "yyyy-MM-dd");

      const [trackingR, langR, examsR, streaksR, exerciseR] = await Promise.all([
        supabase.from("daily_systems_tracking").select("*").gte("tracking_date", start).lte("tracking_date", today),
        supabase.from("language_sessions").select("session_date, duration_minutes, reading_duration").gte("session_date", start),
        supabase.from("exercise_logs").select("log_date").gte("log_date", start),
        supabase.from("system_habit_streaks").select("*"),
        supabase.from("exercise_logs").select("log_date").eq("log_date", today),
      ]);

      const rows = trackingR.data || [];
      const streaks: Record<string, number> = {};
      (streaksR.data || []).forEach((s: any) => streaks[s.habit_id] = s.current_streak || 0);

      const minutesByDay = (key: string) => {
        const arr: number[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = format(subDays(new Date(), i), "yyyy-MM-dd");
          const row = rows.find((r: any) => r.tracking_date === d);
          const t = (row?.time_data as any) || {};
          arr.push(Number(t[key]) || 0);
        }
        return arr;
      };

      const langDaily: Record<string, number> = {};
      (langR.data || []).forEach((s: any) => {
        langDaily[s.session_date] = (langDaily[s.session_date] || 0) + (s.duration_minutes || 0);
      });
      const langSpark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        langSpark.push(langDaily[d] || 0);
      }

      const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
      const last = (a: number[]) => a[a.length - 1] || 0;

      const lecturaSpark = minutesByDay("lectura");
      const ajedrezSpark = minutesByDay("ajedrez");
      const musicaSpark = minutesByDay("piano").map((v, i) => v + (minutesByDay("guitarra")[i] || 0));
      const gymDays = new Set((exerciseR.data || []).map((e: any) => e.log_date));
      const gymSpark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        gymSpark.push(gymDays.has(d) ? 1 : 0);
      }

      setSystems([
        { id: "idiomas", label: "Idiomas", icon: Languages, route: "/languages-dashboard", todayValue: last(langSpark), unit: "min", weekTotal: sum(langSpark), streak: streaks.idiomas || 0, goal: 120, spark: langSpark },
        { id: "lectura", label: "Lectura", icon: BookOpen, route: "/reading-library", todayValue: last(lecturaSpark), unit: "min", weekTotal: sum(lecturaSpark), streak: streaks.lectura || 0, goal: 30, spark: lecturaSpark },
        { id: "musica", label: "Música", icon: Music, route: "/music-dashboard", todayValue: last(musicaSpark), unit: "min", weekTotal: sum(musicaSpark), streak: Math.max(streaks.piano || 0, streaks.guitarra || 0), goal: 30, spark: musicaSpark },
        { id: "ajedrez", label: "Ajedrez", icon: Brain, route: "/chess", todayValue: last(ajedrezSpark), unit: "min", weekTotal: sum(ajedrezSpark), streak: streaks.ajedrez || 0, goal: 30, spark: ajedrezSpark },
        { id: "gym", label: "Gym", icon: Dumbbell, route: "/gym", todayValue: last(gymSpark), unit: "sesión", weekTotal: sum(gymSpark), streak: streaks.gym || 0, goal: 1, spark: gymSpark },
        { id: "gaming", label: "Gaming", icon: Heart, todayValue: 0, unit: "", weekTotal: 0, streak: streaks.gaming || 0, spark: [] },
      ]);
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2"><Activity className="h-4 w-4" />Mis Sistemas</h2>
        <Link to="/systems" className="text-xs text-muted-foreground hover:text-foreground">Ver todo →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {systems.map(s => {
          const Icon = s.icon;
          const goalPct = s.goal ? Math.min(100, Math.round((s.todayValue / s.goal) * 100)) : 0;
          const max = Math.max(1, ...s.spark);
          return (
            <Link key={s.id} to={s.route || "/systems"} className="block">
              <Card className="p-3 hover:bg-muted/30 transition-colors h-full">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold">{s.label}</span>
                  </div>
                  {s.streak > 0 && <span className="text-[10px] text-orange-500">🔥{s.streak}</span>}
                </div>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-lg font-bold">{s.todayValue}</span>
                  <span className="text-[10px] text-muted-foreground">{s.unit}</span>
                  {s.goal && <span className="text-[10px] text-muted-foreground ml-auto">/{s.goal}</span>}
                </div>
                {s.spark.length > 0 && (
                  <div className="flex items-end gap-0.5 h-6">
                    {s.spark.map((v, i) => (
                      <div key={i} className="flex-1 bg-primary/60 rounded-sm" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />
                    ))}
                  </div>
                )}
                {s.goal && (
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${goalPct}%` }} />
                  </div>
                )}
                <p className="text-[10px] text-muted-foreground mt-1">Semana: {s.weekTotal}{s.unit && ` ${s.unit}`}</p>
              </Card>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
