import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, BarChart3, Shield, TrendingUp, Dumbbell, BookOpen, Music, Gamepad2, Globe, Clock, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const SOSTEN_GROUPS = [
  {
    label: 'Estructural',
    habits: [
      { id: 'rutina-activacion', label: 'Activación' },
      { id: 'alistamiento-desayuno', label: 'Alistamiento' },
      { id: 'horario-regular', label: 'Horario' },
      { id: 'rutina-desactivacion', label: 'Desactivación' },
    ],
  },
  {
    label: 'Apariencia',
    habits: [
      { id: 'skincare-manana', label: 'Skincare AM' },
      { id: 'skincare-noche', label: 'Skincare PM' },
      { id: 'banarme-vestirme', label: 'Bañarse' },
    ],
  },
  {
    label: 'Alimentación',
    habits: [
      { id: 'pre-entreno', label: 'Pre-entreno' },
      { id: 'desayuno', label: 'Desayuno' },
      { id: 'merienda-1', label: 'Merienda 1' },
      { id: 'almuerzo', label: 'Almuerzo' },
      { id: 'merienda-2', label: 'Merienda 2' },
      { id: 'comida', label: 'Comida' },
      { id: 'antes-dormir', label: 'Antes dormir' },
      { id: 'suplementos', label: 'Suplem.' },
    ],
  },
];

const MEJORA_HABITS = [
  { id: 'lectura', label: 'Lectura', icon: BookOpen, hasTime: true },
  { id: 'musica', label: 'Música', icon: Music, hasTime: true },
  { id: 'ajedrez', label: 'Ajedrez', icon: Gamepad2, hasTime: true, hasCount: true, countLabel: 'part.' },
  { id: 'idiomas', label: 'Idiomas', icon: Globe, hasTime: true },
  { id: 'entrenamiento-fisico', label: 'Entreno', icon: Dumbbell, hasTime: true },
];

