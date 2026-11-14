import { AlertTriangle, ArrowRight, CheckCircle2, Info, Sparkles, TrendingDown } from 'lucide-react';
import type { NextAction } from '@/lib/entrepreneurship/types';
import { cn } from '@/lib/utils';
import { GlassCard, SectionTitle } from './ui';

const TONE = {
  danger: {
    icon: TrendingDown,
    border: 'border-l-red-500',
    bg: 'bg-red-500/5',
    text: 'text-red-600 dark:text-red-400',
  },
  warning: {
    icon: AlertTriangle,
    border: 'border-l-amber-500',
    bg: 'bg-amber-500/5',
    text: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    icon: Info,
    border: 'border-l-sky-500',
    bg: 'bg-sky-500/5',
    text: 'text-sky-600 dark:text-sky-400',
  },
  success: {
    icon: CheckCircle2,
    border: 'border-l-emerald-500',
    bg: 'bg-emerald-500/5',
    text: 'text-emerald-600 dark:text-emerald-400',
  },
} as const;

export function NextBestActions({ actions, onAction }: { actions: NextAction[]; onAction: (tab: string) => void }) {
  return (
    <GlassCard className="p-4">
      <SectionTitle
        title="Próximas acciones"
        subtitle="Lo que más mueve la aguja ahora mismo"
        icon={Sparkles}
      />
      <div className="mt-3 space-y-2">
        {actions.length === 0 && (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/5 px-3 py-4 text-center text-xs text-emerald-700 dark:text-emerald-300">
            Todo bajo control. Mantén el ritmo y registra tus avances.
          </div>
        )}
        {actions.map((action) => {
          const tone = TONE[action.tone];
          const Icon = tone.icon;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action.tab)}
              className={cn(
                'flex w-full items-start gap-2.5 rounded-lg border border-l-2 border-border/60 px-3 py-2.5 text-left transition-colors hover:bg-muted/40',
                tone.border,
                tone.bg,
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone.text)} />
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-medium text-foreground">{action.title}</span>
                <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{action.description}</span>
              </span>
              <span className={cn('mt-0.5 flex shrink-0 items-center gap-0.5 text-[10px] font-medium', tone.text)}>
                {action.cta}
                <ArrowRight className="h-3 w-3" />
              </span>
            </button>
          );
        })}
      </div>
    </GlassCard>
  );
}