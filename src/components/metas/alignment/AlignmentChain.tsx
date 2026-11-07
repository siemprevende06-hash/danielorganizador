import { Fragment } from 'react';
import { Link2, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AlignmentLevel, FutureSummary } from '@/lib/alignment';
import {
  Chip,
  SectionHeader,
  TONE,
  type Tone,
} from './alignmentUi';

const STATUS_TONE: Record<AlignmentLevel['status'], Tone> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
  grey: 'gray',
};

export function AlignmentChain({
  levels,
  future,
}: {
  levels: AlignmentLevel[];
  future: FutureSummary;
}) {
  const futureTone: Tone = future.percent == null
    ? 'gray'
    : future.percent >= 70
      ? 'green'
      : future.percent >= 45
        ? 'amber'
        : 'red';

  const empty = levels.every(level => level.compliance == null) && future.total === 0;

  return (
    <section className="space-y-3">
      <SectionHeader
        index="01"
        icon={Link2}
        title="La cadena"
        subtitle="Cómo se conecta hoy con tu futuro."
        chips={<Chip label="Una sola línea" tone="primary" />}
      />

      <div className="rounded-3xl border border-border/50 bg-gradient-to-br from-primary/[0.04] to-violet-500/[0.06] p-3 shadow-sm">
        <div className="flex snap-x snap-mandatory items-stretch overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {levels.map((level, index) => (
            <Fragment key={level.id}>
              <ChainCard level={level} isToday={level.id === 'day'} />
              {index < levels.length - 1 && (
                <Connector
                  tone={STATUS_TONE[level.status]}
                  broken={level.compliance != null && level.compliance < 50}
                />
              )}
            </Fragment>
          ))}
          <Connector tone="violet" broken={false} />
          <FutureCard future={future} tone={futureTone} />
        </div>

        {empty ? (
          <p className="mt-3 border-t border-border/40 pt-2.5 text-center text-[10px] font-semibold text-muted-foreground">
            Cuando registres tu primer día, esta línea empieza a encenderse.
          </p>
        ) : (
          <p className="mt-3 border-t border-border/40 pt-2.5 text-center text-[10px] text-muted-foreground">
            Solo el tiempo te separa del futuro.
          </p>
        )}
      </div>
    </section>
  );
}

function ChainCard({
  level,
  isToday,
}: {
  level: AlignmentLevel;
  isToday: boolean;
}) {
  const tone = STATUS_TONE[level.status];
  const pct = level.compliance;

  return (
    <div
      className={cn(
        'relative min-w-[132px] flex-1 snap-start overflow-hidden rounded-2xl border border-border/50 bg-background/75 p-3 pr-5',
        isToday && 'ring-1 ring-primary/30',
      )}
    >
      <div className="flex items-center gap-1">
        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
          {level.label}
        </span>
        {isToday && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />}
      </div>

      <div className="mt-1.5 flex items-baseline gap-0.5">
        <span className="text-3xl font-bold leading-none tabular-nums">
          {pct == null ? '—' : pct}
        </span>
        {pct != null && <span className="text-xs font-bold text-muted-foreground">%</span>}
      </div>

      <p className="mt-1 text-[10px] tabular-nums text-muted-foreground">
        {level.available > 0
          ? `${level.done}/${level.available} · ${level.minutes} min`
          : 'Sin datos'}
      </p>

      <div className="absolute inset-y-2 right-1.5 w-1 overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn('absolute bottom-0 w-full rounded-full transition-all duration-700', TONE[tone].solid)}
          style={{ height: `${pct ?? 0}%` }}
        />
      </div>
    </div>
  );
}

function Connector({ tone, broken }: { tone: Tone; broken: boolean }) {
  return (
    <div className="flex w-5 shrink-0 items-center justify-center self-stretch">
      <div
        className={cn(
          'relative h-[2px] w-full',
          !broken && 'bg-gradient-to-r from-emerald-500/70 via-primary/60 to-violet-500/70',
        )}
        style={broken
          ? { backgroundImage: 'repeating-linear-gradient(90deg, rgb(245 158 11) 0 4px, transparent 4px 8px)' }
          : undefined}
      >
        <span
          className={cn(
            'absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full',
            TONE[tone].solid,
          )}
        />
        {broken && (
          <Zap className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 bg-background text-amber-500" />
        )}
      </div>
    </div>
  );
}

function FutureCard({ future, tone }: { future: FutureSummary; tone: Tone }) {
  return (
    <div className="relative min-w-[150px] flex-1 snap-start overflow-hidden rounded-2xl border border-violet-500/30 p-3 text-white">
      {future.photo ? (
        <img
          src={future.photo}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-violet-950" />
      )}
      <div className="absolute inset-0 bg-black/45" />

      <div className="relative">
        <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-white/85">
          <Sparkles className="h-3 w-3" />
          Futuro
        </div>
        <div className="mt-1.5 flex items-baseline gap-0.5">
          <span className="text-3xl font-bold leading-none tabular-nums">
            {future.percent == null ? '—' : future.percent}
          </span>
          {future.percent != null && <span className="text-xs font-bold text-white/80">%</span>}
        </div>
        <p className="mt-1 text-[10px] text-white/85">
          {future.total > 0
            ? `${future.total} metas · ${future.onTrack} en camino`
            : 'Aún sin metas futuras'}
        </p>
        <span className={cn('mt-1.5 inline-flex h-1 w-8 rounded-full', TONE[tone].solid)} />
      </div>
    </div>
  );
}
