import type { ReactNode } from 'react';
import type { SystemGoal } from '@/lib/systemGoals';
import { useAlignmentData } from '@/hooks/useAlignmentData';
import { AlignmentChain } from './AlignmentChain';
import { AlignmentVerdict } from './AlignmentVerdict';
import { AreaLinesPanel } from './AreaLinesPanel';
import { ArrivalForecastPanel } from './ArrivalForecastPanel';
import { LifeStagePanel } from './LifeStagePanel';
import { NeedsRewardsPanel } from './NeedsRewardsPanel';
import { SystemsGoalsPanel } from './SystemsGoalsPanel';
import { Chip, SectionSkeleton } from './alignmentUi';

export function AlignmentPanel({
  goals,
  onOpenForecast,
}: {
  goals: SystemGoal[];
  onOpenForecast: () => void;
}) {
  const data = useAlignmentData(goals);

  if (data.coreLoading) {
    return (
      <div className="space-y-4">
        <SectionSkeleton cards={6} />
        <SectionSkeleton cards={4} />
        <SectionSkeleton cards={4} />
      </div>
    );
  }

  const areasOnPath = data.areaLines.filter(area => area.effort >= 50 || area.results >= 50).length;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute bottom-2 left-3 top-2 hidden w-px bg-gradient-to-b from-emerald-500/30 via-border to-violet-500/30 lg:block" />

      <div className="space-y-4 lg:pl-6">
        <div className="flex flex-wrap items-center gap-1.5 px-0.5">
          <Chip label={`${data.score}% alineado`} tone={data.verdict.tone} />
          <Chip label={`${areasOnPath}/10 áreas en marcha`} tone="primary" />
          <Chip label={`${data.forecast.onTrack} pronósticos en camino`} tone="green" />
          <Chip label={`${data.counts.systemsWithGoal}/${data.counts.systems} sistemas con meta`} tone="amber" />
        </div>

        <Section delay={0}>
          <AlignmentChain levels={data.levels} future={data.future} />
        </Section>

        <Section delay={60}>
          <AlignmentVerdict
            score={data.score}
            verdict={data.verdict}
            timePct={data.timePct}
            strengths={data.strengths}
            blockers={data.blockers}
            todayActions={data.todayActions}
            areaLines={data.areaLines}
          />
        </Section>

        <Section delay={120}>
          <LifeStagePanel
            areaLines={data.areaLines}
            visionPhotos={data.visionPhotos}
            future={data.future}
            lifePct={data.lifePct}
          />
        </Section>

        <Section delay={180}>
          <SystemsGoalsPanel
            rows={data.systemRows}
            counts={data.counts}
            orphanGoals={data.orphanGoals}
            systemsWithoutGoal={data.systemsWithoutGoal}
            needScores={data.needScores}
          />
        </Section>

        <Section delay={240}>
          <AreaLinesPanel areaLines={data.areaLines} systems={data.systems} />
        </Section>

        <Section delay={300}>
          <ArrivalForecastPanel
            effort={data.effort}
            summary={data.forecast}
            cards={data.forecastCards}
            loading={data.forecastLoading}
            error={data.error}
            onOpenForecast={onOpenForecast}
            onRefresh={data.refresh}
          />
        </Section>

        <Section delay={360}>
          <NeedsRewardsPanel
            pillars={data.pillars}
            needScores={data.needScores}
            needLinks={data.needLinks}
            rewards={data.rewards}
          />
        </Section>

        <p className="pb-2 text-center text-xs font-semibold italic text-muted-foreground">
          “No estás esperando el futuro. Lo estás ejecutando.”
        </p>
      </div>
    </div>
  );
}

function Section({ delay, children }: { delay: number; children: ReactNode }) {
  return (
    <div
      className="animate-slide-up motion-reduce:animate-none"
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
