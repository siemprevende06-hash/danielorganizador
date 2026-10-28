import { cn } from '@/lib/utils';

export type GoalTone = 'rose' | 'emerald' | 'sky' | 'amber' | 'indigo' | 'violet' | 'blue';

const BAR: Record<GoalTone, string> = {
  rose: 'bg-rose-500',
  emerald: 'bg-emerald-500',
  sky: 'bg-sky-500',
  amber: 'bg-amber-500',
  indigo: 'bg-indigo-500',
  violet: 'bg-violet-500',
  blue: 'bg-blue-500',
};

const TEXT: Record<GoalTone, string> = {
  rose: 'text-rose-600 dark:text-rose-400',
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  amber: 'text-amber-600 dark:text-amber-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  violet: 'text-violet-600 dark:text-violet-400',
  blue: 'text-blue-600 dark:text-blue-400',
};

interface Props {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  tone?: GoalTone;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  /** Texto cuando el plan no tiene meta (goal = 0). */
  emptyLabel?: string;
}

/**
 * Barra real vs objetivo con el mismo criterio de color que las tarjetas de
 * Lectura/Ajedrez: rojo sin registro, azul en progreso, verde al llegar y
 * ámbar al superar la meta. Si no hay meta, queda neutra y lo dice.
 */
export function GoalMeter({
  label,
  value,
  goal,
  unit = '',
  tone = 'sky',
  size = 'sm',
  className,
  emptyLabel = 'sin objetivo',
}: Props) {
  const safeValue = Math.max(0, Number(value) || 0);
  const safeGoal = Math.max(0, Number(goal) || 0);
  const hasGoal = safeGoal > 0;
  const over = hasGoal && safeValue > safeGoal;
  const reached = hasGoal && safeValue >= safeGoal;
  const pct = hasGoal ? Math.min(100, (safeValue / safeGoal) * 100) : 0;

  const bar = !hasGoal
    ? 'bg-muted-foreground/25'
    : safeValue <= 0
      ? 'bg-red-500'
      : over
        ? 'bg-amber-500'
        : reached
          ? 'bg-green-500'
          : BAR[tone];

  const text = !hasGoal
    ? 'text-muted-foreground'
    : safeValue <= 0
      ? 'text-red-500'
      : over
        ? 'text-amber-600 dark:text-amber-400'
        : reached
          ? 'text-green-600 dark:text-green-400'
          : TEXT[tone];

  const height = size === 'xs' ? 'h-1' : size === 'md' ? 'h-2' : 'h-1.5';

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-baseline justify-between gap-1.5">
        <span className="text-[9px] text-muted-foreground truncate">{label}</span>
        <span className={cn('text-[10px] font-bold tabular-nums whitespace-nowrap', text)}>
          {safeValue}{unit}
          {hasGoal ? (
            <span className="font-normal text-muted-foreground"> / {safeGoal}{unit}</span>
          ) : (
            <span className="font-normal text-muted-foreground"> · {emptyLabel}</span>
          )}
        </span>
      </div>
      <div className={cn('rounded-full bg-muted overflow-hidden', height)}>
        <div
          className={cn('h-full transition-all', bar)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-label={label}
          aria-valuenow={safeGoal > 0 ? Math.min(safeValue, safeGoal) : safeValue}
          aria-valuemin={0}
          aria-valuemax={safeGoal || undefined}
        />
      </div>
    </div>
  );
}
