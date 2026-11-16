import { useMemo, useState } from 'react';
import { Plus, Search, Target, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { systemSpeedOptions, type DaySystem, type SystemSpeed } from '@/lib/daySystems';
import type { PlannerTask } from '@/lib/planMananaTasks';
import type { PlanObjective, PlanObjectiveKind } from '@/lib/planObjectives';
import {
  ACTIVITY_TAG_OPTIONS,
  ACTIVITY_TAG_STYLES,
  type ActivityTag,
} from '@/hooks/useSystemActivityTags';
import { ActivityTagBadge } from '@/components/systems/ActivityTagBadge';
import { cn } from '@/lib/utils';

/** Colores del enfoque planificado según el sistema. */
const FOCUS_TONES: Record<string, { border: string; bg: string; text: string }> = {
  universidad: { border: 'border-sky-400/40', bg: 'bg-sky-500/5', text: 'text-sky-700 dark:text-sky-300' },
  emprendimiento: { border: 'border-purple-400/40', bg: 'bg-purple-500/5', text: 'text-purple-700 dark:text-purple-300' },
  proyectos: { border: 'border-emerald-400/40', bg: 'bg-emerald-500/5', text: 'text-emerald-700 dark:text-emerald-300' },
};

/** Icono del objetivo cuando no tiene portada. */
const OBJECTIVE_EMOJI: Record<PlanObjectiveKind, string> = {
  libro: '📖',
  cancion: '🎹',
  materia: '🎓',
  proyecto: '📦',
  elo: '♟️',
};

interface PlanSystemCardProps {
  system: DaySystem;
  cover?: string | null;
  emoji: string;
  speed: SystemSpeed;
  onSpeedChange: (speed: SystemSpeed) => void;
  /** Etiqueta Activo/Pasivo del sistema (null = sin etiqueta). */
  activityTag?: ActivityTag | null;
  onActivityTagChange?: (tag: ActivityTag | null) => void;
  plannedMinutes: number;
  tasks: PlannerTask[];
  /** Títulos de los bloques donde el sistema tiene minutos planificados. */
  blocks: string[];
  /** Tareas pendientes que todavía no están en ningún bloque. */
  availableTasks: PlannerTask[];
  /** Enfoques elegidos en los bloques del día (estudio o trabajo). */
  focusPlans?: { blockTitle: string; emoji: string; primary: string; secondary: string | null }[];
  /** Objetivos planificados del periodo para este sistema (libro, canción, materia…). */
  objectives?: PlanObjective[];
  onAddTask: (task: PlannerTask) => void;
  onCreateTask: () => void;
  onRemoveTask: (taskId: string) => void;
}

export function PlanSystemCard({
  system,
  cover,
  emoji,
  speed,
  onSpeedChange,
  activityTag = null,
  onActivityTagChange,
  plannedMinutes,
  tasks,
  blocks,
  availableTasks,
  focusPlans,
  objectives,
  onAddTask,
  onCreateTask,
  onRemoveTask,
}: PlanSystemCardProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const options = useMemo(() => systemSpeedOptions(system), [system]);
  const selected = options.find(option => option.id === speed) ?? options[0];
  const targetMinutes = selected?.minutes ?? 0;
  const pct = targetMinutes > 0
    ? Math.min(100, Math.round((plannedMinutes / targetMinutes) * 100))
    : plannedMinutes > 0
      ? 100
      : 0;
  const complete = targetMinutes > 0 && plannedMinutes >= targetMinutes;
  const focusTone = FOCUS_TONES[system.id] ?? { border: 'border-border/50', bg: 'bg-foreground/5', text: 'text-foreground' };

  const matchingTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const sorted = [...availableTasks].sort((a, b) => a.title.localeCompare(b.title, 'es'));
    if (!query) return sorted;
    return sorted.filter(task => task.title.toLowerCase().includes(query));
  }, [availableTasks, search]);

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl ring-2 transition-colors',
        complete
          ? 'bg-emerald-500/5 ring-emerald-500/40'
          : plannedMinutes > 0
            ? 'bg-white/80 ring-sky-500/30 dark:bg-zinc-950/80'
            : 'bg-white/80 ring-border/40 dark:bg-zinc-950/80',
      )}
    >
      <div className={cn('relative h-16 w-full shrink-0 overflow-hidden bg-gradient-to-br', getCoverGradient(system.id))}>
        {cover ? (
          <img src={cover} alt={system.name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 grid place-items-center">
            <span className="text-2xl drop-shadow-sm">{emoji}</span>
          </div>
        )}
        <span
          className={cn(
            'absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-white backdrop-blur-sm',
            complete ? 'bg-emerald-600/80' : 'bg-black/45',
          )}
          title={`${plannedMinutes} min planificados · meta ${targetMinutes} min`}
        >
          {plannedMinutes > 0 ? `${plannedMinutes}′` : '0′'}
        </span>
        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[8px] font-bold text-white backdrop-blur-sm">
          {selected?.label ?? 'Máx'}
        </span>
        {/* Etiqueta Activo / Pasivo pegada a la portada */}
        <ActivityTagBadge tag={activityTag} className="absolute bottom-1.5 left-1.5" />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2.5">
        <div className="flex items-baseline gap-1.5">
          <h4 className="truncate text-[11px] font-bold leading-tight">{system.name}</h4>
          {blocks.length > 0 && (
            <span className="ml-auto min-w-0 truncate text-[8px] font-medium text-muted-foreground" title={blocks.join(' · ')}>
              {blocks[0]}
              {blocks.length > 1 ? ` +${blocks.length - 1}` : ''}
            </span>
          )}
        </div>

        {/* Etiqueta Activo / Pasivo */}
        <div className="flex flex-wrap items-center gap-1">
          <span className="text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Etiqueta
          </span>
          <div className="ml-auto flex items-center gap-1">
            {ACTIVITY_TAG_OPTIONS.map(option => {
              const active = activityTag === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => onActivityTagChange?.(active ? null : option.id)}
                  disabled={!onActivityTagChange}
                  aria-pressed={active}
                  title={active ? `Quitar etiqueta ${option.label}` : `${option.label} · ${option.hint}`}
                  className={cn(
                    'flex items-center gap-0.5 whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[8px] font-bold transition-colors',
                    active
                      ? ACTIVITY_TAG_STYLES[option.id].chip
                      : 'border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
                    !onActivityTagChange && 'cursor-default opacity-60',
                  )}
                >
                  <span aria-hidden>{option.icon}</span>
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Velocidad de avance del sistema */}
        <div className="flex flex-wrap gap-1">
          {options.map(option => (
            <button
              key={option.id}
              type="button"
              onClick={() => onSpeedChange(option.id)}
              title={`${option.label} · ${option.minutes} min`}
              className={cn(
                'rounded-md border px-1.5 py-0.5 text-[8px] font-bold tabular-nums transition-colors',
                speed === option.id
                  ? 'border-foreground/30 bg-foreground text-background'
                  : 'border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
              )}
            >
              {option.label} {option.minutes}′
            </button>
          ))}
        </div>

        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              complete ? 'bg-emerald-500' : plannedMinutes > 0 ? 'bg-sky-500' : 'bg-muted-foreground/30',
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-[8px] text-muted-foreground">
          <span className="tabular-nums">{plannedMinutes} / {targetMinutes} min</span>
          <span className="tabular-nums">{tasks.length} tarea{tasks.length === 1 ? '' : 's'}</span>
        </div>

        {/* Objetivos planificados del periodo (libro, canción, materia, proyecto, ELO) */}
        {objectives && objectives.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              <Target className="h-2.5 w-2.5" />
              Objetivo
            </div>
            {objectives.map(objective => {
              const isBook = objective.kind === 'libro';
              const isRead = isBook && (objective.status === 'completed' || Boolean(objective.finishDate));
              const isReading = isBook && objective.isCurrent && !isRead;
              return (
                <div
                  key={`${objective.kind}-${objective.id}`}
                  title={[objective.title, objective.subtitle, objective.tag].filter(Boolean).join(' · ')}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-1.5 py-1 ring-1',
                    isRead
                      ? 'bg-emerald-500/10 ring-emerald-500/40'
                      : isReading
                        ? 'bg-blue-500/10 ring-blue-500/40'
                        : 'bg-foreground/5 ring-transparent',
                  )}
                >
                  {objective.cover ? (
                    <img
                      src={objective.cover}
                      alt={objective.title}
                      className="h-7 w-5 shrink-0 rounded border border-border/40 object-cover"
                    />
                  ) : (
                    <span aria-hidden className="text-[10px] leading-none">{OBJECTIVE_EMOJI[objective.kind]}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9px] font-bold leading-tight">{objective.title}</p>
                    {objective.subtitle && (
                      <p className="truncate text-[8px] leading-tight text-muted-foreground">{objective.subtitle}</p>
                    )}
                  </div>
                  {objective.tag && (
                    <span className="shrink-0 rounded border border-indigo-500/25 bg-indigo-500/10 px-1 py-0.5 text-[8px] font-bold text-indigo-600 dark:text-indigo-400">
                      {objective.tag}
                    </span>
                  )}
                  {isRead && (
                    <span className="shrink-0 rounded border border-emerald-500/30 bg-emerald-500/15 px-1 py-0.5 text-[8px] font-bold text-emerald-600 dark:text-emerald-400">
                      Leído ✓
                    </span>
                  )}
                  {isReading && (
                    <span className="shrink-0 rounded border border-blue-500/30 bg-blue-500/15 px-1 py-0.5 text-[8px] font-bold text-blue-600 dark:text-blue-400">
                      Leyendo
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tareas del sistema */}
        {tasks.length > 0 ? (
          <div className="max-h-28 space-y-0.5 overflow-y-auto pr-0.5">
            {tasks.map(task => (
              <div
                key={task.id}
                className="group flex items-center gap-1.5 rounded-md bg-foreground/5 px-1.5 py-1"
              >
                <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', task.completed ? 'bg-emerald-500' : 'bg-sky-500')} />
                <span className={cn('min-w-0 flex-1 truncate text-[9px] leading-tight', task.completed && 'text-muted-foreground line-through')}>
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveTask(task.id)}
                  title="Quitar del bloque"
                  className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border/50 px-1.5 py-1.5 text-[8px] leading-tight text-muted-foreground/80">
            Sin tareas asignadas. Añade una para planificarla en un bloque.
          </p>
        )}

        {/* Enfoques planificados en los bloques del día */}
        {focusPlans && focusPlans.length > 0 && (
          <div className={cn('space-y-0.5 rounded-md border px-1.5 py-1', focusTone.border, focusTone.bg)}>
            {focusPlans.map((plan, index) => (
              <div
                key={`${plan.blockTitle}-${index}`}
                className="flex items-center gap-1"
                title={`${plan.blockTitle} · ${plan.primary}${plan.secondary ? ` · ${plan.secondary}` : ''}`}
              >
                <span aria-hidden className="text-[9px] leading-none">{plan.emoji}</span>
                <span className={cn('min-w-0 flex-1 truncate text-[9px] font-medium leading-tight', focusTone.text)}>
                  {plan.primary}
                </span>
                {plan.secondary && (
                  <span className="min-w-0 max-w-[55%] truncate text-[8px] leading-tight text-muted-foreground" title={plan.secondary}>
                    {plan.secondary}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Añadir tarea dentro de la tarjeta */}
        <Popover open={open} onOpenChange={value => { setOpen(value); if (!value) setSearch(''); }}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="mt-auto flex w-full items-center justify-center gap-1 rounded-lg border border-dashed border-border/60 bg-foreground/[0.03] py-1 text-[9px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Plus className="h-3 w-3" /> Añadir tarea
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar tarea..."
                className="h-7 pl-7 text-[11px]"
              />
            </div>
            <div className="mt-1.5 max-h-48 space-y-0.5 overflow-y-auto">
              {matchingTasks.length > 0 ? (
                matchingTasks.map(task => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => {
                      onAddTask(task);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left transition-colors hover:bg-muted/60"
                  >
                    <Target className="h-3 w-3 shrink-0 text-sky-500" />
                    <span className="min-w-0 flex-1 truncate text-[10px]">{task.title}</span>
                    <Plus className="h-3 w-3 shrink-0 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <p className="px-1.5 py-2 text-center text-[10px] text-muted-foreground">
                  No hay tareas pendientes de este sistema.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                onCreateTask();
                setOpen(false);
                setSearch('');
              }}
              className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-border/60 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              <Plus className="h-3 w-3" /> Nueva tarea de {system.name}
            </button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
