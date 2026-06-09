import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Clock, GraduationCap, Briefcase, FolderKanban, Zap, Calendar, X, Loader2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface RoutineBlockData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  blockType: string;
  defaultFocus: string;
  currentFocus?: string;
  order: number;
}

interface TaskItem {
  id: string;
  title: string;
  source: string;
  sourceName?: string;
  routine_block_id?: string;
}

const FOCUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string; icon: typeof GraduationCap }> = {
  universidad: { label: 'UNI', color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: GraduationCap },
  emprendimiento: { label: 'EMP', color: 'text-purple-600', bg: 'bg-purple-500/10', border: 'border-purple-500/30', icon: Briefcase },
  proyectos: { label: 'PRO', color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/30', icon: FolderKanban },
  none: { label: '—', color: 'text-muted-foreground', bg: 'bg-muted', border: 'border-border', icon: Zap },
};

interface RoutineBlockScheduleProps {
  onTaskUnassigned?: () => void;
}

export function RoutineBlockSchedule({ onTaskUnassigned }: RoutineBlockScheduleProps) {
  const [blocks, setBlocks] = useState<RoutineBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<'today' | 'tomorrow'>('today');

  const dateKey = selectedDate === 'today'
    ? format(new Date(), 'yyyy-MM-dd')
    : format(new Date(Date.now() + 86400000), 'yyyy-MM-dd');

  useEffect(() => {
    loadBlocks();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      setBlocks(prev => [...prev]);
    };
    window.addEventListener('taskAssignmentChanged', handleRefresh);
    return () => window.removeEventListener('taskAssignmentChanged', handleRefresh);
  }, []);

  const loadBlocks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routine_blocks')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const mapped: RoutineBlockData[] = (data || []).map((row: any) => ({
        id: row.block_id,
        title: row.title,
        startTime: row.start_time,
        endTime: row.end_time,
        blockType: row.block_type || 'fijo',
        defaultFocus: row.default_focus || 'none',
        currentFocus: row.current_focus || undefined,
        order: row.order_index,
      }));

      setBlocks(mapped);
    } catch (error) {
      console.error('Error loading routine blocks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignedTasks = (blockId: string): TaskItem[] => {
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return (parsed.tasks || []).filter((t: any) => t.routine_block_id === blockId && t.source === 'university');
    } catch {
      return [];
    }
  };

  const getTasksForDate = (): TaskItem[] => {
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return (parsed.tasks || []).filter((t: any) => t.source === 'university');
    } catch {
      return [];
    }
  };

  const handleUnassign = (taskId: string) => {
    try {
      const stored = localStorage.getItem(`dailyPlanTasks_${dateKey}`);
      if (!stored) return;
      const parsed = JSON.parse(stored);
      parsed.tasks = (parsed.tasks || []).filter((t: any) => t.id !== taskId);
      localStorage.setItem(`dailyPlanTasks_${dateKey}`, JSON.stringify(parsed));
      setBlocks(prev => [...prev]);
      onTaskUnassigned?.();
    } catch (error) {
      console.error('Error unassigning task:', error);
    }
  };

  const allUniversityTasks = getTasksForDate();
  const unassignedTasks = allUniversityTasks.filter(t => !t.routine_block_id);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Cargando bloques...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Bloques de Estudio en mi Rutina
          </CardTitle>
          <div className="flex gap-1.5">
            <Button
              variant={selectedDate === 'today' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDate('today')}
            >
              Hoy
            </Button>
            <Button
              variant={selectedDate === 'tomorrow' ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setSelectedDate('tomorrow')}
            >
              Mañana
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {format(selectedDate === 'today' ? new Date() : new Date(Date.now() + 86400000), "EEEE d 'de' MMMM", { locale: es })}
        </p>
      </CardHeader>
      <CardContent>
        {blocks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay bloques de rutina configurados
          </p>
        ) : (
          <ScrollArea className="max-h-[400px] pr-2">
            <div className="space-y-1.5">
              {blocks.map(block => {
                const focus = block.currentFocus || block.defaultFocus;
                const style = FOCUS_STYLE[focus] || FOCUS_STYLE.none;
                const Icon = style.icon;
                const assignedTasks = getAssignedTasks(block.id);
                const isUniFocus = focus === 'universidad';

                return (
                  <div
                    key={block.id}
                    className={cn(
                      'flex items-start gap-3 p-2.5 rounded-lg border transition-colors',
                      isUniFocus ? style.bg + ' ' + style.border : 'border-border',
                    )}
                  >
                    {/* Time column */}
                    <div className="text-center shrink-0 w-14 pt-0.5">
                      <p className="text-xs font-bold leading-tight">{block.startTime}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{block.endTime}</p>
                    </div>

                    {/* Vertical divider */}
                    <div className={cn(
                      'w-0.5 shrink-0 rounded-full self-stretch',
                      isUniFocus ? 'bg-blue-500' : 'bg-border'
                    )} />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{block.title}</span>
                        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0', style.bg, style.color, style.border)}>
                          <Icon className="h-2.5 w-2.5 mr-0.5" />
                          {style.label}
                        </Badge>
                      </div>

                      {/* Assigned tasks */}
                      {assignedTasks.length > 0 && (
                        <div className="space-y-1">
                          {assignedTasks.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center gap-2 pl-2 py-1 rounded bg-background/80 border border-blue-500/20"
                            >
                              <BookOpen className="h-3 w-3 text-blue-600 shrink-0" />
                              <span className="text-xs truncate flex-1">{task.title}</span>
                              {task.sourceName && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0">{task.sourceName}</Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5 shrink-0"
                                onClick={() => handleUnassign(task.id)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Unassigned university tasks summary */}
        {unassignedTasks.length > 0 && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-1.5">
              Tareas universitarias sin bloque ({unassignedTasks.length})
            </p>
            <div className="space-y-1">
              {unassignedTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <BookOpen className="h-3 w-3" />
                  <span className="truncate flex-1">{task.title}</span>
                  {task.sourceName && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0">{task.sourceName}</Badge>
                  )}
                </div>
              ))}
              {unassignedTasks.length > 5 && (
                <p className="text-xs text-muted-foreground italic">
                  +{unassignedTasks.length - 5} más
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
