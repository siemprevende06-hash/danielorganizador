import { useMemo } from "react";
import {
  CalendarDays,
  Check,
  Coffee,
  Loader2,
  MoonStar,
  Sunrise,
  type LucideIcon,
} from "lucide-react";
import { getCoverGradient } from "@/components/areas/AreaCover";
import { cn } from "@/lib/utils";
import {
  stepCardId,
  useRoutineSteps,
  type RoutineCard,
  type RoutineStep,
  type RoutineType,
} from "@/hooks/useRoutineSteps";

export interface RoutineCardsOption {
  type: RoutineType;
  /** Nombre completo de la rutina. */
  label: string;
  /** Nombre corto para botones y pastillas. */
  shortLabel: string;
  icon: LucideIcon;
}

/** Las 4 rutinas que se pueden abrir desde el modo tablet. */
export const ROUTINE_CARDS_OPTIONS: RoutineCardsOption[] = [
  {
    type: "activation",
    label: "Rutina de Activación",
    shortLabel: "Activación",
    icon: Sunrise,
  },
  {
    type: "deactivation",
    label: "Rutina de Desactivación",
    shortLabel: "Desactivación",
    icon: MoonStar,
  },
  {
    type: "morning_prep",
    label: "Alistamiento y Desayuno",
    shortLabel: "Alistamiento",
    icon: Coffee,
  },
  {
    type: "weekend",
    label: "Rutina de Fin de Semana",
    shortLabel: "Fin de semana",
    icon: CalendarDays,
  },
];

export const routineCardsOption = (type: RoutineType): RoutineCardsOption =>
  ROUTINE_CARDS_OPTIONS.find(option => option.type === type) ??
  ROUTINE_CARDS_OPTIONS[0];

interface Props {
  type: RoutineType;
  className?: string;
}

interface BoardCardProps {
  card: RoutineCard;
  tasks: RoutineStep[];
  completed: Set<string>;
  onToggleTask: (taskId: string) => void;
}

function RoutineBoardCard({ card, tasks, completed, onToggleTask }: BoardCardProps) {
  const done = tasks.filter(task => completed.has(task.id)).length;
  const total = tasks.length;
  const progress = total ? (done / total) * 100 : 0;
  const isComplete = total > 0 && done === total;

  return (
    <article
      className={cn(
        "group/card flex min-w-0 flex-col overflow-hidden rounded-2xl border bg-black/40 backdrop-blur-md transition-colors",
        isComplete ? "border-emerald-400/50" : "border-white/10",
      )}
    >
      {/* Portada */}
      <div
        className={cn(
          "relative h-24 w-full overflow-hidden bg-gradient-to-br sm:h-28",
          getCoverGradient(card.id),
        )}
      >
        {card.cover_url ? (
          <img
            src={card.cover_url}
            alt={`Portada de ${card.title}`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 px-3 pb-2.5">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold leading-tight text-white drop-shadow-sm sm:text-base">
              {card.title}
            </h3>
            <p className="text-[11px] font-medium text-white/70">
              {done}/{total} {total === 1 ? "tarea" : "tareas"}
            </p>
          </div>
          <span
            className={cn(
              "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
              isComplete ? "bg-emerald-500 text-white" : "bg-white/20 text-white backdrop-blur-sm",
            )}
          >
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      <div className="h-1 w-full bg-white/10">
        <div
          className={cn(
            "h-full transition-all duration-500",
            isComplete ? "bg-emerald-400" : "bg-white/70",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Tareas */}
      <ul className="flex flex-1 flex-col gap-1 p-2">
        {tasks.length > 0 ? (
          tasks.map(task => {
            const taskDone = completed.has(task.id);
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  aria-pressed={taskDone}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                    taskDone
                      ? "bg-white/5 text-white/45"
                      : "bg-white/5 text-white hover:bg-white/15",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition-colors",
                      taskDone
                        ? "border-emerald-400 bg-emerald-400 text-black"
                        : "border-white/40",
                    )}
                  >
                    {taskDone && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 text-sm font-medium leading-snug sm:text-[15px]",
                      taskDone && "line-through",
                    )}
                  >
                    {task.title}
                  </span>
                  {task.duration_min ? (
                    <span className="shrink-0 font-mono text-[10px] text-white/40">
                      {task.duration_min}′
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })
        ) : (
          <li className="px-2.5 py-2 text-xs italic text-white/40">
            Sin tareas en esta tarjeta.
          </li>
        )}
      </ul>
    </article>
  );
}

/**
 * Tarjetas de una rutina (Activación, Desactivación, Alistamiento o Fin de
 * semana) en versión de solo marcado, pensada para el modo tablet: muestra las
 * mismas tarjetas y tareas de su página y deja tacharlas sin editar nada.
 */
export function RoutineCardsBoard({ type, className }: Props) {
  const { steps, cards, completed, loading, toggle } = useRoutineSteps(type);

  const tasksByCard = useMemo(() => {
    const map = new Map<string, RoutineStep[]>();
    for (const card of cards) map.set(card.id, []);
    for (const step of steps) {
      const id = stepCardId(step);
      if (!map.has(id)) map.set(id, []);
      map.get(id)!.push(step);
    }
    return map;
  }, [cards, steps]);

  const total = steps.length;
  const done = steps.filter(step => completed.has(step.id)).length;
  const progress = total ? (done / total) * 100 : 0;

  if (loading) {
    return (
      <div className={cn("grid gap-3 sm:grid-cols-2 xl:grid-cols-3", className)}>
        {[0, 1, 2].map(index => (
          <div
            key={index}
            className="flex h-40 items-center justify-center rounded-2xl border border-white/10 bg-white/5"
          >
            <Loader2 className="h-5 w-5 animate-spin text-white/50" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md">
        <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-white/80">
          {done}/{total}
        </span>
        <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="shrink-0 font-mono text-xs font-bold tabular-nums text-white/60">
          {Math.round(progress)}%
        </span>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-black/30 px-4 py-10 text-center text-sm text-white/55">
          Esta rutina todavía no tiene tarjetas. Créalas desde su página y
          aparecerán aquí.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {cards.map(card => (
            <RoutineBoardCard
              key={card.id}
              card={card}
              tasks={tasksByCard.get(card.id) ?? []}
              completed={completed}
              onToggleTask={taskId => {
                void toggle(taskId);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
