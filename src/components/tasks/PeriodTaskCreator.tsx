import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Trash2, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const TASK_AREAS = [
  { value: 'general', label: 'General' },
  { value: 'university', label: 'Universidad' },
  { value: 'entrepreneurship', label: 'Emprendimiento' },
  { value: 'project', label: 'Proyecto' },
] as const;

type AreaValue = (typeof TASK_AREAS)[number]['value'];

interface TaskRow {
  id: string;
  title: string;
  source: string;
  area_id: string | null;
  completed: boolean;
  due_date: string | null;
}

interface Props {
  periodStart: Date;
  periodEnd: Date;
  defaultDueDate?: Date;
  title?: string;
  description?: string;
}

export function PeriodTaskCreator({
  periodStart,
  periodEnd,
  defaultDueDate,
  title = 'Crear tarea',
  description,
}: Props) {
  const [text, setText] = useState('');
  const [area, setArea] = useState<AreaValue>('general');
  const [creating, setCreating] = useState(false);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const startStr = format(periodStart, 'yyyy-MM-dd');
  const endStr = format(periodEnd, 'yyyy-MM-dd');

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('id, title, source, area_id, completed, due_date')
      .gte('due_date', `${startStr}T00:00:00`)
      .lte('due_date', `${endStr}T23:59:59`)
      .order('created_at', { ascending: true });
    if (!error) setTasks(data as TaskRow[]);
    setLoading(false);
  }, [startStr, endStr]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setCreating(true);
    try {
      const due = defaultDueDate ?? new Date();
      const { error } = await supabase.from('tasks').insert({
        title: text.trim(),
        source: area,
        area_id: area,
        priority: 'medium',
        due_date: `${format(due, 'yyyy-MM-dd')}T12:00:00`,
        completed: false,
        status: 'pendiente',
      });
      if (error) throw error;
      setText('');
      toast({ title: 'Tarea creada' });
      load();
    } catch (e: any) {
      toast({ title: 'Error al crear', description: e.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const areaOf = (t: TaskRow): AreaValue => {
    const a = (t.area_id || t.source) as AreaValue;
    return (TASK_AREAS.find((x) => x.value === a) ? a : 'general');
  };

  return (
    <Card className="border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Target className="w-4 h-4 text-indigo-500" /> {title}
          </h3>
          {description && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>

        <div className="flex gap-2">
          <Input
            placeholder="¿Qué necesitas hacer?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            className="h-8 text-xs flex-1"
            disabled={creating}
          />
          <Select value={area} onValueChange={(v) => setArea(v as AreaValue)}>
            <SelectTrigger className="h-8 w-[120px] text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_AREAS.map((a) => (
                <SelectItem key={a.value} value={a.value} className="text-xs">
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleCreate}
            disabled={creating || !text.trim()}
          >
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-2">
          {TASK_AREAS.map((a) => {
            const sectionTasks = tasks.filter((t) => areaOf(t) === a.value);
            if (sectionTasks.length === 0) return null;
            return (
              <div key={a.value}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1">
                  {a.label}
                </p>
                <div className="space-y-1">
                  {sectionTasks.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 p-1.5 rounded-md border bg-muted/30 group"
                    >
                      <span className="flex-1 text-xs truncate">{t.title}</span>
                      <button
                        onClick={() => handleDelete(t.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {!loading && tasks.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-3">
              Sin tareas todavía. Crea una para este periodo.
            </p>
          )}
          {loading && (
            <p className="text-xs text-muted-foreground text-center py-3 animate-pulse">
              Cargando tareas...
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
