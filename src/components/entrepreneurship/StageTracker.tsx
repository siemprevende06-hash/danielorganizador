import { Check, ChevronRight, Circle, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getStageIndex, getStageMeta, nextStage, STAGE_ORDER } from '@/lib/entrepreneurship/stages';
import { hexWithAlpha } from '@/lib/entrepreneurship/formatters';
import type { Stage, VentureAnalytics, VentureData } from '@/lib/entrepreneurship/types';
import { GlassCard, ProgressBar, SectionTitle } from './ui';
import { cn } from '@/lib/utils';

const STAGE_ICONS: Record<string, string> = {
  idea: '💡',
  validation: '🧪',
  mvp: '🛠️',
  traction: '📈',
  revenue: '💵',
  scale: '🚀',
  paused: '⏸️',
};

export function StageTracker({
  data,
  analytics,
  onChangeStage,
  onToggleItem,
  compact = false,
}: {
  data: VentureData;
  analytics: VentureAnalytics;
  onChangeStage: (stage: Stage) => void;
  onToggleItem: (key: string, title: string, done: boolean) => void;
  compact?: boolean;
}) {
  const current = data.venture.stage;
  const meta = getStageMeta(current);
  const currentIndex = getStageIndex(current);
  const next = nextStage(current);
  const nextMeta = next ? getStageMeta(next) : null;
  const progress = analytics.stageProgress;

  return (
    <GlassCard className="p-4" accent={meta.color}>
      <SectionTitle
        title="Etapa del negocio"
        subtitle={meta.description}
        action={
          <span
            className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
            style={{ background: hexWithAlpha(meta.color, 0.14), color: meta.color }}
          >
            {meta.label}
          </span>
        }
      />

      {/* Stepper */}
      <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
        {STAGE_ORDER.map((stageKey, index) => {
          const stageMeta = getStageMeta(stageKey);
          const isCurrent = current === stageKey;
          const isDone = current !== 'paused' && index < currentIndex;
          return (
            <div key={stageKey} className="flex min-w-0 flex-1 items-center gap-1">
              <div className="flex min-w-0 flex-col items-center gap-1">
                <div
                  className={cn(
                    'grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] transition-all',
                    isCurrent && 'scale-110 shadow-sm',
                  )}
                  style={{
                    borderColor: isCurrent || isDone ? stageMeta.color : 'hsl(var(--border))',
                    background: isCurrent ? stageMeta.color : isDone ? hexWithAlpha(stageMeta.color, 0.16) : 'hsl(var(--muted))',
                    color: isCurrent ? '#fff' : isDone ? stageMeta.color : 'hsl(var(--muted-foreground))',
                  }}
                  title={stageMeta.label}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : <span>{STAGE_ICONS[stageKey]}</span>}
                </div>
                <span
                  className={cn(
                    'max-w-[64px] truncate text-center text-[9px] leading-tight',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {stageMeta.short}
                </span>
              </div>
              {index < STAGE_ORDER.length - 1 && (
                <div className="mb-4 h-px flex-1" style={{ background: index < currentIndex ? meta.color : 'hsl(var(--border))' }} />
              )}
            </div>
          );
        })}
      </div>

      {current === 'paused' ? (
        <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">
            Este proyecto está en pausa. Reactívalo cuando tengas foco y tiempo para avanzar.
          </p>
          <Button size="sm" variant="outline" className="mt-2 gap-1.5" onClick={() => onChangeStage('idea')}>
            <Play className="h-3.5 w-3.5" /> Reactivar proyecto
          </Button>
        </div>
      ) : (
        <>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {progress.done}/{progress.total} criterios de salida
            </span>
            <span className="font-semibold tabular-nums" style={{ color: meta.color }}>
              {progress.percent}%
            </span>
          </div>
          <ProgressBar value={progress.percent} className="mt-1.5" color={meta.color} />

          {!compact && (
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {progress.items.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleItem(item.key, item.label, !item.done)}
                  className={cn(
                    'flex items-start gap-2 rounded-lg border px-2.5 py-2 text-left text-xs transition-colors',
                    item.done
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-muted-foreground'
                      : 'border-border/60 bg-background/40 hover:border-border',
                  )}
                >
                  {item.done ? (
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                  ) : (
                    <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                  )}
                  <span className={cn('leading-snug', item.done && 'line-through decoration-emerald-500/40')}>{item.label}</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {nextMeta && (
              <Button
                size="sm"
                className="gap-1"
                style={{ background: nextMeta.color, color: '#fff' }}
                onClick={() => onChangeStage(next!)}
              >
                Avanzar a {nextMeta.label}
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button size="sm" variant="outline" className="gap-1.5 text-muted-foreground" onClick={() => onChangeStage('paused')}>
              <Pause className="h-3.5 w-3.5" /> Pausar
            </Button>
            {progress.percent < 100 && nextMeta && (
              <span className="text-[10px] text-muted-foreground">
                Faltan {progress.total - progress.done} criterios (puedes avanzar igual)
              </span>
            )}
          </div>
        </>
      )}
    </GlassCard>
  );
}