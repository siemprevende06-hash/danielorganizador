import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Clock, BookOpen, Briefcase, FolderKanban, ListTodo, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface Task {
  id: string;
  title: string;
  source: string;
  sourceName?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
}

interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  blockType?: string;
}

interface BlockTaskPlannerProps {
  blocks: RoutineBlock[];
  selectedDate: Date;
  taskAssignments: Record<string, string[]>; // blockId -> taskIds[]
  onAssignmentChange: (blockId: string, taskIds: string[]) => void;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case "university":
      return <BookOpen className="h-3 w-3" />;
    case "entrepreneurship":
      return <Briefcase className="h-3 w-3" />;
    case "project":
      return <FolderKanban className="h-3 w-3" />;
    default:
      return <ListTodo className="h-3 w-3" />;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case "university":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "entrepreneurship":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "project":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  }
};

const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

export function BlockTaskPlanner({ 
  blocks, 
  selectedDate,
  taskAssignments, 
  onAssignmentChange 
}: BlockTaskPlannerProps) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllTasks();
  }, [selectedDate]);

  const loadAllTasks = async () => {
    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Load regular tasks
      const { data: regularTasks } = await supabase
        .from('tasks')
        .select('id, title, source, completed, due_date, priority')
        .eq('completed', false);

      // Load entrepreneurship tasks
      const { data: entrepreneurshipTasks } = await supabase
        .from('entrepreneurship_tasks')
        .select('id, title, completed, due_date, entrepreneurship_id')
        .eq('completed', false);

      // Get entrepreneurship names
      const { data: entrepreneurships } = await supabase
        .from('entrepreneurships')
        .select('id, name');

      const entrepreneurshipMap = new Map(entrepreneurships?.map(e => [e.id, e.name]) || []);

      const mapped: Task[] = [
        ...(regularTasks || []).map(t => ({
          id: t.id,
          title: t.title,
          source: t.source || 'general',
          completed: t.completed || false,
          due_date: t.due_date,
          priority: t.priority
        })),
        ...(entrepreneurshipTasks || []).map(t => ({
          id: t.id,
          title: t.title,
          source: 'entrepreneurship',
          sourceName: entrepreneurshipMap.get(t.entrepreneurship_id),
          completed: t.completed,
          due_date: t.due_date
        }))
      ];

      setAllTasks(mapped);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter to only show work/study blocks
  const workBlocks = blocks.filter(block => 
    block.title.toLowerCase().includes('deep work') ||
    block.title.toLowerCase().includes('focus') ||
    block.title.toLowerCase().includes('estudio') ||
    block.title.toLowerCase().includes('trabajo') ||
    block.blockType === 'dinamico'
  );

  const getAssignedTasks = (blockId: string): Task[] => {
    const taskIds = taskAssignments[blockId] || [];
    return allTasks.filter(t => taskIds.includes(t.id));
  };

  const getAvailableTasks = (): Task[] => {
    const allAssigned = Object.values(taskAssignments).flat();
    return allTasks.filter(t => !allAssigned.includes(t.id));
  };

  const openAssigner = (blockId: string) => {
    setActiveBlockId(blockId);
    setTempSelectedIds(taskAssignments[blockId] || []);
  };

  const toggleTask = (taskId: string) => {
    setTempSelectedIds(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const saveAssignments = async () => {
    if (activeBlockId) {
      onAssignmentChange(activeBlockId, tempSelectedIds);
      
      // Also update entrepreneurship_tasks with routine_block_id
      for (const taskId of tempSelectedIds) {
        const task = allTasks.find(t => t.id === taskId);
        if (task?.source === 'entrepreneurship') {
          await supabase
            .from('entrepreneurship_tasks')
            .update({ routine_block_id: activeBlockId })
            .eq('id', taskId);
        }
      }
    }
    setActiveBlockId(null);
    setTempSelectedIds([]);
  };

  const removeTaskFromBlock = (blockId: string, taskId: string) => {
    const current = taskAssignments[blockId] || [];
    onAssignmentChange(blockId, current.filter(id => id !== taskId));
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Asignar Tareas a Bloques</h3>
          <p className="text-sm text-muted-foreground">
            Organiza tus tareas en los bloques de trabajo del día
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Target className="w-3 h-3" />
          {allTasks.length} tareas disponibles
        </Badge>
      </div>

      <div className="space-y-3">
        {workBlocks.map((block) => {
          const assignedTasks = getAssignedTasks(block.id);
          
          return (
            <Card key={block.id} className="p-4 border-2 border-border hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    {block.title}
                  </h4>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(block.startTime)} - {formatTime(block.endTime)}
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openAssigner(block.id)}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Agregar
                </Button>
              </div>

              {assignedTasks.length === 0 ? (
                <div 
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openAssigner(block.id)}
                >
                  <p className="text-sm text-muted-foreground">
                    Haz clic para asignar tareas a este bloque
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-2 bg-muted/30 rounded-lg group"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn("text-xs", getSourceColor(task.source))}>
                          {getSourceIcon(task.source)}
                          <span className="ml-1">{task.sourceName || task.source}</span>
                        </Badge>
                        <span className="text-sm font-medium truncate max-w-[200px]">
                          {task.title}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTaskFromBlock(block.id, task.id)}
                        className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Task Selection Dialog */}
      <Dialog open={!!activeBlockId} onOpenChange={(open) => !open && setActiveBlockId(null)}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Asignar Tareas: {blocks.find(b => b.id === activeBlockId)?.title}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {/* Show currently assigned + available tasks */}
              {[...allTasks.filter(t => tempSelectedIds.includes(t.id)), ...getAvailableTasks()].map((task) => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    tempSelectedIds.includes(task.id)
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-muted/50 border-border"
                  )}
                  onClick={() => toggleTask(task.id)}
                >
                  <Checkbox
                    checked={tempSelectedIds.includes(task.id)}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    <Badge variant="outline" className={cn("text-xs mt-1", getSourceColor(task.source))}>
                      {getSourceIcon(task.source)}
                      <span className="ml-1">{task.sourceName || task.source}</span>
                    </Badge>
                  </div>
                </div>
              ))}

              {allTasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No hay tareas disponibles
                </p>
              )}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveBlockId(null)}>
              Cancelar
            </Button>
            <Button onClick={saveAssignments}>
              Guardar ({tempSelectedIds.length} tareas)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
