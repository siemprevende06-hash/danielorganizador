import { differenceInCalendarDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  ForecastConfidence,
  ForecastStatus,
} from '@/lib/forecasting/resultForecast';
import type {
  ForecastDeadlineSource,
  SystemForecastCard,
} from '@/lib/forecasting/systemForecastAdapters';

export type ForecastTone = 'green' | 'amber' | 'red' | 'gray' | 'primary';

export const FORECAST_STATUS_META: Record<ForecastStatus, {
  label: string;
  tone: ForecastTone;
  className: string;
  dot: string;
}> = {
  achieved: {
    label: 'Cumplida',
    tone: 'green',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'on-track': {
    label: 'En camino',
    tone: 'green',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  'at-risk': {
    label: 'En riesgo',
    tone: 'amber',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  'off-track': {
    label: 'Fuera de camino',
    tone: 'red',
    className: 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
  'no-target': {
    label: 'Sin meta',
    tone: 'gray',
    className: 'border-border/60 bg-muted/40 text-muted-foreground',
    dot: 'bg-muted-foreground/40',
  },
  'no-data': {
    label: 'Sin datos',
    tone: 'gray',
    className: 'border-border/60 bg-muted/40 text-muted-foreground',
    dot: 'bg-muted-foreground/40',
  },
};

export const FORECAST_CONFIDENCE_META: Record<ForecastConfidence, {
  label: string;
  className: string;
}> = {
  alta: {
    label: 'Confianza alta',
    className: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  },
  media: {
    label: 'Confianza media',
    className: 'border-sky-500/25 bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  baja: {
    label: 'Confianza baja',
    className: 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  },
  nula: {
    label: 'Sin confianza',
    className: 'border-border/60 bg-muted/40 text-muted-foreground',
  },
};

export const DEADLINE_SOURCE_LABEL: Record<ForecastDeadlineSource, string> = {
  custom: 'Fecha propia',
  target: 'Fecha de la meta',
  goal: 'Meta del sistema',
  horizon: 'Fin del periodo',
};

export function parseForecastDate(key: string | null | undefined): Date | null {
  if (!key) return null;
  const date = new Date(`${String(key).slice(0, 10)}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatShortDate(key: string | null | undefined): string {
  const date = parseForecastDate(key);
  return date ? format(date, 'd MMM', { locale: es }) : '—';
}

export function formatLongDate(key: string | null | undefined): string {
  const date = parseForecastDate(key);
  return date ? format(date, "d 'de' MMMM 'de' yyyy", { locale: es }) : '—';
}

export function formatMonthYear(key: string | null | undefined): string {
  const date = parseForecastDate(key);
  return date ? format(date, 'MMM yyyy', { locale: es }) : '—';
}

export function forecastProgress(card: SystemForecastCard): number {
  const pct = card.forecast.progressPct;
  if (pct == null) return 0;
  return Math.max(0, Math.min(100, pct));
}

export function forecastRangeText(card: SystemForecastCard): string {
  const range = card.forecast.etaRange;
  if (!range) return '';
  if (range.optimistic === range.pessimistic) return formatShortDate(range.optimistic);
  return `${formatShortDate(range.optimistic)} – ${formatShortDate(range.pessimistic)}`;
}

export function forecastEtaText(card: SystemForecastCard): string {
  const { status } = card.forecast;
  if (status === 'achieved') return 'Meta lograda';
  if (status === 'no-target') return 'Sin meta';
  if (status === 'no-data') return 'Faltan datos';
  if (!card.forecast.etaDate) return 'Sin fecha';

  const date = parseForecastDate(card.forecast.etaDate);
  if (!date) return 'Sin fecha';
  const days = differenceInCalendarDays(date, new Date());

  if (days < 0) return 'Fecha vencida';
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  if (days <= 45) return `En ${days} días`;
  return format(date, "d MMM ''yy", { locale: es });
}

export function forecastDeadlineText(card: SystemForecastCard): string {
  return `${formatShortDate(card.deadline)} · ${DEADLINE_SOURCE_LABEL[card.deadlineSource]}`;
}

export function toneBarClass(tone: ForecastTone): string {
  switch (tone) {
    case 'green':
      return 'bg-emerald-500';
    case 'amber':
      return 'bg-amber-500';
    case 'red':
      return 'bg-rose-500';
    case 'primary':
      return 'bg-primary';
    default:
      return 'bg-muted-foreground/40';
  }
}
