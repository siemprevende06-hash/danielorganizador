import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Flame, Trophy } from "lucide-react";

const SYSTEM_NAMES: Record<string, string> = {
  "rutina-activacion": "Activación",
  "alistamiento-desayuno": "Alistamiento",
  "rutina-desactivacion": "Desactivación",
  "entrenamiento-fisico": "Gym",
  "lectura": "Lectura",
  "musica": "Música",
  "ajedrez": "Ajedrez",
  "skincare-manana": "Skincare AM",
  "skincare-noche": "Skincare PM",
  "banarme-vestirme": "Baño/Vestirme",
};

interface Props {
  monthDate: Date;
}

export function MonthlySystemsStats({ monthDate }: Props) {
  const [data, setData] = useState<any[]>([]);
  const [streaks, setStreaks] = useState<Record<string, { current: number; best: number }>>({});

  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const today = new Date();
  const effectiveEnd = isBefore(monthEnd, today) ? monthEnd : today;
  const totalDays = eachDayOfInterval({ start: monthStart, end: effectiveEnd }).length;

  useEffect(() => {
    const load = async () => {
      const [trackingRes, streaksRes] = await Promise.all([
        supabase
          .from("daily_systems_tracking")
          .select("tracking_date, completions")
          .gte("tracking_date", format(monthStart, "yyyy-MM-dd"))
          .lte("tracking_date", format(monthEnd, "yyyy-MM-dd")),
        supabase
          .from("system_habit_streaks")
          .select("habit_id, current_streak, longest_streak"),
      ]);
      setData(trackingRes.data || []);
      const map: Record<string, { current: number; best: number }> = {};
      (streaksRes.data || []).forEach((s: any) => {
        map[s.habit_id] = { current: s.current_streak || 0, best: s.longest_streak || 0 };
      });
      setStreaks(map);
    };
    load();
  }, [monthDate.toISOString()]);

  const habitIds = Object.keys(SYSTEM_NAMES);

  const stats = habitIds.map(hid => {
    const completedDays = data.filter(r => {
      const c = (r.completions || {}) as Record<string, boolean>;
      return !!c[hid];
    }).length;
    const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const s = streaks[hid];
    return { id: hid, name: SYSTEM_NAMES[hid], completedDays, pct, currentStreak: s?.current || 0, bestStreak: s?.best || 0 };
  });

  return (
    <Card className="p-4">
      <h3 className="font-bold text-sm mb-3">📊 Sistemas de Vida — Mes</h3>
      <div className="space-y-2">
        {stats.map(s => (
          <div key={s.id} className="space-y-1">
            <div className="flex justify-between text-xs items-center">
              <span className="text-muted-foreground">{s.name}</span>
              <div className="flex items-center gap-2">
                {s.currentStreak > 0 && (
                  <span className="flex items-center gap-0.5 text-orange-500 text-[10px] font-medium">
                    <Flame className="h-3 w-3" />{s.currentStreak}
                  </span>
                )}
                {s.bestStreak > 0 && (
                  <span className="flex items-center gap-0.5 text-yellow-600 text-[10px] font-medium">
                    <Trophy className="h-3 w-3" />{s.bestStreak}
                  </span>
                )}
                <span className="font-medium">{s.completedDays}/{totalDays} ({s.pct}%)</span>
              </div>
            </div>
            <Progress value={s.pct} className="h-1.5" />
          </div>
        ))}
      </div>
    </Card>
  );
}
