import { useState } from 'react';
import { Activity, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALIGNMENT_LEVELS, type AlignmentAreaLine } from '@/lib/alignment';
import { DIAGNOSIS_TONE } from '@/lib/areaSystemsMap';
import { PLAN_SYSTEM_META, type PlanSystemMetrics } from '@/lib/planSystems';
import {
  Bar,
  Chip,
  SectionHeader,
  TONE,
  toneForDiagnosis,
  type Tone,
} from './alignmentUi';

export function AreaLinesPanel({
  areaLines,
  systems,
}: {
  areaLines: AlignmentAreaLine[];
  systems: Record<string, PlanSystemMetrics>;
}) {
  return (
    <section className="space-y-3">
      <SectionHeader
        index="05"
        icon={Activity}
        title="Las 10 áreas"
        subtitle="E = esfuerzo del mes · R = avance hacia Point B."
        chips={<Chip label={`${areaLines.filter(area => area.effort >= 50 || area.results >= 50).length}/10 en marcha`} tone="primary" />}
      />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {areaLines.map(area => (
          <AreaCard key={area.id} area={area} systems={systems} />
        ))}
      </div>
    </section>
  );
}

function AreaCard({
  area,
  systems,
}: {
  area: AlignmentAreaLine;
  systems: Record<string, PlanSystemMetrics>;
}) {
  const [open, setOpen] = useState(false);
  const gap = area.effort - area.results;
  const diagnosisTone = DIAGNOSIS_TONE[area.diagnosis.tone];
  const measurable = area.systems.filter(id => systems[id]);
  const weeks = (area.plan?.weeks ?? [])
    .map(week => week.compliance)
    .filter((value): value is number => value != null);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/50 bg-white/70 p-3 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md dark:bg-zinc-950/60">
      <div className="flex items-center gap-1.5">
        <span className="text-base leading-none">{area.icon}</span>
        <p className="min-w-0 flex-1 truncate text-xs font-bold">{area.label}</p>
        <span
          className={cn(
            'shrink-0 rounded-full border px-1.5 py-0.5 text-[9px] font-bold',
            diagnosisTone.border,
            diagnosisTone.bg,
            diagnosisTone.text,
          )}
          title={area.diagnosis.message}
        >
          {area.diagnosis.short}
        </span>
      </div>

      <div className="mt-2.5 space-y-1.5">
        <LabeledBar label="E" value={area.effort} tone="sky" hint="Esfuerzo: consistencia del mes" />
        <LabeledBar label="R" value={area.results} tone="green" hint="Resultados: avance hacia Point B" />
      </div>

      <p
        className={cn(
          'mt-1 text-right text-[9px] font-bold tabular-nums',
          gap > 0 ? 'text-amber-600 dark:text-amber-400' : gap < 0 ? 'text-sky-600 dark:text-sky-400' : 'text-muted-foreground',
        )}
      >
        {gap === 0 ? 'Sin brecha' : `${gap > 0 ? '+' : ''}${gap} brecha`}
      </p>

      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1">
          {ALIGNMENT_LEVELS.map(level => {
            const value = area.levels[level.id];
            const tone: Tone = value == null
              ? 'gray'
              : value >= 80
                ? 'green'
                : value >= 50
                  ? 'amber'
                  : 'red';
            return (
              <span
                key={level.id}
                title={`${level.label}: ${value == null ? 'sin datos' : `${value}%`}`}
                className={cn('h-1.5 w-1.5 rounded-full', TONE[tone].solid)}
              />
            );
          })}
        </div>
        <span className="text-[8px] font-bold tracking-widest text-muted-foreground">H S M T A</span>
      </div>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="min-w-0 flex-1 truncate text-[9px] text-muted-foreground">
          {area.plan?.weakestAnchor
            ? `Ancla débil: ${area.plan.weakestAnchor.name} ${area.plan.weakestAnchor.compliance}%`
            : area.vision ?? 'Sin ancla registrada'}
        </p>
        <Sparkline values={weeks} />
      </div>

      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-lg py-1 text-[9px] font-bold text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-expanded={open}
      >
        {open ? 'Ocultar sistemas' : 'Ver sistemas'}
        <ChevronDown className={cn('h-3 w-3 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="mt-1 space-y-1 rounded-xl bg-muted/20 p-2">
          {measurable.length === 0 ? (
            <p className="text-[9px] text-muted-foreground">Sin sistemas medibles en esta área.</p>
          ) : (
            measurable.map(id => {
              const system = systems[id];
              const value = system.compliance;
              const tone: Tone = value == null
                ? 'gray'
                : value >= 80
                  ? 'green'
                  : value >= 50
                    ? 'amber'
                    : 'red';
              return (
                <div key={id} className="flex items-center gap-1.5">
                  <span className="w-16 truncate text-[9px] font-semibold">
                    {PLAN_SYSTEM_META[id]?.name ?? id}
                  </span>
                  <Bar value={value} tone={tone} height="h-0.5" className="flex-1" />
                  <span className="w-7 text-right text-[9px] tabular-nums text-muted-foreground">
                    {value == null ? '—' : `${value}%`}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

function LabeledBar({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: number;
  tone: Tone;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={hint}>
      <span className="w-2 text-[9px] font-bold text-muted-foreground">{label}</span>
      <Bar value={value} tone={tone} height="h-1" className="flex-1" />
      <span className="w-6 text-right text-[9px] font-bold tabular-nums">{value}%</span>
    </div>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) {
    return <span className="text-[8px] text-muted-foreground">sin historial</span>;
  }

  const width = 60;
  const height = 16;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - (Math.max(0, Math.min(100, value)) / 100) * height;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="shrink-0 text-primary/60"
      aria-label="Tendencia semanal del área"
      role="img"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
