import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { POINT_B_AREAS } from "@/data/pointB2027";
import { useAreaScores } from "@/hooks/useAreaScores";
import {
  AREA_SYSTEMS,
  DIAGNOSIS_TONE,
  GROUP_CONFIG,
  HABIT_META,
  diagnoseArea,
  type AreaSystemConfig,
  type PointBGroup,
} from "@/lib/areaSystemsMap";
import {
  DAY_SYSTEMS,
  systemActualMinutes,
  systemMinForSpeed,
  type DaySystem,
} from "@/lib/daySystems";
import {
  getSystemRule,
  getSystemRuleStatus,
  SYSTEM_RULE_IDS,
  type SystemRuleStatus,
} from "@/lib/systemRules";
import { cn } from "@/lib/utils";

const SYSTEM_BY_ID = new Map<string, DaySystem>(
  DAY_SYSTEMS.flatMap(area =>
    area.systems.map(sys => [sys.id, sys] as [string, DaySystem]),
  ),
);

const GROUP_ORDER: PointBGroup[] = ["cimientos", "construccion", "recompensas"];

const STATUS_LABEL: Record<SystemRuleStatus, string> = {
  cumplido: "Cumplido",
  minimo: "Mínimo",
  "en-progreso": "En curso",
  "sin-registro": "Sin registro",
  saltado: "Saltado",
  "sin-meta": "Sin meta",
};

const STATUS_TEXT: Record<SystemRuleStatus, string> = {
  cumplido: "text-emerald-600 dark:text-emerald-400",
  minimo: "text-sky-600 dark:text-sky-400",
  "en-progreso": "text-sky-600/80 dark:text-sky-400/80",
  "sin-registro": "text-muted-foreground",
  saltado: "text-rose-500",
  "sin-meta": "text-muted-foreground",
};

const STATUS_CHIP: Record<SystemRuleStatus, string> = {
  cumplido: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  minimo: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "en-progreso": "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:text-sky-300",
  "sin-registro": "border-border/60 bg-muted/40 text-muted-foreground",
  saltado: "border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "sin-meta": "border-border/60 bg-muted/40 text-muted-foreground",
};

export interface LifeSystemsRow {
  tracking_date: string;
  time_data?: Record<string, number> | null;
  workout_duration?: number | null;
  skipped?: Record<string, boolean> | null;
  rest?: Record<string, boolean> | null;
  completions?: Record<string, boolean> | null;
  count_data?: Record<string, number> | null;
}

interface LinkedSystem {
  id: string;
  name: string;
  actual: number;
  target: number;
  ruleText?: string;
  status: SystemRuleStatus;
  statusLabel: string;
  progress: number;
}

interface LifeAreaView {
  id: string;
  label: string;
  icon: string;
  group: PointBGroup;
  config?: AreaSystemConfig;
  timed: LinkedSystem[];
  trackedHabitIds: string[];
  doneHabits: number;
  effort: number;
  results: number;
  hasScore: boolean;
  diagnosis: ReturnType<typeof diagnoseArea>;
  failing: LinkedSystem | null;
}

interface LifeAsSystemsProps {
  anchorDate: Date;
  rows: LifeSystemsRow[];
  loading?: boolean;
}

/**
 * La Rueda de la Vida leída como sistemas: cada área muestra su diagnóstico,
 * los sistemas diarios que la alimentan y el sistema concreto que falla hoy.
 * Solo usa datos reales: sin meta => "sin registro", sin sistema => hueco.
 */
