import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Activity, Dumbbell, Brain, Languages, Music, Gamepad2, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemCard {
  id: string;
  label: string;
  icon: any;
  route?: string;
  schedule: string;
  todayValue: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  weekTotal: number;
  streak: number;
  spark: number[];
}

const todayKey = () => new Date().toISOString().split("T")[0];

const semaphore = (value: number, min: number, max: number) => {
  if (value >= max) return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓" };
  if (value >= min) return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓" };
  if (value > 0) return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Incompleto" };
  return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
};

export function MySystemsSection() {
  const [cards, setCards] = useState<SystemCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = todayKey();
      const start = format(subDays(new Date(), 6), "yyyy-MM-dd");

      const [trackingR, langR, streaksR] = await Promise.all([
        supabase.from("daily_systems_tracking").select("*").gte("tracking_date", start).lte("tracking_date", today),
        supabase.from("language_sessions").select("session_date, duration_minutes").gte("session_date", start),
        supabase.from("system_habit_streaks").select("*"),
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

      const gymSpark: number[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        const row = rows.find((r: any) => r.tracking_date === d);
        gymSpark.push(row?.workout_duration || 0);
      }
      const ajedrezSpark = minutesByDay("ajedrez");
      const gamingSpark = minutesByDay("gaming");
      const musicaSpark = minutesByDay("musica");

      const gymToday = rows.find((r: any) => r.tracking_date === today);
      const gymValue = gymToday?.workout_duration || 0;

      setCards([
        {
          id: "gym", label: "Gym", icon: Dumbbell, route: "/systems",
          schedule: "7:00 - 8:00 AM",
          todayValue: gymValue, unit: "min",
          minThreshold: 30, maxThreshold: 60,
          weekTotal: sum(gymSpark), streak: streaks.gym || 0, spark: gymSpark,
        },
        {
          id: "ajedrez", label: "Ajedrez", icon: Brain, route: "/chess",
          schedule: "1:20 - 2:00 PM",
          todayValue: last(ajedrezSpark), unit: "min",
          minThreshold: 10, maxThreshold: 20,
          weekTotal: sum(ajedrezSpark), streak: streaks.ajedrez || 0, spark: ajedrezSpark,
        },
        {
          id: "gaming", label: "Gaming", icon: Gamepad2, route: "/systems",
          schedule: "1:20 - 2:00 PM",
          todayValue: last(gamingSpark), unit: "min",
          minThreshold: 10, maxThreshold: 20,
          weekTotal: sum(gamingSpark), streak: streaks.gaming || 0, spark: gamingSpark,
        },
        {
          id: "idiomas", label: "Idiomas", icon: Languages, route: "/languages-dashboard",
          schedule: "5:00 - 6:30 PM",
          todayValue: last(langSpark), unit: "min",
          minThreshold: 30, maxThreshold: 90,
          weekTotal: sum(langSpark), streak: streaks.idiomas || 0, spark: langSpark,
        },
        {
          id: "musica", label: "Música", icon: Music, route: "/music-dashboard",
          schedule: "8:00 - 8:30 PM",
          todayValue: last(musicaSpark), unit: "min",
          minThreshold: 15, maxThreshold: 30,
          weekTotal: sum(musicaSpark), streak: Math.max(streaks.piano || 0, streaks.guitarra || 0), spark: musicaSpark,
        },
        {
          id: "lectura", label: "Lectura", icon: BookOpen, route: "/reading-library",
          schedule: "8:30 - 9:00 AM",
          todayValue: last(minutesByDay("lectura")), unit: "min",
          minThreshold: 15, maxThreshold: 30,
          weekTotal: sum(minutesByDay("lectura")), streak: streaks.lectura || 0, spark: minutesByDay("lectura"),
        },
      ]);
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold uppercase tracking-wide flex items-center gap-2">
          <Activity className="h-4 w-4" />Mis Sistemas
        </h2>
        <Link to="/systems" className="text-xs text-muted-foreground hover:text-foreground">Ver todo →</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          const sem = semaphore(c.todayValue, c.minThreshold, c.maxThreshold);
          const goalPct = c.maxThreshold > 0 ? Math.min(100, Math.round((c.todayValue / c.maxThreshold) * 100)) : 0;
          const max = Math.max(1, ...c.spark);

          return (
            <Link key={c.id} to={c.route || "/systems"} className="block">
              <Card className={cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg)}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold">{c.label}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {c.streak > 0 && <span className="text-[10px] text-orange-500">🔥{c.streak}</span>}
                    <span className={cn("text-[10px] font-semibold", sem.text)}>{sem.label}</span>
                  </div>
                </div>

                {c.schedule && (
                  <p className="text-[10px] text-muted-foreground mb-1.5 font-mono">{c.schedule}</p>
                )}

                <div className="flex items-baseline gap-1 mb-1.5">
                  <span className="text-2xl font-bold">{c.todayValue}</span>
                  <span className="text-[10px] text-muted-foreground">{c.unit}</span>
                  {c.maxThreshold > 0 && (
                    <span className="text-[10px] text-muted-foreground ml-auto">/{c.maxThreshold}</span>
                  )}
                </div>

                {c.maxThreshold > 0 && (
                  <Progress value={goalPct} className="h-1.5 mb-1.5" />
                )}

                {c.spark.length > 0 && (
                  <div className="flex items-end gap-0.5 h-5 mb-1">
                    {c.spark.map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-sm"
                        style={{
                          height: `${Math.max(6, (v / max) * 100)}%`,
                          backgroundColor: i === 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                        }}
                      />
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-muted-foreground">
                  Semana: {c.weekTotal}{c.unit && ` ${c.unit}`}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
