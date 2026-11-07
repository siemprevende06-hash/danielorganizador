import { CalendarDays, Gauge } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SystemForecastCard as SystemForecastCardData } from '@/lib/forecasting/systemForecastAdapters';
import { ForecastSparkline } from '@/components/metas/ForecastSparkline';
import {
  FORECAST_CONFIDENCE_META,
  FORECAST_STATUS_META,
  forecastDeadlineText,
  forecastEtaText,
  forecastProgress,
  forecastRangeText,
  toneBarClass,
} from '@/components/metas/forecastUi';

interface SystemForecastCardProps {
  card: SystemForecastCardData;
  onOpen: (card: SystemForecastCardData) => void;
}

export function SystemForecastCard({ card, onOpen }: SystemForecastCardProps) {
  const status = FORECAST_STATUS_META[card.forecast.status];
  const confidence = FORECAST_CONFIDENCE_META[card.forecast.confidence];
  const progress = forecastProgress(card);
  const range = forecastRangeText(card);

  return (
    <button
      type="button"
      onClick={() => onOpen(card)}
      className="group flex h-full flex-col gap-2 rounded-2xl border border-border/50 bg-white/75 p-2.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md dark:bg-zinc-950/60"
    >
      <div className="flex items-start gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted/50 text-base">
          {card.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-1">
            <span className="truncate text-xs font-bold leading-tight">{card.label}</span>
            <span className={cn('shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold', status.className)}>
              {status.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[9px] text-muted-foreground" title={card.sourceLabel}>
            {card.sourceLabel}
          </p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
            Llegada estimada
          </p>
          <p className="truncate text-sm font-bold leading-tight">{forecastEtaText(card)}</p>
          {range && (
            <p className="truncate text-[9px] tabular-nums text-muted-foreground" title={range}>
              {range}
            </p>
          )}
        </div>
        <div className="shrink-0 text-right">
          <p className="max-w-[7.5rem] truncate text-[11px] font-bold tabular-nums" title={card.displayCurrent}>
            {card.displayCurrent}
          </p>
          <p className="max-w-[7.5rem] truncate text-[9px] text-muted-foreground" title={`Meta: ${card.displayTarget}`}>
            meta {card.displayTarget}
          </p>
        </div>
      </div>

      <ForecastSparkline
        chart={card.forecast.chart}
        target={card.forecast.target}
        className="h-9 w-full"
      />

      <div className="space-y-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
          <div
            className={cn('h-full rounded-full transition-all', toneBarClass(status.tone))}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between gap-1 text-[9px] text-muted-foreground">
          <span className="truncate" title={card.context[0] ?? ''}>{card.context[0] ?? '—'}</span>
          <span className="shrink-0 tabular-nums">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-1 border-t border-border/40 pt-1.5 text-[9px] text-muted-foreground">
        <span className="inline-flex min-w-0 items-center gap-1">
          <CalendarDays className="h-3 w-3 shrink-0" />
          <span className="truncate">{forecastDeadlineText(card)}</span>
        </span>
        <span className={cn('inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5', confidence.className)}>
          <Gauge className="h-2.5 w-2.5" />
          {confidence.label.replace('Confianza ', '')}
        </span>
      </div>
    </button>
  );
}
