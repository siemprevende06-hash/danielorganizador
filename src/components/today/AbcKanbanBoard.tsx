import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Check, Loader2, GripVertical, LayoutGrid, CalendarClock, Clock, Trash2, Target,
  ChevronDown, ChevronUp, ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import type { TaskItem } from '@/hooks/useDailyPlanData';

type Category = 'a' | 'b' | 'c' | 'd';

interface CategoryCfg {
  id: Category;
  letter: string;
  name: string;
  hint: string;
  icon: ReactNode;
  topBar: string;
  tint: string;
  letterBg: string;
  hintColor: string;
  bar: string;
  ring: string;
}

const CATEGORIES: Record<Category, CategoryCfg> = {
  a: {
    id: 'a',
    letter: 'A',
    name: 'Hazlo',
    hint: 'Críticas · máxima prioridad',
    icon: <Target className="h-3.5 w-3.5" />,
    topBar: 'from-red-500 to-rose-400',
    tint: 'bg-red-50/70 dark:bg-red-950/[0.15] border-red-300/60 dark:border-red-500/20',
    letterBg: 'bg-red-500/15 text-red-500',
    hintColor: 'text-red-600 dark:text-red-400',
    bar: 'bg-red-500',
    ring: 'ring-2 ring-red-400/70 ring-offset-2 ring-offset-background',
  },
  b: {
    id: 'b',
    letter: 'B',
    name: 'Programa',
    hint: 'Importantes · agenda próxima',
    icon: <CalendarClock className="h-3.5 w-3.5" />,
    topBar: 'from-amber-500 to-orange-400',
    tint: 'bg-amber-50/70 dark:bg-amber-950/[0.15] border-amber-300/60 dark:border-amber-500/20',
    letterBg: 'bg-amber-500/15 text-amber-500',
    hintColor: 'text-amber-600 dark:text-amber-400',
    bar: 'bg-amber-500',
    ring: 'ring-2 ring-amber-400/70 ring-offset-2 ring-offset-background',
  },
  c: {
    id: 'c',
    letter: 'C',
    name: 'Cuando puedas',
    hint: 'Menor prioridad · opcional',
    icon: <Clock className="h-3.5 w-3.5" />,
    topBar: 'from-blue-500 to-cyan-400',
    tint: 'bg-blue-50/70 dark:bg-blue-950/[0.15] border-blue-300/60 dark:border-blue-500/20',
    letterBg: 'bg-blue-500/15 text-blue-500',
    hintColor: 'text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    ring: 'ring-2 ring-blue-400/70 ring-offset-2 ring-offset-background',
  },
  d: {
    id: 'd',
    letter: 'D',
    name: 'Delega / Elimina',
    hint: 'No esenciales · descarta',
    icon: <Trash2 className="h-3.5 w-3.5" />,
    topBar: 'from-slate-500 to-slate-400',
    tint: 'bg-slate-100/70 dark:bg-slate-800/20 border-slate-300/60 dark:border-slate-600/30',
    letterBg: 'bg-slate-500/15 text-slate-500',
    hintColor: 'text-slate-600 dark:text-slate-400',
    bar: 'bg-slate-500',
    ring: 'ring-2 ring-slate-400/70 ring-offset-2 ring-offset-background',
  },
};

const CAT_ORDER: Category[] = ['a', 'b', 'c', 'd'];

const SOURCE_META: Record<string, { label: string; cls: string }> = {
  universidad: { label: 'Uni', cls: 'text-blue-500' },
  university: { label: 'Uni', cls: 'text-blue-500' },
  emprendimiento: { label: 'Emprende', cls: 'text-purple-500' },
  entrepreneurship: { label: 'Emprende', cls: 'text-purple-500' },
  entrepreneur: { label: 'Emprende', cls: 'text-purple-500' },
  proyectos: { label: 'Proyecto', cls: 'text-amber-500' },
  project: { label: 'Proyecto', cls: 'text-amber-500' },
  idiomas: { label: 'Idiomas', cls: 'text-emerald-500' },
  general: { label: 'General', cls: 'text-muted-foreground' },
};

const sourceOf = (t: TaskItem): string => {
  const raw = ((t.area_id || t.source || 'general') as string).toLowerCase();
  return raw === 'proyectos' ? 'project' : raw;
};

const taskScore = (t: TaskItem): number => {
  let s = 0;
  if (t.priority === 'high') s += 4;
  else if (t.priority === 'medium') s += 3;
  else if (t.priority === 'low') s += 2;
  else s += 1;
  const src = sourceOf(t);
  if (src === 'entrepreneurship') s += 2;
  else if (src === 'university') s += 1;
  else if (src === 'project') s += 0.5;
  return s;
};

const bucketIndex = (pos: number, size: number): number =>
  size <= 1 ? 0 : Math.min(3, Math.floor((pos * 4) / size));

