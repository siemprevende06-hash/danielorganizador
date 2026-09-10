import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { GripVertical, GraduationCap, Briefcase, FolderKanban, ListTodo, Check, Loader2, Plus, X, Move } from 'lucide-react';

interface WeekTask {
  id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  priority?: string | null;
  source?: string | null;
  area_id?: string | null;
}

type AreaKey = 'universidad' | 'emprendimiento' | 'proyectos' | 'general';

const SECTIONS: { key: AreaKey; label: string; icon: React.ReactNode; accent: string; chip: string; dropBg: string }[] = [
  { key: 'universidad', label: 'Universidad', icon: <GraduationCap className="w-3.5 h-3.5" />, accent: 'text-blue-500', chip: 'bg-blue-500/15 text-blue-600', dropBg: 'border-blue-400 bg-blue-500/10' },
  { key: 'emprendimiento', label: 'Emprendimiento', icon: <Briefcase className="w-3.5 h-3.5" />, accent: 'text-purple-500', chip: 'bg-purple-500/15 text-purple-600', dropBg: 'border-purple-400 bg-purple-500/10' },
  { key: 'proyectos', label: 'Proyectos', icon: <FolderKanban className="w-3.5 h-3.5" />, accent: 'text-amber-500', chip: 'bg-amber-500/15 text-amber-600', dropBg: 'border-amber-400 bg-amber-500/10' },
  { key: 'general', label: 'Tareas generales', icon: <ListTodo className="w-3.5 h-3.5" />, accent: 'text-muted-foreground', chip: 'bg-muted text-muted-foreground', dropBg: 'border-primary bg-primary/10' },
];

const AREA_ALIAS: Record<string, AreaKey> = {
  universidad: 'universidad',
  university: 'universidad',
  emprendimiento: 'emprendimiento',
  entrepreneurship: 'emprendimiento',
  entrepreneur: 'emprendimiento',
  proyectos: 'proyectos',
  project: 'proyectos',
  general: 'general',
};

function areaOf(t: WeekTask): AreaKey {
  const raw = t.area_id || t.source;
  if (!raw) return 'general';
  return AREA_ALIAS[raw.toLowerCase()] || 'general';
}

const SOURCE_VALUE: Record<AreaKey, string> = {
  universidad: 'university',
  emprendimiento: 'entrepreneurship',
  proyectos: 'project',
  general: 'general',
};

const PRIORITY: Record<string, { label: string; badge: string; bar: string }> = {
  high: { label: 'Alta', badge: 'bg-red-500/15 text-red-600', bar: 'border-l-red-500' },
  medium: { label: 'Media', badge: 'bg-amber-500/15 text-amber-600', bar: 'border-l-amber-400' },
  low: { label: 'Baja', badge: 'bg-muted text-muted-foreground', bar: 'border-l-slate-300' },
};

