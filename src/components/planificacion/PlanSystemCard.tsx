import { useMemo, useState } from 'react';
import { Plus, Search, Target, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getCoverGradient } from '@/components/areas/AreaCover';
import { systemSpeedOptions, type DaySystem, type SystemSpeed } from '@/lib/daySystems';
import type { PlannerTask } from '@/lib/planMananaTasks';
import { cn } from '@/lib/utils';

interface PlanSystemCardProps {
  system: DaySystem;
  cover?: string | null;
  emoji: string;
  speed: SystemSpeed;
  onSpeedChange: (speed: SystemSpeed) => void;
  plannedMinutes: number;
  tasks: PlannerTask[];
  /** Títulos de los bloques donde el sistema tiene minutos planificados. */
  blocks: string[];
  /** Tareas pendientes que todavía no están en ningún bloque. */
  availableTasks: PlannerTask[];
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
  plannedMinutes,
  tasks,
  blocks,
  availableTasks,
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
                  title="Quitar del plan"
                  className="grid h-3.5 w-3.5 shrink-0 place-items-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border/50 px-1.5 py-1.5 text-[8px] leading-tight text-muted-foreground/80">
            Sin tareas asignadas. Añade una para planificarla en un Deep Work.
          </p>
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
