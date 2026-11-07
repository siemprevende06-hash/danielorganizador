import { Link } from "react-router-dom";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Activity, BarChart3, Clock3, Flame, Gauge, Sparkles, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WheelOfLife } from "@/components/WheelOfLife";
import type { Timeframe } from "@/contexts/TimeframeContext";
import type { AreaScore } from "@/hooks/useAreaScores";
import type { useLifeOverview } from "@/hooks/useLifeOverview";
import { cn } from "@/lib/utils";
import { PERIOD_LABEL } from "./PeriodSwitch";
import {
  EmptyState,
  SectionHeader,
  StatCard,
  TONES,
  formatMinutes,
  type Tone,
} from "./shared";

type Overview = ReturnType<typeof useLifeOverview>;

function areaMinutes(area: AreaScore): number {
  return area.sub.reduce((sum, sub) => sum + (sub.minutes || 0), 0);
}

function areaTone(score: number): Tone {
  if (score >= 80) return "emerald";
  if (score >= 60) return "blue";
  if (score >= 40) return "amber";
  if (score > 0) return "rose";
  return "slate";
}

function areaLabel(score: number): string {
  if (score >= 80) return "Excelente";
  if (score >= 60) return "Bien";
  if (score >= 40) return "Regular";
  if (score > 0) return "Atención";
  return "Sin datos";
}

