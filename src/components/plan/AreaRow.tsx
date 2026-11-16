import { type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { CheckCircle2, CircleDashed, Clock, Crosshair } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MonthTaskCounts } from '@/hooks/useWeeklyPlanData';
import { Ring } from './WeekMinutesRings';
import { SystemPlanCard } from '@/components/systems/SystemPlanCard';

export const fmtMin = (m: number) => {
  if (m <= 0) return '0m';
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}m`;
  if (r === 0) return `${h}h`;
  return `${h}h ${r}m`;
};

/** Selector multi de enfoque semanal (asignaturas, proyectos, emprendimientos...) */
export function FocusSelector({
  label,
  options,
  selected,
  onChange,
  accent,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  accent?: string;
}) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  };
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Crosshair className={cn('w-3 h-3', accent)} /> {label}
      </span>
      {options.map(o => {
        const active = selected.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => toggle(o.id)}
            title={active ? 'Quitar del enfoque' : 'Enfocarse en esta semana'}
            className={cn(
              'rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors',
              active
                ? 'border-transparent bg-indigo-500 text-white shadow-sm'
                : 'border-muted text-muted-foreground hover:border-indigo-400 hover:text-indigo-600'
            )}
          >
            {o.name}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Tarjeta por área: esfuerzo en minutos + resultado al que se dirigen esos
 * minutos + tareas del mes hechas / sin hacer. Misma portada que las tarjetas
 * de sistemas de /plan-manana.
 */
export function AreaRow({
  systemId,
  title,
  subtitle,
  accent,
  counts,
  countsLabel = 'del mes',
  minutesThisWeek,
  minutesGoal,
  onMinutesGoalChange,
  result,
  results,
  onResultChange,
  extra,
  focusOptions,
  focusSelected,
  onFocusChange,
}: {
  /** Id del sistema para la portada (emprendimiento, proyectos, tareas…). */
  systemId: string;
  title: string;
  subtitle?: string;
  accent: string;
  counts: MonthTaskCounts;
  countsLabel?: string;
  minutesThisWeek: number;
  minutesGoal: number;
  onMinutesGoalChange: (v: number) => void;
  result: string;
  results: { id: string; title: string; done: boolean }[];
  onResultChange: (v: string) => void;
  extra?: ReactNode;
  focusOptions?: { id: string; name: string }[];
  focusSelected?: string[];
  onFocusChange?: (ids: string[]) => void;
}) {
  const pct = counts.total > 0 ? Math.round((counts.done / counts.total) * 100) : 0;

  return (
    <SystemPlanCard
      systemId={systemId}
      title={title}
      subtitle={subtitle}
      metric={`${minutesThisWeek}′`}
      badge={`${counts.done}/${counts.total} mes`}
    >
      <div className="flex items-center gap-1.5">
        <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
        <Input
          type="number"
          min={0}
          step={15}
          value={minutesGoal || ''}
          onChange={e => onMinutesGoalChange(Math.max(0, parseInt(e.target.value) || 0))}
          className="h-7 min-w-0 flex-1 text-[10px] tabular-nums text-center"
          title="Minutos de esfuerzo planificados para el área"
        />
        <span className="text-[9px] text-muted-foreground">min</span>
        <Ring label="Min" value={minutesThisWeek} goal={minutesGoal} size={40} stroke={4} color="currentColor" />
      </div>

      <select
        value={results.some(r => r.id === result) ? result : result ? '__custom__' : ''}
        onChange={e => onResultChange(e.target.value === '__custom__' ? '' : e.target.value)}
        className="h-7 w-full rounded-md border border-input bg-background px-1.5 text-[10px] outline-none focus:ring-1 focus:ring-ring"
        title="Resultado al que se dirigen estos minutos"
      >
        <option value="">Resultado al que apunta…</option>
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
          className="h-7 text-[10px]"
        />
      )}

      {/* Enfoque de la semana: qué proyectos/emprendimientos atacar */}
      {focusOptions && focusOptions.length > 0 && onFocusChange && (
        <div className="border-t border-border/40 pt-1.5">
          <FocusSelector
            label="Enfoque de la semana"
            options={focusOptions}
            selected={focusSelected ?? []}
            onChange={onFocusChange}
            accent={accent}
          />
        </div>
      )}

      {/* Tareas del mes hechas / sin hacer */}
      <div className="mt-auto space-y-1 border-t border-border/40 pt-1.5">
        <div className="flex flex-wrap items-center gap-1">
          <Badge variant="outline" className="h-5 border-emerald-500/40 text-[9px] text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 w-3 h-3" />
            {counts.done} hechas {countsLabel}
          </Badge>
          <Badge variant="outline" className="h-5 text-[9px]">
            <CircleDashed className="mr-1 w-3 h-3" />
            {counts.pending} sin hacer
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="w-8 text-right text-[9px] tabular-nums text-muted-foreground">{pct}%</span>
        </div>
      </div>
      {extra}
    </SystemPlanCard>
  );
}
