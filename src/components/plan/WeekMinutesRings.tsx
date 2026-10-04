import { useState } from 'react';
import { cn } from '@/lib/utils';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import { getWeekGoalEffective, setWeekGoal } from '@/lib/hierarchy';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export interface MinutesRingDef {
  area: string;
  label: string;
  color: string;
  actualMinutes: number;
}

/** Círculo de progreso: valor real vs objetivo de minutos */
function Ring({
  value,
  goal,
  size = 62,
  stroke = 6,
  color = 'hsl(var(--primary))',
  label,
  sublabel,
  center,
}: {
  value: number;
  goal: number;
  size?: number;
  stroke?: number;
  color?: string;
  label: string;
  sublabel?: string;
  center?: React.ReactNode;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = goal > 0 ? Math.min(value / goal, 1) : value > 0 ? 1 : 0;
  const over = goal > 0 && value > goal;

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke="currentColor" strokeWidth={stroke} className="text-muted"
          />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={over ? '#10b981' : color} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ transition: 'stroke-dashoffset 600ms ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {center ?? (
            <>
              <span className="text-[11px] font-bold tabular-nums leading-none">{goal > 0 ? `${Math.round((value / goal) * 100)}%` : '—'}</span>
              <span className="text-[8px] tabular-nums text-muted-foreground leading-none mt-0.5">
                {value}/{goal}m
              </span>
            </>
          )}
        </div>
      </div>
      <span className="text-[10px] font-semibold text-center leading-tight">{label}</span>
      {sublabel && <span className="text-[9px] text-muted-foreground text-center leading-tight">{sublabel}</span>}
    </div>
  );
}

export function WeekMinutesRings({
  weekStart,
  rings,
  onChanged,
}: {
  weekStart: Date;
  rings: MinutesRingDef[];
  onChanged?: () => void;
}) {
  const [, force] = useState(0);

  const applyGoal = (area: string, value: string) => {
    setWeekGoal(weekStart, area, Math.max(0, parseInt(value) || 0));
    force(v => v + 1);
    onChanged?.();
  };

  const totalActual = rings.reduce((a, r) => a + r.actualMinutes, 0);
  const totalGoal = rings.reduce((a, r) => a + getWeekGoalEffective(weekStart, r.area), 0);

  return (
    <div className="rounded-2xl border-2 border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm p-3">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          Minutos de la semana
        </p>
        <span className="text-[10px] font-semibold tabular-nums text-muted-foreground">
          {Math.round(totalActual / 60)}h {totalActual % 60}m
          {totalGoal > 0 && <span className="text-muted-foreground/70"> / {Math.round(totalGoal / 60)}h {totalGoal % 60}m</span>}
        </span>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-11 gap-x-2 gap-y-3">
        {rings.map(r => (
          <Ring
            key={r.area}
            label={r.label}
            color={r.color}
            value={r.actualMinutes}
            goal={getWeekGoalEffective(weekStart, r.area)}
          />
        ))}
        <Ring
          label="Total"
          color="hsl(var(--primary))"
          size={62}
          value={totalActual}
          goal={totalGoal}
        />
      </div>

      <div className="mt-3 pt-2.5 border-t border-muted/60 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-x-3 gap-y-1">
        {rings.map(r => (
          <div key={r.area} className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-muted-foreground truncate">{r.label}</span>
            <MinutesGoalInput
              value={getWeekGoalEffective(weekStart, r.area)}
              onApply={v => applyGoal(r.area, v)}
              className="h-5 w-14 text-[9px] text-center tabular-nums"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Diagrama de barras por día con el detalle de minutos y eventos */
export function WeekDayBars({
  weekDays,
  values,
  goals,
}: {
  weekDays: Date[];
  values: Record<string, number>;
  goals?: Record<string, number>;
}) {
  const max = Math.max(1, ...weekDays.map(d => values[format(d, 'yyyy-MM-dd')] ?? 0));
  return (
    <div className="space-y-1">
      {weekDays.map(d => {
        const key = format(d, 'yyyy-MM-dd');
        const v = values[key] ?? 0;
        const goal = goals?.[key] ?? 0;
        return (
          <div key={key} className="flex items-center gap-2">
            <span className="text-[9px] w-14 shrink-0 text-muted-foreground truncate">
              {format(d, 'EEE d', { locale: es })}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden relative">
              <div
                className={cn('h-full rounded-full transition-all duration-500', v >= goal && goal > 0 ? 'bg-emerald-500' : 'bg-indigo-500')}
                style={{ width: `${(v / max) * 100}%` }}
              />
              {goal > 0 && (
                <span
                  className="absolute top-0 h-full w-px bg-foreground/50"
                  style={{ left: `${Math.min(100, (goal / max) * 100)}%` }}
                  title={`Objetivo ${goal}m`}
                />
              )}
            </div>
            <span className="text-[9px] tabular-nums w-12 text-right text-muted-foreground shrink-0">{v}m</span>
          </div>
        );
      })}
    </div>
  );
}

export { Ring };