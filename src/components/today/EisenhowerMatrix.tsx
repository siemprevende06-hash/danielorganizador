import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Check, Loader2, GripVertical, LayoutGrid, Zap, CalendarClock, Send, Trash2,
  ChevronDown, ChevronUp, ArrowRight, ArrowDown,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TaskItem } from '@/hooks/useDailyPlanData';

type Quadrant = 'hacer' | 'programar' | 'delegar' | 'eliminar';

interface QuadrantCfg {
  id: Quadrant;
  name: string;
  hint: string;
  urgency: 'Urgente' | 'No urgente';
  importance: 'Importante' | 'No importante';
  icon: ReactNode;
  topBar: string;
  tint: string;
  iconBg: string;
  hintColor: string;
  bar: string;
  ring: string;
}

const QUADRANTS: Record<Quadrant, QuadrantCfg> = {
  hacer: {
    id: 'hacer',
    name: 'Hacer',
    hint: 'Ejecútalo hoy mismo',
    urgency: 'Urgente',
    importance: 'Importante',
    icon: <Zap className="h-3.5 w-3.5" />,
    topBar: 'from-rose-500 to-red-400',
    tint: 'bg-rose-50/70 dark:bg-rose-950/[0.15] border-rose-300/60 dark:border-rose-500/20',
    iconBg: 'bg-rose-500/15 text-rose-500',
    hintColor: 'text-rose-600 dark:text-rose-400',
    bar: 'bg-rose-500',
    ring: 'ring-2 ring-rose-400/70 ring-offset-2 ring-offset-background',
  },
  programar: {
    id: 'programar',
    name: 'Programar',
    hint: 'Agéndalo y mantenlo a la vista',
    urgency: 'No urgente',
    importance: 'Importante',
    icon: <CalendarClock className="h-3.5 w-3.5" />,
    topBar: 'from-amber-500 to-orange-400',
    tint: 'bg-amber-50/70 dark:bg-amber-950/[0.15] border-amber-300/60 dark:border-amber-500/20',
    iconBg: 'bg-amber-500/15 text-amber-500',
    hintColor: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    ring: 'ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background',
  },
  delegar: {
    id: 'delegar',
    name: 'Delegar',
    hint: 'Asigna o automatiza',
    urgency: 'Urgente',
    importance: 'No importante',
    icon: <Send className="h-3.5 w-3.5" />,
    topBar: 'from-blue-500 to-cyan-400',
    tint: 'bg-blue-50/70 dark:bg-blue-950/[0.15] border-blue-300/60 dark:border-blue-500/20',
    iconBg: 'bg-blue-500/15 text-blue-500',
    hintColor: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    ring: 'ring-2 ring-blue-400/70 ring-offset-2 ring-offset-background',
  },
  eliminar: {
    id: 'eliminar',
    name: 'Eliminar',
    hint: 'Déjalo o elimínalo',
    urgency: 'No urgente',
    importance: 'No importante',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    topBar: 'from-slate-500 to-slate-400',
    tint: 'bg-slate-100/70 dark:bg-slate-800/20 border-slate-300/60 dark:border-slate-600/30',
    iconBg: 'bg-slate-500/15 text-slate-500',
    hintColor: 'text-slate-600 dark:text-slate-400',
    bar: 'bg-slate-500',
    ring: 'ring-2 ring-slate-400/70 ring-offset-2 ring-offset-background',
  },
};

const Q_ORDER: Quadrant[] = ['hacer', 'programar', 'delegar', 'eliminar'];

const SOURCE_META: Record<string, { label: string; cls: string }> = {
  universidad: { label: 'Uni', cls: 'text-blue-500' },
  university: { label: 'Uni', cls: 'text-blue-500' },
  emprendimiento: { label: 'Emprende', cls: 'text-purple-500' },
  entrepreneurship: { label: 'Emprende', cls: 'text-purple-500' },
  entrepreneur: { label: 'Emprende', cls: 'text-purple-500' },
  proyectos: { label: 'Proyecto', cls: 'text-amber-500' },
  project: { label: 'Proyecto', cls: 'text-amber-500' },
  proyectos_: { label: 'Proyecto', cls: 'text-amber-500' },
  idiomas: { label: 'Idiomas', cls: 'text-emerald-500' },
  general: { label: 'General', cls: 'text-muted-foreground' },
};

