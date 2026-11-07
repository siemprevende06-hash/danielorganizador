import { useMemo, useState } from 'react';
import { ArrowRight, GripVertical, Inbox, Search, Target, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { SPEED_PLAN_SYSTEMS } from '@/lib/daySystems';
import { planSystemEmoji, planSystemName, type PlannerTask } from '@/lib/planMananaTasks';
import { cn } from '@/lib/utils';

interface TaskInboxCardProps {
  tasks: PlannerTask[];
  assignedIds: Set<string>;
  selectedIds: Set<string>;
  onToggleSelect: (taskId: string) => void;
  onAssign: (task: PlannerTask) => void;
  onAssignSelected: () => void;
  onRemove: (taskId: string) => void;
  onDragStart: (event: React.DragEvent, taskId: string) => void;
}

const SYSTEM_ORDER = SPEED_PLAN_SYSTEMS.map(system => system.id);

export function TaskInboxCard({
  tasks,
  assignedIds,
  selectedIds,
  onToggleSelect,
  onAssign,
  onAssignSelected,
  onRemove,
  onDragStart,
}: TaskInboxCardProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const presentSystems = useMemo(() => {
    const ids = new Set(tasks.map(task => task.systemId));
    return SYSTEM_ORDER.filter(id => ids.has(id));
  }, [tasks]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks
      .filter(task => filter === 'all' || task.systemId === filter)
      .filter(task => !query || task.title.toLowerCase().includes(query))
      .sort((a, b) => {
        const orderA = SYSTEM_ORDER.indexOf(a.systemId);
        const orderB = SYSTEM_ORDER.indexOf(b.systemId);
        if (orderA !== orderB) return orderA - orderB;
        return a.title.localeCompare(b.title, 'es');
      });
  }, [tasks, filter, search]);

  const selectedCount = useMemo(
    () => [...selectedIds].filter(id => !assignedIds.has(id)).length,
    [selectedIds, assignedIds],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/80 shadow-sm dark:bg-zinc-950/80">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="space-y-2 p-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-amber-500" />
          <h2 className="text-sm font-semibold">Bandeja de tareas</h2>
          <Badge variant="secondary" className="ml-auto text-[9px]">{tasks.length}</Badge>
        </div>
        <p className="text-[9px] text-muted-foreground">
          Busca, selecciona y coloca cada tarea en un Deep Work. También puedes arrastrarlas a la línea de tiempo.
        </p>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Buscar tarea..."
            className="h-8 pl-8 text-xs"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={cn(
              'shrink-0 rounded-lg border px-2 py-1 text-[9px] font-semibold transition-colors',
              filter === 'all'
                ? 'border-foreground/30 bg-foreground text-background'
                : 'border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
            )}
          >
            Todas
          </button>
          {presentSystems.map(systemId => (
            <button
              key={systemId}
              type="button"
              onClick={() => setFilter(systemId)}
              className={cn(
                'shrink-0 rounded-lg border px-2 py-1 text-[9px] font-semibold transition-colors',
                filter === systemId
                  ? 'border-foreground/30 bg-foreground text-background'
                  : 'border-border/50 bg-foreground/5 text-muted-foreground hover:bg-foreground/10',
              )}
            >
              {planSystemEmoji(systemId)} {planSystemName(systemId)}
            </button>
          ))}
        </div>

        <div className="max-h-[380px] space-y-1 overflow-y-auto pr-0.5">
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
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-500/15 text-[8px] text-emerald-600 dark:text-emerald-400">
                      ✓
                    </span>
                  ) : (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => onToggleSelect(task.id)}
                      className="h-4 w-4 shrink-0"
                    />
                  )}
                  {!assigned && (
                    <GripVertical className="h-3 w-3 shrink-0 cursor-grab text-muted-foreground/40 active:cursor-grabbing" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] leading-tight">{task.title}</p>
                    <p className="flex items-center gap-1 text-[8px] text-muted-foreground">
                      <span>{planSystemEmoji(task.systemId)}</span>
                      <span>{planSystemName(task.systemId)}</span>
                      {assigned && <span className="font-semibold text-emerald-600 dark:text-emerald-400">· En un bloque</span>}
                      {!assigned && selected && <span className="font-semibold text-amber-600 dark:text-amber-400">· En el plan</span>}
                    </p>
                  </div>
                  {assigned ? (
                    <button
                      type="button"
                      onClick={() => onRemove(task.id)}
                      title="Quitar del plan"
                      className="grid h-5 w-5 shrink-0 place-items-center rounded text-muted-foreground/60 transition-colors hover:bg-red-500/10 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onAssign(task)}
                      title="Colocar en un Deep Work"
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
              <p className="text-xs text-muted-foreground">No hay tareas con este filtro.</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2">
          <span className="text-[9px] font-medium text-muted-foreground">
            {selectedCount > 0 ? `${selectedCount} seleccionada${selectedCount === 1 ? '' : 's'}` : 'Selecciona tareas para el plan'}
          </span>
          <Button
            size="sm"
            className="h-7 rounded-full gap-1 text-[10px]"
            disabled={selectedCount === 0}
            onClick={onAssignSelected}
          >
            <ArrowRight className="h-3 w-3" /> Asignar al plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
