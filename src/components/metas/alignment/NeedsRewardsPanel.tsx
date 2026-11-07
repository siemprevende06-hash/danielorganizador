import { Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NeedLink, PillarSummary, RewardImage } from '@/lib/alignment';
import {
  Chip,
  Ring,
  SectionHeader,
  TONE,
} from './alignmentUi';

export function NeedsRewardsPanel({
  pillars,
  needScores,
  needLinks,
  rewards,
}: {
  pillars: PillarSummary[];
  needScores: Record<string, number>;
  needLinks: Record<string, NeedLink>;
  rewards: RewardImage[];
}) {
  const allNeeds = pillars.flatMap(pillar =>
    pillar.needs.map(need => ({
      need,
      score: needScores[need.necesidad_id] ?? need.progreso ?? 0,
    })),
  );
  const next = [...allNeeds].sort((a, b) => b.score - a.score)[0] ?? null;
  const nextId = next && next.score > 0 ? next.need.necesidad_id : null;

  return (
    <section className="space-y-3">
      <SectionHeader
        index="07"
        icon={Gift}
        title="Necesidades y recompensas"
        subtitle="La cosecha de cada día cumplido."
        chips={(
          <>
            <Chip label={`${pillars.reduce((sum, pillar) => sum + pillar.needs.length, 0)} necesidades`} tone="violet" />
            <Chip label={`${rewards.length} recompensas`} tone="primary" />
          </>
        )}
      />

      <div className="rounded-3xl border border-border/50 bg-white/70 p-3 shadow-sm dark:bg-zinc-950/60">
        <div className="grid gap-2 lg:grid-cols-3">
          {pillars.map(pillar => (
            <div
              key={pillar.id}
              className="rounded-2xl border border-border/50 bg-background/60 p-2.5"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{pillar.icon}</span>
                <p className="min-w-0 flex-1 truncate text-xs font-bold">{pillar.short}</p>
                <Chip label={`${pillar.score}%`} tone="violet" />
              </div>

              <div className="mt-2 space-y-1.5">
                {pillar.needs.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border/60 p-2 text-[10px] text-muted-foreground">
                    Sin necesidades vinculadas todavía.
                  </p>
                ) : (
                  pillar.needs.map(need => {
                    const score = needScores[need.necesidad_id] ?? need.progreso ?? 0;
                    const link = needLinks[need.necesidad_id];
                    const isNext = need.necesidad_id === nextId;

                    return (
                      <div
                        key={need.necesidad_id}
                        className={cn(
                          'flex items-center gap-2 rounded-2xl border bg-background/70 p-2',
                          isNext ? 'border-violet-500/30' : 'border-border/50',
                        )}
                      >
                        <span className="text-base leading-none">{need.icono || '⭐'}</span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1">
                            <p className="truncate text-[11px] font-semibold">{need.titulo}</p>
                            {isNext && (
                              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-violet-500/25 bg-violet-500/10 px-1 py-0.5 text-[8px] font-bold text-violet-600 dark:text-violet-400">
                                <Sparkles className="h-2.5 w-2.5 animate-sparkle" />
                                Próxima
                              </span>
                            )}
                          </div>
                          <p className="truncate text-[9px] text-muted-foreground">
                            {link
                              ? `${link.systemLabel ?? 'Sistema'} → ${link.areaLabel ?? 'Área'} → Necesidad`
                              : 'Necesidad sin área vinculada'}
                          </p>
                        </div>
                        <Ring value={score} size={44} stroke={4} tone={isNext ? 'violet' : 'primary'} />
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>

        {rewards.length > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tus recompensas
              </p>
              <span className="text-[9px] text-muted-foreground">Compartidas con Motivos</span>
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {rewards.slice(0, 6).map(reward => (
                <img
                  key={reward.id}
                  src={reward.url}
                  alt={reward.section}
                  loading="lazy"
                  className="aspect-square rounded-xl object-cover transition-transform hover:scale-105"
                />
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-center text-xs font-semibold italic text-muted-foreground">
          “Cada día cumplido es una cuota de esta recompensa.”
        </p>
        <span className={cn('mx-auto mt-1 block h-0.5 w-16 rounded-full', TONE.violet.solid)} />
      </div>
    </section>
  );
}
