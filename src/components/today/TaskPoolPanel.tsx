import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Loader2, BookOpen, Briefcase, FolderKanban, Target, GripVertical, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskItem } from '@/hooks/useDailyPlanData';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface Props {
  unassignedTasks: TaskItem[];
  onTaskCreated: () => void;
}

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  general: { label: 'General', color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: <Target className="h-3 w-3" /> },
  university: { label: 'Universidad', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <BookOpen className="h-3 w-3" /> },
  entrepreneurship: { label: 'Emprendimiento', color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', icon: <Briefcase className="h-3 w-3" /> },
  project: { label: 'Proyecto', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30', icon: <FolderKanban className="h-3 w-3" /> },
};

export function TaskPoolPanel({ unassignedTasks, onTaskCreated }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskArea, setNewTaskArea] = useState('general');
  const [creating, setCreating] = useState(false);

  const { toast } = useToast();

  const filteredTasks = unassignedTasks.filter(t => {
    if (sourceFilter !== 'all' && t.source !== sourceFilter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleQuickCreate = async () => {
    if (!newTaskTitle.trim()) return;
    setCreating(true);
    try {
      const areaMap: Record<string, string> = {
        general: 'general',
        university: 'university',
        entrepreneurship: 'entrepreneurship',
        project: 'project',
      };
      const { error } = await supabase.from('tasks').insert({
        title: newTaskTitle.trim(),
        source: areaMap[newTaskArea] || 'general',
        area_id: newTaskArea,
        priority: 'medium',
        due_date: `${format(new Date(), 'yyyy-MM-dd')}T12:00:00`,
        completed: false,
        status: 'pendiente',
      });
      if (error) throw error;
      setNewTaskTitle('');
      toast({ title: 'Tarea creada' });
      onTaskCreated();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-3 border-b">
        <h3 className="text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2 mb-2">
          <Target className="h-4 w-4 text-primary" />
          Tareas Pendientes
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {unassignedTasks.length}
          </Badge>
        </h3>

        <div className="flex gap-1.5">
          <Input
            placeholder="Nueva tarea..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
            className="h-7 text-xs flex-1"
            disabled={creating}
          />
          <Select value={newTaskArea} onValueChange={setNewTaskArea}>
            <SelectTrigger className="h-7 w-[90px] text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="h-7 w-7 p-0" onClick={handleQuickCreate} disabled={creating || !newTaskTitle.trim()}>
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          </Button>
        </div>
      </div>

      <div className="p-3 border-b">
        <div className="flex gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-7 text-xs pl-7"
            />
          </div>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="h-7 w-[80px] text-[10px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">Todas</SelectItem>
              {Object.entries(SOURCE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-[200px]">
        <div className="p-2 space-y-1">
          {filteredTasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <AlertCircle className="h-6 w-6 mb-2 opacity-50" />
              <p className="text-xs">
                {searchQuery || sourceFilter !== 'all' ? 'Sin resultados' : '¡Todo asignado! 🎯'}
              </p>
            </div>
          )}
          {filteredTasks.map(task => {
            const cfg = SOURCE_CONFIG[task.source] || SOURCE_CONFIG.general;
            return (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleDragStart(e, task.id)}
                className="flex items-center gap-2 p-2 rounded-md border cursor-grab active:cursor-grabbing transition-all hover:bg-muted/50 group"
              >
                <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{task.title}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Badge variant="outline" className={cn("text-[8px] px-1 py-0 h-3.5", cfg.color)}>
                      {cfg.icon}
                      <span className="ml-0.5">{task.sourceName || cfg.label}</span>
                    </Badge>
                    {task.priority === 'high' && (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5">Alta</Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="p-2 border-t text-[9px] text-muted-foreground text-center">
        Arrastra tareas a los bloques del horario
      </div>
    </Card>
  );
}
