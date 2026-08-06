import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Brain, Target, Dumbbell, BookOpen, Music, TrendingUp, BarChart3, Zap, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Mismas áreas que agrega la página Estadísticas de Esfuerzo
const AREA_ICONS: Record<string, React.ReactNode> = {
  universidad: <Brain className="w-3.5 h-3.5" />,
  emprendimiento: <TrendingUp className="w-3.5 h-3.5" />,
  proyectos: <Target className="w-3.5 h-3.5" />,
  gym: <Dumbbell className="w-3.5 h-3.5" />,
  idiomas: <BookOpen className="w-3.5 h-3.5" />,
  lectura: <BookOpen className="w-3.5 h-3.5" />,
  musica: <Music className="w-3.5 h-3.5" />,
  ajedrez: <Gamepad2 className="w-3.5 h-3.5" />,
  game: <Gamepad2 className="w-3.5 h-3.5" />,
};

const AREA_COLORS: Record<string, string> = {
  universidad: 'bg-blue-500',
  emprendimiento: 'bg-purple-500',
  proyectos: 'bg-amber-500',
  gym: 'bg-red-500',
  idiomas: 'bg-emerald-500',
  lectura: 'bg-cyan-500',
  musica: 'bg-pink-500',
  ajedrez: 'bg-teal-500',
  game: 'bg-rose-500',
};

const AREA_LABELS: Record<string, string> = {
  universidad: 'Universidad',
  emprendimiento: 'Emprendimiento',
  proyectos: 'Proyectos',
  gym: 'Gym',
  idiomas: 'Idiomas',
  lectura: 'Lectura',
  musica: 'Música',
  ajedrez: 'Ajedrez',
  game: 'Game',
};

const MEJORA_KEYS = ['lectura', 'musica', 'ajedrez', 'italiano', 'ingles', 'game'];
const FOCUS_AREA_IDS = ['universidad', 'emprendimiento', 'proyectos'];

interface MonthlyTimeBreakdownProps {
  currentMonth: Date;
}