const sourceOf = (t: TaskItem): string => {
  const raw = ((t.area_id || t.source || 'general') as string).toLowerCase();
  return raw === 'proyectos' ? 'project' : raw;
};

const autoQuadrant = (t: TaskItem): Quadrant => {
  if (t.priority === 'high') return 'hacer';
  if (t.priority === 'medium') return 'programar';
  if (t.priority === 'low') return 'delegar';
  return 'eliminar';
};

const storageKey = (date: Date) => `eisenhower_${format(date, 'yyyy-MM-dd')}`;

const readStored = (key: string): Record<string, Quadrant> | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Quadrant>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export function EisenhowerMatrix({ tasks, onToggle, date }: {
  tasks: TaskItem[];
  onToggle: (taskId: string) => void;
  date: Date;
}) {
  const key = storageKey(date);
  const [map, setMap] = useState<Record<string, Quadrant>>(() => readStored(key) || {});
  const [toggling, setToggling] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Quadrant | null>(null);

  useEffect(() => {
    setMap(prev => {
      const next = { ...prev };
      let changed = false;
      for (const t of tasks) {
        if (t.completed) continue;
        if (!next[t.id]) {
          next[t.id] = autoQuadrant(t);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [tasks]);

  const persist = (next: Record<string, Quadrant>) => {
    localStorage.setItem(key, JSON.stringify(next));
  };

  const moveTo = (taskId: string, q: Quadrant) => {
    setMap(prev => {
      const next = { ...prev, [taskId]: q };
      persist(next);
      return next;
    });
  };

  const rotate = (taskId: string, dir: 1 | -1) => {
    setMap(prev => {
      const cur = prev[taskId];
      if (!cur) return prev;
      const idx = Q_ORDER.indexOf(cur);
      const nextQ = Q_ORDER[(idx + dir + Q_ORDER.length) % Q_ORDER.length];
      const next = { ...prev, [taskId]: nextQ };
      persist(next);
      return next;
    });
  };

  const handleToggle = async (taskId: string) => {
    setToggling(taskId);
    try {
      await onToggle(taskId);
    } finally {
      setToggling(null);
    }
  };

  const pending = useMemo(() => tasks.filter(t => !t.completed).length, [tasks]);
  const pendingClassified = useMemo(
    () => tasks.filter(t => !t.completed && map[t.id]).length,
    [tasks, map],
  );

  const renderQuadrant = (q: QuadrantCfg) => {
    const list = tasks.filter(t => map[t.id] === q.id);
    const total = list.length;
    const done = list.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isOver = dragOver === q.id;

    return (
      <div
        key={q.id}
        onDragOver={e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOver(q.id);
        }}
        onDragLeave={() => setDragOver(prev => (prev === q.id ? null : prev))}
        onDrop={e => {
          e.preventDefault();
          setDragOver(null);
          const id = e.dataTransfer.getData('text/plain');
          if (id) moveTo(id, q.id);
        }}
        className={cn(
          'relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 animate-fade-in',
          q.tint,
          isOver ? q.ring : 'hover:shadow-md',
        )}
      >
        <div className={cn('h-1 shrink-0 bg-gradient-to-r', q.topBar)} />
        <div className="flex-1 p-2.5 space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={cn('w-6 h-6 rounded-lg flex items-center justify-center shrink-0', q.iconBg)}>
              {q.icon}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-tight leading-none">{q.name}</p>
              <p className={cn('text-[9px] leading-tight mt-0.5 truncate', q.hintColor)}>{q.hint}</p>
            </div>
            <div className="md:hidden flex flex-col items-end gap-0.5 shrink-0">
              <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded bg-foreground/[0.07] text-muted-foreground">
                {q.urgency}
              </span>
              <span className="text-[7px] font-bold uppercase tracking-wider px-1 py-px rounded bg-foreground/[0.07] text-muted-foreground">
                {q.importance}
              </span>
            </div>
            <Badge variant="secondary" className="hidden md:inline-flex text-[9px] px-1.5 py-0 h-4 shrink-0">
              {total}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-foreground/[0.07] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', q.bar)}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[8px] font-semibold tabular-nums text-muted-foreground shrink-0">
              {done}/{total}
            </span>
          </div>

          <div className="space-y-1 min-h-0 max-h-52 overflow-y-auto pr-0.5">
            {list.length === 0 ? (
              <div className="rounded-lg border border-dashed border-foreground/10 py-3 text-center">
                <p className="text-[9px] text-muted-foreground/70 italic">Sin tareas</p>
              </div>
            ) : (
              list.map(task => {
                const meta = SOURCE_META[sourceOf(task)] || SOURCE_META.general;
                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/plain', task.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    className={cn(
                      'flex items-center gap-1.5 p-1.5 rounded-lg border text-[11px] cursor-grab active:cursor-grabbing transition-colors',
                      task.completed
                        ? 'bg-background/40 dark:bg-background/40 border-border/40'
                        : 'bg-white/60 dark:bg-zinc-950/60 border-border/60 hover:bg-muted/40',
                    )}
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                    <button
                      onClick={() => handleToggle(task.id)}
                      className={cn(
                        'shrink-0 w-4 h-4 rounded-[5px] border flex items-center justify-center transition-colors cursor-pointer',
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-muted-foreground/40 hover:border-emerald-500',
                      )}
                      title={task.completed ? 'Desmarcar' : 'Marcar como hecha'}
                    >
                      {toggling === task.id
                        ? <Loader2 className="w-2.5 h-2.5 animate-spin" />
                        : task.completed && <Check className="w-2.5 h-2.5" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('leading-snug break-words', task.completed && 'line-through text-muted-foreground')}>
                        {task.title}
                      </p>
                      <p className={cn('text-[8px] font-semibold uppercase tracking-wider', meta.cls)}>
                        {meta.label}
                      </p>
                    </div>
                    <div className="flex flex-col shrink-0 gap-px">
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          rotate(task.id, -1);
                        }}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors"
                        title="Mover al cuadrante anterior"
                      >
                        <ChevronUp className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          rotate(task.id, 1);
                        }}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors"
                        title="Mover al siguiente cuadrante"
                      >
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-rose-500 via-amber-400 to-slate-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-500 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight leading-tight">Matriz de Eisenhower</h3>
              <p className="text-[10px] text-muted-foreground">Prioriza tus tareas por urgencia e importancia</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
            {pendingClassified}/{pending} clasificadas
          </Badge>
        </div>

        {pending === 0 && (
          <div className="text-[11px] text-muted-foreground rounded-xl bg-muted/40 px-3 py-2">
            Sin tareas pendientes. Crea o asigna tareas para organizarlas en la matriz.
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-[44px_1fr_1fr] md:gap-2 gap-1.5">
          <div className="hidden md:block" />

          <div className="hidden md:flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground pb-0.5">
            Urgente <ArrowRight className="h-2.5 w-2.5" />
          </div>
          <div className="hidden md:flex items-center justify-center gap-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground pb-0.5">
            No urgente <ArrowRight className="h-2.5 w-2.5 opacity-40" />
          </div>

          <div className="hidden md:flex items-center justify-center gap-1">
            <ArrowDown className="h-2.5 w-2.5 opacity-40 shrink-0 -rotate-90" />
            <span className="[writing-mode:vertical-rl] text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Importante
            </span>
          </div>
          {renderQuadrant(QUADRANTS.hacer)}
          {renderQuadrant(QUADRANTS.programar)}

          <div className="hidden md:flex items-center justify-center gap-1">
            <ArrowDown className="h-2.5 w-2.5 opacity-20 shrink-0 -rotate-90" />
            <span className="[writing-mode:vertical-rl] text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground opacity-60">
              No importante
            </span>
          </div>
          {renderQuadrant(QUADRANTS.delegar)}
          {renderQuadrant(QUADRANTS.eliminar)}
        </div>

        <p className="text-[9px] text-muted-foreground/70 flex items-center gap-1.5">
          <GripVertical className="h-3 w-3" />
          Arrastra o usa las flechas para cambiar de cuadrante · la clasificación se guarda automáticamente
        </p>
      </CardContent>
    </Card>
  );
}