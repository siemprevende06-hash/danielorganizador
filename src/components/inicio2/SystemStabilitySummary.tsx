import type { ReactNode } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CalendarCheck,
  Flame,
  Minus,
  Target,
  TrendingUp,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PlanSystemMetricsResult } from "@/hooks/usePlanSystemMetrics";
import { PLAN_SYSTEM_META, type PlanSystemMetrics } from "@/lib/planSystems";
import { cn } from "@/lib/utils";
import { TONES, toneForCompliance } from "./shared";
import { SYSTEM_GROUPS } from "./systemGroups";

interface StabilityEntry {
  id: string;
  name: string;
  emoji: string;
  system: PlanSystemMetrics;
}

function entriesFor(metrics: PlanSystemMetricsResult): StabilityEntry[] {
  return SYSTEM_GROUPS.flatMap(group =>
    group.systemIds.flatMap(id => {
      const meta = PLAN_SYSTEM_META[id];
      const system = metrics.systems[id];
      if (!meta || !system) return [];
      return [{ id, name: meta.name, emoji: meta.emoji, system }];
    }),
  );
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function trendIcon(trend: number | null) {
  if (trend == null || trend === 0) return <Minus className="h-3.5 w-3.5" />;
  return trend > 0
    ? <ArrowUpRight className="h-3.5 w-3.5" />
    : <ArrowDownRight className="h-3.5 w-3.5" />;
}

function trendText(trend: number | null): string {
  if (trend == null) return "—";
  if (trend > 0) return `+${Math.round(trend)}`;
  return `${Math.round(trend)}`;
}

function SummaryStat({
  label,
  value,
  hint,
  icon,
  tone = "slate",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  tone?: keyof typeof TONES;
}) {
  const palette = TONES[tone];
  return (
    <div className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-2.5">
      <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
        <span className={cn("grid h-4 w-4 shrink-0 place-items-center rounded", palette.bg, palette.text)}>
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-extrabold leading-none tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 truncate text-[9px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Resumen de estabilidad que acompaña a las tarjetas de "Sistemas en detalle".
 * La racha y la tendencia importan más que la meta: un sistema que se cumple
 * todos los días vuelve inevitables los resultados.
 */
export function SystemStabilitySummary({ metrics }: { metrics: PlanSystemMetricsResult }) {
  const entries = entriesFor(metrics);
  const done = entries.reduce((sum, entry) => sum + entry.system.daysDone, 0);
  const available = entries.reduce((sum, entry) => sum + entry.system.daysTotal, 0);
  const compliance = available > 0 ? Math.round((done / available) * 100) : null;

  const avgStreak = average(entries.map(entry => entry.system.streak)) ?? 0;
  const trends = entries
    .map(entry => entry.system.trend)
    .filter((trend): trend is number => trend != null);
  const avgTrend = average(trends);

  const greenWeeks = entries.reduce((sum, entry) => sum + entry.system.greenWeeks, 0);
  const totalWeeks = entries.reduce((sum, entry) => sum + entry.system.totalWeeks, 0);
  const greenPct = totalWeeks > 0 ? Math.round((greenWeeks / totalWeeks) * 100) : null;

  const onTarget = entries.filter(entry => entry.system.targetMet === true).length;
  const ranked = entries
    .filter(entry => entry.system.compliance != null)
    .sort((a, b) => (b.system.compliance ?? 0) - (a.system.compliance ?? 0));
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  return (
    <Card className="p-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        <SummaryStat
          label="Cumplimiento"
          value={compliance == null ? "—" : `${compliance}%`}
          hint={`${done}/${available} días cumplidos`}
          icon={<Activity className="h-3 w-3" />}
          tone={compliance == null ? "slate" : toneForCompliance(compliance)}
        />
        <SummaryStat
          label="Racha media"
          value={`${avgStreak.toFixed(avgStreak % 1 === 0 ? 0 : 1)}d`}
          hint="Días seguidos por sistema"
          icon={<Flame className="h-3 w-3" />}
          tone={avgStreak > 0 ? "amber" : "slate"}
        />
        <SummaryStat
          label="Tendencia"
          value={trendText(avgTrend)}
          hint="Vs periodo anterior"
          icon={trendIcon(avgTrend)}
          tone={avgTrend == null || avgTrend === 0 ? "slate" : avgTrend > 0 ? "emerald" : "rose"}
        />
        <SummaryStat
          label="Semanas verdes"
          value={greenPct == null ? "—" : `${greenPct}%`}
          hint={`${greenWeeks}/${totalWeeks} semanas ≥80%`}
          icon={<CalendarCheck className="h-3 w-3" />}
          tone={greenPct == null ? "slate" : toneForCompliance(greenPct)}
        />
        <SummaryStat
          label="En meta"
          value={`${onTarget}/${entries.length}`}
          hint="Sistemas que cumplen su meta"
          icon={<Target className="h-3 w-3" />}
          tone={entries.length > 0 && onTarget === entries.length ? "emerald" : "blue"}
        />
        <SummaryStat
          label="Días"
          value={`${done}/${available}`}
          hint="Cumplidos / disponibles"
          icon={<TrendingUp className="h-3 w-3" />}
          tone={compliance == null ? "slate" : toneForCompliance(compliance)}
        />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border/60 pt-2.5 text-[10px]">
        <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Más fuerte</span>
          {strongest ? (
            <span className="truncate text-foreground">
              {strongest.emoji} {strongest.name} · {strongest.system.compliance}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
        <span className="inline-flex min-w-0 items-center gap-1 text-muted-foreground">
          <span className="font-semibold text-rose-600 dark:text-rose-400">Más débil</span>
          {weakest ? (
            <span className="truncate text-foreground">
              {weakest.emoji} {weakest.name} · {weakest.system.compliance}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </span>
        <span className="ml-auto text-muted-foreground">
          Un sistema que se cumple todos los días vuelve inevitables los resultados.
        </span>
      </div>
    </Card>
  );
}
