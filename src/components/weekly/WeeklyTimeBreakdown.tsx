import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Clock, Moon, Brain, Target, Dumbbell, BookOpen, Music, TrendingUp, BarChart3, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AREAS_WITH_METRICS } from '@/data/areaMetricsData';

const TOTAL_WEEK_HOURS = 168;

const AREA_ICONS: Record<string, React.ReactNode> = {
  universidad: <Brain className="w-3.5 h-3.5" />,
  emprendimiento: <TrendingUp className="w-3.5 h-3.5" />,
  proyectos: <Target className="w-3.5 h-3.5" />,
  gym: <Dumbbell className="w-3.5 h-3.5" />,
  idiomas: <BookOpen className="w-3.5 h-3.5" />,
  lectura: <BookOpen className="w-3.5 h-3.5" />,
  piano: <Music className="w-3.5 h-3.5" />,
  guitarra: <Music className="w-3.5 h-3.5" />,
};

const AREA_COLORS: Record<string, string> = {
  universidad: 'bg-blue-500',
  emprendimiento: 'bg-purple-500',
  proyectos: 'bg-amber-500',
  gym: 'bg-red-500',
  idiomas: 'bg-emerald-500',
  lectura: 'bg-cyan-500',
  piano: 'bg-pink-500',
  guitarra: 'bg-orange-500',
};

interface WeeklyTimeBreakdownProps {
  weekStart: Date;
  weekEnd: Date;
}

export function WeeklyTimeBreakdown({ weekStart, weekEnd }: WeeklyTimeBreakdownProps) {
  const weekDays = useMemo(() => eachDayOfInterval({ start: weekStart, end: weekEnd }), [weekStart.getTime(), weekEnd.getTime()]);

  const { data: focusData } = useQuery({
    queryKey: ['weeklyFocusBreakdown', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('focus_sessions')
        .select('*')
        .gte('start_time', `${startStr}T00:00:00`)
        .lte('start_time', `${endStr}T23:59:59`);
      return data || [];
    },
  });

  const { data: taskData } = useQuery({
    queryKey: ['weeklyTaskStats', format(weekStart, 'yyyy-MM-dd')],
    queryFn: async () => {
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', `${startStr}T00:00:00`)
        .lte('due_date', `${endStr}T23:59:59`);
      return data || [];
    },
  });

  const dayBreakdown = useMemo(() => {
    if (!focusData) return [];
    return weekDays.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySessions = focusData.filter(f => format(new Date(f.start_time), 'yyyy-MM-dd') === dayStr);
      const totalMin = daySessions.reduce((s, f) => s + (f.duration_minutes || 0), 0);
      const byArea: Record<string, number> = {};
      daySessions.forEach(f => {
        const area = f.task_area || 'general';
        byArea[area] = (byArea[area] || 0) + (f.duration_minutes || 0);
      });
      return { day, totalMin, byArea, sessionCount: daySessions.length };
    });
  }, [focusData, weekDays]);

  // Aggregate by area across the whole week
  const areaTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    dayBreakdown.forEach(d => {
      Object.entries(d.byArea).forEach(([area, min]) => {
        totals[area] = (totals[area] || 0) + min;
      });
    });
    return Object.entries(totals)
      .map(([area, minutes]) => ({ area, minutes, hours: Math.round(minutes / 60 * 10) / 10 }))
      .sort((a, b) => b.minutes - a.minutes);
  }, [dayBreakdown]);

  const totalFocusMinutes = dayBreakdown.reduce((s, d) => s + d.totalMin, 0);
  const totalFocusHours = Math.round(totalFocusMinutes / 60 * 10) / 10;
  const focusPct = Math.round((totalFocusMinutes / (TOTAL_WEEK_HOURS * 60)) * 100);

  const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="space-y-4">
      {/* 168 hours header */}
      <Card className="border-0 bg-gradient-to-br from-primary/5 via-primary/3 to-transparent backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tienes 168 horas esta semana</h2>
              <p className="text-xs text-muted-foreground">
                Has registrado {totalFocusHours}h de trabajo enfocado ({focusPct}% de tu semana)
              </p>
            </div>
          </div>

          {/* 168 hours bar */}
          <div className="relative h-6 rounded-full bg-muted overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-primary/60 rounded-full transition-all"
              style={{ width: `${Math.min(focusPct, 100)}%` }}
            />
            <div className="absolute inset-0 flex items-center justify-between px-3 text-[10px] font-medium">
              <span className="text-muted-foreground/60">0h</span>
              <span className={cn("font-bold", focusPct > 15 ? "text-primary-foreground" : "text-muted-foreground")}>
                {totalFocusHours}h / 168h
              </span>
              <span className="text-muted-foreground/60">168h</span>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-2 text-center">
            El resto del tiempo se distribuye entre dormir (~56h), rutinas, ocio y otras actividades
          </p>
        </CardContent>
      </Card>

      {/* Day-by-day focus heatmap */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5" />
            Minutos de foco por día
          </h3>
          <div className="space-y-2">
            {dayBreakdown.map((d, i) => {
              const pct = totalFocusMinutes > 0 ? Math.round((d.totalMin / totalFocusMinutes) * 100) : 0;
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-8 text-[10px] font-medium text-muted-foreground text-right">{dayNames[i]}</span>
                  <div className="flex-1 h-6 bg-muted/50 rounded-full overflow-hidden relative">
                    <div
                      className={cn(
                        "absolute inset-y-0 left-0 rounded-full transition-all",
                        d.totalMin >= 120 ? "bg-green-500" : d.totalMin >= 60 ? "bg-blue-500" : d.totalMin > 0 ? "bg-muted-foreground/40" : ""
                      )}
                      style={{ width: `${Math.max(pct, d.totalMin > 0 ? 3 : 0)}%` }}
                    />
                    <div className="absolute inset-0 flex items-center px-2">
                      <span className="text-[10px] font-medium text-muted-foreground/80">
                        {format(d.day, 'd MMM', { locale: es })}
                      </span>
                      <span className="ml-auto text-[10px] font-mono font-bold">
                        {d.totalMin > 0 ? `${d.totalMin}m` : '—'}
                      </span>
                    </div>
                  </div>
                  <span className="w-6 text-[9px] text-muted-foreground/60">{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-3 mt-3 text-[9px] text-muted-foreground/60 justify-center">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /> 2h+</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /> 1-2h</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-muted-foreground/40" /> &lt;1h</span>
          </div>
        </CardContent>
      </Card>

      {/* Area breakdown */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Target className="w-3.5 h-3.5" />
            Horas por área
          </h3>
          {areaTotals.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin sesiones de foco esta semana</p>
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
                          <span className="text-xs font-medium capitalize truncate">{at.area}</span>
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
      <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
        <CardContent className="p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            Sesiones de foco
          </h3>
          {!focusData || focusData.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-4">Sin sesiones de foco esta semana</p>
          ) : (
            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {focusData.slice().reverse().map((session: any) => {
                const sessionDate = format(new Date(session.start_time), 'EEE d', { locale: es });
                return (
                  <div key={session.id} className="flex items-center gap-2 text-xs py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className={cn("w-2 h-2 rounded-full shrink-0", session.completed ? "bg-green-500" : "bg-amber-500")} />
                    <span className="text-[10px] text-muted-foreground w-14 shrink-0">{sessionDate}</span>
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
