import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export type Tone = "blue" | "emerald" | "amber" | "rose" | "violet" | "slate";

export const TONES: Record<Tone, { text: string; bg: string; border: string; bar: string; hex: string }> = {
  blue: { text: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", bar: "bg-blue-500", hex: "#3b82f6" },
  emerald: { text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", bar: "bg-emerald-500", hex: "#10b981" },
  amber: { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", bar: "bg-amber-500", hex: "#f59e0b" },
  rose: { text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/20", bar: "bg-rose-500", hex: "#f43f5e" },
  violet: { text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10", border: "border-violet-500/20", bar: "bg-violet-500", hex: "#8b5cf6" },
  slate: { text: "text-muted-foreground", bg: "bg-muted/60", border: "border-border", bar: "bg-muted-foreground/40", hex: "#94a3b8" },
};

export function formatMinutes(minutes: number): string {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const rest = safe % 60;
  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
}

export function formatHours(minutes: number): string {
  return `${(Math.max(0, minutes) / 60).toFixed(1)}h`;
}

export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
  if (abs >= 10_000) return `${(value / 1_000).toFixed(1).replace(".", ",")}k`;
  return value.toLocaleString("es-ES", { maximumFractionDigits: 0 });
}

export function formatCup(value: number): string {
  return `${formatCompact(value)} CUP`;
}

export function formatUsdFromCup(value: number, rate: number): string {
  const safeRate = rate > 0 ? rate : 1;
  return `$${(value / safeRate).toLocaleString("es-ES", { maximumFractionDigits: 0 })}`;
}

export function toneForCompliance(value: number): Tone {
  if (value >= 100) return "emerald";
  if (value >= 60) return "blue";
  if (value >= 30) return "amber";
  if (value > 0) return "rose";
  return "slate";
}

export function complianceLabel(value: number): string {
  if (value >= 100) return "Cumplido";
  if (value >= 60) return "En marcha";
  if (value > 0) return "Bajo";
  return "Sin datos";
}

export function SectionHeader({
  icon,
  title,
  subtitle,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3", className)}>
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-muted/40 text-muted-foreground">
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-foreground">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "blue",
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  const palette = TONES[tone];
  return (
    <Card className={cn("relative overflow-hidden p-4", className)}>
      <div className={cn("absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-60", palette.bg)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-bold leading-none tracking-tight tabular-nums text-foreground">{value}</p>
          {hint ? <p className="mt-1.5 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border", palette.bg, palette.border, palette.text)}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export function ScoreRing({
  value,
  size = 96,
  stroke = 9,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (safe / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold leading-none tabular-nums text-foreground">{safe}%</span>
        {label ? <span className="mt-1 text-[9px] uppercase tracking-wider text-muted-foreground">{label}</span> : null}
      </div>
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="flex min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 px-4 py-6 text-center">
      <p className="text-xs text-muted-foreground">{message}</p>
      {action}
    </div>
  );
}
