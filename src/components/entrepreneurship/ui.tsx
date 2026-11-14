import { useId, type ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercent, hexWithAlpha } from '@/lib/entrepreneurship/formatters';
import type { LucideIcon } from 'lucide-react';

export function GlassCard({
  className,
  children,
  accent,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { accent?: string }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 backdrop-blur-sm',
        'shadow-[inset_0_1px_0_hsl(var(--foreground)/0.04)]',
        className,
      )}
      {...props}
    >
      {accent && (
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full blur-3xl"
          style={{ background: hexWithAlpha(accent, 0.22) }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function SectionTitle({
  title,
  subtitle,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          {title}
        </h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProgressBar({
  value,
  className,
  color,
}: {
  value: number;
  className?: string;
  color?: string;
}) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${safe}%`, background: color || 'hsl(var(--primary))' }}
      />
    </div>
  );
}

export function Sparkline({
  values,
  color = '#3b82f6',
  height = 36,
}: {
  values: number[];
  color?: string;
  height?: number;
}) {
  const id = useId().replace(/:/g, '');
  const width = 120;
  const data = values.length > 1 ? values : [0, values[0] ?? 0];
  const max = Math.max(...data, 0.0001);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const line = `M${points.join(' L')}`;
  const area = `${line} L${width},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-9 w-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#spark-${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DeltaChip({ value, className }: { value: number; className?: string }) {
  const up = value > 0.0001;
  const down = value < -0.0001;
  const Icon = up ? ArrowUpRight : down ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-medium tabular-nums',
        up && 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        down && 'bg-red-500/10 text-red-600 dark:text-red-400',
        !up && !down && 'bg-muted text-muted-foreground',
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      {formatPercent(Math.abs(value), 1)}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  delta,
  spark,
  accent = '#3b82f6',
  className,
  footer,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  delta?: number;
  spark?: number[];
  accent?: string;
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <GlassCard className={cn('p-4', className)} accent={accent}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">{value}</p>
          {(hint || delta !== undefined) && (
            <div className="mt-1 flex items-center gap-1.5">
              {delta !== undefined && <DeltaChip value={delta} />}
              {hint && <span className="truncate text-[10px] text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-xl"
            style={{ background: hexWithAlpha(accent, 0.12), color: accent }}
          >
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      {spark && spark.length > 0 && <div className="mt-2 -mb-1 opacity-90"><Sparkline values={spark} color={accent} /></div>}
      {footer && <div className="mt-2">{footer}</div>}
    </GlassCard>
  );
}

export function HealthRing({ score, size = 108 }: { score: number; size?: number }) {
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, score));
  const offset = circumference - (safe / 100) * circumference;
  const color = safe >= 70 ? '#22c55e' : safe >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-semibold tabular-nums text-foreground">{safe}</div>
        <div className="text-[9px] uppercase tracking-wider text-muted-foreground">Salud</div>
      </div>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 px-4 py-8 text-center', className)}>
      {Icon && <Icon className="mb-2 h-7 w-7 text-muted-foreground/70" />}
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export function StageChip({
  label,
  color,
  className,
}: {
  label: string;
  color: string;
  className?: string;
}) {
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium', className)}
      style={{ background: hexWithAlpha(color, 0.14), color }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

export function SetupBanner({ tables }: { tables: string[] }) {
  if (!tables.length) return null;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
      <span className="font-medium">Faltan tablas o columnas del dashboard.</span>{' '}
      Aplica <code className="rounded bg-amber-500/15 px-1">supabase/migrations/20261113000000_entrepreneurship_dashboard.sql</code>{' '}
      para activar finanzas, clientes, métricas y experimentos. Mientras tanto, las funciones nuevas quedan desactivadas y los ingresos se guardan en la moneda base.
    </div>
  );
}