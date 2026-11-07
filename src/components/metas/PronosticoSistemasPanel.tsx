import { useMemo, useState } from 'react';
import { AlertTriangle, RefreshCw, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SystemGoal } from '@/lib/systemGoals';
import { METAS_SYSTEM_GROUPS } from '@/lib/metasSistemas';
import type { ForecastHorizon, SystemForecastCard as SystemForecastCardData } from '@/lib/forecasting/systemForecastAdapters';
import { useForecastDeadlines, useSystemForecasts } from '@/hooks/useSystemForecasts';
import { SystemForecastCard } from '@/components/metas/SystemForecastCard';
import { SystemForecastDialog } from '@/components/metas/SystemForecastDialog';
import { formatShortDate } from '@/components/metas/forecastUi';

interface PronosticoSistemasPanelProps {
  goals: SystemGoal[];
}

type ChipTone = 'green' | 'amber' | 'red' | 'gray' | 'primary';

function Chip({ label, tone }: { label: string; tone: ChipTone }) {
  const className = tone === 'green'
    ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
    : tone === 'amber'
      ? 'border-amber-500/25 bg-amber-500/10 text-amber-600 dark:text-amber-400'
      : tone === 'red'
        ? 'border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400'
        : tone === 'primary'
          ? 'border-primary/25 bg-primary/10 text-primary'
          : 'border-border/60 bg-muted/40 text-muted-foreground';
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums', className)}>
      {label}
    </span>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-2 rounded-2xl border border-border/50 bg-white/60 p-2.5 dark:bg-zinc-950/50">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-xl" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-2 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-2.5 w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function PronosticoSistemasPanel({ goals }: PronosticoSistemasPanelProps) {
  const [horizon, setHorizon] = useState<ForecastHorizon>('quarter');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { deadlines, setDeadline, clearDeadline } = useForecastDeadlines();
  const { cards, loading, refreshing, error, horizonInfo, refresh } = useSystemForecasts({
    goals,
    horizon,
    deadlines,
  });

  const cardById = useMemo(
    () => new Map(cards.map(card => [card.systemId, card])),
    [cards],
  );
  const selectedCard = selectedId ? cardById.get(selectedId) ?? null : null;

  const summary = useMemo(() => {
    const counts = { onTrack: 0, atRisk: 0, offTrack: 0, pending: 0 };
    for (const card of cards) {
      switch (card.forecast.status) {
        case 'achieved':
        case 'on-track':
          counts.onTrack++;
          break;
        case 'at-risk':
          counts.atRisk++;
          break;
        case 'off-track':
          counts.offTrack++;
          break;
        default:
          counts.pending++;
          break;
      }
    }
    return counts;
  }, [cards]);

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/50 bg-white/70 p-3 shadow-sm dark:bg-zinc-950/60">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold leading-tight">Pronóstico de resultados</h2>
              <p className="text-[11px] text-muted-foreground">
                Fecha estimada, rango y estado frente a la meta de cada sistema.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 p-0.5">
              {([
                { id: 'quarter' as const, label: 'Trimestre' },
                { id: 'year' as const, label: 'Año' },
              ]).map(option => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setHorizon(option.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-bold transition-all',
                    horizon === option.id
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-pressed={horizon === option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 rounded-full px-2 text-[10px]"
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw className={cn('mr-1 h-3 w-3', refreshing && 'animate-spin')} />
              Actualizar
            </Button>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <Chip label={`${cards.length || 13} sistemas`} tone="primary" />
          <Chip label={`${summary.onTrack} en camino`} tone="green" />
          <Chip label={`${summary.atRisk} en riesgo`} tone="amber" />
          <Chip label={`${summary.offTrack} fuera`} tone="red" />
          <Chip label={`${summary.pending} sin datos/meta`} tone="gray" />
          <span className="text-[10px] text-muted-foreground">
            {horizonInfo.label} · hasta {formatShortDate(horizonInfo.endKey)}
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
          Combina el ritmo de los últimos 14 días con una tendencia robusta de 56 días.
          Se recalcula al abrir la pestaña, al volver a la ventana y cada 90 segundos.
        </p>
      </div>

      {loading ? (
        <LoadingGrid />
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-destructive/25 bg-destructive/5 p-6 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <p className="text-sm font-bold">No se pudo cargar el pronóstico</p>
          <p className="max-w-md text-[11px] text-muted-foreground">{error}</p>
          <Button type="button" size="sm" variant="outline" className="rounded-full" onClick={refresh}>
            Reintentar
          </Button>
        </div>
      ) : cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-[11px] text-muted-foreground">
          Todavía no hay resultados para pronosticar. Registra actividad en tus sistemas y vuelve a esta pestaña.
        </div>
      ) : (
        <div className="space-y-4">
          {METAS_SYSTEM_GROUPS.map(group => {
            const groupCards = group.systems
              .map(system => cardById.get(system.id))
              .filter((card): card is SystemForecastCardData => !!card);
            if (!groupCards.length) return null;

            return (
              <section key={group.id} className="space-y-1.5">
                <div className="flex items-center gap-2 px-0.5">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', group.dot)} />
                  <h3 className="text-[11px] font-bold uppercase tracking-wide">{group.title}</h3>
                  {group.note && (
                    <span className="hidden text-[9px] text-muted-foreground sm:inline">{group.note}</span>
                  )}
                  <span className="h-px flex-1 bg-border/60" />
                  <span className="rounded-full border border-border/60 bg-background/60 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-muted-foreground">
                    {groupCards.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 2xl:grid-cols-4">
                  {groupCards.map(card => (
                    <SystemForecastCard
                      key={card.systemId}
                      card={card}
                      onOpen={selected => setSelectedId(selected.systemId)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <p className="px-1 text-[10px] leading-snug text-muted-foreground">
            Un pronóstico no es una promesa: es la proyección con los datos y el ritmo actuales.
            Si el ritmo cambia, la fecha y el estado se recalculan.
          </p>
        </div>
      )}

      <SystemForecastDialog
        card={selectedCard}
        onClose={() => setSelectedId(null)}
        onSetDeadline={setDeadline}
        onClearDeadline={clearDeadline}
      />
    </div>
  );
}
