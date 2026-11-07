import { AlertCircle, CalendarDays, Check, Flame, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatGoalDate } from '@/lib/metasSistemas';
import type {
  AlignmentCounts,
  SystemMapGoal,
  SystemMapRow,
} from '@/lib/alignment';
import type { MetaSystemDef } from '@/lib/metasSistemas';
import {
  Bar,
  Chip,
  SectionHeader,
  TONE,
  type Tone,
} from './alignmentUi';

const ROW_TONE: Record<SystemMapRow['tone'], Tone> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
  grey: 'gray',
};

const FORECAST_SHORT: Record<string, string> = {
  achieved: 'lograda',
  'on-track': 'en camino',
  'at-risk': 'en riesgo',
  'off-track': 'fuera',
  'no-target': 'sin meta',
  'no-data': 'sin datos',
};

export function SystemsGoalsPanel({
  rows,
  counts,
  orphanGoals,
  systemsWithoutGoal,
  needScores,
}: {
  rows: SystemMapRow[];
  counts: AlignmentCounts;
  orphanGoals: SystemMapGoal[];
  systemsWithoutGoal: MetaSystemDef[];
  needScores: Record<string, number>;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader
        index="04"
        icon={Network}
        title="El mapa"
        subtitle="Sistemas → Metas → Necesidades."
        chips={(
          <>
            <Chip label={`${counts.systemsWithGoal}/${counts.systems} con meta`} tone="primary" />
            <Chip label={`${counts.systemGoals + counts.futureGoals} metas activas`} tone="green" />
            <Chip label={`${counts.needsWithSystem}/${counts.needs} necesidades`} tone="violet" />
            <Chip label={`${orphanGoals.length} huérfanas`} tone="amber" />
          </>
        )}
      />

      <div className="rounded-3xl border border-border/50 bg-white/70 p-3 shadow-sm dark:bg-zinc-950/60">
        <p className="text-xs font-semibold text-foreground/80">
          Un sistema sin meta es solo un hábito. Una meta sin sistema es solo un deseo.
        </p>

        <div className="mt-3 hidden grid-cols-[1.1fr_28px_1.3fr_28px_1fr] gap-1 px-1 text-[9px] font-bold uppercase tracking-widest text-muted-foreground md:grid">
          <span>Sistemas</span>
          <span />
          <span>Metas</span>
          <span />
          <span>Necesidades</span>
        </div>

        <div className="mt-1.5 space-y-1.5">
          {rows.map(row => (
            <MapRow key={row.system.id} row={row} needScores={needScores} />
          ))}
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-2">
          <div className="rounded-2xl border border-border/50 bg-muted/20 p-3">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Sistemas sin meta
            </p>
            {systemsWithoutGoal.length === 0 ? (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Todos los sistemas tienen al menos una meta.
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {systemsWithoutGoal.map(system => (
                  <span
                    key={system.id}
                    className="rounded-full border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-400"
                  >
                    {system.emoji} {system.label}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-muted/20 p-3">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <AlertCircle className="h-3 w-3" />
              Metas huérfanas
            </p>
            {orphanGoals.length === 0 ? (
              <p className="mt-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Ninguna meta está fuera de un sistema.
              </p>
            ) : (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {orphanGoals.slice(0, 8).map(goal => (
                  <span
                    key={goal.id}
                    className="max-w-full truncate rounded-full border border-border/60 bg-background/70 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground"
                  >
                    {goal.title}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MapRow({
  row,
  needScores,
}: {
  row: SystemMapRow;
  needScores: Record<string, number>;
}) {
  const tone = ROW_TONE[row.tone];
  const firstNeed = row.needs[0] ?? null;
  const needScore = firstNeed
    ? needScores[firstNeed.necesidad_id] ?? firstNeed.progreso ?? 0
    : null;

  return (
    <div className="group grid gap-1.5 rounded-2xl border border-border/50 bg-background/60 p-2 transition-colors hover:border-primary/25 hover:bg-primary/[0.04] md:grid-cols-[1.1fr_28px_1.3fr_28px_1fr] md:items-center">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-muted/60 text-base">
          {row.system.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xs font-bold">{row.system.label}</p>
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', TONE[tone].solid)} />
            <span className="tabular-nums">
              {row.compliance == null ? 'Sin datos' : `${row.compliance}%`}
            </span>
            {row.metrics && row.metrics.streak > 0 && (
              <span className="inline-flex items-center gap-0.5">
                <Flame className="h-3 w-3 text-amber-500" />
                {row.metrics.streak}
              </span>
            )}
            {row.forecast && (
              <span className="truncate">{FORECAST_SHORT[row.forecast.forecast.status] ?? ''}</span>
            )}
          </div>
        </div>
      </div>

      <Connector tone={tone} broken={row.tone === 'red'} />

      {row.goals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground">
          Sin meta
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border border-border/50 bg-background/70 px-2 py-1.5">
          <div className="flex items-start gap-1">
            <p className="line-clamp-2 min-w-0 flex-1 text-[11px] font-semibold leading-tight">
              {row.nextGoal?.title ?? 'Meta sin título'}
            </p>
            {row.goals.length > 1 && (
              <span className="shrink-0 rounded-full bg-muted px-1 text-[9px] font-bold tabular-nums">
                +{row.goals.length - 1}
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground">
            <CalendarDays className="h-2.5 w-2.5" />
            <span>{row.nextGoal?.date ? formatGoalDate(row.nextGoal.date) : 'Sin fecha'}</span>
            {row.nextGoal?.completed && <Check className="h-2.5 w-2.5 text-emerald-500" />}
          </div>
          {row.nextGoal?.progress != null && (
            <Bar value={row.nextGoal.progress} tone="primary" height="h-0.5" className="mt-1" />
          )}
        </div>
      )}

      <Connector tone={tone} broken={row.tone === 'red'} />

      {firstNeed == null ? (
        <div className="rounded-xl border border-dashed border-border/60 px-2 py-1.5 text-[10px] text-muted-foreground">
          Sin necesidad directa
        </div>
      ) : (
        <div className="min-w-0 rounded-xl border border-border/50 bg-background/70 px-2 py-1.5">
          <div className="flex items-center gap-1">
            <span className="text-sm leading-none">{firstNeed.icono}</span>
            <p className="truncate text-[11px] font-semibold">{firstNeed.titulo}</p>
          </div>
          <div className="mt-1 flex items-center gap-1">
            <Bar value={needScore} tone="violet" height="h-0.5" className="flex-1" />
            <span className="text-[9px] font-bold tabular-nums text-muted-foreground">{needScore}%</span>
          </div>
          {row.needs.length > 1 && (
            <p className="mt-0.5 text-[9px] text-muted-foreground">+{row.needs.length - 1} más</p>
          )}
        </div>
      )}
    </div>
  );
}

function Connector({ tone, broken }: { tone: Tone; broken: boolean }) {
  return (
    <div className="flex items-center justify-center self-stretch py-0.5">
      <span
        className={cn(
          'hidden h-[1.5px] w-full md:block',
          !broken && 'bg-gradient-to-r from-border via-border to-border',
        )}
        style={broken
          ? { backgroundImage: 'repeating-linear-gradient(90deg, rgb(245 158 11 / 0.55) 0 4px, transparent 4px 8px)' }
          : undefined}
      >
        <span className={cn('block h-full w-1/2', TONE[tone].solid, 'opacity-30')} />
      </span>
      <span
        className={cn('h-4 w-[1.5px] md:hidden', broken ? 'bg-amber-500/40' : 'bg-border')}
        aria-hidden="true"
      />
    </div>
  );
}
