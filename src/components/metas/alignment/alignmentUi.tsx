import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Piezas visuales compartidas por las secciones de Alineación.
// La app es cálida y sobria: bordes suaves, números tabulares y color con
// significado. El violeta queda reservado para el futuro.
// ---------------------------------------------------------------------------

export type Tone =
  | 'green'
  | 'amber'
  | 'red'
  | 'gray'
  | 'primary'
  | 'violet'
  | 'sky';

export const TONE: Record<Tone, {
  text: string;
  bg: string;
  border: string;
  solid: string;
  ring: string;
}> = {
  green: {
    text: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/25',
    solid: 'bg-emerald-500',
    ring: 'stroke-emerald-500',
  },
  amber: {
    text: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/25',
    solid: 'bg-amber-500',
    ring: 'stroke-amber-500',
  },
  red: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-500/10',
    border: 'border-red-500/25',
    solid: 'bg-red-500',
    ring: 'stroke-red-500',
  },
  gray: {
    text: 'text-muted-foreground',
    bg: 'bg-muted/40',
    border: 'border-border/60',
    solid: 'bg-muted-foreground/40',
    ring: 'stroke-muted-foreground/40',
  },
  primary: {
    text: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/25',
    solid: 'bg-primary',
    ring: 'stroke-primary',
  },
  violet: {
    text: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/25',
    solid: 'bg-violet-500',
    ring: 'stroke-violet-500',
  },
  sky: {
    text: 'text-sky-600 dark:text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/25',
    solid: 'bg-sky-500',
    ring: 'stroke-sky-500',
  },
};

export function Chip({
  label,
  tone = 'gray',
  icon: Icon,
  className,
}: {
  label: string;
  tone?: Tone;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums',
        TONE[tone].border,
        TONE[tone].bg,
        TONE[tone].text,
        className,
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {label}
    </span>
  );
}

export function SectionHeader({
  index,
  icon: Icon,
  title,
  subtitle,
  chips,
}: {
  index: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  chips?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 px-0.5">
      <div className="flex min-w-0 items-start gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold tabular-nums text-muted-foreground/60">
              {index}
            </span>
            <h2 className="text-sm font-bold leading-tight">{title}</h2>
          </div>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      {chips && <div className="ml-auto flex flex-wrap items-center gap-1.5">{chips}</div>}
    </div>
  );
}

export function Ring({
  value,
  size = 120,
  stroke = 8,
  tone = 'primary',
  label,
  hint,
}: {
  value: number | null;
  size?: number;
  stroke?: number;
  tone?: Tone;
  label?: string;
  hint?: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className="relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={label ?? `${Math.round(pct)}%`}
      title={hint}
    >
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (circumference * pct) / 100}
          className={cn('transition-[stroke-dashoffset] duration-700', TONE[tone].ring)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={cn(
            'font-bold leading-none tabular-nums',
            size <= 52 ? 'text-xs' : size <= 80 ? 'text-xl' : 'text-3xl',
          )}
        >
          {value == null ? '—' : Math.round(value)}
        </span>
        {size > 52 && (
          <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
            alineado
          </span>
        )}
      </div>
    </div>
  );
}

export function Bar({
  value,
  tone = 'primary',
  height = 'h-1.5',
  className,
}: {
  value: number | null;
  tone?: Tone;
  height?: string;
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div className={cn('overflow-hidden rounded-full bg-muted', height, className)}>
      <div
        className={cn('h-full rounded-full transition-all duration-500', TONE[tone].solid)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionSkeleton({ cards = 4 }: { cards?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <div className="h-8 w-8 animate-pulse rounded-2xl bg-muted/60" />
        <div className="space-y-1.5">
          <div className="h-3 w-32 animate-pulse rounded-full bg-muted/60" />
          <div className="h-2.5 w-48 animate-pulse rounded-full bg-muted/40" />
        </div>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-2xl bg-muted/40" />
        ))}
      </div>
    </div>
  );
}

/** Conecta un tono de diagnóstico con la paleta compartida. */
export function toneForDiagnosis(tone: 'green' | 'amber' | 'red' | 'blue' | 'grey'): Tone {
  if (tone === 'blue') return 'sky';
  if (tone === 'grey') return 'gray';
  return tone;
}
