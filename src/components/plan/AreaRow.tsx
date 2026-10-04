import { type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, CircleDashed, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthTaskCounts } from '@/hooks/useWeeklyPlanData';
import { Ring } from './WeekMinutesRings';

export const fmtMin = (m: number) => {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
};

/**
 * Fila por área: esfuerzo en minutos + resultado al que se dirigen esos minutos
 * + tareas del mes hechas / sin hacer.
 */
export function AreaRow({
  title,
  subtitle,
  icon,
  accent,
  border,
  counts,
  countsLabel = 'del mes',
  minutesThisWeek,
  minutesGoal,
  onMinutesGoalChange,
  result,
  results,
  onResultChange,
  extra,
}: {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  accent: string;
  border: string;
  counts: MonthTaskCounts;
  countsLabel?: string;
  minutesThisWeek: number;
  minutesGoal: number;
  onMinutesGoalChange: (v: number) => void;
  result: string;
  results: { id: string; title: string; done: boolean }[];
  onResultChange: (v: string) => void;
  extra?: ReactNode;
}) {
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <section
      className={cn(
        'rounded-2xl border-2 bg-gradient-to-br via-background to-background backdrop-blur-sm overflow-hidden',
        border
      )}
    >
      <div className="px-3.5 py-2.5 flex flex-wrap items-center gap-3">
        <div className={cn('w-8 h-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0', accent)}>{icon}</div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold tracking-tight leading-tight">{title}</h3>
          {subtitle && <p className="text-[10px] text-muted-foreground truncate">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-3">
          {/* Esfuerzo en minutos + resultado al que se dirige */}
          <div className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              step={15}
              value={minutesGoal || ''}
              onChange={e => onMinutesGoalChange(Math.max(0, parseInt(e.target.value) || 0))}
              className="h-7 w-20 text-[11px] tabular-nums text-center"
              title="Minutos de esfuerzo planificados para el área"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">min →</span>
            <select
              value={results.some(r => r.id === result) ? result : result ? '__custom__' : ''}
              onChange={e => onResultChange(e.target.value === '__custom__' ? '' : e.target.value)}
              className="h-7 w-[150px] rounded-md border border-input bg-background px-1.5 text-[10px] outline-none focus:ring-1 focus:ring-ring"
              title="Resultado al que se dirigen estos minutos"
            >
              <option value="">Resultado…</option>
              {results.map(r => (
                <option key={r.id} value={r.id}>
                  {r.done ? '✓ ' : ''}{r.title}
                </option>
              ))}
              <option value="__custom__">Otro…</option>
            </select>
            {!results.some(r => r.id === result) && result !== '' && (
              <Input
                value={result}
                onChange={e => onResultChange(e.target.value)}
                placeholder="Resultado…"
                className="h-7 w-[150px] text-[10px]"
              />
            )}
          </div>

          <Ring label="Min" value={minutesThisWeek} goal={minutesGoal} size={48} stroke={5} color="currentColor" />
        </div>
      </div>

      {/* Tareas del mes hechas / sin hacer */}
      <div className="px-3.5 py-2 border-t border-muted/40 flex flex-wrap items-center gap-2">
        <Badge variant="outline" className="text-[10px] h-5 border-emerald-500/40 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          {counts.done} hechas {countsLabel}
        </Badge>
        <Badge variant="outline" className="text-[10px] h-5">
          <CircleDashed className="w-3 h-3 mr-1" />
          {counts.pending} sin hacer
        </Badge>
        <div className="flex items-center gap-1.5 min-w-[120px] flex-1">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[9px] tabular-nums text-muted-foreground w-8 text-right">{pct}%</span>
        </div>
        {extra}
      </div>
    </section>
  );
}