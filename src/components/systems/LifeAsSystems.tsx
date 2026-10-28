import { useMemo } from "react";
import { format, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { Activity, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { POINT_B_AREAS } from "@/data/pointB2027";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useGymDayPlan } from "@/hooks/useGymDayPlan";
import { useRoutineBlocks } from "@/hooks/useRoutineBlocks";
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
import { getAreaChrono } from "@/lib/systemSchedule";
import { getWeekLanguagePlans } from "@/lib/languagePlan";
import {
  buildBlocksRuleView,
  buildGymRuleView,
  buildMinuteRuleView,
  buildProjectTasksRuleView,
  buildRuleView,
  SYSTEM_RULE_IDS,
  type SystemRuleStatus,
  type SystemRuleView,
} from "@/lib/systemRules";
import { cn } from "@/lib/utils";

const SYSTEM_BY_ID = new Map<string, DaySystem>(
  DAY_SYSTEMS.flatMap(area =>
    area.systems.map(sys => [sys.id, sys] as [string, DaySystem]),
  ),
);

const GROUP_ORDER: PointBGroup[] = ["cimientos", "construccion", "recompensas"];

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
  unit: string;
  ruleText?: string;
  detail?: string;
  status: SystemRuleStatus;
  statusLabel: string;
  progress: number;
}

