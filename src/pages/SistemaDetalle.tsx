import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  CalendarRange,
  Eye,
  Layers,
  Target,
  TrendingUp,
  Trophy,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { format } from "date-fns";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { POINT_B_AREAS } from "@/data/pointB2027";
import type { PointBSubAxis } from "@/lib/definitions";
import {
  AREA_SYSTEMS,
  DIAGNOSIS_TONE,
  GROUP_CONFIG,
  diagnoseArea,
} from "@/lib/areaSystemsMap";
import {
  AREA_LABELS,
  getMonthGoalsSummary,
  getQuarterFromDate,
  getQuarterGoal,
  getWeekGoalEffective,
} from "@/lib/hierarchy";
import { useAreaScores, type AreaScore } from "@/hooks/useAreaScores";
import { usePuntoPartida } from "@/hooks/usePuntoPartida";
import { usePersonalLists, usePersonalListsSystemsRange } from "@/hooks/usePersonalLists";
import { buildResultLeaves } from "@/lib/resultConnections";
import { chainForArea } from "@/lib/resultChains";
import { ResultLeaves } from "@/components/today/systems/ResultLeaves";
import { ResultChain, type ChainComodidad } from "@/components/today/systems/ResultChain";
import {
  useAreaDetailData,
  type EffortWindow,
} from "@/hooks/useAreaDetailData";
import { MejoraProcessPanel } from "@/components/mejora/MejoraProcessPanel";
import { FocusProcessPanel } from "@/components/focus/FocusProcessPanel";
import { cn } from "@/lib/utils";

function flattenPointB(subs: PointBSubAxis[]): PointBSubAxis[] {
  const out: PointBSubAxis[] = [];
  for (const s of subs) {
    if (s.children && s.children.length > 0) out.push(...flattenPointB(s.children));
    else out.push(s);
  }
  return out;
}

const WINDOW_ORDER: Array<{ key: EffortWindow; label: string; icon: LucideIcon }> = [
  { key: "hoy", label: "Hoy", icon: Zap },
  { key: "semana", label: "Semana", icon: CalendarRange },
  { key: "mes", label: "Mes", icon: Calendar },
  { key: "trimestre", label: "Trimestre", icon: Layers },
  { key: "anio", label: "Año", icon: Eye },
];

const WINDOW_ORDERED_GOALS: Array<{ key: EffortWindow; label: string; icon: LucideIcon }> =
  WINDOW_ORDER.slice(1);

function goalFor(windowKey: EffortWindow, hierarchyArea: string): number {
  const now = new Date();
  if (windowKey === "semana") {
    return getWeekGoalEffective(now, hierarchyArea);
  }
  if (windowKey === "mes") {
    return getMonthGoalsSummary(now)[hierarchyArea] ?? 0;
  }
  const { quarter, year } = getQuarterFromDate(now);
  if (windowKey === "trimestre") {
    return getQuarterGoal(quarter, year, hierarchyArea);
  }
  // año = suma de los 4 trimestres
  return [1, 2, 3, 4].reduce((s, q) => s + getQuarterGoal(q, year, hierarchyArea), 0);
}

