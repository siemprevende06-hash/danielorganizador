import { CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatMinutes, type DireccionAreaSeries, type DireccionWeekDay } from '@/hooks/useDireccionData';

export function toneColor(rate: number, future: boolean): string {
  if (future) return 'transparent';
  if (rate >= 70) return '#10b981';
  if (rate >= 40) return '#f59e0b';
  if (rate > 0) return '#f97316';
  return 'hsl(var(--muted-foreground))';
}

export function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-rose-600';
}

export function scoreBg(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export function MetricTile({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-1.5 space-y-0.5 min-w-0">
      <p className="text-[8px] uppercase tracking-wider text-muted-foreground truncate">{label}</p>
      <p className={cn('text-xs font-bold tabular-nums truncate', tone)}>{value}</p>
      {sub && <p className="text-[8px] text-muted-foreground truncate tabular-nums">{sub}</p>}
    </div>
  );
}

function DayCell({ day }: { day: DireccionWeekDay }) {
  const height = Math.min(100, Math.max(day.active ? 12 : 4, day.rate));

  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <span
        className={cn(
          'text-[9px] font-bold leading-none',
          day.isToday ? 'text-primary' : day.active ? 'text-foreground' : 'text-muted-foreground/50',
        )}
      >
        {day.letter}
      </span>
      <div
        title={`${day.label} · ${formatMinutes(day.minutes)}${day.future ? ' · pendiente' : ''}`}
        className={cn(
          'w-full h-10 rounded-md flex items-end overflow-hidden',
          day.future ? 'bg-muted/20 border border-dashed border-border/40' : 'bg-muted/50',
          day.isToday && !day.future && 'ring-1 ring-primary/50',
        )}
      >
        <div
          className="w-full rounded-md transition-all duration-500"
          style={{ height: `${height}%`, backgroundColor: toneColor(day.rate, day.future) }}
        />
      </div>
    </div>
  );
}

export function WeekStreak({ area }: { area: DireccionAreaSeries }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground">
          <CalendarDays className="h-3 w-3" />
          Racha semanal
        </span>
        <span className="flex items-center gap-1 text-[9px] text-muted-foreground tabular-nums">
          <span className="font-bold text-foreground">{area.weekActiveDays}/7</span> días
          <span className="opacity-40">·</span>
          {formatMinutes(area.weekMinutes)}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {area.weekDays.map(day => (
          <DayCell key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] text-muted-foreground shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: scoreBg(value) }}
        />
      </div>
      <span className={cn('text-[10px] font-bold tabular-nums w-8 text-right shrink-0', scoreColor(value))}>
        {value}%
      </span>
    </div>
  );
}