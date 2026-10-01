import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, Flame, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AreaCover, getCoverGradient } from '@/components/areas/AreaCover';
import { forecastSeries, MODEL_LABELS } from '@/lib/forecasting/holtWinters';
import { DireccionAreaSparkline } from '@/components/direccion/DireccionTrendChart';
import { getLifeAreaSection } from '@/data/lifeAreaSections';
import {
  DIRECCION_HORIZON_DAYS,
  formatMinutes,
  type DireccionAreaSeries,
  type DireccionWeekDay,
} from '@/hooks/useDireccionData';

function toneColor(rate: number, future: boolean): string {
  if (future) return 'transparent';
  if (rate >= 70) return '#10b981';
  if (rate >= 40) return '#f59e0b';
  if (rate > 0) return '#f97316';
  return 'hsl(var(--muted-foreground))';
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-rose-600';
}

function scoreBg(score: number): string {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

function MetricTile({
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

function WeekStreak({ area }: { area: DireccionAreaSeries }) {
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

function ScoreBar({ label, value }: { label: string; value: number }) {
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

export function DireccionVisionCard({
  area,
  coverUrl,
  uploading,
  onUploadCover,
}: {
  area: DireccionAreaSeries;
  coverUrl?: string | null;
  uploading?: boolean;
  onUploadCover?: (file: File) => void;
}) {
  const forecast = useMemo(
    () => forecastSeries(area.points.map(p => p.minutes), { horizon: DIRECCION_HORIZON_DAYS, minObservations: 21 }),
    [area.points],
  );

  const forecastTotal = Math.round(forecast.forecast.reduce((a, b) => a + b, 0));
  const weekAvg = Math.round(area.weekMinutes / Math.max(1, area.weekActiveDays));
  const advancing = area.weekDelta >= 0 && area.weekMinutes > 0;
  const DeltaIcon = area.weekDelta >= 0 ? TrendingUp : TrendingDown;
  const section = getLifeAreaSection(area.group);

  return (
    <Card className="overflow-hidden border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-xl hover:shadow-md transition-shadow">
      <AreaCover
        cover={coverUrl ?? null}
        gradient={getCoverGradient(area.id)}
        label={area.label}
        icon={area.icon}
        showCamera
        uploading={uploading}
        onUpload={onUploadCover}
        className="h-20"
      />

      <CardContent className="p-3 space-y-2.5">
        {section && (
          <Badge variant="outline" className={cn('text-[8px] px-1.5 py-0', section.badgeColor)}>
            {section.short}
          </Badge>
        )}

        <div className="grid grid-cols-4 gap-1">
          <MetricTile
            label="Hoy"
            value={formatMinutes(area.todayMinutes)}
            sub={`${area.todayRate}% meta`}
            tone={area.todayMinutes > 0 ? 'text-primary' : undefined}
          />
          <MetricTile label="7 días" value={formatMinutes(area.weekMinutes)} sub={`${area.weekRate}% meta`} />
          <MetricTile
            label="Racha"
            value={`${area.streakDays}d`}
            sub={`máx ${area.bestStreakDays}d`}
            tone={area.streakDays > 0 ? 'text-orange-600' : undefined}
          />
          <MetricTile
            label="Avance"
            value={`${area.weekDelta >= 0 ? '+' : ''}${area.weekDelta}%`}
            sub="vs 7 días previos"
            tone={advancing ? 'text-emerald-600' : 'text-rose-600'}
          />
        </div>

        <WeekStreak area={area} />

        <div className="space-y-1">
          <ScoreBar label="Esfuerzo" value={area.esfuerzo} />
          <ScoreBar label="Resultados" value={area.resultados} />
        </div>

        <div className="pt-1.5 border-t border-border/40 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
              <Target className="h-3 w-3" />
              Próximos {DIRECCION_HORIZON_DAYS} días
            </span>
            <span className="flex items-center gap-1.5">
              <span className="flex items-center gap-1 text-[9px] text-muted-foreground tabular-nums">
                <Flame className="h-3 w-3 text-orange-500" />
                {area.streakWeeks} sem
              </span>
              <span
                className={cn(
                  'flex items-center gap-0.5 text-[9px] font-bold tabular-nums',
                  advancing ? 'text-emerald-600' : 'text-rose-600',
                )}
              >
                <DeltaIcon className="h-2.5 w-2.5" />
                {forecast.reliable ? formatMinutes(forecastTotal) : '—'}
              </span>
            </span>
          </div>
          <DireccionAreaSparkline area={area} />
          <p className="text-[8px] text-muted-foreground/70 leading-tight">
            {weekAvg > 0 ? `${formatMinutes(weekAvg)} por día activo · ` : ''}
            {forecast.reliable
              ? `${MODEL_LABELS[forecast.model]} · MAPE ${forecast.mape.toFixed(0)}%`
              : forecast.reason}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export default DireccionVisionCard;