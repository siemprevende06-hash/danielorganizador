import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Gauge } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  getWeekGoalEffective, getMonthGoal, getQuarterGoal,
  getQuarterFromDate, getMonthKeyOf,
} from '@/lib/hierarchy';
import {
  DEFAULT_GOALS, PRIORITIES, HOBBY_ITEMS, SOSTEN_ITEMS, ALL_TIMER_ITEMS,
  minutesOfToday, GlowRing,
} from '@/components/control/PanelControlSection';

export type PeriodScope = 'week' | 'month' | 'quarter' | 'year';

interface DailyRow {
  tracking_date: string;
  completions?: Record<string, boolean>;
  time_data?: Record<string, number>;
  workout_duration?: number;
}

function periodLabel(scope: PeriodScope, start: Date): string {
  switch (scope) {
    case 'week':
      return `Semana del ${format(start, 'd MMM', { locale: es })}`;
    case 'month':
      return format(start, 'MMMM yyyy', { locale: es });
    case 'quarter': {
      const { quarter, year } = getQuarterFromDate(start);
      return `Q${quarter} ${year}`;
    }
    case 'year':
      return `Año ${start.getFullYear()}`;
  }
}

function rawAreaGoal(scope: PeriodScope, start: Date, area: string): number {
  switch (scope) {
    case 'week':
      return getWeekGoalEffective(start, area);
    case 'month': {
      const { quarter, year } = getQuarterFromDate(start);
      return getMonthGoal(quarter, year, getMonthKeyOf(start, quarter), area);
    }
    case 'quarter': {
      const { quarter, year } = getQuarterFromDate(start);
      return getQuarterGoal(quarter, year, area);
    }
    case 'year': {
      const yearN = start.getFullYear();
      return [1, 2, 3, 4].reduce((s, q) => s + getQuarterGoal(q, yearN, area), 0);
    }
  }
}

function PeriodTimerCard({ id, label, color, minutes, goal }: { id: string; label: string; color: string; minutes: number; goal: number }) {
  const pct = goal > 0 ? Math.round((minutes / goal) * 100) : 0;
  const over = minutes - goal;
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40 p-3 flex flex-col items-center gap-1.5">
      <GlowRing pct={pct} color={color}>
        <span className="text-sm font-bold tabular-nums">{minutes}<span className="text-[9px] text-muted-foreground ml-0.5">min</span></span>
      </GlowRing>
      <div className="text-center leading-tight">
        <p className="text-[10px] font-semibold">{label}</p>
        <p className="text-[9px] text-muted-foreground">
          meta {goal} min
          {over > 0 && <span className="text-amber-500 font-semibold"> · +{over}</span>}
        </p>
      </div>
    </div>
  );
}

function PeriodSostenRing({ item, done, days }: { item: { id: string; label: string; color: string }; done: number; days: number }) {
  const pct = days > 0 ? Math.round((done / days) * 100) : 0;
  return (
    <div className="rounded-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm border border-border/40 p-3 flex flex-col items-center gap-1.5">
      <GlowRing pct={pct} color={item.color}>
        <span className="text-sm font-bold tabular-nums">
          {done}<span className="text-[9px] text-muted-foreground ml-0.5">/ {days}</span>
        </span>
      </GlowRing>
      <div className="text-center leading-tight">
        <p className="text-[10px] font-semibold">{item.label}</p>
        <p className="text-[9px] text-muted-foreground">{done}/{days} días completado</p>
      </div>
    </div>
  );
}

export function PeriodControlSection({ scope, start, end, title }: {
  scope: PeriodScope;
  start: Date;
  end: Date;
  title?: string;
}) {
  const startKey = format(start, 'yyyy-MM-dd');
  const endKey = format(end, 'yyyy-MM-dd');

  const [rows, setRows] = useState<DailyRow[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data } = await supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions, time_data, workout_duration')
          .gte('tracking_date', startKey)
          .lte('tracking_date', endKey);
        if (alive && data) setRows(data as DailyRow[]);
      } catch {
        if (alive) setRows([]);
      }
    })();
    return () => { alive = false; };
  }, [startKey, endKey]);

  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const elapsedDays = useMemo(() => {
    const today = startOfDay(new Date());
    const s = startOfDay(start);
    if (today.getTime() < s.getTime()) return 1;
    return Math.min(totalDays, Math.floor((today.getTime() - s.getTime()) / 86400000) + 1);
  }, [startKey, endKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totals = useMemo(() => {
    const minutes: Record<string, number> = {};
    const completions: Record<string, number> = {};
    ALL_TIMER_ITEMS.forEach(it => minutes[it.id] = 0);
    SOSTEN_ITEMS.forEach(it => completions[it.id] = 0);
    rows.forEach(row => {
      ALL_TIMER_ITEMS.forEach(it => minutes[it.id] += minutesOfToday(row.time_data || {}, row.workout_duration || 0, it.id));
      SOSTEN_ITEMS.forEach(it => { if (row.completions?.[it.id]) completions[it.id] = (completions[it.id] || 0) + 1; });
    });
    return { minutes, completions };
  }, [rows]);

  const goalFor = (id: string): number => {
    const area = id === 'idiomas' ? 'italiano' : id;
    let g = rawAreaGoal(scope, start, area);
    if (id === 'idiomas') g += rawAreaGoal(scope, start, 'ingles');
    if (g > 0) return g;
    return (DEFAULT_GOALS[id] || 30) * totalDays;
  };

  const summaryMinutes = ALL_TIMER_ITEMS.reduce((s, it) => s + (totals.minutes[it.id] || 0), 0);
  const summaryGoal = ALL_TIMER_ITEMS.reduce((s, it) => s + goalFor(it.id), 0);
  const summaryPct = summaryGoal > 0 ? Math.min(100, Math.round((summaryMinutes / summaryGoal) * 100)) : 0;
  const label = title || periodLabel(scope, start);

  return (
    <div className="space-y-4">
      {/* Resumen general */}
      <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardContent className="p-3 flex items-center gap-4">
          <GlowRing pct={summaryPct} color="#6366f1" size={60}>
            <span className="text-xs font-bold tabular-nums">{summaryPct}%</span>
          </GlowRing>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold flex items-center gap-1.5"><Gauge className="h-3.5 w-3.5 text-indigo-500" /> Panel de control · {label}</p>
            <p className="text-[10px] text-muted-foreground">{summaryMinutes} minutos acumulados · objetivo {summaryGoal} min</p>
          </div>
        </CardContent>
      </Card>

      {/* Prioridades */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Prioridades</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PRIORITIES.map(it => (
            <PeriodTimerCard key={it.id} id={it.id} label={it.label} color={it.color} minutes={totals.minutes[it.id] || 0} goal={goalFor(it.id)} />
          ))}
        </div>
      </div>

      {/* Acumulativos */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Acumulativos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {HOBBY_ITEMS.map(it => (
            <PeriodTimerCard key={it.id} id={it.id} label={it.label} color={it.color} minutes={totals.minutes[it.id] || 0} goal={goalFor(it.id)} />
          ))}
        </div>
      </div>

      {/* Sostén */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">Sostén</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SOSTEN_ITEMS.map(it => (
            <PeriodSostenRing key={it.id} item={it} done={totals.completions[it.id] || 0} days={elapsedDays} />
          ))}
        </div>
      </div>
    </div>
  );
}