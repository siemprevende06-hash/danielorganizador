import { useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { Layers } from "lucide-react";
import { coverKey, useAreaCovers } from "@/hooks/useAreaCovers";
import {
  usePlanSystemMetrics,
  type PlanSystemMetricsResult,
} from "@/hooks/usePlanSystemMetrics";
import { useGeneralTaskMetrics } from "@/hooks/useGeneralTaskMetrics";
import {
  useDayWeekSystemObjectives,
  useMonthSystemObjectives,
  useQuarterSystemObjectives,
  useYearSystemObjectives,
  type ExistingSystemObjectives,
} from "@/hooks/usePlanObjectivesBySystem";
import { useSystemGoals } from "@/hooks/useSystemGoals";
import { goalsInDateRange, type SystemGoal } from "@/lib/systemGoals";
import { formatGoalDate, goalPeriodRange } from "@/lib/metasSistemas";
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
import { PERIOD_LABEL } from "./PeriodSwitch";
import { SectionHeader } from "./shared";
import { SystemStabilitySummary } from "./SystemStabilitySummary";
import {
  PLANNED_UNIT_BY_SCOPE,
  SCOPE_BY_TIMEFRAME,
  SYSTEM_GROUPS,
} from "./systemGroups";

interface SharedCardsProps {
  timeframe: Timeframe;
  scope: PlanificationScope;
  anchor: Date;
  metrics: PlanSystemMetricsResult;
  covers: Record<string, string>;
  goals: SystemGoal[];
  onToggleGoal: (id: string) => void;
}

export function SystemDataCards({ timeframe }: { timeframe: Timeframe }) {
  const scope = SCOPE_BY_TIMEFRAME[timeframe] ?? "week";
  const anchor = useMemo(() => new Date(), []);
  const metrics = usePlanSystemMetrics(scope, anchor);
  const { covers } = useAreaCovers();
  const { goals, toggleGoal } = useSystemGoals();

  const shared: SharedCardsProps = {
    timeframe,
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
  timeframe,
  scope,
  anchor,
  metrics,
  covers,
  goals,
  onToggleGoal,
  objectives,
}: SharedCardsProps & { objectives: ExistingSystemObjectives }) {
  const periodLabel = PERIOD_LABEL[timeframe] || "este periodo";

  const range = useMemo(() => goalPeriodRange(scope, anchor), [scope, anchor]);
  const todayKey = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const generalTasks = useGeneralTaskMetrics(range.start, range.end);
  const taskMetrics = generalTasks.metrics;
  const taskItems = generalTasks.items;

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

  const groups = useMemo(
    () =>
      SYSTEM_GROUPS.flatMap((group) => {
        const area = PLAN_AREA_BY_ID[group.areaId];
        if (!area) return [];

        const cards = group.systemIds.flatMap((id): PlanAreaCardData[] => {
          if (id === "tareas") {
            return [{
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
            }];
          }

          const meta = PLAN_SYSTEM_META[id];
          const system = metrics.systems[id];
          if (!meta || !system) return [];

          const planned = objectives.plannedById[id];

          return [{
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
              ? dayStatusFor(system.days, system.status, todayKey)
              : undefined,
            onTargetChange: (pct: number) => metrics.setTarget(id, pct),
            items: [
              ...(goalRowsById[id] ?? []),
              ...(objectives.itemsById[id] ?? []),
            ],
            emptyHint: "Sin objetivos del periodo",
          }];
        });

        return cards.length > 0 ? [{ ...group, area, cards }] : [];
      }),
    [covers, metrics, objectives, goalRowsById, scope, taskMetrics, taskItems, todayKey],
  );

  const loading = metrics.loading || objectives.loading || generalTasks.loading;

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

      {loading ? (
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
