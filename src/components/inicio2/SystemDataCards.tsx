import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Layers } from "lucide-react";
import { coverKey, useAreaCovers } from "@/hooks/useAreaCovers";
import {
  usePlanSystemMetrics,
  type PlanSystemMetricsResult,
} from "@/hooks/usePlanSystemMetrics";
import { useGeneralTaskMetrics } from "@/hooks/useGeneralTaskMetrics";
import { useHabitChecklist } from "@/hooks/useHabitChecklist";
import {
  useDayWeekSystemObjectives,
  useMonthSystemObjectives,
  useQuarterSystemObjectives,
  useYearSystemObjectives,
  type ExistingSystemObjectives,
} from "@/hooks/usePlanObjectivesBySystem";
import { useSystemGoals } from "@/hooks/useSystemGoals";
import { goalsInDateRange, type SystemGoal } from "@/lib/systemGoals";
import { formatGoalDate, goalPeriodLabel, goalPeriodRange } from "@/lib/metasSistemas";
import {
  PlanAreaCard,
  type PlanAreaCardData,
  type PlanObjectiveRow,
} from "@/components/planificacion/PlanAreaCard";
import {
  PLAN_AREA_BY_ID,
  PLAN_SYSTEM_META,
  type PlanDayStatus,
  type PlanificationScope,
} from "@/lib/planSystems";
import type { Timeframe } from "@/contexts/TimeframeContext";
import { cn } from "@/lib/utils";
import { getCubaDate } from "@/lib/cubaTime";
import { SectionHeader } from "./shared";
import { SystemStabilitySummary } from "./SystemStabilitySummary";
import { aggregateSystemMetrics } from "./groupMetrics";
import {
  PLANNED_UNIT_BY_SCOPE,
  SCOPE_BY_TIMEFRAME,
  SYSTEM_GROUPS,
  type SystemCardGroupDef,
} from "./systemGroups";

interface SharedCardsProps {
  scope: PlanificationScope;
  anchor: Date;
  metrics: PlanSystemMetricsResult;
  covers: Record<string, string>;
  goals: SystemGoal[];
  onToggleGoal: (id: string) => void;
}

