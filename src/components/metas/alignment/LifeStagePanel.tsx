import { CalendarRange, ChevronDown, Quote, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LIFE_STAGE } from '@/data/lifeStage';
import { POINT_B_AREAS, VISION_3_YEARS } from '@/data/pointB2027';
import type { PointBSubAxis } from '@/lib/definitions';
import type { SubAreaScore } from '@/hooks/useAreaScores';
import {
  timeProgress,
  type AlignmentAreaLine,
  type FutureSummary,
  type VisionPhoto,
} from '@/lib/alignment';
import { Bar, Chip, SectionHeader, TONE } from './alignmentUi';

const VISION_END = `${LIFE_STAGE.visionYear}-12-31`;

function clamp(value: number): number {
  return Math.max(3, Math.min(97, value));
}

function flattenSub(subs: PointBSubAxis[]): PointBSubAxis[] {
  return subs.flatMap(sub => (sub.children && sub.children.length > 0 ? flattenSub(sub.children) : [sub]));
}

function findSubProgress(subs: SubAreaScore[], id: string): number | null {
  for (const sub of subs) {
    if (sub.id === id) return Math.round(sub.resultados);
    if (sub.children && sub.children.length > 0) {
      const found = findSubProgress(sub.children, id);
      if (found != null) return found;
    }
  }
  return null;
}

function shortLabel(label: string): string {
  return label.replace(' y Bienestar', '').replace(' y Entorno', '').replace(' / Académico', '');
}

