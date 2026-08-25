import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface PeriodAreaTasksProps {
  /** Inclusive start of the timeline */
  start: Date;
  /** Inclusive end of the timeline */
  end: Date;
  /** Label shown in the header: "Hoy", "esta semana", ... */
  periodLabel: string;
  /** Date pre-filled when creating a task (defaults to start) */
  defaultDate?: Date;
}

const AREAS: { id: string; label: string; source: string; color: string }[] = [
  { id: 'universidad', label: 'Universidad', source: 'university', color: 'bg-blue-500' },
  { id: 'emprendimiento', label: 'Emprendimiento', source: 'entrepreneurship', color: 'bg-purple-500' },
  { id: 'proyectos', label: 'Proyectos', source: 'projects', color: 'bg-amber-500' },
  { id: 'idiomas', label: 'Idiomas', source: 'general', color: 'bg-teal-500' },
  { id: 'gym', label: 'Gym', source: 'general', color: 'bg-red-500' },
  { id: 'lectura', label: 'Lectura', source: 'general', color: 'bg-emerald-500' },
  { id: 'musica', label: 'Música', source: 'general', color: 'bg-pink-500' },
  { id: 'ajedrez', label: 'Ajedrez', source: 'general', color: 'bg-slate-500' },
  { id: 'finanzas', label: 'Finanzas', source: 'general', color: 'bg-cyan-500' },
  { id: 'general', label: 'Tareas', source: 'general', color: 'bg-zinc-500' },
];

const areaOf = (t: any) => {
  const id = t.area_id;
  if (id && AREAS.some(a => a.id === id)) return id;
  if (t.source === 'university') return 'universidad';
  if (t.source === 'entrepreneurship') return 'emprendimiento';
  if (t.source === 'projects') return 'proyectos';
  return 'general';
};

export function PeriodAreaTasks({ start, end, periodLabel, defaultDate }: PeriodAreaTasksProps) {
  const queryClient = useQueryClient();
  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');
  const queryKey = ['periodAreaTasks', startStr, endStr];

  const [title, setTitle] = useState('');
  const [areaId, setAreaId] = useState('general');
  const initialDate = (() => {
    const d = defaultDate || start;
    if (d < start) return start;
    if (d > end) return end;
    return d;
  })();
  const [dueDate, setDueDate] = useState(format(initialDate, 'yyyy-MM-dd'));
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [filter, setFilter] = useState<string | null>(null);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', `${startStr}T00:00:00`)
        .lte('due_date', `${endStr}T23:59:59`)
        .order('due_date');
      if (error) throw error;
      return data || [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey });
    ['weeklyTasks', 'monthlyTasks', 'weeklyData', 'dailyPlanData', 'tasks'].forEach(k =>
      queryClient.invalidateQueries({ queryKey: [k] })
    );
  };

  const createTask = useMutation({
    mutationFn: async () => {
      const clean = title.trim();
      if (!clean) throw new Error('El título es requerido');
      const area = AREAS.find(a => a.id === areaId)!;
      const { error } = await supabase.from('tasks').insert({
        title: clean,
        area_id: area.id,
        source: area.source,
        priority,
        completed: false,
        due_date: `${dueDate}T12:00:00`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setTitle('');
      invalidate();
      toast.success('Tarea creada');
    },
    onError: (e: any) => toast.error(e.message || 'No se pudo crear la tarea'),
  });

  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('tasks').update({ completed: !completed }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast.success('Tarea eliminada');
    },
  });

  const inRange = useMemo(
    () =>
      tasks.filter((t: any) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return isWithinInterval(d, {
          start: new Date(`${startStr}T00:00:00`),
          end: new Date(`${endStr}T23:59:59`),
        });
      }),
    [tasks, startStr, endStr]
  );

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {};
    inRange.forEach((t: any) => {
      const a = areaOf(t);
      (map[a] ||= []).push(t);
    });
    return map;
  }, [inRange]);

  const visibleAreas = AREAS.filter(a => (grouped[a.id]?.length || 0) > 0);
  const done = inRange.filter((t: any) => t.completed).length;
  const pct = inRange.length > 0 ? Math.round((done / inRange.length) * 100) : 0;
  const sameDay = startStr === endStr;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <CardContent className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <ListTodo className="w-3.5 h-3.5" />
            Tareas por área · {periodLabel}
          </h3>
          <span className="text-sm font-bold tabular-nums">{done}/{inRange.length}</span>
        </div>
        <Progress value={pct} className="h-1.5" />

        {/* Create form */}
        <div className="space-y-2">
          <Input
            value={title}
            placeholder="Nueva tarea..."
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && title.trim()) createTask.mutate();
            }}
            className="h-9 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Select value={areaId} onValueChange={setAreaId}>
              <SelectTrigger className="h-9 w-[150px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AREAS.map(a => (
                  <SelectItem key={a.id} value={a.id} className="text-xs">{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
              <SelectTrigger className="h-9 w-[110px] text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high" className="text-xs">Alta</SelectItem>
                <SelectItem value="medium" className="text-xs">Media</SelectItem>
                <SelectItem value="low" className="text-xs">Baja</SelectItem>
              </SelectContent>
            </Select>
            {!sameDay && (
              <Input
                type="date"
                value={dueDate}
                min={startStr}
                max={endStr}
                onChange={e => setDueDate(e.target.value)}
                className="h-9 w-[145px] text-xs"
              />
            )}
            <Button
              size="sm"
              className="h-9 gap-1 text-xs"
              disabled={!title.trim() || createTask.isPending}
              onClick={() => createTask.mutate()}
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </Button>
          </div>
        </div>

        {/* Area filter */}
        {visibleAreas.length > 1 && (
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setFilter(null)}
              className={cn(
                'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                !filter ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'
              )}
            >
              Todas
            </button>
            {visibleAreas.map(a => (
              <button
                key={a.id}
                onClick={() => setFilter(filter === a.id ? null : a.id)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full border transition-colors',
                  filter === a.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/50 text-muted-foreground border-border'
                )}
              >
                {a.label} ({grouped[a.id].length})
              </button>
            ))}
          </div>
        )}

        {/* Lists */}
        {isLoading ? (
          <p className="text-xs text-muted-foreground animate-pulse py-4 text-center">Cargando tareas...</p>
        ) : inRange.length === 0 ? (
          <p className="text-xs text-muted-foreground py-6 text-center">
            No hay tareas con fecha de {periodLabel.toLowerCase()}. Crea la primera arriba.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleAreas
              .filter(a => !filter || a.id === filter)
              .map(area => (
                <div key={area.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className={cn('w-1.5 h-1.5 rounded-full', area.color)} />
                    <p className="text-[11px] font-semibold">{area.label}</p>
                    <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                      {grouped[area.id].filter((t: any) => t.completed).length}/{grouped[area.id].length}
                    </Badge>
                  </div>
                  {grouped[area.id].map((task: any) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <button onClick={() => toggleTask.mutate({ id: task.id, completed: task.completed })}>
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Circle className="w-4 h-4 text-muted-foreground/50" />
                        )}
                      </button>
                      <span className={cn('flex-1 text-xs', task.completed && 'line-through text-muted-foreground')}>
                        {task.title}
                      </span>
                      {task.due_date && !sameDay && (
                        <span className="text-[9px] text-muted-foreground tabular-nums">
                          {format(new Date(task.due_date), 'd MMM', { locale: es })}
                        </span>
                      )}
                      <button
                        onClick={() => deleteTask.mutate(task.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive/70" />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