export function SystemDataCards({ timeframe, anchor }: { timeframe: Timeframe; anchor: Date }) {
  const scope = SCOPE_BY_TIMEFRAME[timeframe] ?? "week";
  const metrics = usePlanSystemMetrics(scope, anchor);
  const { covers } = useAreaCovers();
  const { goals, toggleGoal } = useSystemGoals();

  const shared: SharedCardsProps = {
    scope,
    anchor,
    metrics,
    covers,
    goals,
    onToggleGoal: toggleGoal,
  };

  switch (scope) {
    case "day":
    case "week":
      return <DayWeekSystemCards {...shared} />;
    case "month":
      return <MonthSystemCards {...shared} />;
    case "quarter":
      return <QuarterSystemCards {...shared} />;
    case "year":
      return <YearSystemCards {...shared} />;
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* Objetivos del periodo: un wrapper por ámbito, igual que Metas       */
/* Sistemas, porque cada ámbito usa un hook distinto.                  */
/* ------------------------------------------------------------------ */

function DayWeekSystemCards(props: SharedCardsProps) {
  const objectives = useDayWeekSystemObjectives(
    props.scope === "week" ? "week" : "day",
    props.anchor,
  );
  return <SystemCardsContent {...props} objectives={objectives} />;
}

function MonthSystemCards(props: SharedCardsProps) {
  const objectives = useMonthSystemObjectives(props.anchor);
  return <SystemCardsContent {...props} objectives={objectives} />;
}

function QuarterSystemCards(props: SharedCardsProps) {
  const objectives = useQuarterSystemObjectives(props.anchor);
  return <SystemCardsContent {...props} objectives={objectives} />;
}

function YearSystemCards(props: SharedCardsProps) {
  const objectives = useYearSystemObjectives(props.anchor);
  return <SystemCardsContent {...props} objectives={objectives} />;
}

function dayStatusFor(
  days: string[] | undefined,
  statuses: PlanDayStatus[] | undefined,
  todayKey: string,
): PlanDayStatus | undefined {
  if (!days || !statuses) return undefined;
  const index = days.indexOf(todayKey);
  return index >= 0 ? statuses[index] : undefined;
}

function SystemCardsContent({
  scope,
  anchor,
  metrics,
  covers,
  goals,
  onToggleGoal,
  objectives,
}: SharedCardsProps & { objectives: ExistingSystemObjectives }) {
  const periodLabel = goalPeriodLabel(scope, anchor);

  const range = useMemo(() => goalPeriodRange(scope, anchor), [scope, anchor]);
  const todayKey = useMemo(() => getCubaDate(), []);
  const checklistDayKey = scope === "day" ? range.startKey : todayKey;
  const generalTasks = useGeneralTaskMetrics(range.start, range.end);
  const taskMetrics = generalTasks.metrics;
  const taskItems = generalTasks.items;
  const habits = useHabitChecklist(checklistDayKey, metrics.refresh);
  const { done: habitDone, toggle: toggleHabit } = habits;

  const periodGoals = useMemo(
    () => goalsInDateRange(goals, range.startKey, range.endKey),
    [goals, range.startKey, range.endKey],
  );

  const goalRowsById = useMemo(() => {
    const out: Record<string, PlanObjectiveRow[]> = {};
    for (const goal of periodGoals) {
      (out[goal.systemId] ??= []).push({
        id: `system-goal-${goal.id}`,
        title: goal.title,
        subtitle: goal.objective || undefined,
        meta: formatGoalDate(goal.date),
        emoji: "🎯",
        tag: goal.completed ? "Hecha" : undefined,
        done: !!goal.completed,
        onToggle: () => onToggleGoal(goal.id),
      });
    }
    return out;
  }, [periodGoals, onToggleGoal]);

  const habitRowsFor = useMemo(
    () => (ids: string[]): PlanObjectiveRow[] => ids.flatMap((id) => {
      const meta = PLAN_SYSTEM_META[id];
      if (!meta) return [];
      const isDone = !!habitDone[id];
      return [{
        id: `habit-check-${id}`,
        title: meta.name,
        meta: isDone ? "Hecha" : "Pendiente",
        emoji: meta.emoji,
        tag: isDone ? "Hecha" : undefined,
        done: isDone,
        onToggle: () => toggleHabit(id),
        ignoreForCompletion: true,
      }];
    }),
    [habitDone, toggleHabit],
  );

  const groups = useMemo(
    () =>
      SYSTEM_GROUPS.flatMap((group) => {
        const area = PLAN_AREA_BY_ID[group.areaId];
        if (!area) return [];

        const systemCard = (id: string): PlanAreaCardData | null => {
          if (id === "tareas") {
            return {
              id,
              title: "Tareas generales",
              emoji: "✅",
              note: "general",
              cover:
                covers[coverKey("sub", "tareas")]
                ?? covers[coverKey("sub", "general")]
                ?? covers[coverKey("area", group.areaId)]
                ?? null,
              tasks: taskMetrics,
              dayStatus: scope === "day" ? taskMetrics.todayStatus : undefined,
              items: taskItems,
              emptyHint: "Sin tareas generales del periodo",
            };
          }

          const meta = PLAN_SYSTEM_META[id];
          const system = metrics.systems[id];
          if (!meta || !system) return null;

          const planned = objectives.plannedById[id];

          return {
            id,
            title: meta.name,
            emoji: meta.emoji,
            note: meta.role === "ancla" ? "ancla" : undefined,
            cover:
              covers[coverKey("sub", id)]
              ?? covers[coverKey("area", id)]
              ?? covers[coverKey("area", group.areaId)]
              ?? null,
            minutes: planned,
            minutesUnit: PLANNED_UNIT_BY_SCOPE[scope],
            system: { ...system, plannedMinutes: planned },
            showStability: true,
            dayStatus: scope === "day"
              ? dayStatusFor(system.days, system.status, range.startKey)
              : undefined,
            onTargetChange: (pct: number) => metrics.setTarget(id, pct),
            items: [
              ...(goalRowsById[id] ?? []),
              ...(objectives.itemsById[id] ?? []),
            ],
            emptyHint: "Sin objetivos del periodo",
          };
        };

        const groupCard = (def: SystemCardGroupDef): PlanAreaCardData | null => {
          const ids = def.systemIds;
          const members = ids.filter(id => !!metrics.systems[id]);
          if (members.length === 0) return null;

          const planned = ids.reduce(
            (sum, id) => sum + (objectives.plannedById[id] ?? 0),
            0,
          );
          const merged = aggregateSystemMetrics({
            id: def.id,
            systemIds: ids,
            systems: metrics.systems,
            todayKey,
          });
          if (!merged) return null;

          return {
            id: def.id,
            title: def.title,
            emoji: def.emoji,
            note: def.note,
            cover:
              covers[coverKey("sub", def.id)]
              ?? covers[coverKey("sub", ids[0])]
              ?? covers[coverKey("area", group.areaId)]
              ?? null,
            minutes: planned > 0 ? planned : undefined,
            minutesUnit: PLANNED_UNIT_BY_SCOPE[scope],
            system: { ...merged, plannedMinutes: planned > 0 ? planned : undefined },
            dayStatus: scope === "day"
              ? dayStatusFor(merged.days, merged.status, range.startKey)
              : undefined,
            onTargetChange: def.id === "barbero-estetica"
              ? undefined
              : (pct: number) => ids.forEach(systemId => metrics.setTarget(systemId, pct)),
            items: [
              ...ids.flatMap(id => goalRowsById[id] ?? []),
              ...(scope === "day" ? habitRowsFor(ids) : []),
              ...ids.flatMap(id => objectives.itemsById[id] ?? []),
            ],
            emptyHint: "Sin objetivos del periodo",
          };
        };

        const cards = group.cards
          ? group.cards.flatMap((def): PlanAreaCardData[] => {
              const card = groupCard(def);
              return card ? [card] : [];
            })
          : group.systemIds.flatMap((id): PlanAreaCardData[] => {
              const card = systemCard(id);
              return card ? [card] : [];
            });

        return cards.length > 0 ? [{ ...group, area, cards }] : [];
      }),
    [
      covers,
      metrics,
      objectives,
      goalRowsById,
      scope,
      range.startKey,
      taskMetrics,
      taskItems,
      todayKey,
      habitRowsFor,
    ],
  );

  const [initialLoaded, setInitialLoaded] = useState(false);
  useEffect(() => {
    if (!metrics.loading) setInitialLoaded(true);
  }, [metrics.loading]);
  // Al marcar un hábito se refrescan las métricas: no volvemos al esqueleto
  // completo, solo se actualizan las tarjetas con los datos nuevos.
  const showSkeleton = (!initialLoaded && metrics.loading)
    || objectives.loading
    || generalTasks.loading;

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<Layers className="h-4 w-4" />}
        title="Sistemas en detalle"
        subtitle={`Objetivos, racha y tendencia de cada sistema · ${periodLabel}`}
        action={
          <Link
            to="/daily"
            className="text-[10px] font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            Ver Daily →
          </Link>
        }
      />

      {showSkeleton ? (
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-2xl bg-muted/40" />
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl bg-muted/40" />
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <SystemStabilitySummary metrics={metrics} />
          {groups.map((group) => (
            <div key={group.areaId} className="space-y-2">
              <div className="flex items-center gap-2 px-0.5">
                <span className="text-sm leading-none">{group.area.icon}</span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-foreground/70">
                  {group.area.label}
                </h3>
                <span className="hidden truncate text-[10px] text-muted-foreground sm:inline">
                  {group.note}
                </span>
                <span className="h-px flex-1 bg-border/60" />
                <span className="shrink-0 text-[9px] font-semibold tabular-nums text-muted-foreground">
                  {group.cards.length} {group.cards.length === 1 ? "sistema" : "sistemas"}
                </span>
              </div>

              <div className={cn(
                "grid grid-cols-2 gap-2.5 sm:grid-cols-3",
                group.cards.length >= 5 ? "lg:grid-cols-5" : "lg:grid-cols-4",
              )}>
                {group.cards.map((card) => (
                  <PlanAreaCard key={card.id} card={card} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