function fmtMin(min: number): string {
  if (min <= 0) return "0";
  if (min < 60) return `${Math.round(min)}min`;
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default function SistemaDetalle() {
  const { areaId } = useParams<{ areaId: string }>();
  const area = POINT_B_AREAS.find(a => a.id === areaId);
  const config = area ? AREA_SYSTEMS[area.id] : undefined;
  const group = area
    ? GROUP_CONFIG[area.group as keyof typeof GROUP_CONFIG] ?? GROUP_CONFIG.construccion
    : GROUP_CONFIG.construccion;

  const { consistency, series, today, todayCompletions, todayTimeData, minutesIn, loading } =
    useAreaDetailData(areaId ?? "");
  const { scores: areaScores, loading: scoresLoading, subStats } = useAreaScores("month", "ambos");
  const { entries: ppEntries, loading: ppLoading } = usePuntoPartida();
  const { lists, tasks, systems } = usePersonalLists();
  const range7 = usePersonalListsSystemsRange(7);
  const range30 = usePersonalListsSystemsRange(30);
  const range90 = usePersonalListsSystemsRange(90);

  const score = useMemo(
    () => (areaScores.length > 0 ? areaScores.find(s => s.id === areaId) : undefined),
    [areaScores, areaId]
  );

  const resultLeaves = useMemo(() => {
    if (!score || !area) return [];
    return buildResultLeaves({
      area,
      score,
      currentOf: leafId => {
        const v = ppEntries[area.id]?.sub_scores?.[leafId];
        return typeof v === "number" ? v : undefined;
      },
      completions: todayCompletions,
      timeData: todayTimeData,
      subStats,
    });
  }, [area, score, ppEntries, todayCompletions, todayTimeData, subStats]);

  const pointBLeaves = useMemo(() => {
    if (!area) return [];
    return flattenPointB(area.sub);
  }, [area]);

  const chainsData = useMemo(() => {
    if (!area) return [] as { chainId: string; minutes: Record<string, number>; comodidad: ChainComodidad }[];
    return chainForArea(area.id).map(c => {
      const minutes = {
        hoy: systems[c.systemId]?.minutes ?? 0,
        semana: range7.data?.[c.systemId]?.totalMinutes ?? 0,
        mes: range30.data?.[c.systemId]?.totalMinutes ?? 0,
        trimestre: range90.data?.[c.systemId]?.totalMinutes ?? 0,
      };
      const linked = lists
        .filter(l => l.system_key === c.systemId)
        .map(l => {
          const lt = tasks.filter(t => t.list_id === l.id);
          return { title: l.title, done: lt.filter(t => t.completed).length, total: lt.length };
        });
      let pct = 0;
      let source: ChainComodidad["source"] = "lists";
      if (linked.length > 0) {
        const total = linked.reduce((s, l) => s + l.total, 0);
        const done = linked.reduce((s, l) => s + l.done, 0);
        pct = total > 0 ? Math.round((done / total) * 100) : 0;
      } else {
        source = "puntoB";
        const leaf = pointBLeaves.find(l => l.id === c.leafId);
        if (leaf) {
          const base = ppEntries[area.id]?.sub_scores?.[c.leafId];
          const cur = typeof base === "number" ? base : leaf.start;
          const range = leaf.target - leaf.start;
          pct = range !== 0 ? Math.round(Math.max(0, Math.min(100, ((cur - leaf.start) / range) * 100))) : 0;
        }
      }
      return { chainId: c.systemId, minutes, comodidad: { pct, source, linked } };
    });
  }, [area, systems, range7.data, range30.data, range90.data, lists, tasks, ppEntries, pointBLeaves]);

  const diagnosis = score ? diagnoseArea(score.esfuerzo, score.resultados) : diagnoseArea(0, 0);
  const tone = DIAGNOSIS_TONE[diagnosis.tone];

  const chartData = useMemo(
    () =>
      series.map(d => ({
        date: format(new Date(`${d.date}T00:00:00`), "d MMM"),
        esfuerzo: d.effort,
        minutos: d.minutes,
      })),
    [series]
  );

  if (loading || scoresLoading || ppLoading) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!area || !config) {
    return (
      <div className="min-h-screen bg-background p-4 pt-20 flex items-center justify-center">
        <Card className="p-6 text-center space-y-3">
          <p className="text-lg font-bold">Área no encontrada</p>
          <Link
            to="/daily"
            className="text-sm text-primary flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" /> Volver al día
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.05)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-5">
        {/* ─── Cabecera ─── */}
        <div className="flex items-center gap-2">
          <Link
            to="/daily"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Hoy
          </Link>
          <span className="text-xs text-muted-foreground">/</span>
          <Badge className={cn("gap-1 border", group.chip)}>
            <span className="text-xs">{area.icon}</span> {area.label}
          </Badge>
        </div>

        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div
            className={cn(
              "bg-gradient-to-b p-4 border-b border-border/40",
              group.headerBg
            )}
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-white/70 dark:bg-zinc-900/70 border border-border/40 grid place-items-center text-2xl shadow-sm">
                {area.icon}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold tracking-tight truncate">
                  {area.label}
                </h1>
                <p className="text-xs text-muted-foreground">{config.vision}</p>
              </div>
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-bold",
                  tone.bg,
                  tone.border,
                  tone.text
                )}
              >
                <span className="text-sm">{diagnosis.icon}</span>
                {diagnosis.short}
              </div>
            </div>
            <p className={cn("text-xs leading-relaxed mt-2", tone.text)}>
              {diagnosis.message}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 p-4 text-center">
            <div className="rounded-xl bg-foreground/5 px-2 py-3">
              <div className="text-lg font-bold tabular-nums">
                {today.done}
                <span className="text-muted-foreground text-xs font-medium">/{today.total}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Hoy completado</p>
              <p className="text-[10px] font-semibold tabular-nums">
                {fmtMin(today.minutes)} min
              </p>
            </div>
            <div className="rounded-xl bg-foreground/5 px-2 py-3">
              <div className="text-lg font-bold tabular-nums text-blue-500">
                {score?.esfuerzo ?? 0}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Esfuerzo (30d)</p>
              <p className="text-[10px] font-semibold tabular-nums">
                {fmtMin(consistency.mes > 0 ? (score?.esfuerzo ?? 0) : 0)}
              </p>
            </div>
            <div className="rounded-xl bg-foreground/5 px-2 py-3">
              <div className="text-lg font-bold tabular-nums">
                {score?.resultados ?? 0}%
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5">Resultado (Punto B)</p>
              <p className="text-[10px] font-semibold tabular-nums">
                🎯 {pointBLeaves.length} ejes
              </p>
            </div>
          </div>
        </Card>

        {/* ─── Promesa ─── */}
        {config.promise && (
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-bold text-foreground">🎯 El sistema: </span>
              {config.promise}
            </p>
          </Card>
        )}

        {/* ─── Esfuerzo ─── */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Datos de esfuerzo</h2>
          </div>

          <div className="grid grid-cols-5 gap-2">
            {WINDOW_ORDER.map(w => (
              <div
                key={w.key}
                className="rounded-xl bg-foreground/5 px-2 py-2.5 space-y-1.5"
              >
                <div className="flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                  <w.icon className="h-3 w-3" /> {w.label}
                </div>
                <div className="text-center text-sm font-bold tabular-nums">
                  {consistency[w.key]}%
                </div>
                <Progress
                  value={Math.min(100, consistency[w.key])}
                  className="h-1"
                  indicatorClassName="bg-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="rounded-xl bg-foreground/5 p-2">
            <p className="text-[10px] text-muted-foreground px-1 pb-1">Esfuerzo diario · últimos 30 días</p>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="esfuerzoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--info))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--info))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9 }}
                    minTickGap={24}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 9 }}
                  />
                  <Tooltip
                    cursor={{ stroke: "hsl(var(--border))" }}
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 11,
                    }}
                    formatter={(value: number | null) => [value != null ? `${value}%` : "sin datos", "Esfuerzo"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="esfuerzo"
                    stroke="hsl(var(--info))"
                    strokeWidth={2}
                    fill="url(#esfuerzoGrad)"
                    connectNulls
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* ─── Esfuerzo de la sección Mejora: solo desarrollo personal ─── */}
        {area.id === "desarrollo" && <MejoraProcessPanel />}

        {/* ─── Esfuerzo profesional/académico: solo área profesional ─── */}
        {area.id === "profesional" && <FocusProcessPanel />}

        {/* ─── Objetivos semana / mes / trimestre / año ─── */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wider">
              Objetivos · {config.hierarchyAreas.length > 0 ? "escalera de minutos" : "por sistema"}
            </h2>
          </div>

          {config.hierarchyAreas.length > 0 ? (
            <p className="text-[10px] text-muted-foreground">
              Meta vs real en minutos, empujado por tu plan trimestral (hierarchy).
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground">
              Esta área no tiene metas de minutos en la escalera trimestral. Usa el sistema diario y revisa el Punto B.
            </p>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {WINDOW_ORDERED_GOALS.map(w => {
              const rows = config.hierarchyAreas
                .map(a => ({
                  area: a,
                  label: AREA_LABELS[a] ?? a,
                  goal: goalFor(w.key, a),
                  actual: minutesIn(a, w.key),
                }))
                .filter(r => r.goal > 0 || r.actual > 0);

              if (rows.length === 0) return null;

              const goalTot = rows.reduce((s, r) => s + r.goal, 0);
              const actTot = rows.reduce((s, r) => s + r.actual, 0);

              return (
                <div key={w.key} className="rounded-xl border border-border/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <w.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      {w.label}
                    </div>
                    <span className="text-[10px] tabular-nums font-semibold">
                      <span className={cn(actTot >= goalTot && goalTot > 0 ? "text-emerald-500" : "")}>
                        {fmtMin(actTot)}
                      </span>
                      {goalTot > 0 && (
                        <span className="text-muted-foreground"> / {fmtMin(goalTot)}</span>
                      )}
                    </span>
                  </div>
                  <Progress
                    value={goalTot > 0 ? Math.min(100, Math.round((actTot / goalTot) * 100)) : 0}
                    className="h-1.5"
                    indicatorClassName={group.bar}
                  />
                  <div className="space-y-1">
                    {rows.map(r => {
                      const pct = r.goal > 0 ? Math.min(100, Math.round((r.actual / r.goal) * 100)) : 0;
                      return (
                        <div key={r.area} className="flex items-center gap-2 text-[10px]">
                          <span className="w-20 truncate text-muted-foreground">{r.label}</span>
                          <Progress
                            value={pct}
                            className="h-1 flex-1"
                            indicatorClassName={group.bar}
                          />
                          <span className="w-24 text-right tabular-nums text-muted-foreground">
                            {fmtMin(r.actual)}
                            {r.goal > 0 && <span className="text-muted-foreground/60"> / {fmtMin(r.goal)}</span>}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {config.hierarchyAreas.length > 0 && (
            <p className="text-[9px] text-muted-foreground pt-1">
              La meta del año = suma de los 4 trimestres. Real = minutos registrados en los últimos 7/30/90/364 días.
            </p>
          )}
        </Card>

        {/* ─── Resultados (Punto B) ─── */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-emerald-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider">Resultados que produce (Punto B)</h2>
            <span className="ml-auto text-xs font-bold tabular-nums">
              {score?.resultados ?? 0}%
            </span>
          </div>

          {chainsData.length > 0 && (
            <div className="space-y-4">
              {chainsData.map(d => {
                const chain = chainForArea(area.id).find(ch => ch.systemId === d.chainId);
                if (!chain) return null;
                return (
                  <div key={d.chainId} className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <span>{chain.emoji}</span> {chain.name}
                    </div>
                    <ResultChain chain={chain} minutes={d.minutes} comodidad={d.comodidad} />
                  </div>
                );
              })}
            </div>
          )}

          {resultLeaves.length > 0 && (
            <div className="pt-1 space-y-2 border-t border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Resumen del Punto B
              </p>
              <ResultLeaves leaves={resultLeaves} group={group} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}