function MiniBar({ value, tone }: { value: number; tone: Tone }) {
  const palette = TONES[tone];
  return (
    <div className="flex items-center gap-2">
      <span className="w-7 text-right text-[10px] font-semibold tabular-nums text-foreground">{Math.round(value)}</span>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all", palette.bar)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border bg-popover/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
      <p className="mb-1.5 font-semibold capitalize text-foreground">{payload[0]?.payload?.fullLabel || label}</p>
      {payload.map((entry: any) => (
        <div key={entry.dataKey} className="flex items-center gap-2 py-0.5">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-semibold text-foreground">
            {entry.dataKey === "minutes" ? formatMinutes(Number(entry.value)) : `${entry.value}%`}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LifeSummarySection({
  timeframe,
  areas,
  averages,
  loading,
  overview,
}: {
  timeframe: Timeframe;
  areas: AreaScore[];
  averages: { esfuerzo: number; resultados: number };
  loading: boolean;
  overview: Overview;
}) {
  const lifeScore = Math.round((averages.esfuerzo + averages.resultados) / 2);
  const wheelValues = areas.map((area) => Math.round(area.esfuerzo / 10));
  const wheelValues2 = areas.map((area) => Math.round(area.resultados / 10));
  const wheelAverage = Math.round(averages.esfuerzo / 10);
  const wheelAverage2 = Math.round(averages.resultados / 10);
  const periodLabel = PERIOD_LABEL[timeframe] || "este periodo";

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Activity className="h-4 w-4" />}
        title="Mi vida"
        subtitle={`Rueda de la vida, áreas y evolución · ${periodLabel}`}
        action={
          <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wide">
            {overview.days} {overview.days === 1 ? "día" : "días"}
          </Badge>
        }
      />

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Score de vida"
          value={`${lifeScore}/100`}
          hint={`Esfuerzo ${averages.esfuerzo} · Resultados ${averages.resultados}`}
          icon={<Gauge className="h-4 w-4" />}
          tone={areaTone(lifeScore)}
        />
        <StatCard
          label="Consistencia"
          value={`${overview.avgConsistency}%`}
          hint={`${overview.activeDays}/${overview.days} días activos`}
          icon={<Target className="h-4 w-4" />}
          tone={areaTone(overview.avgConsistency)}
        />
        <StatCard
          label="Tiempo invertido"
          value={formatMinutes(overview.totalMinutes)}
          hint={`${Math.round(overview.totalMinutes / Math.max(1, overview.days))} min/día · ${overview.workouts} entrenos`}
          icon={<Clock3 className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          label="Racha actual"
          value={`${overview.currentStreak} ${overview.currentStreak === 1 ? "día" : "días"}`}
          hint={`${overview.waterGlasses} vasos de agua · ${overview.trackedDays} días registrados`}
          icon={<Flame className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Rueda de la vida</h3>
              <p className="text-[11px] text-muted-foreground">10 áreas · esfuerzo vs resultados</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-primary" /> Esfuerzo</span>
              <span className="flex items-center gap-1"><span className="h-1.5 w-4 rounded-full bg-amber-500" /> Resultados</span>
            </div>
          </div>
          {areas.length > 0 && (overview.hasData || areas.some((area) => area.esfuerzo > 0 || area.resultados > 0)) ? (
            <WheelOfLife
              values={wheelValues}
              values2={wheelValues2}
              average={wheelAverage}
              average2={wheelAverage2}
              view="ambos"
              loading={loading}
            />
          ) : (
            <EmptyState message="Aún no hay datos de áreas para este periodo. Registra tiempo o completa hábitos para ver la rueda." />
          )}
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold">Tabla de áreas</h3>
              <p className="text-[11px] text-muted-foreground">Detalle por área de vida</p>
            </div>
            <Link to="/areas-de-vida" className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline">
              Ver áreas →
            </Link>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-8 animate-pulse rounded-lg bg-muted/60" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-xs">
                <thead>
                  <tr className="border-b text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                    <th className="py-2 pr-2 text-left font-semibold">Área</th>
                    <th className="px-2 py-2 text-left font-semibold">Esfuerzo</th>
                    <th className="px-2 py-2 text-left font-semibold">Resultados</th>
                    <th className="px-2 py-2 text-right font-semibold">Tiempo</th>
                    <th className="py-2 pl-2 text-right font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {areas.map((area) => {
                    const score = Math.round((area.esfuerzo + area.resultados) / 2);
                    const tone = areaTone(score);
                    const palette = TONES[tone];
                    return (
                      <tr key={area.id} className="group">
                        <td className="py-2 pr-2">
                          <Link to={`/sistemas/${area.id}`} className="flex items-center gap-2 font-medium text-foreground hover:underline">
                            <span className="text-sm">{area.icon}</span>
                            <span className="truncate">{area.label}</span>
                          </Link>
                        </td>
                        <td className="px-2 py-2"><MiniBar value={area.esfuerzo} tone="blue" /></td>
                        <td className="px-2 py-2"><MiniBar value={area.resultados} tone="amber" /></td>
                        <td className="px-2 py-2 text-right text-[10px] tabular-nums text-muted-foreground">{formatMinutes(areaMinutes(area))}</td>
                        <td className="py-2 pl-2 text-right">
                          <span className={cn("inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] font-semibold", palette.bg, palette.border, palette.text)}>
                            {areaLabel(score)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-1.5 text-sm font-bold">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Evolución de la consistencia
            </h3>
            <p className="text-[11px] text-muted-foreground">Hábitos completados y tiempo invertido por periodo</p>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Consistencia</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-blue-500/40" /> Minutos</span>
          </div>
        </div>

        {overview.hasData ? (
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={overview.trend} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  yAxisId="left"
                  domain={[0, 100]}
                  tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis yAxisId="right" orientation="right" hide />
                <Tooltip content={<TrendTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.35)" }} />
                <Bar
                  yAxisId="right"
                  dataKey="minutes"
                  name="Minutos"
                  fill="#3b82f6"
                  fillOpacity={0.28}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={28}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="consistency"
                  name="Consistencia"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 3, strokeWidth: 0, fill: "#10b981" }}
                  activeDot={{ r: 5 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <EmptyState message="Sin registros en este periodo. Empieza marcando hábitos en Sistemas o tu rutina diaria." />
        )}

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <TrendingUp className="h-3 w-3" /> Promedio {overview.avgConsistency}%
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <Clock3 className="h-3 w-3" /> Total {formatMinutes(overview.totalMinutes)}
          </Badge>
          <Badge variant="secondary" className="gap-1 text-[10px] font-medium">
            <Sparkles className="h-3 w-3" /> {overview.activeDays} días activos
          </Badge>
        </div>
      </Card>
    </section>
  );
}
