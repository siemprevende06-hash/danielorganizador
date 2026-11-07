import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  ExternalLink,
  LineChart,
  Sparkles,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { SystemForecastCard } from '@/lib/forecasting/systemForecastAdapters';
import { ForecastSparkline } from '@/components/metas/ForecastSparkline';
import {
  DEADLINE_SOURCE_LABEL,
  FORECAST_CONFIDENCE_META,
  FORECAST_STATUS_META,
  formatLongDate,
  forecastProgress,
  forecastRangeText,
} from '@/components/metas/forecastUi';

interface SystemForecastDialogProps {
  card: SystemForecastCard | null;
  onClose: () => void;
  onSetDeadline: (systemId: string, date: string) => void;
  onClearDeadline: (systemId: string) => void;
}

function fmt(value: number | null | undefined, digits = 1): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: digits }).format(value);
}

function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: string;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border border-border/50 bg-muted/20 p-2.5', className)}>
      <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-bold leading-tight tabular-nums">{value}</p>
      {sub && <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SystemForecastDialog({
  card,
  onClose,
  onSetDeadline,
  onClearDeadline,
}: SystemForecastDialogProps) {
  const [deadlineDraft, setDeadlineDraft] = useState('');

  useEffect(() => {
    if (!card) {
      setDeadlineDraft('');
      return;
    }
    setDeadlineDraft(card.deadlineSource === 'custom' ? card.deadline ?? '' : '');
  }, [card?.systemId, card?.deadline, card?.deadlineSource]);

  if (!card) return null;

  const forecast = card.forecast;
  const status = FORECAST_STATUS_META[forecast.status];
  const confidence = FORECAST_CONFIDENCE_META[forecast.confidence];
  const progress = forecastProgress(card);
  const range = forecastRangeText(card);
  const daysLeft = forecast.daysLeft;

  return (
    <Dialog open={!!card} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-1rem)] overflow-y-auto rounded-2xl p-4 sm:max-w-2xl">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-start gap-2.5 pr-6">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-muted/50 text-xl">
              {card.emoji}
            </span>
            <div className="min-w-0">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-base">
                {card.label}
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', status.className)}>
                  {status.label}
                </span>
                <span className={cn('rounded-full border px-2 py-0.5 text-[10px] font-bold', confidence.className)}>
                  {confidence.label}
                </span>
              </DialogTitle>
              <DialogDescription className="mt-0.5 text-[11px]">
                {card.sourceLabel} · {forecast.label}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Stat
              label="Llegada estimada"
              value={formatLongDate(forecast.etaDate)}
              sub={range ? `Rango: ${range}` : forecast.status === 'no-target' ? 'Define una meta para pronosticar' : 'Sin rango suficiente'}
            />
            <Stat
              label="Fecha límite"
              value={formatLongDate(card.deadline)}
              sub={`${DEADLINE_SOURCE_LABEL[card.deadlineSource]}${daysLeft != null ? ` · ${daysLeft >= 0 ? `${daysLeft} días` : `${Math.abs(daysLeft)} días vencida`}` : ''}`}
            />
            <Stat
              label="Ritmo actual"
              value={`${fmt(forecast.pace)} ${forecast.unit}/día`}
              sub={forecast.requiredPace != null ? `Necesitas ${fmt(forecast.requiredPace)} ${forecast.unit}/día` : 'Sin fecha límite exigente'}
            />
            <Stat
              label="Progreso"
              value={card.displayCurrent}
              sub={`${Math.round(progress)}% · meta ${card.displayTarget}`}
            />
            <Stat
              label="Datos usados"
              value={`${forecast.activeDays} / ${forecast.sampleDays} días`}
              sub={forecast.variability != null ? `Variabilidad ${fmt(forecast.variability, 2)}` : 'Días con actividad / días de historia'}
            />
            <Stat
              label="Confianza"
              value={`${forecast.confidenceScore}/100`}
              sub={forecast.confidence === 'baja' ? 'Datos ruidosos o proxy declarado' : 'Calculada con historia y ajuste'}
            />
          </div>

          <div className="rounded-xl border border-border/50 bg-white/60 p-2.5 dark:bg-zinc-950/40">
            <div className="mb-1.5 flex items-center gap-1.5">
              <LineChart className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold">Resultado real y proyección</span>
              <span className="ml-auto text-[9px] text-muted-foreground">Meta: {card.displayTarget}</span>
            </div>
            <ForecastSparkline chart={forecast.chart} target={forecast.target} className="h-28 w-full" />
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 rounded-full bg-primary" /> Real
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 rounded-full border-t border-dashed border-primary/60" /> Proyección
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-4 rounded-sm bg-primary/10" /> Rango P10–P90
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-0.5 w-4 border-t border-dashed border-muted-foreground/60" /> Meta
              </span>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold">Por qué de esta fecha</span>
              </div>
              <ul className="space-y-1 text-[11px] leading-snug">
                {forecast.explanation.map((line, index) => (
                  <li key={index} className="flex gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-border/50 p-2.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold">Contexto</span>
              </div>
              <ul className="space-y-1 text-[11px] leading-snug text-muted-foreground">
                {card.context.map((line, index) => (
                  <li key={index} className="flex gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground/50" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {forecast.assumptions.length > 0 && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-2.5">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                Supuestos del cálculo
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-[10px] leading-snug text-muted-foreground">
                {forecast.assumptions.map((line, index) => (
                  <li key={index}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-xl border border-border/50 p-2.5">
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-bold">Fecha límite propia</span>
            </div>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Si la defines, se usa en lugar de la fecha de la meta, de la próxima meta del sistema o del fin del periodo.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Input
                type="date"
                value={deadlineDraft}
                onChange={event => setDeadlineDraft(event.target.value)}
                className="h-8 w-auto rounded-lg text-xs"
              />
              <Button
                type="button"
                size="sm"
                className="h-8 rounded-full px-3 text-[11px]"
                disabled={!deadlineDraft}
                onClick={() => {
                  onSetDeadline(card.systemId, deadlineDraft);
                  toast.success('Fecha límite propia guardada');
                }}
              >
                Guardar fecha
              </Button>
              {card.deadlineSource === 'custom' && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-8 rounded-full px-3 text-[11px] text-muted-foreground"
                  onClick={() => {
                    onClearDeadline(card.systemId);
                    setDeadlineDraft('');
                    toast.success('Fecha propia eliminada');
                  }}
                >
                  Quitar fecha
                </Button>
              )}
            </div>
            {forecast.targetSource && (
              <p className="mt-2 flex items-start gap-1 text-[10px] text-muted-foreground">
                <CalendarDays className="mt-0.5 h-3 w-3 shrink-0" />
                Fuente de la meta: {forecast.targetSource}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="mt-1 flex-row flex-wrap gap-2">
          <Button asChild className="rounded-full">
            <Link to={card.href} onClick={onClose}>
              Abrir {card.label}
              <ExternalLink className="ml-1 h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button type="button" variant="outline" className="rounded-full" onClick={onClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
