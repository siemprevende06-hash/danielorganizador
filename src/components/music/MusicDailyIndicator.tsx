import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { MusicTrendChart } from "@/components/music/MusicTrendChart";
import { cn } from "@/lib/utils";

interface Props {
  /** Minutos/día objetivo (default 30) */
  dailyMinutesGoal?: number;
}

const todayKey = () => new Date().toISOString().split("T")[0];

function minutesStats(rows: any[]): { today: number; week: number; month: number } {
  const today = new Date();
  const iso = (d: Date) => d.toISOString().split("T")[0];
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const wk = iso(weekStart), ms = iso(monthStart), td = iso(today);
  const totals = { today: 0, week: 0, month: 0 };
  (rows || []).forEach((r: any) => {
    const min = r.duration_minutes || 0;
    if (r.practice_date === td) totals.today += min;
    if (r.practice_date >= wk && r.practice_date <= td) totals.week += min;
    if (r.practice_date >= ms && r.practice_date <= td) totals.month += min;
  });
  return totals;
}

export function MusicDailyIndicator({ dailyMinutesGoal = 30 }: Props) {
  const [minutesToday, setMinutesToday] = useState(0);
  const [minutes, setMinutes] = useState({ today: 0, week: 0, month: 0 });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const today = todayKey();
    const [practiceR, systemsR] = await Promise.all([
      supabase.from("music_practice_sessions").select("practice_date, duration_minutes").gte("practice_date", today.slice(0, 7) + "-01"),
      supabase.from("daily_systems_tracking").select("time_data,completions").eq("tracking_date", today).maybeSingle(),
    ]);
    const fromPractice = (practiceR.data || []).reduce((a, s: any) => a + (s.duration_minutes || 0), 0);
    const td: any = (systemsR.data?.time_data as any) || {};
    const fromSystems = td.musica || 0;
    setMinutesToday(fromPractice + fromSystems);
    setMinutes(minutesStats(practiceR.data as any[]));
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("music_today")
      .on("postgres_changes", { event: "*", schema: "public", table: "music_practice_sessions" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_systems_tracking" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const pct = Math.min(100, Math.round((minutesToday / dailyMinutesGoal) * 100));
  const onTrack = minutesToday >= dailyMinutesGoal;

  return (
    <Card className={cn("border-l-4", onTrack ? "border-l-green-500" : "border-l-amber-500")}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Music className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide">Práctica de hoy</span>
          </div>
          <Badge variant={onTrack ? "default" : "secondary"} className="text-xs">
            <Flame className="w-3 h-3 mr-1" />
            {minutesToday} / {dailyMinutesGoal} min
          </Badge>
        </div>

        <Progress value={pct} className="h-2" />

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold leading-none">{minutes.today}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">min hoy</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold leading-none">{minutes.week}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">min semana</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-2 text-center">
            <p className="text-lg font-bold leading-none">{minutes.month}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">min mes</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> Meta diaria: {dailyMinutesGoal} min
          </span>
          <span>{onTrack ? "Meta cumplida ✓" : `${dailyMinutesGoal - minutesToday} min restantes`}</span>
        </div>

        <div className="pt-1">
          <WeekStreakBar habitId="musica" todayValue={minutesToday} maxThreshold={dailyMinutesGoal} compact />
        </div>

        <div className="pt-1 border-t border-border/40">
          <MusicTrendChart />
        </div>
      </CardContent>
    </Card>
  );
}