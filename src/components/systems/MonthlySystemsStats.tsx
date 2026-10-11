import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from "date-fns";
import { cn } from "@/lib/utils";
import { getMonthGoalsSummary } from "@/lib/hierarchy";
import { useSystemCardCovers } from "@/hooks/useSystemCardCovers";
import { useImageUpload } from "@/hooks/useImageUpload";
import {
  Camera, CheckCircle2, Clock, Flame, ImagePlus, Loader2, Target, Trophy, X,
} from "lucide-react";

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

const SYSTEM_AREA: Record<string, string> = {
  "entrenamiento-fisico": "gym",
  "lectura": "lectura",
  "musica": "musica",
  "ajedrez": "ajedrez",
};

interface MonthlyGoal {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  completed: boolean | null;
  unit: string | null;
  priority: string;
}

interface Props {
  monthDate: Date;
}

interface CardProps {
  id: string;
  name: string;
  cover: string;
  completedDays: number;
  totalDays: number;
  pct: number;
  currentStreak: number;
  bestStreak: number;
  monthMinutes: number;
  monthGoal: number;
  objectives: MonthlyGoal[];
  uploading: boolean;
  onUpload: (id: string, file: File) => void;
  onRemove: (id: string) => void;
}

function SystemMonthCard({
  id, name, cover, completedDays, totalDays, pct, currentStreak, bestStreak,
  monthMinutes, monthGoal, objectives, uploading, onUpload, onRemove,
}: CardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const minutesPct = monthGoal > 0 ? Math.min(100, Math.round((monthMinutes / monthGoal) * 100)) : 0;

  return (
    <Card className="relative overflow-hidden border-l-[3px] border-l-indigo-400/60">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onUpload(id, f);
          e.target.value = '';
        }}
      />

      {cover ? (
        <div className="relative w-full h-28 overflow-hidden group">
          <img src={cover} alt={`${name} portada`} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="icon"
              className="h-6 w-6"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
            </Button>
            <Button
              variant="destructive"
              size="icon"
              className="h-6 w-6"
              onClick={() => onRemove(id)}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="absolute bottom-2 left-3 right-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-white/90" />
            <span className="text-sm font-bold text-white drop-shadow truncate">{name}</span>
          </div>
        </div>
      ) : (
        <div className="px-3 pt-3 pb-2 flex items-start justify-between gap-2 bg-indigo-500/10">
          <div className="flex items-center gap-2 flex-1 min-w-0 pt-0.5">
            <Clock className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="text-sm font-bold truncate">{name}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[10px] gap-1 shrink-0"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
            Foto
          </Button>
        </div>
      )}

      <div className="p-3 space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground">Días completados</span>
            <span className="font-medium">{completedDays}/{totalDays} ({pct}%)</span>
          </div>
          <Progress value={pct} className="h-1.5" />
        </div>

        <div className="flex items-center gap-3 text-[10px]">
          {currentStreak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-500 font-medium">
              <Flame className="h-3 w-3" />{currentStreak} días
            </span>
          )}
          {bestStreak > 0 && (
            <span className="flex items-center gap-0.5 text-yellow-600 font-medium">
              <Trophy className="h-3 w-3" />{bestStreak} mejor
            </span>
          )}
        </div>

        {(monthGoal > 0 || monthMinutes > 0) && (
          <div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Minutos / meta mes</span>
              <span className={cn("font-medium", monthGoal > 0 && monthMinutes >= monthGoal && "text-emerald-500")}>
                {Math.round(monthMinutes)}min / {monthGoal}min
              </span>
            </div>
            {monthGoal > 0 && <Progress value={minutesPct} className="h-1.5" />}
          </div>
        )}

        {objectives.length > 0 && (
          <div className="space-y-1.5 pt-1.5 border-t border-border/40">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Target className="h-3 w-3" /> Objetivos del mes
            </p>
            {objectives.map(obj => {
              const done = !!obj.completed;
              const objPct = obj.target_value > 0 ? Math.min(100, Math.round((obj.current_value / obj.target_value) * 100)) : 0;
              return (
                <div key={obj.id} className="py-0.5 px-1.5 rounded bg-background/60">
                  <div className="flex items-center gap-1.5">
                    {done && <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />}
                    <span className={cn("text-[11px] flex-1 truncate", done && "line-through text-muted-foreground")}>
                      {obj.title}
                    </span>
                    <Badge variant="secondary" className="text-[8px] px-1.5 h-4">{obj.priority}</Badge>
                    <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                      {obj.current_value}/{obj.target_value}{obj.unit ? ` ${obj.unit}` : ''}
                    </span>
                  </div>
                  <Progress value={objPct} className="h-1 mt-1" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

export function MonthlySystemsStats({ monthDate }: Props) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const today = new Date();
  const effectiveEnd = isBefore(monthEnd, today) ? monthEnd : today;
  const totalDays = eachDayOfInterval({ start: monthStart, end: effectiveEnd }).length;

  const [data, setData] = useState<{ tracking_date: string; completions: Record<string, boolean> | null; time_data: Record<string, number> | null }[]>([]);
  const [streaks, setStreaks] = useState<Record<string, { current: number; best: number }>>({});
  const [goalsByArea, setGoalsByArea] = useState<Record<string, MonthlyGoal[]>>({});
  const { covers, saveCover, removeCover } = useSystemCardCovers();
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    const load = async () => {
      const startStr = format(monthStart, "yyyy-MM-dd");
      const endStr = format(monthEnd, "yyyy-MM-dd");
      const [trackingRes, streaksRes, goalsRes] = await Promise.all([
        supabase
          .from("daily_systems_tracking")
          .select("tracking_date, completions, time_data")
          .gte("tracking_date", startStr)
          .lte("tracking_date", endStr),
        supabase
          .from("system_habit_streaks")
          .select("habit_id, current_streak, longest_streak"),
        supabase
          .from("monthly_area_goals")
          .select("id, area_id, title, target_value, current_value, completed, unit, priority, month_start, month_end")
          .lte("month_start", endStr)
          .gte("month_end", startStr),
      ]);
      setData(trackingRes.data || []);
      const map: Record<string, { current: number; best: number }> = {};
      (streaksRes.data || []).forEach((s: { habit_id: string; current_streak: number | null; longest_streak: number | null }) => {
        map[s.habit_id] = { current: s.current_streak || 0, best: s.longest_streak || 0 };
      });
      setStreaks(map);
      const goals: Record<string, MonthlyGoal[]> = {};
      (goalsRes.data || []).forEach((g: { id: string; area_id: string; title: string; target_value: number | null; current_value: number | null; completed: boolean | null; unit: string | null; priority: string | null }) => {
        if (!g.area_id) return;
        (goals[g.area_id] = goals[g.area_id] || []).push({
          id: g.id,
          title: g.title,
          target_value: g.target_value || 0,
          current_value: g.current_value || 0,
          completed: g.completed,
          unit: g.unit,
          priority: g.priority,
        });
      });
      setGoalsByArea(goals);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthDate.toISOString()]);

  const monthGoals = getMonthGoalsSummary(monthDate);

  const handleUpload = async (id: string, file: File) => {
    const url = await uploadImage(file, "system-cards");
    if (url) saveCover(id, url);
  };

  const stats = Object.keys(SYSTEM_NAMES).map(hid => {
    const minutesKeys = hid === "entrenamiento-fisico" ? ["entrenamiento-fisico", "gym"] : [hid];
    let monthMinutes = 0;
    let completedDays = 0;
    data.forEach(r => {
      const c = (r.completions || {}) as Record<string, boolean>;
      if (c[hid]) completedDays++;
      const td = (r.time_data || {}) as Record<string, number>;
      minutesKeys.forEach(k => {
        monthMinutes += Number(td[k]) || 0;
      });
    });
    const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
    const s = streaks[hid];
    const area = SYSTEM_AREA[hid];
    const monthGoal = area ? monthGoals[area] || 0 : 0;
    const objectives = area ? goalsByArea[area] || [] : [];
    return {
      id: hid,
      name: SYSTEM_NAMES[hid],
      completedDays,
      pct,
      currentStreak: s?.current || 0,
      bestStreak: s?.best || 0,
      monthMinutes,
      monthGoal,
      objectives,
    };
  });

  return (
    <div className="space-y-3">
      <h3 className="font-bold text-sm">Sistemas de Vida — Mes</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {stats.map(s => (
          <SystemMonthCard
            key={s.id}
            id={s.id}
            name={s.name}
            cover={covers[s.id] || ""}
            completedDays={s.completedDays}
            totalDays={totalDays}
            pct={s.pct}
            currentStreak={s.currentStreak}
            bestStreak={s.bestStreak}
            monthMinutes={s.monthMinutes}
            monthGoal={s.monthGoal}
            objectives={s.objectives}
            uploading={uploading}
            onUpload={handleUpload}
            onRemove={(id) => removeCover(id)}
          />
        ))}
      </div>
    </div>
  );
}