import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { cn } from "@/lib/utils";

interface Props {
  /** Páginas/día sugeridas */
  dailyPagesGoal?: number;
  /** Minutos/día objetivo (default 30) */
  dailyMinutesGoal?: number;
}

const todayKey = () => new Date().toISOString().split("T")[0];

export function DailyReadingIndicator({ dailyPagesGoal = 0, dailyMinutesGoal = 30 }: Props) {
  const [minutesToday, setMinutesToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const today = todayKey();
    const [langR, systemsR, focusR] = await Promise.all([
      supabase.from("language_sessions").select("reading_duration").eq("session_date", today),
      supabase.from("daily_systems_tracking").select("time_data,completions").eq("tracking_date", today).maybeSingle(),
      supabase.from("focus_sessions").select("duration_seconds,activity_type").gte("started_at", `${today}T00:00:00`),
    ]);
    const fromLang = (langR.data || []).reduce((a, s) => a + (s.reading_duration || 0), 0);
    const td: any = (systemsR.data?.time_data as any) || {};
    const fromSystems = td.lectura || td.reading || 0;
    const fromFocus = (focusR.data || [])
      .filter((s: any) => (s.activity_type || "").toLowerCase().includes("lectura") || (s.activity_type || "").toLowerCase().includes("reading"))
      .reduce((a, s: any) => a + Math.round((s.duration_seconds || 0) / 60), 0);
    setMinutesToday(fromLang + fromSystems + fromFocus);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("reading_today")
      .on("postgres_changes", { event: "*", schema: "public", table: "daily_systems_tracking" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "language_sessions" }, load)
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
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold uppercase tracking-wide">Lectura de hoy</span>
          </div>
          <Badge variant={onTrack ? "default" : "secondary"} className="text-xs">
            <Flame className="w-3 h-3 mr-1" />
            {minutesToday} / {dailyMinutesGoal} min
          </Badge>
        </div>

        <Progress value={pct} className="h-2" />

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {dailyPagesGoal > 0 ? (
            <span className="flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Meta sugerida: {dailyPagesGoal} pág/día
            </span>
          ) : <span />}
          <span>{onTrack ? "Meta cumplida ✓" : `${dailyMinutesGoal - minutesToday} min restantes`}</span>
        </div>

        <div className="pt-1">
          <WeekStreakBar habitId="lectura" todayValue={minutesToday} maxThreshold={dailyMinutesGoal} compact />
        </div>
      </CardContent>
    </Card>
  );
}