export function LifeStagePanel({
  areaLines,
  visionPhotos,
  future,
  lifePct,
}: {
  areaLines: AlignmentAreaLine[];
  visionPhotos: VisionPhoto[];
  future: FutureSummary;
  lifePct: number;
}) {
  const pointBPct = timeProgress(
    LIFE_STAGE.baselineDate,
    VISION_END,
    new Date(`${LIFE_STAGE.pointBYear}-12-31T12:00:00`),
  );

  const milestones = [
    {
      id: 'baseline',
      date: LIFE_STAGE.baselineLabel,
      title: 'Línea base',
      text: `${LIFE_STAGE.name}, ${LIFE_STAGE.age} años · ${LIFE_STAGE.city}`,
      tone: 'primary' as const,
      dot: 'bg-primary',
      left: 0,
    },
    {
      id: 'point-b',
      date: `31 dic ${LIFE_STAGE.pointBYear}`,
      title: 'Point B',
      text: 'El primer corte: los resultados del año.',
      tone: 'amber' as const,
      dot: 'bg-amber-500',
      left: pointBPct,
    },
    {
      id: 'vision',
      date: `${LIFE_STAGE.visionYear}`,
      title: 'Visión',
      text: `La persona que serás a los ${LIFE_STAGE.visionAge}.`,
      tone: 'violet' as const,
      dot: 'bg-violet-500',
      left: 100,
    },
  ];

  return (
    <section className="space-y-3">
      <SectionHeader
        index="03"
        icon={CalendarRange}
        title={`${LIFE_STAGE.age} años → ${LIFE_STAGE.visionAge}`}
        subtitle="Desde dónde partiste y hacia dónde vas."
        chips={(
          <>
            <Chip label={`${LIFE_STAGE.name}, ${LIFE_STAGE.age}`} tone="primary" />
            <Chip label={`Visión ${LIFE_STAGE.visionYear}`} tone="violet" />
          </>
        )}
      />

      <div className="rounded-3xl border border-border/50 bg-white/70 p-4 shadow-sm dark:bg-zinc-950/60">
        <div className="flex items-center gap-3">
          <span className="text-4xl font-bold leading-none tabular-nums">
            {LIFE_STAGE.age}
          </span>
          <div className="relative h-1.5 flex-1 rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-primary to-violet-500"
              style={{ width: `${clamp(lifePct)}%` }}
            />
            {milestones.map(milestone => (
              <span
                key={milestone.id}
                className={cn(
                  'absolute -top-1 h-3.5 w-3.5 -translate-x-1/2 rounded-full ring-2 ring-background',
                  milestone.dot,
                )}
                style={{ left: `${clamp(milestone.left)}%` }}
                title={`${milestone.title}: ${milestone.date}`}
              />
            ))}
            <span
              className="absolute -top-1.5 h-4 w-4 -translate-x-1/2 animate-pulse rounded-full border-2 border-primary bg-background"
              style={{ left: `${clamp(lifePct)}%` }}
              title="Hoy"
            />
          </div>
          <span className="text-4xl font-bold leading-none tabular-nums text-violet-600 dark:text-violet-400">
            {LIFE_STAGE.visionAge}
          </span>
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {milestones.map(milestone => (
            <div
              key={milestone.id}
              className={cn(
                'rounded-2xl border p-3',
                TONE[milestone.tone].border,
                TONE[milestone.tone].bg,
              )}
            >
              <div className="flex items-center gap-1.5">
                <span className={cn('h-2 w-2 rounded-full', milestone.dot)} />
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {milestone.date}
                </p>
              </div>
              <p className="mt-1 text-xs font-bold">{milestone.title}</p>
              <p className="text-[10px] text-muted-foreground">{milestone.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Desde dónde partiste
            </p>
            <p className="max-w-[60%] truncate text-right text-[10px] text-muted-foreground">
              {future.nearest
                ? `Próxima meta: ${future.nearest.list.title} · ${
                    future.nearest.daysLeft >= 0
                      ? `en ${future.nearest.daysLeft} días`
                      : `vencida hace ${Math.abs(future.nearest.daysLeft)} días`
                  }`
                : future.total > 0
                  ? `${future.total} metas sin fecha`
                  : 'Sin metas futuras todavía'}
            </p>
          </div>

          <div className="mt-2 grid gap-1.5 md:grid-cols-2">
            {areaLines.map(area => {
              const pointB = POINT_B_AREAS.find(item => item.id === area.id);
              const leaves = pointB ? flattenSub(pointB.sub) : [];
              const first = leaves[0];
              const firstProgress = first
                ? clamp(findSubProgress(area.sub, first.id) ?? area.results)
                : clamp(area.results);

              return (
                <details
                  key={area.id}
                  className="group rounded-xl border border-border/50 bg-background/60 px-2.5 py-1.5"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-2">
                    <span className="text-sm leading-none">{area.icon}</span>
                    <span className="w-[86px] shrink-0 truncate text-[11px] font-semibold">
                      {shortLabel(area.label)}
                    </span>

                    {first ? (
                      <span className="flex min-w-0 flex-1 items-center gap-1 text-[9px] tabular-nums text-muted-foreground">
                        <span className="shrink-0">{first.start} {first.unit}</span>
                        <span className="relative h-1 min-w-6 flex-1 rounded-full bg-muted">
                          <span
                            className="absolute -top-0.5 h-2 w-2 -translate-x-1/2 rounded-full bg-primary"
                            style={{ left: `${firstProgress}%` }}
                          />
                        </span>
                        <span className="shrink-0">{first.target} {first.unit}</span>
                      </span>
                    ) : (
                      <span className="flex-1 text-[9px] text-muted-foreground">Sin ejes Point B</span>
                    )}

                    <span className="w-7 shrink-0 text-right text-[10px] font-bold tabular-nums">
                      {area.results}%
                    </span>
                    <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>

                  <div className="mt-1.5 space-y-1 border-t border-border/40 pt-1.5">
                    {leaves.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground">
                        Esta área no tiene ejes en Point B.
                      </p>
                    ) : (
                      leaves.slice(0, 5).map(sub => (
                        <div key={sub.id} className="flex items-center gap-1.5">
                          <span className="w-24 truncate text-[9px] text-muted-foreground">{sub.label}</span>
                          <span className="text-[9px] tabular-nums text-muted-foreground">
                            {sub.start} → {sub.target} {sub.unit}
                          </span>
                          <Bar
                            value={findSubProgress(area.sub, sub.id) ?? area.results}
                            tone="primary"
                            height="h-0.5"
                            className="ml-auto w-10"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </details>
              );
            })}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border-l-2 border-primary/40 bg-primary/[0.03] p-3">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Quote className="h-3 w-3" />
            El contrato de los {LIFE_STAGE.age}
          </p>
          <p className="mt-1 whitespace-pre-line text-[11px] italic leading-relaxed text-foreground/80">
            {VISION_3_YEARS}
          </p>
          <p className="mt-2 text-right text-[10px] font-semibold text-muted-foreground">
            — {LIFE_STAGE.name}, {LIFE_STAGE.age}
          </p>
        </div>

        {visionPhotos.length > 0 && (
          <div className="mt-3">
            <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3 w-3 text-violet-500" />
              Tu futuro en fotos
            </p>
            <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {visionPhotos.slice(0, 6).map(photo => (
                <img
                  key={photo.id}
                  src={photo.url}
                  alt={photo.name}
                  loading="lazy"
                  className="aspect-square rounded-xl object-cover transition-transform hover:scale-105"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