function RingProgress({ done, total }: { done: number; total: number }) {
  const pct = total > 0 ? (done / total) * 100 : 0;
  return (
    <div className="relative w-10 h-10 shrink-0">
      <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" className="text-emerald-500" strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 16}`}
          strokeDashoffset={`${2 * Math.PI * 16 * (1 - Math.min(pct, 100) / 100)}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tabular-nums">
        {total > 0 ? `${Math.round(pct)}%` : '—'}
      </span>
    </div>
  );
}

export function PlanSemanal({ weekDays, tasks, queryKeyPrefix }: {
  weekDays: Date[];
  tasks: WeekTask[];
  queryKeyPrefix: string;
}) {
  const queryClient = useQueryClient();
  const [dragOver, setDragOver] = useState<{ day: string | null; area: AreaKey | null }>({ day: null, area: null });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [doneId, setDoneId] = useState<string | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [creatingTask, setCreatingTask] = useState<string | null>(null);

  const dayStr = (d: Date) => format(d, 'yyyy-MM-dd');

  const addTask = async (day: string) => {
    const clean = newTitle.trim();
    if (!clean) return;
    setCreatingTask(day);
    const { error } = await supabase.from('tasks').insert({
      title: clean,
      source: 'general',
      area_id: 'general',
      priority: 'medium',
      completed: false,
      due_date: `${day}T12:00:00`,
    });
    setCreatingTask(null);
    if (error) {
      console.error('Error al crear tarea:', error.message);
      return;
    }
    setNewTitle('');
    setAddingDay(null);
    queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
  };

  const moveTask = async (taskId: string, targetDay: string, targetArea: AreaKey | null) => {
    setMoving(true);
    const patch: Record<string, unknown> = { due_date: `${targetDay}T12:00:00` };
    if (targetArea) {
      patch.area_id = SOURCE_VALUE[targetArea];
      patch.source = SOURCE_VALUE[targetArea];
    }
    const { error } = await supabase.from('tasks').update(patch).eq('id', taskId);
    setMoving(false);
    if (error) {
      console.error('Error al mover tarea:', error.message);
    } else {
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
    }
    setDragOver({ day: null, area: null });
    setDraggingId(null);
  };

  const toggleDone = async (taskId: string, completed: boolean) => {
    setDoneId(taskId);
    const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', taskId);
    setDoneId(null);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix] });
    }
  };

  const handleDropSection = (e: React.DragEvent, day: Date, area: AreaKey) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) moveTask(taskId, dayStr(day), area);
    else setDragOver({ day: null, area: null });
  };

  const handleDropDay = (e: React.DragEvent, day: Date) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) moveTask(taskId, dayStr(day), null);
    else setDragOver({ day: null, area: null });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Plan de la semana</h2>
          <p className="text-xs text-muted-foreground">Arrastra una tarea a otro día o a otra sección para reprogramarla y cambiar su área</p>
        </div>
        {moving && <Badge variant="secondary" className="text-xs">Moviendo...</Badge>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-3">
        {weekDays.map(day => {
          const ds = dayStr(day);
          const dayTasks = tasks.filter(t => t.due_date && format(new Date(t.due_date), 'yyyy-MM-dd') === ds);
          const done = dayTasks.filter(t => t.completed).length;
          const overDay = dragOver.day === ds && dragOver.area === null;
          return (
            <div
              key={ds}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOver.day !== ds) setDragOver(p => ({ ...p, day: ds })); }}
              onDragLeave={() => setDragOver(p => p.day === ds && p.area === null ? { day: null, area: null } : p)}
              onDrop={(e) => handleDropDay(e, day)}
              className={cn(
                'rounded-2xl border-2 transition-all flex flex-col overflow-hidden',
                isToday(day) && 'ring-2 ring-primary ring-offset-2',
                overDay
                  ? 'border-primary bg-primary/5 scale-[1.01]'
                  : 'border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm'
              )}
            >
              {/* Header del día */}
              <div className="p-2.5 border-b border-muted/60 flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[9px] uppercase font-semibold text-muted-foreground/60">{format(day, 'EEEE', { locale: es })}</p>
                  <p className={cn('text-base font-bold leading-tight', isToday(day) && 'text-primary')}>{format(day, 'd MMM')}</p>
                </div>
                <RingProgress done={done} total={dayTasks.length} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-foreground"
                  title={addingDay === ds ? 'Cancelar' : 'Añadir tarea a este día'}
                  onClick={() => { setAddingDay(addingDay === ds ? null : ds); setNewTitle(''); }}
                >
                  {addingDay === ds ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                </Button>
              </div>

              {/* Añadir tarea rápida */}
              {addingDay === ds && (
                <div className="flex items-center gap-1.5 p-2 border-b border-muted/60 bg-primary/5">
                  <Input
                    autoFocus
                    placeholder="Nueva tarea…"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') addTask(ds); if (e.key === 'Escape') setAddingDay(null); }}
                    className="h-7 text-xs flex-1"
                  />
                  <Button size="icon" className="h-7 w-7 shrink-0" onClick={() => addTask(ds)} disabled={!newTitle.trim()} title="Guardar tarea">
                    {creatingTask === ds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              )}

              {/* Secciones por área */}
              <div className="flex-1 divide-y divide-muted/40 overflow-y-auto overscroll-contain no-scrollbar max-h-[520px]">
                {SECTIONS.map(section => {
                  const sectionTasks = dayTasks.filter(t => areaOf(t) === section.key);
                  const overThis = dragOver?.day === ds && dragOver.area === section.key;
                  return (
                    <div
                      key={section.key}
                      onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = 'move'; if (dragOver?.day !== ds || dragOver.area !== section.key) setDragOver({ day: ds, area: section.key }); }}
                      onDragLeave={() => setDragOver(p => (p.day === ds && p.area === section.key) ? { day: null, area: null } : p)}
                      onDrop={(e) => handleDropSection(e, day, section.key)}
                      className={cn('p-2 transition-all', overThis && section.dropBg)}
                    >
                      <div className="flex items-center gap-1.5 px-1 mb-1">
                        <span className={section.accent}>{section.icon}</span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{section.label}</span>
                        <Badge variant="outline" className={cn('text-[8px] px-1 py-0 h-3.5 ml-auto', section.chip)}>
                          {sectionTasks.filter(t => t.completed).length}/{sectionTasks.length}
                        </Badge>
                      </div>
                      {sectionTasks.length === 0 ? (
                        <p className="text-[9px] text-muted-foreground/40 text-center py-1.5 italic">Suelta tareas aquí</p>
                      ) : (
                        <div className="space-y-1.5">
                          {sectionTasks.map(t => {
                            const prio = PRIORITY[t.priority || 'medium'] || PRIORITY.medium;
                            return (
                              <div
                                key={t.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', t.id);
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggingId(t.id);
                                }}
                                onDragEnd={() => { setDraggingId(null); setDragOver({ day: null, area: null }); }}
                                className={cn(
                                  'flex items-start gap-2 p-2 rounded-xl border border-border/50 border-l-[3px]',
                                  prio.bar,
                                  'bg-white/60 dark:bg-zinc-900/50 cursor-grab active:cursor-grabbing select-none',
                                  t.completed && 'opacity-55',
                                  draggingId === t.id && 'opacity-40'
                                )}
                                title="Arrastra para reprogramar o cambiar de área"
                              >
                                <button
                                  onClick={(e) => { e.stopPropagation(); toggleDone(t.id, t.completed); }}
                                  className={cn(
                                    'mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 transition-colors cursor-pointer',
                                    t.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-muted-foreground/40 hover:border-emerald-500'
                                  )}
                                  title={t.completed ? 'Marcar como pendiente' : 'Marcar como hecha'}
                                >
                                  {doneId === t.id ? <Loader2 className="w-3 h-3 animate-spin" /> : t.completed && <Check className="w-3 h-3" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={cn('text-xs leading-snug break-words', t.completed && 'line-through')}>{t.title}</p>
                                  {t.priority && t.priority !== 'low' && (
                                    <Badge variant="outline" className={cn('text-[8px] px-1 py-0 h-3.5 mt-1', prio.badge)}>{prio.label}</Badge>
                                  )}
                                </div>
                                <div className="flex flex-col items-center gap-0.5 shrink-0">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-5 w-5 p-0 text-muted-foreground/40 hover:text-muted-foreground"
                                        title="Mover tarea"
                                      >
                                        <Move className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48 max-h-[320px] overflow-y-auto">
                                      <DropdownMenuLabel className="text-[10px] uppercase">Mover a día</DropdownMenuLabel>
                                      {weekDays.map(d => {
                                        const targetDs = dayStr(d);
                                        return (
                                          <DropdownMenuItem
                                            key={targetDs}
                                            disabled={targetDs === ds}
                                            onClick={() => moveTask(t.id, targetDs, null)}
                                            className="text-xs"
                                          >
                                            {format(d, 'EEE d', { locale: es })}{isToday(d) ? ' · Hoy' : ''}
                                          </DropdownMenuItem>
                                        );
                                      })}
                                      <DropdownMenuSeparator />
                                      <DropdownMenuLabel className="text-[10px] uppercase">Cambiar área</DropdownMenuLabel>
                                      {SECTIONS.map(s => (
                                        <DropdownMenuItem
                                          key={s.key}
                                          disabled={areaOf(t) === s.key}
                                          onClick={() => moveTask(t.id, ds, s.key)}
                                          className="text-xs"
                                        >
                                          {s.icon}
                                          <span className="ml-1.5">{s.label}</span>
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}