const ALL_SOSTEN_IDS = SOSTEN_GROUPS.flatMap(g => g.habits.map(h => h.id));
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export default function EstadisticasEsfuerzo() {
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthIdx, setMonthIdx] = useState(new Date().getMonth());
  const [records, setRecords] = useState<any[]>([]);

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
        .order('tracking_date', { ascending: true });
      setRecords(data || []);
      setLoading(false);
    };
    load();
  }, [year]);

  const monthKey = `${year}-${String(monthIdx + 1).padStart(2, '0')}`;
  const monthDays = useMemo(() => {
    return records
      .filter(r => r.tracking_date.startsWith(monthKey))
      .map(row => {
        const completions = row.completions || {};
        const timeData = row.time_data || {};
        const countData = row.count_data || {};
        return {
          date: row.tracking_date,
          completions,
          timeData,
          countData,
          workoutDuration: row.workout_duration || 0,
        };
      });
  }, [records, monthKey]);

  const dayLabels = useMemo(() => {
    return monthDays.map(d => {
      const dateObj = parseISO(d.date);
      return { label: format(dateObj, 'EEE d', { locale: es }), short: format(dateObj, 'd') };
    });
  }, [monthDays]);

  const getSostenValue = (day: any, habitId: string) => {
    return day.completions[habitId] === true ? '✅' : '❌';
  };

  const getMejoraTime = (day: any, habitId: string) => {
    return (day.timeData[habitId] as number) || 0;
  };

  const getMejoraCount = (day: any, habitId: string) => {
    return (day.countData[habitId] as number) || 0;
  };

  const monthMin = monthDays.reduce((s, d) => {
    let total = (d.timeData.lectura || 0) + (d.timeData.musica || 0) + (d.timeData.ajedrez || 0) + (d.timeData.idiomas || 0) + d.workoutDuration;
    return s + total;
  }, 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-7xl mx-auto space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Estadísticas de Esfuerzo</h1>
              <p className="text-sm text-muted-foreground">Sostén · Mejora</p>
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

        {/* Month tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {MONTHS.map((name, i) => (
            <button
              key={i}
              onClick={() => setMonthIdx(i)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0",
                i === monthIdx
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {name}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Cargando...</div>
        ) : monthDays.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin datos en {MONTHS[monthIdx]} {year}</p>
              <p className="text-xs text-muted-foreground">Registra actividad desde la página Hoy</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Mini summary */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm text-center">
                <p className="text-lg font-bold">{monthDays.length}</p>
                <p className="text-[9px] text-muted-foreground">días</p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm text-center">
                <p className="text-lg font-bold text-emerald-600">{monthMin}</p>
                <p className="text-[9px] text-muted-foreground">min mejora</p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm text-center">
                <p className="text-lg font-bold text-blue-600">
                  {monthDays.filter(d => ALL_SOSTEN_IDS.every(h => d.completions[h])).length}
                </p>
                <p className="text-[9px] text-muted-foreground">días completos</p>
              </div>
              <div className="p-2 rounded-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm text-center">
                <p className="text-lg font-bold text-purple-600">
                  {Math.round(monthDays.reduce((s, d) => s + ALL_SOSTEN_IDS.filter(h => d.completions[h]).length, 0) / Math.max(monthDays.length, 1))}/{ALL_SOSTEN_IDS.length}
                </p>
                <p className="text-[9px] text-muted-foreground">promedio/día</p>
              </div>
            </div>

            {/* Sostén table */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-3 border-b border-border/30">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <h2 className="text-sm font-bold">Sostén</h2>
                  <span className="text-[10px] text-muted-foreground">✅ completado · ❌ pendiente</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="sticky left-0 bg-white/80 dark:bg-zinc-900/80 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[60px] z-10">Día</th>
                        {SOSTEN_GROUPS.map(g => (
                          <th key={g.label} colSpan={g.habits.length} className="text-center px-1 py-1.5 font-medium text-muted-foreground/60 text-[9px] uppercase tracking-wider">
                            {g.label}
                          </th>
                        ))}
                      </tr>
                      <tr className="border-b border-border/20">
                        <th className="sticky left-0 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 z-10" />
                        {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => (
                          <th key={h.id} className="text-center px-1 py-1 font-medium text-muted-foreground/80 min-w-[44px]">{h.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {monthDays.map(day => (
                        <tr key={day.date} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                          <td className="sticky left-0 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 font-medium whitespace-nowrap z-10">
                            {format(parseISO(day.date), 'EEE d', { locale: es })}
                          </td>
                          {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                            const done = day.completions[h.id] === true;
                            return (
                              <td key={h.id} className={cn("text-center px-1 py-1", done ? "text-emerald-500" : "text-red-400/60")}>
                                {done ? '✅' : '❌'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      {/* Summary row */}
                      <tr className="border-t-2 border-border/30 bg-muted/10">
                        <td className="sticky left-0 bg-muted/10 px-2 py-1.5 font-bold text-[9px] z-10">Completados</td>
                        {SOSTEN_GROUPS.flatMap(g => g.habits).map(h => {
                          const count = monthDays.filter(d => d.completions[h.id] === true).length;
                          const pct = Math.round((count / Math.max(monthDays.length, 1)) * 100);
                          return (
                            <td key={h.id} className="text-center px-1 py-1.5">
                              <span className={cn("font-bold", pct >= 80 ? "text-emerald-500" : pct >= 50 ? "text-amber-500" : "text-red-400")}>
                                {count}
                              </span>
                              <span className="text-muted-foreground">/{monthDays.length}</span>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Mejora table */}
            <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
              <CardContent className="p-0">
                <div className="flex items-center gap-2 p-3 border-b border-border/30">
                  <TrendingUp className="h-4 w-4 text-purple-500" />
                  <h2 className="text-sm font-bold">Mejora</h2>
                  <span className="text-[10px] text-muted-foreground">minutos dedicados por día</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="border-b border-border/20">
                        <th className="sticky left-0 bg-white/80 dark:bg-zinc-900/80 text-left px-2 py-1.5 font-medium text-muted-foreground min-w-[60px] z-10">Día</th>
                        {MEJORA_HABITS.map(h => (
                          <th key={h.id} className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[52px]">
                            <div className="flex items-center justify-center gap-1">
                              <h.icon className="h-3 w-3" />
                              <span>{h.label}</span>
                            </div>
                          </th>
                        ))}
                        <th className="text-center px-2 py-1.5 font-medium text-muted-foreground min-w-[44px]">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthDays.map(day => {
                        const vals = MEJORA_HABITS.map(h => getMejoraTime(day, h.id));
                        const total = vals.reduce((s, v) => s + v, 0) + day.workoutDuration;
                        return (
                          <tr key={day.date} className="border-b border-border/10 hover:bg-muted/20 transition-colors">
                            <td className="sticky left-0 bg-white/80 dark:bg-zinc-900/80 px-2 py-1 font-medium whitespace-nowrap z-10">
                              {format(parseISO(day.date), 'EEE d', { locale: es })}
                            </td>
                            {MEJORA_HABITS.map((h, i) => {
                              const v = vals[i];
                              return (
                                <td key={h.id} className="text-center px-2 py-1">
                                  <span className={cn(
                                    "tabular-nums",
                                    h.hasTime && v >= 30 && "text-emerald-500 font-medium",
                                    h.hasTime && v > 0 && v < 30 && "text-amber-500",
                                    v === 0 && "text-muted-foreground/30"
                                  )}>
                                    {v > 0 ? `${v}'` : '—'}
                                  </span>
                                  {h.hasCount && getMejoraCount(day, h.id) > 0 && (
                                    <span className="text-[8px] text-muted-foreground ml-0.5">
                                      ({getMejoraCount(day, h.id)})
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td className="text-center px-2 py-1 tabular-nums font-medium">
                              {total > 0 ? `${total}'` : '—'}
                            </td>
                          </tr>
                        );
                      })}
                      {/* Summary row */}
                      <tr className="border-t-2 border-border/30 bg-muted/10">
                        <td className="sticky left-0 bg-muted/10 px-2 py-1.5 font-bold text-[9px] z-10">Total mes</td>
                        {MEJORA_HABITS.map(h => {
                          const total = monthDays.reduce((s, d) => s + getMejoraTime(d, h.id), 0);
                          return (
                            <td key={h.id} className="text-center px-2 py-1.5 font-bold">
                              {total > 0 ? `${total}'` : '—'}
                            </td>
                          );
                        })}
                        <td className="text-center px-2 py-1.5 font-bold text-purple-600">{monthMin}'</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}