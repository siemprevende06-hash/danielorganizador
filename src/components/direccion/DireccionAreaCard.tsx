import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Target, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forecastSeries, MODEL_LABELS, type ForecastResult } from '@/lib/forecasting/holtWinters';
import { DIRECCION_HORIZON_DAYS, formatMinutes, type DireccionAreaSeries } from '@/hooks/useDireccionData';

const CONFIDENCE_META = {
  alta: { label: 'Confianza alta', cls: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  media: { label: 'Confianza media', cls: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
  baja: { label: 'Confianza baja', cls: 'text-orange-600 bg-orange-500/10 border-orange-500/30' },
  nula: { label: 'Sin datos suficientes', cls: 'text-muted-foreground bg-muted/40 border-border' },
} as const;

function toneFor(minutes: number, forecast: number): { label: string; cls: string; icon: typeof TrendingUp } {
  if (forecast === 0 && minutes === 0) return { label: 'Sin datos', cls: 'text-muted-foreground', icon: TrendingUp };
  const delta = minutes > 0 ? ((forecast - minutes) / minutes) * 100 : 0;
  if (delta > 10) return { label: `+${delta.toFixed(0)}%`, cls: 'text-emerald-600', icon: TrendingUp };
  if (delta < -10) return { label: `${delta.toFixed(0)}%`, cls: 'text-rose-600', icon: TrendingDown };
  return { label: 'Estable', cls: 'text-muted-foreground', icon: TrendingUp };
}

function scoreColor(score: number): string {
  if (score >= 70) return 'text-emerald-600';
  if (score >= 40) return 'text-amber-600';
  return 'text-rose-600';
}

export function DireccionAreaCard({ area }: { area: DireccionAreaSeries }) {
  const result: ForecastResult = useMemo(
    () => forecastSeries(area.points.map(p => p.minutes), { horizon: DIRECCION_HORIZON_DAYS, minObservations: 21 }),
    [area.points],
  );

  const avgDaily = area.points.length ? area.totalMinutes / area.points.length : 0;
  const tone = toneFor(avgDaily, result.forecast[0] ?? 0);
  const ToneIcon = tone.icon;
  const confidence = CONFIDENCE_META[result.confidence];

  return (
    <div className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-xl overflow-hidden">
      <div className="p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg leading-none shrink-0">{area.icon}</span>
            <span className="text-xs font-semibold truncate">{area.label}</span>
          </div>
          <Badge variant="outline" className={cn("text-[9px] font-bold shrink-0", tone.cls)}>
            <ToneIcon className="h-2.5 w-2.5 mr-1" />
            {tone.label}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/30 space-y-0.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Acumulado</p>
            <p className="text-xs font-bold tabular-nums">{formatMinutes(area.totalMinutes)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 space-y-0.5">
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Promedio/día</p>
            <p className="text-xs font-bold tabular-nums">{formatMinutes(Math.round(avgDaily))}</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">Esfuerzo</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, area.esfuerzo))}%`,
                  backgroundColor: area.esfuerzo >= 70 ? '#10b981' : area.esfuerzo >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className={cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", scoreColor(area.esfuerzo))}>
              {area.esfuerzo}%
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] text-muted-foreground shrink-0">Resultados</span>
            <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(0, area.resultados))}%`,
                  backgroundColor: area.resultados >= 70 ? '#10b981' : area.resultados >= 40 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className={cn("text-[10px] font-bold tabular-nums w-8 text-right shrink-0", scoreColor(area.resultados))}>
              {area.resultados}%
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/40">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Flame className="h-3 w-3 text-orange-500" />
            {area.currentStreak}d
            <span className="opacity-50">·</span>
            {area.activeDayRate}% activo
          </span>
          <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0", confidence.cls)}>
            {confidence.label}
          </Badge>
        </div>

        {result.reliable ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Próximos {DIRECCION_HORIZON_DAYS} días
              </span>
              <span className="tabular-nums">{formatMinutes(Math.round(result.forecast.reduce((a, b) => a + b, 0)))}</span>
            </div>
            <Progress value={Math.min(100, result.confidence === 'alta' ? 100 : 66)} className="h-1" />
            <p className="text-[9px] text-muted-foreground/70 leading-tight">
              {MODEL_LABELS[result.model]} · MAPE {result.mape.toFixed(0)}%
            </p>
          </div>
        ) : (
          <p className="text-[9px] text-muted-foreground/70 leading-tight">{result.reason}</p>
        )}
      </div>
    </div>
  );
}

export function DireccionAreasGrid({ areas, loading }: { areas: DireccionAreaSeries[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid gap-2 md:grid-cols-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!areas.length) {
    return (
      <div className="rounded-xl border border-dashed border-border/60 p-8 text-center text-sm text-muted-foreground">
        No hay áreas centrales configuradas.
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-2">
      {areas.map(a => (
        <DireccionAreaCard key={a.areaId} area={a} />
      ))}
    </div>
  );
}