export function LifeAsSystems({
  anchorDate,
  rows,
  loading = false,
}: LifeAsSystemsProps) {
  const anchorKey = format(anchorDate, "yyyy-MM-dd");
  const todayRow = useMemo(
    () => rows.find(row => row.tracking_date === anchorKey),
    [rows, anchorKey],
  );
  const timeData = useMemo(() => todayRow?.time_data ?? {}, [todayRow]);

  const { scores, loading: scoresLoading } = useAreaScores("month", "ambos");

  const scoreById = useMemo(
    () => Object.fromEntries(scores.map(score => [score.id, score])),
    [scores],
  );

  const fiveToday = useMemo(() => {
    return SYSTEM_RULE_IDS.flatMap(id => {
      const rule = getSystemRule(id);
      const system = SYSTEM_BY_ID.get(id);
      if (!rule || !system) return [];

      const actual = systemActualMinutes(system, { timeData });
      const skipped =
        id === "idiomas"
          ? !!todayRow?.skipped?.italiano && !!todayRow?.skipped?.ingles
          : !!todayRow?.skipped?.[id];
      const result = getSystemRuleStatus(rule, { minutes: actual, skipped });

      return [{
        id,
        name: rule.name,
        actual,
        target: rule.targetMinutes,
        status: result.status,
        statusLabel: result.label,
      }];
    });
  }, [timeData, todayRow]);

  const areas = useMemo<LifeAreaView[]>(() => {
    return POINT_B_AREAS.map(area => {
      const config = AREA_SYSTEMS[area.id];
      const linkedIds = config?.habits ?? [];
      const timed: LinkedSystem[] = [];
      const trackedHabitIds: string[] = [];

      for (const id of linkedIds) {
        // Gym no es DAY_SYSTEM: se mide por workout_duration.
        if (id === "gym") {
          const actual = Number(todayRow?.workout_duration) || 0;
          const target = 60;
          const status: SystemRuleStatus =
            actual >= target
              ? "cumplido"
              : actual > 0
                ? "en-progreso"
                : "sin-registro";
          timed.push({
            id,
            name: "Gym",
            actual,
            target,
            status,
            statusLabel: STATUS_LABEL[status],
            progress: Math.min(100, Math.round((actual / target) * 100)),
          });
          continue;
        }

        const meta = HABIT_META[id];
        const system = meta?.system;

        if (system) {
          const rule = getSystemRule(system.id);
          const actual = systemActualMinutes(system, { timeData });
          const target = rule?.targetMinutes ?? systemMinForSpeed(system, "minimo");
          const skipped =
            system.id === "idiomas"
              ? !!todayRow?.skipped?.italiano && !!todayRow?.skipped?.ingles
              : !!todayRow?.skipped?.[system.id];
          const result = rule
            ? getSystemRuleStatus(rule, { minutes: actual, skipped })
            : {
                status: (actual >= target && target > 0
                  ? "cumplido"
                  : actual > 0
                    ? "en-progreso"
                    : "sin-registro") as SystemRuleStatus,
                label:
                  actual >= target && target > 0
                    ? "Cumplido"
                    : actual > 0
                      ? "En curso"
                      : "Sin registro",
              };

          timed.push({
            id: system.id,
            name: rule?.name ?? system.name,
            actual,
            target,
            ruleText: rule?.text,
            status: result.status,
            statusLabel: result.label,
            progress:
              target > 0
                ? Math.min(100, Math.round((actual / target) * 100))
                : 0,
          });
        } else if (meta) {
          trackedHabitIds.push(id);
        }
      }

      const doneHabits = trackedHabitIds.filter(
        id => !!todayRow?.completions?.[id],
      ).length;

      const score = scoreById[area.id];
      const effort = Number(score?.esfuerzo) || 0;
      const results = Number(score?.resultados) || 0;
      const diagnosis = diagnoseArea(effort, results);

      const failing =
        timed
          .filter(system => system.target > 0 && system.status !== "cumplido")
          .sort(
            (a, b) =>
              a.actual / Math.max(1, a.target) -
              b.actual / Math.max(1, b.target),
          )[0] ?? null;

      return {
        id: area.id,
        label: area.label,
        icon: area.icon,
        group: area.group,
        config,
        timed,
        trackedHabitIds,
        doneHabits,
        effort,
        results,
        hasScore: !!score,
        diagnosis,
        failing,
      };
    });
  }, [scoreById, timeData, todayRow]);

  if (loading || scoresLoading) {
    return (
      <Card className="border-border/60">
        <CardContent className="space-y-2 p-3">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-16 rounded-lg" />
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {[0, 1, 2, 3].map(i => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const fulfilledFive = fiveToday.filter(item => item.status === "cumplido");
  const failingFive = fiveToday.filter(item => item.status !== "cumplido");
  const allFiveDone =
    fiveToday.length > 0 && fulfilledFive.length === fiveToday.length;

  return (
    <div className="space-y-3">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardContent className="space-y-2 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold tracking-tight">
              Tu vida son sistemas
            </h3>
            <Badge variant="outline" className="text-[9px]">
              {format(anchorDate, "d MMM", { locale: es })}
            </Badge>
            <span className="ml-auto text-[10px] font-semibold">
              {fulfilledFive.length}/{fiveToday.length} sistemas cumplidos
            </span>
          </div>

          <p className="text-[11px] leading-snug text-muted-foreground">
            “Si algo va mal, es un sistema que está fallando.” No es falta de
            fuerza de voluntad: es una regla que no se está ejecutando.
          </p>
          <p className="text-[9px] text-muted-foreground">
            Diagnóstico actual de la Rueda (últimos 30 días) y estado del día
            seleccionado.
          </p>

          <div className="flex flex-wrap gap-1">
            {fiveToday.map(item => (
              <span
                key={item.id}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 text-[9px] font-semibold",
                  STATUS_CHIP[item.status],
                )}
              >
                {item.name}: {item.statusLabel} · {item.actual}/{item.target}
              </span>
            ))}
          </div>

          {failingFive.length > 0 ? (
            <p className="flex items-start gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
              <ShieldAlert className="mt-0.5 h-3 w-3 shrink-0" />
              Fallan:{" "}
              {failingFive
                .map(item => `${item.name} (${item.actual}/${item.target} min)`)
                .join(" · ")}
            </p>
          ) : (
            allFiveDone && (
              <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                Los cinco sistemas están cumplidos.
              </p>
            )
          )}
        </CardContent>
      </Card>

      {GROUP_ORDER.map(groupKey => {
        const groupAreas = areas.filter(area => area.group === groupKey);
        const config = GROUP_CONFIG[groupKey];

        return (
          <section key={groupKey} className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5 px-1">
              <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} />
              <h4 className="text-[10px] font-bold uppercase tracking-wider">
                {config.sectionTitle}
              </h4>
              <span className="hidden text-[9px] text-muted-foreground sm:inline">
                {config.sectionNote}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {groupAreas.map(area => {
                const tone = DIAGNOSIS_TONE[area.diagnosis.tone];

                return (
                  <Card key={area.id} className="border-border/60">
                    <CardContent className="space-y-2 p-2.5">
                      <div className="flex items-start gap-2">
                        <span className="text-base leading-none">
                          {area.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold leading-tight">
                            {area.label}
                          </p>
                          <p className="text-[9px] text-muted-foreground">
                            {area.hasScore
                              ? `${Math.round(area.effort)}% esfuerzo · ${Math.round(area.results)}% resultados`
                              : "Sin datos en la Rueda"}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 rounded-md border px-1 py-0.5 text-[8px] font-bold",
                            tone.bg,
                            tone.border,
                            tone.text,
                          )}
                          title={area.diagnosis.message}
                        >
                          {area.diagnosis.icon} {area.diagnosis.short}
                        </span>
                      </div>

                      {area.config?.promise && (
                        <p className="text-[9px] leading-snug text-muted-foreground">
                          {area.config.promise}
                        </p>
                      )}

                      {area.timed.length > 0 ? (
                        <div className="space-y-1">
                          {area.timed.map(system => (
                            <div
                              key={system.id}
                              className="space-y-0.5 rounded-md border border-border/50 bg-muted/20 px-1.5 py-1"
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate text-[10px] font-semibold">
                                  {system.name}
                                </span>
                                <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                                  {system.actual}/{system.target || "—"} min
                                </span>
                                <span
                                  className={cn(
                                    "text-[8px] font-bold",
                                    STATUS_TEXT[system.status],
                                  )}
                                >
                                  {system.statusLabel}
                                </span>
                              </div>
                              {system.ruleText && (
                                <p className="text-[8px] leading-tight text-muted-foreground">
                                  {system.ruleText}
                                </p>
                              )}
                              <Progress
                                value={system.progress}
                                className="h-1"
                                indicatorClassName={
                                  system.status === "cumplido"
                                    ? "bg-emerald-500"
                                    : system.status === "minimo"
                                      ? "bg-sky-500"
                                      : "bg-muted-foreground/40"
                                }
                              />
                            </div>
                          ))}
                        </div>
                      ) : area.trackedHabitIds.length > 0 ? (
                        <div className="rounded-md border border-border/60 bg-muted/20 px-1.5 py-1">
                          <p className="text-[9px] font-semibold">
                            Hábitos diarios sin meta de minutos
                          </p>
                          <p className="text-[8px] text-muted-foreground">
                            Se miden por cumplimiento, no por tiempo.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-md border border-dashed border-border/60 px-1.5 py-1">
                          <p className="text-[9px] font-semibold">
                            Hueco: sin sistema diario
                          </p>
                          {area.config?.systemNote && (
                            <p className="text-[8px] leading-snug text-muted-foreground">
                              {area.config.systemNote}
                            </p>
                          )}
                        </div>
                      )}

                      {area.trackedHabitIds.length > 0 && (
                        <p className="text-[8px] text-muted-foreground">
                          Hábitos de sostén del día:{" "}
                          <b className="text-foreground">
                            {area.doneHabits}/{area.trackedHabitIds.length}
                          </b>
                        </p>
                      )}

                      <div
                        className={cn(
                          "rounded-md px-1.5 py-1 text-[9px] font-semibold",
                          area.timed.length === 0
                            ? area.trackedHabitIds.length > 0
                              ? "bg-muted/40 text-muted-foreground"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : area.failing
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {area.timed.length === 0
                          ? area.trackedHabitIds.length > 0
                            ? "Sin meta de minutos: se mide por hábitos."
                            : "Este es el hueco que hay que cerrar con un sistema."
                          : area.failing
                            ? `Falla: ${area.failing.name} · ${area.failing.actual}/${area.failing.target} min`
                            : "Los sistemas del área están en pie."}
                      </div>

                      {area.config?.systemNote &&
                        area.timed.length > 0 && (
                          <p className="text-[8px] italic leading-snug text-muted-foreground">
                            {area.config.systemNote}
                          </p>
                        )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
