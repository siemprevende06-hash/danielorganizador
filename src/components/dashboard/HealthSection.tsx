import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Activity, Dumbbell, Moon, Utensils, Droplets, Pill, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecompensas } from "@/hooks/useRecompensas";

interface HealthCard {
  id: string;
  label: string;
  icon: any;
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

const MEAL_IDS = ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"];

function calcSleepHours(wakeTime: string, sleepTime: string): number {
  if (!wakeTime || !sleepTime) return 0;
  const [wh, wm] = wakeTime.split(":").map(Number);
  const [sh, sm] = sleepTime.split(":").map(Number);
  if (isNaN(wh) || isNaN(wm) || isNaN(sh) || isNaN(sm)) return 0;
  const wakeMins = wh * 60 + wm;
  const sleepMins = sh * 60 + sm;
  const diff = sleepMins > wakeMins
    ? (24 * 60 - sleepMins + wakeMins)
    : (wakeMins - sleepMins);
  return Math.round((diff / 60) * 10) / 10;
}

function HealthCardView({ c }: { c: HealthCard }) {
  const Icon = c.icon;
  const sem = semaphore(c.todayValue, c.minThreshold, c.maxThreshold);
  const goalPct = c.maxThreshold > 0 ? Math.min(100, Math.round((c.todayValue / c.maxThreshold) * 100)) : 0;
  const max = Math.max(1, ...c.spark);

  return (
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
  );
}

export function HealthSection() {
  const [cards, setCards] = useState<HealthCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { canjes } = useRecompensas();

  const canjesEstaSemana = canjes.filter(c => new Date(c.fecha) >= subDays(new Date(), 7)).length;

  useEffect(() => {
    (async () => {
      try {
        const today = todayKey();
        const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
        const [trackingR, streaksR] = await Promise.all([
          supabase.from("daily_systems_tracking").select("*").gte("tracking_date", start).lte("tracking_date", today),
          supabase.from("system_habit_streaks").select("*"),
        ]);
        const rows = trackingR.data || [];
        const streaks: Record<string, number> = {};
        (streaksR.data || []).forEach((s: any) => streaks[s.habit_id] = s.current_streak || 0);

        const result = buildCards(rows, streaks);
        setCards(result);
      } catch {
        setCards([]);
      }
      setLoading(false);
    })();
  }, []);

  function buildCards(rows: any[], streaks: Record<string, number>): HealthCard[] {
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    const last = (a: number[]) => a[a.length - 1] || 0;

    const gymSpark: number[] = [];
    const sleepSpark: number[] = [];
    const mealSpark: number[] = [];
    const waterSpark: number[] = [];
    const suppSpark: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = format(subDays(new Date(), i), "yyyy-MM-dd");
      const row = rows.find((r: any) => r.tracking_date === d);

      gymSpark.push(row?.workout_duration || 0);

      const hours = calcSleepHours(row?.wake_time, row?.sleep_time);
      sleepSpark.push(hours);

      const comps = (row?.completions as any) || {};
      const mealsDone = MEAL_IDS.filter(id => comps[id]).length;
      mealSpark.push(mealsDone);

      const wData = (row?.water_data as any) || {};
      const waterDone = MEAL_IDS.filter(id => wData[id]).length;
      waterSpark.push(waterDone);

      suppSpark.push(comps["suplementos"] ? 1 : 0);
    }

    const todayRow = rows.find((r: any) => r.tracking_date === todayKey());

    return [
      {
        id: "gym", label: "Gym", icon: Dumbbell,
        todayValue: todayRow?.workout_duration || 0, unit: "min",
        minThreshold: 30, maxThreshold: 60,
        weekTotal: sum(gymSpark), streak: streaks["gym"] || 0, spark: gymSpark,
      },
      {
        id: "sueno", label: "Sueño", icon: Moon,
        todayValue: calcSleepHours(todayRow?.wake_time, todayRow?.sleep_time), unit: "hrs",
        minThreshold: 7, maxThreshold: 8,
        weekTotal: Math.round(sum(sleepSpark) * 10) / 10, streak: streaks["horario-regular"] || 0, spark: sleepSpark,
      },
      {
        id: "alimentacion", label: "Alimentación", icon: Utensils,
        todayValue: last(mealSpark), unit: "",
        minThreshold: 5, maxThreshold: 7,
        weekTotal: sum(mealSpark), streak: 0, spark: mealSpark,
      },
      {
        id: "agua", label: "Agua", icon: Droplets,
        todayValue: last(waterSpark), unit: "",
        minThreshold: 5, maxThreshold: 7,
        weekTotal: sum(waterSpark), streak: 0, spark: waterSpark,
      },
      {
        id: "suplementos", label: "Suplementos", icon: Pill,
        todayValue: last(suppSpark), unit: "",
        minThreshold: 1, maxThreshold: 1,
        weekTotal: sum(suppSpark), streak: streaks["suplementos"] || 0, spark: suppSpark,
      },
      {
        id: "estres", label: "Control Estrés", icon: Heart,
        todayValue: canjesEstaSemana, unit: "canj.",
        minThreshold: 1, maxThreshold: 3,
        weekTotal: canjesEstaSemana, streak: 0, spark: [],
      },
    ];
  }

  if (loading) return null;

  return (
    <Card className="p-4 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4 text-green-500" />
        <h2 className="text-sm font-bold uppercase tracking-wide">Salud</h2>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map(c => <HealthCardView key={c.id} c={c} />)}
      </div>
    </Card>
  );
}
