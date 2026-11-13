import { useMemo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Clock3, Layers, LayoutDashboard, ListTodo, Timer } from "lucide-react";
import { DailyGoalsCard } from "@/components/inicio2/DailyGoalsCard";
import { SectionHeader, StatCard, formatMinutes } from "@/components/inicio2/shared";
import {
  SYSTEM_GROUPS,
  cardGridClass,
  type SystemCardGroupDef,
} from "@/components/inicio2/systemGroups";
import { SYSTEM_CARD_RULE } from "@/components/inicio2/systemRules";
import {
  PlanAreaCard,
  type PlanAreaCardData,
  type PlanObjectiveRow,
} from "@/components/planificacion/PlanAreaCard";
import { coverKey, useAreaCovers } from "@/hooks/useAreaCovers";
import type { TaskItem } from "@/hooks/useDailyPlanData";
import type { RoutineBlock, RoutineInfo } from "@/hooks/useRoutineBlocks";
import type { SystemsData } from "@/hooks/useSystemsTracking";
import { habitTrackingIds } from "@/lib/areaSystemsMap";
import type { ChessResultKey } from "@/lib/daySystems";
import { PLAN_AREA_BY_ID, PLAN_SYSTEM_META } from "@/lib/planSystems";
import type { SpeedPlan } from "@/lib/speedPlan";
import { cn } from "@/lib/utils";
import {
  RoutineControlBoard,
  type RoutineCalendarEvent,
} from "@/components/today/RoutineControlBoard";
import { SystemInlineData } from "@/components/today/SystemInlineData";

/** Fuentes de tareas que no pertenecen a la tarjeta "Tareas generales". */
const NON_GENERAL_TASK_SOURCES = new Set([
  "universidad",
  "emprendimiento",
  "entrepreneurship",
  "proyectos",
]);

/**
 * Clave con la que Daily guarda la marca de un sistema. Gym se registra como
 * `entrenamiento-fisico` desde WorkoutVisual; el resto usa su propio id.
 */
function trackingKeyFor(id: string): string {
  return id === "gym" ? "entrenamiento-fisico" : id;
}

/** Un sistema está cumplido si cualquiera de sus alias está marcado. */
function isSystemDone(
  id: string,
  completions: SystemsData["completions"],
): boolean {
  return habitTrackingIds(id).some((key) => !!completions[key]);
}

/** Minutos reales del sistema (gym e idiomas viven en campos especiales). */
function minutesFor(id: string, data: SystemsData): number {
  if (id === "gym") return data.workoutDuration || 0;
  if (id === "idiomas") {
    return (data.timeData.ingles || 0) + (data.timeData.italiano || 0);
  }
  return data.timeData[id] || 0;
}

export interface DailyControlPanelProps {
  date: Date;
  blocks: RoutineBlock[];
  tasksByBlock: Record<string, TaskItem[]>;
  tasks: TaskItem[];
  completedTasks: TaskItem[];
  completedBlocks: unknown[];
  dayScore: number;
  toggleTaskDone: (taskId: string) => void;
  toggleBlockComplete: (blockId: string) => void;
  isBlockCompleted: (blockId: string) => boolean;
  routineLoading?: boolean;
  tasksLoading?: boolean;
  systems: SystemsData;
  onToggleSystem: (id: string) => void;
  /* Tracking del día (mismos campos que la pestaña Sistemas). */
  onTimeChange: (id: string, minutes: number) => void;
  onCountChange?: (id: string, count: number) => void;
  onChessResultChange?: (result: ChessResultKey, value: number) => void;
  onWaterToggle?: (id: string) => void;
  onMealPhotoUpload?: (id: string, url: string) => void;
  onSkipToggle?: (id: string) => void;
  onRestToggle?: (id: string) => void;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  /* Rutina y tareas. */
  unassignedTasks: TaskItem[];
  onTaskCreated: () => void;
  abcMap?: Record<string, string>;
  onDropTask: (taskId: string, blockId: string) => void;
  onRemoveTask: (taskId: string) => void;
  onUpdateFocus?: (blockId: string, focus: string) => void;
  onUpdateCover: (blockId: string, url: string) => void;
  covers?: Record<string, string>;
  onAddBlock: (data: {
    title: string;
    startTime: string;
    endTime: string;
    isFocusBlock: boolean;
  }) => void;
  onRemoveBlock: (blockId: string) => void;
  routineInfo?: RoutineInfo;
  events?: RoutineCalendarEvent[];
  musicInstrument?: "piano" | "guitar";
  languageChoice?: "ingles" | "italiano";
  isFutureView?: boolean;
  speedPlan?: SpeedPlan;
  onSpeedPlanChange?: (next: SpeedPlan) => void;
}

