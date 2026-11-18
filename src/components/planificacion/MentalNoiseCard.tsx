import { useMemo, useState } from 'react';
import { Brain, Check, GripVertical, Loader2, Moon, Plus, Search, Sun, Target, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import type { PlannerTask } from '@/lib/planMananaTasks';
import { cn } from '@/lib/utils';

interface MentalNoiseCardProps {
  tasks: PlannerTask[];
  assignedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (taskId: string) => void;
  onAssign: (task: PlannerTask) => void;
  onRemove: (taskId: string) => void;
  onDragStart: (event: React.DragEvent, taskId: string) => void;
  /** Crea una tarea nueva directamente en el grupo Ruido Mental. */
  onCreateTask?: (title: string) => Promise<boolean | void> | boolean | void;
  dayMode?: 'hoy' | 'manana';
}

/**
 * Sección del planificador para las tareas del grupo "Ruido Mental".
 * Son las tareas creadas desde Tareas → Ruido Mental (o desde aquí mismo).
 */
export function MentalNoiseCard({
  tasks,
  assignedIds,
  selectedIds,
  onToggleSelect,
  onAssign,
  onRemove,
  onDragStart,
  onCreateTask,
  dayMode = 'manana',
}: MentalNoiseCardProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCreating, setQuickCreating] = useState(false);
  const [search, setSearch] = useState('');

  const dayLabel = dayMode === 'hoy' ? 'Hoy' : 'Mañana';
  const DayIcon = dayMode === 'hoy' ? Sun : Moon;

  const stagedIds = useMemo(() => {
    const known = new Set(tasks.map(task => task.id));
    return new Set([...selectedIds].filter(id => !assignedIds.has(id) && known.has(id)));
  }, [selectedIds, assignedIds, tasks]);

  const assignedCount = useMemo(
    () => tasks.filter(task => assignedIds.has(task.id)).length,
    [tasks, assignedIds],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...tasks]
      .filter(task => !query || task.title.toLowerCase().includes(query))
      .sort((a, b) => {
        const assignedDiff = Number(assignedIds.has(a.id)) - Number(assignedIds.has(b.id));
        if (assignedDiff !== 0) return assignedDiff;
        return a.title.localeCompare(b.title, 'es');
      });
  }, [tasks, search, assignedIds]);

  const handleQuickCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    const title = quickTitle.trim();
    if (!title || quickCreating || !onCreateTask) return;

    setQuickCreating(true);
    try {
      const created = await onCreateTask(title);
      if (created !== false) setQuickTitle('');
    } finally {
      setQuickCreating(false);
    }
  };

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-400" />
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-rose-500/10">
            <Brain className="h-4 w-4 text-rose-500" />
          </span>
          <h2 className="text-sm font-semibold">Ruido Mental</h2>
          <Badge variant="secondary" className="ml-auto text-[9px]">{tasks.length}</Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">
          Lo que sueltas aquí viene del grupo <strong>Ruido Mental</strong> de Tareas. Selecciona para
          pasarlo a <strong>{dayLabel}</strong> o arrástralo a un bloque para vaciarlo.
        </p>

        {onCreateTask && (
          <form
            onSubmit={handleQuickCreate}
            className="rounded-xl border border-dashed border-rose-500/40 bg-rose-500/5 p-1"
          >
            <div className="flex items-center gap-1">
              <Plus className="ml-1 h-3.5 w-3.5 shrink-0 text-rose-500" />
              <Input
                value={quickTitle}
                onChange={event => setQuickTitle(event.target.value)}
                placeholder="Añadir al ruido mental..."
                className="h-7 border-0 bg-transparent px-1 text-[11px] shadow-none focus-visible:ring-0"
                disabled={quickCreating}
              />
              <Button
                type="submit"
                size="sm"
                className="h-7 shrink-0 gap-1 rounded-lg bg-rose-600 px-2 text-[10px] text-white hover:bg-rose-700"
                disabled={!quickTitle.trim() || quickCreating}
              >
                {quickCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                <span className="hidden sm:inline">Añadir</span>
              </Button>
            </div>
          </form>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar en el ruido mental..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="max-h-[280px] space-y-1 overflow-y-auto pr-0.5">
          {filtered.length > 0 ? (
            filtered.map(task => {
              const assigned = assignedIds.has(task.id);
              const selected = selectedIds.has(task.id);
              return (
                <div
                  key={task.id}
                  draggable={!assigned}
                  onDragStart={event => onDragStart(event, task.id)}
                  className={cn(
                    'group flex items-center gap-1.5 rounded-lg border px-1.5 py-1.5 transition-colors',
                    assigned
                      ? 'border-emerald-500/20 bg-emerald-500/5'
                      : 'border-border/40 bg-background/50 hover:bg-muted/50',
                  )}
                >
                  {assigned ? (
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                  ) : (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect(task.id)}
                      aria-label={`Seleccionar ${task.title} para ${dayLabel}`}
                      className="h-4 w-4 shrink-0"
                    />
                  )}
                  {!assigned && (
                    <GripVertical
                      className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/40 active:cursor-grabbing"
                      aria-hidden
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] leading-tight">{task.title}</p>
                    <p className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <Brain className="h-2.5 w-2.5 text-rose-400" />
                      <span>Ruido Mental</span>
                      {assigned && <span className="font-semibold text-emerald-600 dark:text-emerald-400">· En un bloque</span>}
                      {!assigned && selected && (
                        <span className="flex items-center gap-0.5 font-semibold text-rose-600 dark:text-rose-400">
                          · <DayIcon className="h-2 w-2" /> En {dayLabel}
                        </span>
                      )}
                    </p>
                  </div>
                  {assigned ? (
                    <button
                      type="button"
                      onClick={() => onRemove(task.id)}
                      title="Quitar del plan"
                      aria-label={`Quitar ${task.title} del plan`}
                      className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAssign(task)}
                      title="Colocar en un bloque"
                      aria-label={`Asignar ${task.title} a un bloque`}
                      className="flex h-5 shrink-0 items-center gap-0.5 rounded px-1 text-[8px] font-semibold text-muted-foreground transition-colors hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400"
                    >
                      <Target className="h-3 w-3" />
                      <span className="hidden sm:inline">Asignar</span>
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-xl border border-dashed border-border/60 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                {search.trim()
                  ? 'No hay coincidencias en tu ruido mental.'
                  : 'Nada por aquí. Suelta lo que te esté dando vueltas.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2">
          <span className="truncate text-[10px] font-medium text-muted-foreground">
            {stagedIds.size > 0
              ? `${stagedIds.size} en ${dayLabel.toLowerCase()}`
              : `Elige las que quieras para ${dayLabel.toLowerCase()}`}
          </span>
          <Badge variant="outline" className="shrink-0 text-[8px] tabular-nums">
            {assignedCount} en bloques
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
