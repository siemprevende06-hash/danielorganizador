import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Flame, Layers, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Timeframe } from "@/contexts/TimeframeContext";
import type { LifeSystemSummary } from "@/hooks/useLifeOverview";
import { cn } from "@/lib/utils";
import { PERIOD_LABEL } from "./PeriodSwitch";
import {
  EmptyState,
  SectionHeader,
  TONES,
  complianceLabel,
  formatMinutes,
  toneForCompliance,
} from "./shared";

function SystemTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="rounded-xl border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="font-semibold text-foreground">{data.icon} {data.name}</p>
      <p className="mt-1 text-muted-foreground">
        Promedio: <span className="font-semibold text-foreground">{data.avg} min/día</span>
      </p>
      <p className="text-muted-foreground">
        Meta: <span className="font-semibold text-foreground">{data.target} min/día</span>
      </p>
      <p className="text-muted-foreground">
        Total: <span className="font-semibold text-foreground">{formatMinutes(data.total)}</span>
      </p>
    </div>
  );
}

export function SystemsSummaryCard({
  systems,
  loading,
  timeframe,
}: {
  systems: LifeSystemSummary[];
  loading: boolean;
  timeframe: Timeframe;
}) {
  const chartData = systems.map((system) => ({
    ...system,
    avg: system.avgMinutes,
    target: system.targetMinutes,
    total: system.totalMinutes,
    fill: TONES[toneForCompliance(system.compliance)].hex,
  }));
  const hasData = systems.some((system) => system.totalMinutes > 0);
  const totalMinutes = systems.reduce((sum, system) => sum + system.totalMinutes, 0);

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Layers className="h-4 w-4" />}
        title="Sistemas de vida"
        subtitle={`Minutos promedio por día vs meta · ${PERIOD_LABEL[timeframe] || "este periodo"}`}
        action={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-medium">
              <Target className="mr-1 h-3 w-3" /> {formatMinutes(totalMinutes)} total
            </Badge>
            <Link to="/systems" className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Ver sistemas →
            </Link>
          </div>
        }
      />

      <Card className="p-4">
        {loading ? (
          <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="h-[320px] animate-pulse rounded-xl bg-muted/50" />
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="h-8 animate-pulse rounded-lg bg-muted/50" />
              ))}
            </div>
          </div>
        ) : !hasData ? (
          <EmptyState message="Todavía no hay minutos registrados en tus sistemas para este periodo." />
        ) : (
          <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
            <div>
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">Promedio diario</h3>
              <p className="mb-2 text-[11px] text-muted-foreground">La barra gris marca tu meta diaria.</p>
              <div className="h-[330px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
                    barCategoryGap="22%"
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={92}
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<SystemTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.3)" }} />
                    <Bar dataKey="target" name="Meta" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={9} />
                    <Bar dataKey="avg" name="Promedio" radius={[0, 4, 4, 0]} barSize={9}>
                      {chartData.map((entry) => (
                        <Cell key={entry.id} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-xs">
                <thead>
                  <tr className="border-b text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-2 pr-2 text-left font-semibold">Sistema</th>
                    <th className="px-2 py-2 text-right font-semibold">Prom/día</th>
                    <th className="px-2 py-2 text-right font-semibold">Meta</th>
                    <th className="px-2 py-2 text-right font-semibold">Total</th>
                    <th className="px-2 py-2 text-left font-semibold">Cumplimiento</th>
                    <th className="py-2 pl-2 text-right font-semibold">Racha</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {systems.map((system) => {
                    const tone = toneForCompliance(system.compliance);
                    const palette = TONES[tone];
                    return (
                      <tr key={system.id} className="group">
                        <td className="py-2 pr-2">
                          <Link to={system.route} className="flex items-center gap-2 font-medium text-foreground hover:underline">
                            <span className="text-sm">{system.icon}</span>
                            <span className="truncate">{system.name}</span>
                            <ArrowUpRight className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </Link>
                        </td>
                        <td className="px-2 py-2 text-right font-semibold tabular-nums text-foreground">{system.avgMinutes}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{system.targetMinutes}</td>
                        <td className="px-2 py-2 text-right tabular-nums text-muted-foreground">{formatMinutes(system.totalMinutes)}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div className={cn("h-full rounded-full", palette.bar)} style={{ width: `${Math.min(100, system.compliance)}%` }} />
                            </div>
                            <span className={cn("text-[10px] font-semibold tabular-nums", palette.text)}>{system.compliance}%</span>
                            <span className="hidden text-[9px] text-muted-foreground sm:inline">{complianceLabel(system.compliance)}</span>
                          </div>
                        </td>
                        <td className="py-2 pl-2 text-right">
                          <span className="inline-flex items-center gap-1 text-[10px] tabular-nums text-muted-foreground">
                            <Flame className={cn("h-3 w-3", system.streak > 0 ? "text-orange-500" : "text-muted-foreground/40")} />
                            {system.streak}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </section>
  );
}
