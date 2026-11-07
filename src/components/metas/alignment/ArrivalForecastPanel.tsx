import { AlertTriangle, ArrowRight, CalendarCheck, RefreshCw, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODEL_LABELS } from '@/lib/forecasting/holtWinters';
import type { SystemForecastCard } from '@/lib/forecasting/systemForecastAdapters';
import {
  forecastEtaText,
  forecastProgress,
  formatShortDate,
} from '@/components/metas/forecastUi';
import type { EffortForecast, ForecastSummary } from '@/lib/alignment';
import {
  Bar,
  Chip,
  SectionHeader,
  TONE,
  type Tone,
} from './alignmentUi';

const CONFIDENCE_LEVELS = ['alta', 'media', 'baja', 'nula'] as const;
const CONFIDENCE_TONE: Record<(typeof CONFIDENCE_LEVELS)[number], Tone> = {
  alta: 'green',
  media: 'amber',
  baja: 'red',
  nula: 'gray',
};

export function ArrivalForecastPanel({
  effort,
  summary,
  cards,
  loading,
  error,
  onOpenForecast,
  onRefresh,
}: {
  effort: EffortForecast | null;
  summary: ForecastSummary;
  cards: SystemForecastCard[];
  loading: boolean;
  error: string | null;
  onOpenForecast: () => void;
  onRefresh: () => void;
}) {
  const nearest = [...cards]
    .filter(card =>
      !!card.forecast.etaDate
      && (card.forecast.status === 'achieved'
        || card.forecast.status === 'on-track'
        || card.forecast.status === 'at-risk'),
    )
    .sort((a, b) => String(a.forecast.etaDate).localeCompare(String(b.forecast.etaDate)))
    .slice(0, 3);

  const confidence = effort?.confidence ?? 'nula';
  const activeConfidence = CONFIDENCE_LEVELS.indexOf(confidence);

  const tiles: Array<{ label: string; value: number; tone: Tone }> = [
    { label: 'Logradas', value: summary.achieved, tone: 'green' },
    { label: 'En camino', value: summary.onTrack, tone: 'green' },
    { label: 'En riesgo', value: summary.atRisk, tone: 'amber' },
    { label: 'Fuera', value: summary.offTrack, tone: 'red' },
  ];

  return (
    <section className="space-y-3">
      <SectionHeader
        index="06"
        icon={TrendingUp}
        title="El pronóstico"
        subtitle="Fechas, no promesas."
        chips={(
          <>
            <Chip label={`${summary.withTarget} con meta`} tone="primary" />
            <Chip label={`${summary.onTrack} en camino`} tone="green" />
            <Chip label={`${summary.atRisk} en riesgo`} tone="amber" />
          </>
        )}
      />

      {error && (
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-[11px] text-red-600 dark:text-red-400">
          <AlertTriangle className="h-3.5 w-3.5" />
          <span className="min-w-0 flex-1 truncate">{error}</span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-red-500/25 bg-background/60 px-2 py-0.5 text-[10px] font-bold"
          >
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        </div>
      )}

      <div className="grid gap-2 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/50 bg-white/70 p-3 shadow-sm dark:bg-zinc-950/60">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Ritmo de esfuerzo
            </p>
            {effort && (
              <Chip
                label={`${effort.weeklyRate} min/sem`}
                tone={effort.weeklyRate > 0 ? 'green' : 'gray'}
              />
            )}
          </div>

          {effort ? (
            <>
              <EffortChart effort={effort} />
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
                <span>
                  Proyección: <strong className="tabular-nums">{effort.projectedWeekly} min/sem</strong>
                </span>
                <span>Confianza: <strong>{confidence}</strong></span>
                <span>Modelo: <strong>{MODEL_LABELS[effort.model] ?? effort.model}</strong></span>
                <span>MAPE: <strong className="tabular-nums">{effort.mape.toFixed(1)}%</strong></span>
              </div>
            </>
          ) : (
            <div className="mt-3 rounded-2xl border border-dashed border-border/60 p-4 text-center text-[11px] text-muted-foreground">
              Aún no hay suficientes días de esfuerzo para proyectar el ritmo.
            </div>
          )}

          <div className="mt-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
              Confianza del pronóstico
            </p>
            <div className="mt-1 grid grid-cols-4 gap-1">
              {CONFIDENCE_LEVELS.map((level, index) => (
                <div key={level} className="space-y-0.5">
                  <span
                    className={cn(
                      'block h-1.5 rounded-full',
                      index === activeConfidence
                        ? TONE[CONFIDENCE_TONE[level]].solid
                        : 'bg-muted',
                    )}
                  />
                  <span
                    className={cn(
                      'block text-center text-[8px] font-bold uppercase tracking-wider',
                      index === activeConfidence ? TONE[CONFIDENCE_TONE[level]].text : 'text-muted-foreground/60',
                    )}
                  >
                    {level}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/50 bg-white/70 p-3 shadow-sm dark:bg-zinc-950/60">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Fechas estimadas
          </p>

          <div className="mt-1.5 grid grid-cols-4 gap-1.5">
            {tiles.map(tile => (
              <div
                key={tile.label}
                className={cn('rounded-xl border p-1.5 text-center', TONE[tile.tone].border, TONE[tile.tone].bg)}
              >
                <p className={cn('text-xl font-bold leading-none tabular-nums', TONE[tile.tone].text)}>
                  {tile.value}
                </p>
                <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-muted-foreground">
                  {tile.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-3 space-y-1.5">
            {loading && nearest.length === 0 ? (
              <div className="space-y-1.5">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-9 animate-pulse rounded-xl bg-muted/40" />
                ))}
              </div>
            ) : nearest.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border/60 p-3 text-center text-[11px] text-muted-foreground">
                Sin fechas estimadas todavía. El pronóstico aparece cuando hay ritmo suficiente.
              </div>
            ) : (
              nearest.map(card => (
                <div
                  key={card.systemId}
                  className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/60 px-2 py-1.5"
                >
                  <span className="text-sm leading-none">{card.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[11px] font-semibold">{card.label}</p>
                      <span className="ml-auto shrink-0 text-[9px] font-bold tabular-nums text-muted-foreground">
                        {forecastEtaText(card)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Bar
                        value={forecastProgress(card)}
                        tone={card.forecast.status === 'at-risk' ? 'amber' : 'green'}
                        height="h-0.5"
                        className="flex-1"
                      />
                      <span className="text-[8px] tabular-nums text-muted-foreground">
                        {Math.round(forecastProgress(card))}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {summary.nearest?.forecast.etaDate && (
            <p className="mt-2 flex items-center gap-1 text-[9px] text-muted-foreground">
              <CalendarCheck className="h-3 w-3 text-emerald-500" />
              ETA más cercana: {summary.nearest.label} · {formatShortDate(summary.nearest.forecast.etaDate)}
            </p>
          )}

          <button
            type="button"
            onClick={onOpenForecast}
            className="mt-2 inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[10px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ver pronóstico completo
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <p className="px-0.5 text-[10px] text-muted-foreground">
        Un pronóstico no es una promesa: es tu ritmo actual proyectado.
      </p>
    </section>
  );
}

function EffortChart({ effort }: { effort: EffortForecast }) {
  const series = effort.series;
  const forecast = effort.forecast;
  const all = [...series, ...forecast];
  if (all.length < 2) return null;

  const width = 320;
  const height = 80;
  const pad = 2;
  const max = Math.max(1, ...all);
  const step = (width - pad * 2) / Math.max(1, all.length - 1);

  const y = (value: number) =>
    height - pad - (Math.max(0, value) / max) * (height - pad * 2);

  const realPoints = series
    .map((value, index) => `${(pad + index * step).toFixed(1)},${y(value).toFixed(1)}`)
    .join(' ');

  const forecastPoints = [series[series.length - 1], ...forecast]
    .map((value, index) =>
      `${(pad + (series.length - 1 + index) * step).toFixed(1)},${y(value).toFixed(1)}`,
    )
    .join(' ');

  const areaPoints = `${pad},${height - pad} ${realPoints} ${(pad + (series.length - 1) * step).toFixed(1)},${height - pad}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="mt-1.5 h-20 w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Ritmo diario real y proyección a cuatro semanas"
    >
      <polygon points={areaPoints} className="fill-primary/10" />
      <polyline
        points={realPoints}
        fill="none"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-primary"
      />
      <polyline
        points={forecastPoints}
        fill="none"
        strokeWidth="1.6"
        strokeDasharray="4 3"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="stroke-violet-500"
      />
    </svg>
  );
}
