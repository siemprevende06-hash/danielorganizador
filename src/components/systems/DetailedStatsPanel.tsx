import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";
import { TrendingUp, TrendingDown, Minus, BarChart3, Calendar, Target, Flame } from "lucide-react";

interface DayRow {
  tracking_date: string;
  completions: Record<string, boolean>;
  time_data: Record<string, number>;
  count_data: Record<string, number>;
  water_data: Record<string, boolean>;
  block_completions: Record<string, boolean>;
  workout_duration: number;
}

const startOfQuarter = (d: Date) => {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3, 1);
};
const endOfQuarter = (d: Date) => {
  const q = Math.floor(d.getMonth() / 3);
  return new Date(d.getFullYear(), q * 3 + 3, 0);
};

export function DetailedStatsPanel({ totalHabits }: { totalHabits: number }) {
  const [rows, setRows] = useState<DayRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const start = format(startOfQuarter(new Date()), "yyyy-MM-dd");
      const end = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase
        .from("daily_systems_tracking")
        .select("tracking_date, completions, time_data, count_data, water_data, block_completions, workout_duration")
        .gte("tracking_date", start)
        .lte("tracking_date", end)
        .order("tracking_date");
      setRows((data as any[])?.map(r => ({
        tracking_date: r.tracking_date,
        completions: r.completions || {},
        time_data: r.time_data || {},
        count_data: r.count_data || {},
        water_data: r.water_data || {},
        block_completions: r.block_completions || {},
        workout_duration: r.workout_duration || 0,
      })) || []);
      setLoading(false);
    };
    load();
  }, []);

  const summarize = (subset: DayRow[]) => {
    if (subset.length === 0) return { avg: 0, totalMin: 0, water: 0, workout: 0, best: 0, worst: 0, days: 0 };
    const dayPercents = subset.map(r => {
      const done = Object.values(r.completions).filter(Boolean).length;
      return totalHabits > 0 ? Math.round((done / totalHabits) * 100) : 0;
    });
    const totalMin = subset.reduce((s, r) => s + Object.values(r.time_data).reduce((a, b) => a + b, 0), 0);
    const water = subset.reduce((s, r) => s + Object.values(r.water_data).filter(Boolean).length, 0);
    const workout = subset.reduce((s, r) => s + r.workout_duration, 0);
    return {
      avg: Math.round(dayPercents.reduce((a, b) => a + b, 0) / dayPercents.length),
      totalMin,
      water,
      workout,
      best: Math.max(...dayPercents),
      worst: Math.min(...dayPercents),
      days: subset.length,
    };
  };

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const wkStart = startOfWeek(today, { weekStartsOn: 1 });
  const wkEnd = endOfWeek(today, { weekStartsOn: 1 });
  const moStart = startOfMonth(today);
  const moEnd = endOfMonth(today);
  const qtStart = startOfQuarter(today);
  const qtEnd = endOfQuarter(today);

  const inRange = (s: string, a: Date, b: Date) => s >= format(a, "yyyy-MM-dd") && s <= format(b, "yyyy-MM-dd");

  const todayRow = rows.find(r => r.tracking_date === todayStr);
  const week = rows.filter(r => inRange(r.tracking_date, wkStart, wkEnd));
  const month = rows.filter(r => inRange(r.tracking_date, moStart, moEnd));
  const quarter = rows;

  const todayStats = todayRow ? summarize([todayRow]) : { avg: 0, totalMin: 0, water: 0, workout: 0, best: 0, worst: 0, days: 0 };
  const wkStats = summarize(week);
  const moStats = summarize(month);
  const qtStats = summarize(quarter);

  // Trend: compare second half vs first half of current period
  const trend = (subset: DayRow[]) => {
    if (subset.length < 4) return "stable" as const;
    const mid = Math.floor(subset.length / 2);
    const a = summarize(subset.slice(0, mid)).avg;
    const b = summarize(subset.slice(mid)).avg;
    if (b > a + 5) return "up" as const;
    if (b < a - 5) return "down" as const;
    return "stable" as const;
  };

  const TrendIcon = ({ t }: { t: "up" | "down" | "stable" }) =>
    t === "up" ? <TrendingUp className="h-4 w-4 text-success" /> :
    t === "down" ? <TrendingDown className="h-4 w-4 text-destructive" /> :
    <Minus className="h-4 w-4 text-muted-foreground" />;

  const renderPeriod = (label: string, s: ReturnType<typeof summarize>, t: "up" | "down" | "stable", periodLen: number) => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{s.avg}%</span>
            <TrendIcon t={t} />
          </div>
        </div>
        <Badge variant="outline" className="font-mono">
          {s.days}/{periodLen} días
        </Badge>
      </div>
      <Progress value={s.avg} className="h-2" />
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-muted/40">
          <p className="text-muted-foreground">⏱ Tiempo total</p>
          <p className="font-bold">{Math.round(s.totalMin / 60)}h {s.totalMin % 60}m</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/40">
          <p className="text-muted-foreground">💧 Vasos agua</p>
          <p className="font-bold">{s.water}</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/40">
          <p className="text-muted-foreground">💪 Min entreno</p>
          <p className="font-bold">{s.workout} min</p>
        </div>
        <div className="p-2 rounded-lg bg-muted/40">
          <p className="text-muted-foreground">🔥 Mejor día</p>
          <p className="font-bold">{s.best}%</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <Card className="p-4 animate-pulse h-48 bg-muted/20" />;
  }

  return (
    <Card className="p-4 border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-bold">Estadísticas Detalladas</h3>
      </div>
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="flex w-full overflow-x-auto justify-start">
          <TabsTrigger value="today" className="flex-1 min-w-fit whitespace-nowrap text-xs">Hoy</TabsTrigger>
          <TabsTrigger value="week" className="flex-1 min-w-fit whitespace-nowrap text-xs">Semana</TabsTrigger>
          <TabsTrigger value="month" className="flex-1 min-w-fit whitespace-nowrap text-xs">Mes</TabsTrigger>
          <TabsTrigger value="quarter" className="flex-1 min-w-fit whitespace-nowrap text-xs">Trimestre</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4">
          {renderPeriod("Promedio de hoy", todayStats, "stable", 1)}
        </TabsContent>
        <TabsContent value="week" className="mt-4">
          {renderPeriod("Promedio semanal", wkStats, trend(week), 7)}
        </TabsContent>
        <TabsContent value="month" className="mt-4">
          {renderPeriod("Promedio mensual", moStats, trend(month), differenceInDays(moEnd, moStart) + 1)}
        </TabsContent>
        <TabsContent value="quarter" className="mt-4">
          {renderPeriod("Promedio trimestral", qtStats, trend(quarter), differenceInDays(qtEnd, qtStart) + 1)}
        </TabsContent>
      </Tabs>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Análisis basado en tus marcaciones diarias guardadas automáticamente
      </p>
    </Card>
  );
}