export function MonthlyTimeBreakdown({ currentMonth }: MonthlyTimeBreakdownProps) {
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  const daysInMonth = monthDays.length;
  const TOTAL_MONTH_HOURS = daysInMonth * 24;

  const startStr = format(monthStart, 'yyyy-MM-dd');
  const endStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: focusData } = useQuery({
    queryKey: ['monthlyFocusBreakdown', startStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('start_time', `${startStr}T00:00:00`)
        .lte('start_time', `${endStr}T23:59:59`);
      return data || [];
    },
  });

  const { data: systemsData } = useQuery({
    queryKey: ['monthlySystemsTime', startStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_systems_tracking')
        .select('tracking_date, time_data, workout_duration')
        .gte('tracking_date', startStr)
        .lte('tracking_date', endStr);
      return data || [];
    },
  });

  const { data: areaStatsData } = useQuery({
    queryKey: ['monthlyAreaStatsTime', startStr],
    queryFn: async () => {
      const { data } = await supabase
        .from('daily_area_stats')
        .select('area_id, stat_date, time_spent_minutes')
        .gte('stat_date', startStr)
        .lte('stat_date', endStr);
      return data || [];
    },
  });

  // Distribución de minutos por día y por área — mismas fuentes que la página Esfuerzo
  const dayBreakdown = useMemo(() => {
    const areaByDay: Record<string, Record<string, number>> = {};
    const add = (date: string, area: string, min: number) => {
      if (!areaByDay[date]) areaByDay[date] = {};
      areaByDay[date][area] = (areaByDay[date][area] || 0) + min;
    };

    (systemsData || []).forEach((row: any) => {
      const td = row.time_data || {};
      MEJORA_KEYS.forEach(k => {
        const v = Number(td[k]) || 0;
        if (v > 0) add(row.tracking_date, k === 'italiano' || k === 'ingles' ? 'idiomas' : k, v);
      });
      const w = row.workout_duration || 0;
      if (w > 0) add(row.tracking_date, 'gym', w);
    });

    (areaStatsData || []).forEach((row: any) => {
      if (FOCUS_AREA_IDS.includes(row.area_id) && (row.time_spent_minutes || 0) > 0) {
        add(row.stat_date, row.area_id, row.time_spent_minutes);
      }
    });

    return monthDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const byArea = areaByDay[dayStr] || {};
      const totalMin = Object.values(byArea).reduce((s, v) => s + v, 0);
      return { day, totalMin, byArea };
    });
  }, [systemsData, areaStatsData, monthDays]);

  // Totales mensuales por área (mismo resultado que el agregado mensual de Esfuerzo)
  const areaTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    dayBreakdown.forEach(d => {
      Object.entries(d.byArea).forEach(([area, min]) => {
        totals[area] = (totals[area] || 0) + min;
      });
    });
    return Object.entries(totals)
      .map(([area, minutes]) => ({ area, minutes, hours: Math.round((minutes / 60) * 10) / 10 }))
      .filter(t => t.minutes > 0)
      .sort((a, b) => b.minutes - a.minutes);
  }, [dayBreakdown]);

  const totalFocusMinutes = dayBreakdown.reduce((s, d) => s + d.totalMin, 0);
  const totalFocusHours = Math.round((totalFocusMinutes / 60) * 10) / 10;
  const focusPct = Math.round((totalFocusMinutes / (TOTAL_MONTH_HOURS * 60)) * 100);

  const maxDayMin = Math.max(...dayBreakdown.map(d => d.totalMin), 1);

  const { bestDay, bestMin } = useMemo(() => {
    const best = dayBreakdown.reduce((b, d) => d.totalMin > b.totalMin ? d : b, dayBreakdown[0] || { day: new Date(), totalMin: 0, byArea: {} });
    return { bestDay: best.day, bestMin: best.totalMin };
  }, [dayBreakdown]);

  return (
    <div className="space-y-4">
      {/* Month header — barra apilada por área */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tienes ~{TOTAL_MONTH_HOURS} horas este mes</h2>
              <p className="text-xs text-muted-foreground">
                Has registrado {totalFocusHours}h de esfuerzo total ({focusPct}% del mes)
              </p>
            </div>
          </div>

          {/* Barra del mes apilada por área */}
          <div className="relative h-6 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all"
              style={{ width: `${Math.min(focusPct, 100)}%` }}
            >
              {areaTotals.map(at => (
                <div
                  key={at.area}
                  className={cn("h-full", AREA_COLORS[at.area] || 'bg-primary')}
                  style={{ width: `${(at.minutes / totalFocusMinutes) * 100}%` }}
                />
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium">
              <span className="text-muted-foreground/60">0h</span>
              <span className={cn("font-bold", focusPct > 10 ? "text-primary-foreground" : "text-muted-foreground")}>
                {totalFocusHours}h / ~{TOTAL_MONTH_HOURS}h
              </span>
              <span className="text-muted-foreground/60">{TOTAL_MONTH_HOURS}h</span>
            </div>
          </div>
          {bestMin > 0 && (
            <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
              Mejor día: {format(bestDay, 'd MMM', { locale: es })} con {bestMin}m de esfuerzo
            </p>
          )}
          {areaTotals.length > 0 && (
            <div className="flex gap-2.5 mt-2 flex-wrap justify-center text-[9px] text-muted-foreground/70">
              {areaTotals.map(at => (
                <span key={at.area} className="flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-primary')} />
                  {AREA_LABELS[at.area] || at.area} · {at.hours}h
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily heatmap — barras apiladas por área */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Minutos de esfuerzo por día
          </h3>
          <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {dayBreakdown.map((d, i) => {
              const barPct = Math.round((d.totalMin / maxDayMin) * 100);
              const daySegments = Object.entries(d.byArea);
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="w-20 text-[10px] text-muted-foreground shrink-0 text-right">{format(d.day, 'EEE d MMM', { locale: es })}</span>
                  <div className="flex-1 h-5 bg-muted/50 rounded-full overflow-hidden relative">
                    <div
                      className="absolute inset-y-0 left-0 flex overflow-hidden rounded-full transition-all"
                      style={{ width: `${Math.max(barPct, d.totalMin > 0 ? 2 : 0)}%` }}
                    >
                      {daySegments.map(([area, min]) => (
                        <div
                          key={area}
                          className={cn("h-full", AREA_COLORS[area] || 'bg-muted-foreground/40')}
                          style={{ width: `${(min / Math.max(d.totalMin, 1)) * 100}%` }}
                        />
                      ))}
                    </div>
                    <span className="absolute inset-0 flex items-center px-2 text-[9px] text-muted-foreground/60">
                      {d.totalMin > 0 ? `${d.totalMin}m` : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Leyenda por área */}
          {areaTotals.length > 0 && (
            <div className="flex gap-3 mt-3 text-[9px] text-muted-foreground/60 justify-center flex-wrap">
              {areaTotals.map(at => (
                <span key={at.area} className="flex items-center gap-1">
                  <span className={cn("w-2 h-2 rounded-full", AREA_COLORS[at.area] || 'bg-muted-foreground/40')} />
                  {AREA_LABELS[at.area] || at.area}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Area breakdown — mismos totales que la página Esfuerzo */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            Tiempo por área
          </h3>
          {areaTotals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin tiempo registrado este mes</p>
          ) : (
            <div className="space-y-2">
              {areaTotals.map(at => {
                const maxMin = areaTotals[0]?.minutes || 1;
                const pct = Math.round((at.minutes / maxMin) * 100);
                return (
                  <div key={at.area} className="flex items-center gap-2">
                    <div className={cn("w-1.5 h-8 rounded-full shrink-0", AREA_COLORS[at.area] || 'bg-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {AREA_ICONS[at.area] || <Zap className="w-3.5 h-3.5" />}
                          <span className="text-xs font-medium capitalize truncate">{AREA_LABELS[at.area] || at.area}</span>
                        </div>
                        <span className="text-xs font-mono font-bold">{at.hours}h</span>
                      </div>
                      <Progress value={pct} className="h-1 mt-1" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session list */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Sesiones de foco
          </h3>
          {!focusData || focusData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin sesiones de foco este mes</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {focusData.slice().reverse().slice(0, 50).map((session: any) => {
                const sessionDate = format(new Date(session.start_time), 'EEE d MMM', { locale: es });
                return (
                  <div key={session.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", session.completed ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-[9px] text-muted-foreground w-20 shrink-0">{sessionDate}</span>
                    <span className="flex-1 truncate">{session.task_title}</span>
                    <Badge variant="outline" className="text-[9px] font-mono shrink-0 rounded-full px-1.5">
                      {session.duration_minutes || 0}m
                    </Badge>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