const storageKey = (date: Date) => `abc_${format(date, 'yyyy-MM-dd')}`;

const readStored = (key: string): Record<string, Category> | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, Category>;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

export function AbcKanbanBoard({ tasks, onToggle, date }: {
  tasks: TaskItem[];
  onToggle: (taskId: string) => void;
  date: Date;
}) {
  const key = storageKey(date);
  const [map, setMap] = useState<Record<string, Category>>(() => readStored(key) || {});
  const [toggling, setToggling] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<Category | null>(null);

  useEffect(() => {
    setMap(prev => {
      const pending = tasks.filter(t => !t.completed);
      if (pending.length === 0) return prev;
      const sorted = [...pending].sort((x, y) => taskScore(x) - taskScore(y));
      const n = sorted.length;
      const next = { ...prev };
      let changed = false;
      sorted.forEach((t, i) => {
        if (next[t.id]) return;
        const idx = bucketIndex(i, n);
        const cat: Category = idx === 3 ? 'a' : idx === 2 ? 'b' : idx === 1 ? 'c' : 'd';
        next[t.id] = cat;
        changed = true;
      });
      return changed ? next : prev;
    });
  }, [tasks]);

  const persist = (next: Record<string, Category>) => {
    localStorage.setItem(key, JSON.stringify(next));
  };

  const moveTo = (taskId: string, cat: Category) => {
    setMap(prev => {
      const next = { ...prev, [taskId]: cat };
      persist(next);
      return next;
    });
  };

  const rotate = (taskId: string, dir: 1 | -1) => {
    setMap(prev => {
      const cur = prev[taskId];
      if (!cur) return prev;
      const idx = CAT_ORDER.indexOf(cur);
      const nextCat = CAT_ORDER[(idx + dir + CAT_ORDER.length) % CAT_ORDER.length];
      const next = { ...prev, [taskId]: nextCat };
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

  const renderColumn = (cat: CategoryCfg) => {
    const list = tasks.filter(t => map[t.id] === cat.id);
    const total = list.length;
    const done = list.filter(t => t.completed).length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    const isOver = dragOver === cat.id;

    return (
      <div
        key={cat.id}
        onDragOver={e => {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOver(cat.id);
        }}
        onDragLeave={() => setDragOver(prev => (prev === cat.id ? null : prev))}
        onDrop={e => {
          e.preventDefault();
          setDragOver(null);
          const id = e.dataTransfer.getData('text/plain');
          if (id) moveTo(id, cat.id);
        }}
        className={cn(
          'relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 animate-fade-in',
          cat.tint,
          isOver ? cat.ring : 'hover:shadow-md',
        )}
      >
        <div className={cn('h-1.5 shrink-0 bg-gradient-to-r', cat.topBar)} />
        <div className="flex-1 p-2.5 space-y-2 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0', cat.letterBg)}>
              {cat.letter}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold tracking-tight leading-none">{cat.icon} {cat.name}</p>
              <p className={cn('text-[9px] leading-tight mt-0.5 truncate', cat.hintColor)}>{cat.hint}</p>
            </div>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
              {total}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="h-1 flex-1 rounded-full bg-foreground/[0.07] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all duration-300', cat.bar)}
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
                <p className="text-[9px] text-muted-foreground/70 italic">Vacío</p>
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
                        title="Mover a la categoría anterior"
                      >
                        <ChevronUp className="h-2.5 w-2.5" />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          rotate(task.id, 1);
                        }}
                        className="w-3.5 h-3.5 flex items-center justify-center rounded hover:bg-foreground/10 transition-colors"
                        title="Mover a la siguiente categoría"
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
      <div className="h-1 bg-gradient-to-r from-red-500 via-amber-400 to-slate-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-500 flex items-center justify-center">
              <LayoutGrid className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-tight leading-tight">Kanban ABC</h3>
              <p className="text-[10px] text-muted-foreground">Clasifica tus tareas de la A a la D por prioridad</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[9px] px-1.5 py-0 ml-auto">
            {pendingClassified}/{pending} clasificadas
          </Badge>
        </div>

        {pending === 0 && (
          <div className="text-[11px] text-muted-foreground rounded-xl bg-muted/40 px-3 py-2">
            Sin tareas pendientes para el día.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {renderColumn(CATEGORIES.a)}
          {renderColumn(CATEGORIES.b)}
          {renderColumn(CATEGORIES.c)}
          {renderColumn(CATEGORIES.d)}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground/70">
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-red-400" /> A = crítica
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-amber-400" /> B = importante
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-blue-400" /> C = opcional
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-slate-400" /> D = descartar
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <GripVertical className="h-3 w-3" /> Arrastra o usa las flechas · se guarda automáticamente
          </span>
        </div>
      </CardContent>
    </Card>
  );
}