/**
 * Panel de control del día: reúne el horario, las tareas y todas las tarjetas
 * de sistemas de Inicio 2.0 en una sola vista marcable.
 */
export function DailyControlPanel({
  date,
  blocks,
  tasksByBlock,
  tasks,
  completedTasks,
  completedBlocks,
  dayScore,
  toggleTaskDone,
  toggleBlockComplete,
  isBlockCompleted,
  routineLoading,
  tasksLoading,
  systems,
  onToggleSystem,
  onTimeChange,
  onCountChange,
  onChessResultChange,
  onWaterToggle,
  onMealPhotoUpload,
  onSkipToggle,
  onRestToggle,
  onWorkoutDurationChange,
  onWorkoutIntensityChange,
  onWakeTimeChange,
  onSleepTimeChange,
  unassignedTasks,
  onTaskCreated,
  abcMap,
  onDropTask,
  onRemoveTask,
  onUpdateFocus,
  onUpdateCover,
  covers: routineCovers,
  onAddBlock,
  onRemoveBlock,
  routineInfo,
  events,
  musicInstrument,
  languageChoice,
  isFutureView,
  speedPlan,
  onSpeedPlanChange,
}: DailyControlPanelProps) {
  const { covers: areaCovers } = useAreaCovers();
  const dayLabel = format(date, "EEEE d 'de' MMMM", { locale: es });

  const groups = useMemo(() => {
    const toggleSystem = (id: string) => {
      const active = habitTrackingIds(id).find(
        (key) => !!systems.completions[key],
      );
      onToggleSystem(active ?? trackingKeyFor(id));
    };

    const inlineDetails = (id: string, showMinutes?: boolean) => (
      <SystemInlineData
        systemId={id}
        systems={systems}
        onTimeChange={onTimeChange}
        onCountChange={onCountChange}
        onChessResultChange={onChessResultChange}
        onWaterToggle={onWaterToggle}
        onMealPhotoUpload={onMealPhotoUpload}
        onSkipToggle={onSkipToggle}
        onRestToggle={onRestToggle}
        onWorkoutDurationChange={onWorkoutDurationChange}
        onWorkoutIntensityChange={onWorkoutIntensityChange}
        onWakeTimeChange={onWakeTimeChange}
        onSleepTimeChange={onSleepTimeChange}
        showMinutes={showMinutes}
      />
    );

    const systemRow = (id: string): PlanObjectiveRow => {
      const meta = PLAN_SYSTEM_META[id];
      const minutes = minutesFor(id, systems);
      const count = systems.countData[id] || 0;
      const rest = !!systems.rest?.[id];
      const skipped = !!systems.skipped?.[id];

      let detail: string | undefined;
      if (id === "horario-regular" && systems.wakeTime && systems.sleepTime) {
        detail = `Hoy: ${systems.sleepTime} – ${systems.wakeTime}`;
      } else if (id === "gym" && minutes > 0) {
        detail = `${minutes} min de entreno`;
      } else if (id === "ajedrez" && (minutes > 0 || count > 0)) {
        detail = [
          count > 0 ? `${count} ${count === 1 ? "partida" : "partidas"}` : null,
          minutes > 0 ? `${minutes} min` : null,
        ].filter(Boolean).join(" · ");
      } else if (minutes > 0) {
        detail = `${minutes} min`;
      }

      return {
        id: `system-${id}`,
        title: meta?.name ?? id,
        emoji: meta?.emoji ?? "•",
        done: isSystemDone(id, systems.completions),
        onToggle: () => toggleSystem(id),
        meta: detail,
        tag: rest ? "Descanso" : skipped ? "Saltado" : undefined,
        details: inlineDetails(id),
      };
    };

    const idiomRows: PlanObjectiveRow[] = (["ingles", "italiano"] as const).map(
      (id) => {
        const minutes = systems.timeData[id] || 0;
        return {
          id: `system-${id}`,
          title: id === "ingles" ? "Inglés" : "Italiano",
          emoji: id === "ingles" ? "🇬🇧" : "🇮🇹",
          done: !!systems.completions[id],
          onToggle: () => toggleSystem(id),
          meta: minutes > 0 ? `${minutes} min` : undefined,
          tag: systems.rest?.[id]
            ? "Descanso"
            : systems.skipped?.[id]
              ? "Saltado"
              : undefined,
          details: inlineDetails(id, true),
        };
      },
    );

    const generalTaskRows: PlanObjectiveRow[] = tasks
      .filter(
        (task) =>
          !NON_GENERAL_TASK_SOURCES.has(
            (task.source || "general").toLowerCase(),
          ),
      )
      .map((task) => ({
        id: `task-${task.id}`,
        title: task.title,
        emoji: "✅",
        done: task.completed,
        onToggle: () => toggleTaskDone(task.id),
        meta:
          task.priority === "high"
            ? "Prioridad alta"
            : task.priority === "medium"
              ? "Prioridad media"
              : undefined,
        tag: task.completed ? "Hecha" : undefined,
      }));

    const buildCard = (
      areaId: string,
      def: SystemCardGroupDef,
    ): PlanAreaCardData => {
      let items: PlanObjectiveRow[];
      if (def.id === "tareas") items = generalTaskRows;
      else if (def.id === "idiomas") items = idiomRows;
      else items = def.systemIds.map(systemRow);

      const total = items.length;
      const done = items.filter((item) => item.done).length;
      const state =
        total === 0
          ? "empty"
          : done === total
            ? "done"
            : done > 0
              ? "partial"
              : "pending";

      return {
        id: def.id,
        title: def.title,
        emoji: def.emoji,
        note: def.note,
        systemRule: SYSTEM_CARD_RULE[def.id],
        cover:
          areaCovers[coverKey("sub", def.id)]
          ?? areaCovers[coverKey("sub", def.systemIds[0])]
          ?? areaCovers[coverKey("area", areaId)]
          ?? null,
        statusOverride: {
          state,
          detail:
            total === 0
              ? "Sin elementos para hoy"
              : `${done} de ${total} completados`,
        },
        items,
        emptyHint:
          def.id === "tareas"
            ? "Sin tareas generales para hoy"
            : "Sin elementos para hoy",
      };
    };

    return SYSTEM_GROUPS.flatMap((group) => {
      const area = PLAN_AREA_BY_ID[group.areaId];
      if (!area) return [];

      const defs: SystemCardGroupDef[] =
        group.cards
        ?? group.systemIds.map((id) => ({
          id,
          title: PLAN_SYSTEM_META[id]?.name ?? id,
          emoji: PLAN_SYSTEM_META[id]?.emoji ?? "•",
          note:
            PLAN_SYSTEM_META[id]?.role === "ancla" ? "ancla" : undefined,
          systemIds: [id],
        }));

      return [{
        areaId: group.areaId,
        area,
        note: group.note,
        cards: defs.map((def) => buildCard(group.areaId, def)),
      }];
    });
  }, [
    areaCovers,
    systems,
    tasks,
    toggleTaskDone,
    onToggleSystem,
    onTimeChange,
    onCountChange,
    onChessResultChange,
    onWaterToggle,
    onMealPhotoUpload,
    onSkipToggle,
    onRestToggle,
    onWorkoutDurationChange,
    onWorkoutIntensityChange,
    onWakeTimeChange,
    onSleepTimeChange,
  ]);

  const summary = useMemo(() => {
    const rows = groups
      .flatMap((group) => group.cards)
      .filter((card) => card.id !== "tareas")
      .flatMap((card) => card.items);
    const done = rows.filter((item) => item.done).length;
    return {
      done,
      total: rows.length,
      pct: rows.length > 0 ? Math.round((done / rows.length) * 100) : 0,
    };
  }, [groups]);

  const totalMinutes = useMemo(() => {
    const tracked = Object.entries(systems.timeData).reduce(
      (sum, [key, value]) =>
        key === "idiomas" ? sum : sum + (Number(value) || 0),
      0,
    );
    return tracked + (systems.workoutDuration || 0);
  }, [systems.timeData, systems.workoutDuration]);

  return (
    <section className="space-y-4">
      <SectionHeader
        icon={<LayoutDashboard className="h-4 w-4" />}
        title="Panel de control"
        subtitle={`Horario, tareas y todos los sistemas del día · ${dayLabel}`}
        action={
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold tabular-nums",
              summary.pct >= 100
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : summary.pct > 0
                  ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  : "bg-foreground/[0.06] text-muted-foreground",
            )}
          >
            <Layers className="h-3 w-3" />
            {summary.done}/{summary.total} sistemas
          </span>
        }
      />

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatCard
          label="Sistemas"
          value={`${summary.done}/${summary.total}`}
          hint={`${summary.pct}% del día`}
          icon={<Layers className="h-4 w-4" />}
          tone={summary.pct >= 100 ? "emerald" : "blue"}
        />
        <StatCard
          label="Tareas"
          value={`${completedTasks.length}/${tasks.length}`}
          hint={`${Math.max(0, tasks.length - completedTasks.length)} pendientes`}
          icon={<ListTodo className="h-4 w-4" />}
          tone="violet"
        />
        <StatCard
          label="Horario"
          value={`${completedBlocks.length}/${blocks.length}`}
          hint="Bloques completados"
          icon={<Clock3 className="h-4 w-4" />}
          tone="emerald"
        />
        <StatCard
          label="Tiempo"
          value={formatMinutes(totalMinutes)}
          hint="Invertido hoy"
          icon={<Timer className="h-4 w-4" />}
          tone="amber"
        />
      </div>

      <RoutineControlBoard
        blocks={blocks}
        tasksByBlock={tasksByBlock}
        unassignedTasks={unassignedTasks}
        onTaskCreated={onTaskCreated}
        abcMap={abcMap}
        onToggleBlock={toggleBlockComplete}
        isBlockCompleted={isBlockCompleted}
        onDropTask={onDropTask}
        onRemoveTask={onRemoveTask}
        onToggleTask={toggleTaskDone}
        onUpdateFocus={onUpdateFocus}
        onUpdateCover={onUpdateCover}
        covers={routineCovers}
        onAddBlock={onAddBlock}
        onRemoveBlock={onRemoveBlock}
        routineInfo={routineInfo}
        events={events}
        musicInstrument={musicInstrument}
        languageChoice={languageChoice}
        isFutureView={isFutureView}
        speedPlan={speedPlan}
        onSpeedPlanChange={onSpeedPlanChange}
        loading={routineLoading}
      />

      <DailyGoalsCard
        tasks={tasks}
        completedTasks={completedTasks}
        blocks={blocks}
        completedBlocks={completedBlocks}
        dayScore={dayScore}
        toggleTaskDone={toggleTaskDone}
        loading={tasksLoading}
        maxTasks={tasks.length}
      />

      <div className="space-y-5">
        {groups.map((group) => {
          const rows = group.cards.flatMap((card) => card.items);
          const done = rows.filter((item) => item.done).length;
          const complete = rows.length > 0 && done === rows.length;

          return (
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
                <span
                  className={cn(
                    "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums",
                    complete
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-foreground/[0.06] text-muted-foreground",
                  )}
                  title={`${done} de ${rows.length} completados`}
                >
                  {done}/{rows.length}
                </span>
              </div>

              <div
                className={cn(
                  "grid gap-2.5",
                  cardGridClass(group.cards.length),
                )}
              >
                {group.cards.map((card) => (
                  <PlanAreaCard
                    key={card.id}
                    card={card}
                    periodLabel={dayLabel}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
