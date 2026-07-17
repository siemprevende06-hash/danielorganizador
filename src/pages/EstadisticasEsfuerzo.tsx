import { useState, useEffect, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, BarChart3, Shield, TrendingUp, Focus, Clock, CheckCircle2, Dumbbell, BookOpen, Music, Gamepad2, Globe, Brain, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOSTEN_HABIT_IDS = new Set([
  'rutina-activacion', 'alistamiento-desayuno', 'horario-regular', 'rutina-desactivacion',
  'skincare-manana', 'skincare-noche', 'banarme-vestirme',
  'pre-entreno', 'desayuno', 'merienda-1', 'almuerzo', 'merienda-2', 'comida', 'antes-dormir', 'suplementos',
]);

const MEJORA_HABIT_IDS = new Set([
  'lectura', 'musica', 'ajedrez', 'idiomas', 'entrenamiento-fisico',
]);

const HABIT_LABELS: Record<string, string> = {
  lectura: 'Lectura', musica: 'Música', ajedrez: 'Ajedrez', idiomas: 'Idiomas',
  'entrenamiento-fisico': 'Entrenamiento', 'rutina-activacion': 'Rutina Activación',
  'alistamiento-desayuno': 'Alistamiento', 'horario-regular': 'Horario',
  'rutina-desactivacion': 'Rutina Desactivación', 'skincare-manana': 'Skincare AM',
  'skincare-noche': 'Skincare PM', 'banarme-vestirme': 'Bañarse',
  'pre-entreno': 'Pre-entreno', desayuno: 'Desayuno', 'merienda-1': 'Merienda 1',
  almuerzo: 'Almuerzo', 'merienda-2': 'Merienda 2', comida: 'Comida',
  'antes-dormir': 'Antes de dormir', suplementos: 'Suplementos',
};

interface DayRecord {
  date: string;
  sostenCompleted: number;
  sostenTotal: number;
  mejoraCompleted: number;
  mejoraTotal: number;
  timeData: Record<string, number>;
  workoutDuration: number;
  focusBlocks: number;
  focusBlocksDone: number;
  wakeTime: string | null;
  sleepTime: string | null;
}

interface MonthGroup {
  month: string;
  days: DayRecord[];
  totalMinutes: number;
  sostenMinutes: number;
  mejoraMinutes: number;
  sostenPct: number;
  mejoraPct: number;
}

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EstadisticasEsfuerzo() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [records, setRecords] = useState<DayRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      const { data } = await supabase
        .from('daily_systems_tracking')
        .select('*')
        .gte('tracking_date', startDate)
        .lte('tracking_date', endDate)
        .order('tracking_date', { ascending: false });
      if (data) {
        const mapped: DayRecord[] = data.map((row: any) => {
          const completions = row.completions || {};
          const timeData = row.time_data || {};
          const workAssignments = row.work_assignments || {};
          const blockCompletions = row.block_completions || {};
          const sostenHabits = [...SOSTEN_HABIT_IDS].filter(id => completions[id]);
          const mejoraHabits = [...MEJORA_HABIT_IDS].filter(id => completions[id]);
          const blocks = Object.keys(workAssignments).filter(id => !id.startsWith('__'));
          const blocksDone = blocks.filter(id => blockCompletions[id]);
          return {
            date: row.tracking_date,
            sostenCompleted: sostenHabits.length,
            sostenTotal: SOSTEN_HABIT_IDS.size,
            mejoraCompleted: mejoraHabits.length,
            mejoraTotal: MEJORA_HABIT_IDS.size,
            timeData,
            workoutDuration: row.workout_duration || 0,
            focusBlocks: blocks.length,
            focusBlocksDone: blocksDone.length,
            wakeTime: row.wake_time,
            sleepTime: row.sleep_time,
          };
        });
        setRecords(mapped);
      }
      setLoading(false);
    };
    load();
  }, [year]);

  const months = useMemo(() => {
    const groups: Record<string, DayRecord[]> = {};
    records.forEach(r => {
      const m = r.date.slice(0, 7);
      if (!groups[m]) groups[m] = [];
      groups[m].push(r);
    });
    return Object.entries(groups).map(([monthKey, days]) => {
      let totalMinutes = 0;
      let sostenMinutes = 0;
      let mejoraMinutes = 0;
      days.forEach(d => {
        Object.entries(d.timeData).forEach(([k, v]) => {
          const mins = v as number;
          if (SOSTEN_HABIT_IDS.has(k)) sostenMinutes += mins;
          else if (MEJORA_HABIT_IDS.has(k)) mejoraMinutes += mins;
          totalMinutes += mins;
        });
        mejoraMinutes += d.workoutDuration;
        totalMinutes += d.workoutDuration;
      });
      const sostenPct = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.sostenCompleted, 0) / (days.length * SOSTEN_HABIT_IDS.size) * 100) : 0;
      const mejoraPct = days.length > 0 ? Math.round(days.reduce((s, d) => s + d.mejoraCompleted, 0) / (days.length * MEJORA_HABIT_IDS.size) * 100) : 0;
      return { month: monthKey, days, totalMinutes, sostenMinutes, mejoraMinutes, sostenPct, mejoraPct };
    }).sort((a, b) => b.month.localeCompare(a.month));
  }, [records]);

  const totalSostenMin = months.reduce((s, m) => s + m.sostenMinutes, 0);
  const totalMejoraMin = months.reduce((s, m) => s + m.mejoraMinutes, 0);
  const totalMin = months.reduce((s, m) => s + m.totalMinutes, 0);
  const totalDays = records.length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-5xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Estadísticas de Esfuerzo</h1>
              <p className="text-sm text-muted-foreground">Sostén · Mejora · Enfoque</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
            <button onClick={() => setYear(y => y - 1)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold min-w-[60px] text-center">{year}</span>
            <button onClick={() => setYear(y => Math.min(y + 1, new Date().getFullYear()))} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted/50 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <>
            {/* Annual summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
              {[
                { icon: <CalendarDays className="h-4 w-4 text-blue-500" />, label: "Días registrados", value: totalDays, gradient: "from-blue-500 to-cyan-400" },
                { icon: <Clock className="h-4 w-4 text-purple-500" />, label: "Total minutos", value: totalMin, gradient: "from-purple-500 to-pink-400" },
                { icon: <Shield className="h-4 w-4 text-emerald-500" />, label: "Min Sostén", value: totalSostenMin, gradient: "from-emerald-500 to-teal-400" },
                { icon: <TrendingUp className="h-4 w-4 text-rose-500" />, label: "Min Mejora", value: totalMejoraMin, gradient: "from-rose-500 to-pink-400" },
              ].map((s, i) => (
                <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                  <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
                  <CardContent className="p-3.5 text-center space-y-1">
                    <div className="flex justify-center">{s.icon}</div>
                    <div className="text-lg font-bold tabular-nums">{s.value}</div>
                    <div className="text-[10px] text-muted-foreground">{s.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Months */}
            {months.length === 0 ? (
              <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">Sin datos en {year}</p>
                  <p className="text-xs text-muted-foreground">Registra actividad desde la página Hoy para ver estadísticas</p>
                </CardContent>
              </Card>
            ) : (
              months.map(month => {
                const [, m] = month.month.split('-');
                const monthName = MONTHS[parseInt(m) - 1] || month.month;
                const avgSosten = month.days.length > 0 ? Math.round(month.days.reduce((s, d) => s + d.sostenCompleted, 0) / month.days.length) : 0;
                const avgMejora = month.days.length > 0 ? Math.round(month.days.reduce((s, d) => s + d.mejoraCompleted, 0) / month.days.length) : 0;
                const avgFocus = month.days.length > 0 ? Math.round(month.days.reduce((s, d) => s + d.focusBlocksDone, 0) / month.days.length) : 0;

                return (
                  <Card key={month.month} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-400" />
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold">{monthName}</h2>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                          <span>{month.days.length} días</span>
                          <span>{Math.round(month.totalMinutes)} min</span>
                        </div>
                      </div>

                      {/* Monthly averages */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-emerald-50/40 dark:bg-emerald-950/20 text-center">
                          <p className="text-[9px] text-muted-foreground">Sostén</p>
                          <p className="text-sm font-bold text-emerald-600">{avgSosten}/{SOSTEN_HABIT_IDS.size}</p>
                          <p className="text-[9px] text-muted-foreground">promedio/día</p>
                        </div>
                        <div className="p-2 rounded-lg bg-purple-50/40 dark:bg-purple-950/20 text-center">
                          <p className="text-[9px] text-muted-foreground">Mejora</p>
                          <p className="text-sm font-bold text-purple-600">{avgMejora}/{MEJORA_HABIT_IDS.size}</p>
                          <p className="text-[9px] text-muted-foreground">promedio/día</p>
                        </div>
                        <div className="p-2 rounded-lg bg-amber-50/40 dark:bg-amber-950/20 text-center">
                          <p className="text-[9px] text-muted-foreground">Enfoque</p>
                          <p className="text-sm font-bold text-amber-600">{avgFocus} bloques</p>
                          <p className="text-[9px] text-muted-foreground">promedio/día</p>
                        </div>
                      </div>

                      {/* Days list */}
                      <div className="space-y-1 max-h-96 overflow-y-auto">
                        {month.days.map(day => {
                          const dateObj = parseISO(day.date);
                          const dayLabel = format(dateObj, 'EEE d', { locale: es });
                          const dayTimeTotal = Object.values(day.timeData).reduce((s, v) => s + (v as number), 0) + day.workoutDuration;
                          return (
                            <div key={day.date} className="flex items-center gap-2 p-2 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                              <div className="w-14 shrink-0">
                                <p className="text-[10px] font-medium">{dayLabel}</p>
                                <p className="text-[8px] text-muted-foreground">{format(dateObj, 'MMM', { locale: es })}</p>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge variant="outline" className={cn("text-[8px] px-1 h-4", day.sostenCompleted === day.sostenTotal ? "bg-emerald-500/10 text-emerald-600 border-emerald-200" : "")}>
                                  <Shield className="h-2 w-2 mr-0.5" />{day.sostenCompleted}
                                </Badge>
                                <Badge variant="outline" className={cn("text-[8px] px-1 h-4", day.mejoraCompleted === day.mejoraTotal ? "bg-purple-500/10 text-purple-600 border-purple-200" : "")}>
                                  <TrendingUp className="h-2 w-2 mr-0.5" />{day.mejoraCompleted}
                                </Badge>
                                <Badge variant="outline" className="text-[8px] px-1 h-4">
                                  <Focus className="h-2 w-2 mr-0.5" />{day.focusBlocksDone}/{day.focusBlocks}
                                </Badge>
                              </div>
                              <div className="flex-1" />
                              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                                {day.workoutDuration > 0 && <span className="flex items-center gap-0.5"><Dumbbell className="h-2.5 w-2.5" />{day.workoutDuration}</span>}
                                {day.timeData?.lectura > 0 && <span className="flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" />{day.timeData.lectura}</span>}
                                {day.timeData?.musica > 0 && <span className="flex items-center gap-0.5"><Music className="h-2.5 w-2.5" />{day.timeData.musica}</span>}
                                {day.timeData?.ajedrez > 0 && <span className="flex items-center gap-0.5"><Gamepad2 className="h-2.5 w-2.5" />{day.timeData.ajedrez}</span>}
                                {day.timeData?.idiomas > 0 && <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{day.timeData.idiomas}</span>}
                              </div>
                              <div className="text-[10px] font-medium tabular-nums w-12 text-right">
                                {dayTimeTotal > 0 ? `${dayTimeTotal}min` : '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Monthly progress */}
                      <div className="space-y-1.5 pt-2 border-t border-border/30">
                        <div className="flex items-center gap-2 text-[10px]">
                          <Shield className="h-3 w-3 text-emerald-500" />
                          <span className="text-muted-foreground">Sostén</span>
                          <Progress value={month.sostenPct} className="h-1 flex-1" />
                          <span className="font-medium text-emerald-600">{month.sostenPct}%</span>
                          <span className="text-muted-foreground">{month.sostenMinutes}min</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          <TrendingUp className="h-3 w-3 text-purple-500" />
                          <span className="text-muted-foreground">Mejora</span>
                          <Progress value={month.mejoraPct} className="h-1 flex-1" />
                          <span className="font-medium text-purple-600">{month.mejoraPct}%</span>
                          <span className="text-muted-foreground">{month.mejoraMinutes}min</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </>
        )}
      </div>
    </div>
  );
}