interface HabitGroupView {
  id: string;
  title: string;
  emoji?: string;
  done: number;
  total: number;
  pending: string[];
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
  habitGroups: HabitGroupView[];
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

const isProjectTask = (task: {
  source?: string | null;
  area_id?: string | null;
}) =>
  task.source === "project" ||
  task.source === "projects" ||
  task.area_id === "proyectos" ||
  task.area_id === "proyectos-personales";

function toLinked(view: SystemRuleView): LinkedSystem {
  return {
    id: view.id,
    name: view.name,
    actual: view.actual,
    target: view.target,
    unit: view.unit,
    ruleText: view.text,
    detail: view.detail,
    status: view.status,
    statusLabel: view.label,
    progress: view.progress,
  };
}

function buildHabitGroups(
  config: AreaSystemConfig | undefined,
  trackedHabitIds: string[],
  completions: Record<string, boolean>,
): HabitGroupView[] {
  const tracked = new Set(trackedHabitIds);
  const used = new Set<string>();
  const groups: HabitGroupView[] = [];

  const addGroup = (
    id: string,
    title: string,
    emoji: string | undefined,
    ids: string[],
  ) => {
    const valid = ids.filter(id => tracked.has(id));
    if (valid.length === 0) return;
    valid.forEach(id => used.add(id));

    groups.push({
      id,
      title,
      emoji,
      total: valid.length,
      done: valid.filter(id => !!completions[id]).length,
      pending: valid
        .filter(id => !completions[id])
        .map(id => HABIT_META[id]?.name ?? id),
    });
  };

  for (const section of config?.habitSections ?? []) {
    addGroup(section.id, section.title, section.emoji, section.habitIds);
  }

  const rest = trackedHabitIds.filter(id => !used.has(id));
  if (rest.length > 0) {
    addGroup(
      "otros",
      (config?.habitSections?.length ?? 0) > 0
        ? "Otros hábitos"
        : "Hábitos de sostén",
      undefined,
      rest,
    );
  }

  return groups;
}

/**
 * La Rueda de la Vida leída como sistemas: cada área muestra su diagnóstico,
 * los sistemas diarios que la alimentan y el sistema concreto que falla hoy.
 * Solo usa datos reales: sin meta => "sin registro", sin sistema => hueco.
 *
 * Los sistemas no son solo minutos:
 *  - Universidad = bloques de estudio completados.
 *  - Emprendimiento = bloques de trabajo completados.
 *  - Proyectos = tareas del proyecto realizadas.
 *  - Gym = rutina y grupos musculares que toca hoy según Gym 2.0.
 *  - Áreas estructurales = hábitos de sostén agrupados por subárea.
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
  const completions = useMemo(
    () => todayRow?.completions ?? {},
    [todayRow],
  );

  const { scores, loading: scoresLoading } = useAreaScores("month", "ambos");
  const { blocks: dbBlocks, tasks, isBlockCompleted } = useDailyPlanData(anchorDate);
  // Misma rutina que ve el usuario en el día (local); si no hay, la de la DB.
  const { blocks: routineBlocks } = useRoutineBlocks();
  const chronoBlocks = routineBlocks.length > 0 ? routineBlocks : dbBlocks;
  const gymPlan = useGymDayPlan(anchorKey);

  const scoreById = useMemo(
    () => Object.fromEntries(scores.map(score => [score.id, score])),
    [scores],
  );

  // Meta diaria combinada de idiomas según el plan real de la semana.
  // Si el plan exige más de 30 min/día, la regla sube con él.
  const languagePlanDay = useMemo(() => {
    const weekStart = startOfWeek(new Date(`${anchorKey}T12:00:00`), {
      weekStartsOn: 1,
    });
    const plan = getWeekLanguagePlans(weekStart);
    const weekly =
      (plan.italiano.minutesTarget || 0) + (plan.ingles.minutesTarget || 0);
    return weekly > 0 ? Math.round(weekly / 7) : 0;
  }, [anchorKey]);

  const fiveToday = useMemo(() => {
    return SYSTEM_RULE_IDS.flatMap(id => {
      const system = SYSTEM_BY_ID.get(id);
      if (!system) return [];

      const actual = systemActualMinutes(system, { timeData });
      const skipped =
        id === "idiomas"
          ? !!todayRow?.skipped?.italiano && !!todayRow?.skipped?.ingles
          : !!todayRow?.skipped?.[id];
      const view = buildMinuteRuleView(id, actual, {
        skipped,
        planTargetMinutes: id === "idiomas" ? languagePlanDay : undefined,
      });
      if (!view) return [];

      return [{
        id,
        name: view.name,
        actual: view.actual,
        target: view.target,
        status: view.status,
        statusLabel: view.label,
      }];
    });
  }, [timeData, todayRow, languagePlanDay]);

  const areas = useMemo<LifeAreaView[]>(() => {
    return POINT_B_AREAS.map(area => {
      const config = AREA_SYSTEMS[area.id];
      const linkedIds = config?.habits ?? [];
      const timed: LinkedSystem[] = [];
      const trackedHabitIds: string[] = [];

      for (const id of linkedIds) {
        // Gym: rutina y grupos musculares del día según Gym 2.0.
        if (id === "gym") {
          const view = buildGymRuleView({
            plan: gymPlan,
            minutes: Number(todayRow?.workout_duration) || 0,
            done:
              !!todayRow?.completions?.["gym"] ||
              !!todayRow?.completions?.["entrenamiento-fisico"],
            rest:
              !!todayRow?.rest?.["gym"] ||
              !!todayRow?.rest?.["entrenamiento-fisico"],
            skipped:
              !!todayRow?.skipped?.["gym"] ||
              !!todayRow?.skipped?.["entrenamiento-fisico"],
          });
          if (view) timed.push(toLinked(view));
          continue;
        }

        // Universidad / Emprendimiento: bloques reales del plan del día.
        if (id === "universidad" || id === "emprendimiento") {
          const chrono = getAreaChrono(chronoBlocks, id);
          // Horario fijo + bloques de enfoque (Deep Work / Focus) del área.
          const dayBlocks = [...chrono.fixed, ...chrono.extra];
          const completed = dayBlocks.filter(
            block => block.id && isBlockCompleted(block.id),
          ).length;

          timed.push(
            toLinked(
              buildBlocksRuleView({
                id,
                name:
                  HABIT_META[id]?.name ??
                  (id === "universidad" ? "Universidad" : "Emprendimiento"),
                noun: id === "universidad" ? "estudio" : "trabajo",
                total: dayBlocks.length,
                completed,
                skipped: !!todayRow?.skipped?.[id],
              }),
            ),
          );
          continue;
        }

        // Proyectos: tareas del proyecto realizadas hoy.
        if (id === "proyectos") {
          const projectTasks = (tasks ?? []).filter(isProjectTask);
          timed.push(
            toLinked(
              buildProjectTasksRuleView({
                done: projectTasks.filter(task => task.completed).length,
                total: projectTasks.length,
                skipped: !!todayRow?.skipped?.[id],
              }),
            ),
          );
          continue;
        }

        const meta = HABIT_META[id];
        const system = meta?.system;

        if (system) {
          const actual = systemActualMinutes(system, { timeData });
          const skipped =
            system.id === "idiomas"
              ? !!todayRow?.skipped?.italiano && !!todayRow?.skipped?.ingles
              : !!todayRow?.skipped?.[system.id];

          const minuteView = buildMinuteRuleView(system.id, actual, { skipped });
          if (minuteView) {
            timed.push(toLinked(minuteView));
          } else {
            // Sistemas sin regla fija (ej. Finanzas): mínimo real del sistema.
            const target = systemMinForSpeed(system, "minimo");
            timed.push(
              toLinked(
                buildRuleView({
                  id: system.id,
                  name: system.name,
                  text: `${target} min diarios de ${system.name.toLowerCase()}`,
                  actual,
                  target,
                  unit: "min",
                  minimum: Math.min(1, target),
                  skipped,
                }),
              ),
            );
          }
        } else if (meta) {
          trackedHabitIds.push(id);
        }
      }

      const doneHabits = trackedHabitIds.filter(
        id => !!completions[id],
      ).length;
      const habitGroups = buildHabitGroups(
        config,
        trackedHabitIds,
        completions,
      );

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
        habitGroups,
        effort,
        results,
        hasScore: !!score,
        diagnosis,
        failing,
      };
    });
  }, [
    chronoBlocks,
    completions,
    gymPlan,
    isBlockCompleted,
    scoreById,
    tasks,
    timeData,
    todayRow,
  ]);

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
                const hasTarget = area.timed.some(system => system.target > 0);

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

                      {area.timed.length > 0 && (
                        <div className="space-y-1">
                          {area.timed.map(system => (
                            <div
                              key={`${area.id}-${system.id}`}
                              className="space-y-0.5 rounded-md border border-border/50 bg-muted/20 px-1.5 py-1"
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate text-[10px] font-semibold">
                                  {system.name}
                                </span>
                                <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                                  {system.actual}/{system.target || "—"}{" "}
                                  {system.unit}
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
                              {system.detail && (
                                <p className="text-[8px] font-medium leading-tight text-foreground/80">
                                  {system.detail}
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
                      )}

                      {area.habitGroups.length > 0 && (
                        <div className="space-y-1">
                          {area.habitGroups.map(group => (
                            <div
                              key={`${area.id}-${group.id}`}
                              className="space-y-0.5 rounded-md border border-border/50 bg-muted/10 px-1.5 py-1"
                            >
                              <div className="flex items-center gap-1">
                                <span className="truncate text-[10px] font-semibold">
                                  {group.emoji ? `${group.emoji} ` : ""}
                                  {group.title}
                                </span>
                                <span className="ml-auto font-mono text-[9px] tabular-nums text-muted-foreground">
                                  {group.done}/{group.total} hábitos
                                </span>
                                <span
                                  className={cn(
                                    "text-[8px] font-bold",
                                    group.done === group.total
                                      ? "text-emerald-600 dark:text-emerald-400"
                                      : group.done > 0
                                        ? "text-sky-600 dark:text-sky-400"
                                        : "text-muted-foreground",
                                  )}
                                >
                                  {group.done === group.total
                                    ? "Cumplido"
                                    : group.done > 0
                                      ? "En curso"
                                      : "Sin registro"}
                                </span>
                              </div>
                              {group.pending.length > 0 && (
                                <p className="text-[8px] leading-tight text-muted-foreground">
                                  Pendiente: {group.pending.join(" · ")}
                                </p>
                              )}
                              <Progress
                                value={
                                  group.total > 0
                                    ? Math.round(
                                        (group.done / group.total) * 100,
                                      )
                                    : 0
                                }
                                className="h-1"
                                indicatorClassName={
                                  group.done === group.total
                                    ? "bg-emerald-500"
                                    : "bg-muted-foreground/40"
                                }
                              />
                            </div>
                          ))}
                        </div>
                      )}

                      {area.timed.length === 0 &&
                        area.habitGroups.length === 0 && (
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
                            ? area.habitGroups.length > 0
                              ? "bg-muted/40 text-muted-foreground"
                              : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            : area.failing
                              ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                              : hasTarget
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-muted/40 text-muted-foreground",
                        )}
                      >
                        {area.timed.length === 0
                          ? area.habitGroups.length > 0
                            ? "Se mide por los hábitos de sostén del área."
                            : "Este es el hueco que hay que cerrar con un sistema."
                          : area.failing
                            ? `Falla: ${area.failing.name} · ${area.failing.actual}/${area.failing.target} ${area.failing.unit}`
                            : hasTarget
                              ? "Los sistemas del área están en pie."
                              : "Sin metas registradas para hoy (datos reales)."}
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
