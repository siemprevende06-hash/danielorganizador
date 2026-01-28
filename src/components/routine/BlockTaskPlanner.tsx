import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Clock, BookOpen, Briefcase, FolderKanban, ListTodo, Target, X, Dumbbell, Coffee, Moon, Sun, Languages } from "lucide-react";
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
  taskAssignments: Record<string, string[]>;
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

const getBlockIcon = (title: string) => {
  const lower = title.toLowerCase();
  if (lower.includes('gym')) return <Dumbbell className="h-4 w-4" />;
  if (lower.includes('activación') || lower.includes('despertar')) return <Sun className="h-4 w-4" />;
  if (lower.includes('desactivación') || lower.includes('dormir')) return <Moon className="h-4 w-4" />;
  if (lower.includes('almuerzo') || lower.includes('comida') || lower.includes('desayuno')) return <Coffee className="h-4 w-4" />;
  if (lower.includes('idiomas') || lower.includes('lectura')) return <Languages className="h-4 w-4" />;
  if (lower.includes('deep work') || lower.includes('focus')) return <Target className="h-4 w-4 text-primary" />;
  return <Clock className="h-4 w-4" />;
};

const formatTime = (time: string) => {
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
};

const parseTimeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
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

  // Show ALL blocks sorted by time (from 5 AM to 9 PM)
  const sortedBlocks = [...blocks]
    .filter(block => {
      const startMinutes = parseTimeToMinutes(block.startTime);
      // Filter to show blocks between 5:00 AM (300) and 11:00 PM (1380)
      return startMinutes >= 300 && startMinutes <= 1380;
    })
    .sort((a, b) => parseTimeToMinutes(a.startTime) - parseTimeToMinutes(b.startTime))
    // Remove duplicates by block_id (keep first occurrence)
    .filter((block, index, self) => 
      index === self.findIndex(b => b.id === block.id)
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
          <div key={i} className="h-24 bg-muted/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const unassignedTasks = getAvailableTasks();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Horario Completo del Día</h3>
          <p className="text-sm text-muted-foreground">
            Asigna tareas a cualquier bloque de tu rutina
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Target className="w-3 h-3" />
          {allTasks.length} tareas · {unassignedTasks.length} sin asignar
        </Badge>
      </div>

      {/* Timeline View */}
      <div className="space-y-2">
        {sortedBlocks.map((block, index) => {
          const assignedTasks = getAssignedTasks(block.id);
          const isWorkBlock = block.title.toLowerCase().includes('deep work') || 
                             block.title.toLowerCase().includes('focus') ||
                             block.blockType === 'configurable' ||
                             block.blockType === 'dinamico';
          
          return (
            <div key={`${block.id}-${index}`} className="relative">
              {/* Time marker */}
              <div className="flex items-start gap-3">
                <div className="w-16 flex-shrink-0 text-xs text-muted-foreground font-mono pt-3">
                  {formatTime(block.startTime)}
                </div>
                
                <Card className={cn(
                  "flex-1 p-3 border-l-4 transition-all hover:shadow-md",
                  isWorkBlock ? "border-l-primary" : "border-l-muted-foreground/30",
                  assignedTasks.length > 0 && "bg-primary/5"
                )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getBlockIcon(block.title)}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{block.title}</h4>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(block.startTime)} - {formatTime(block.endTime)}
                        </span>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => openAssigner(block.id)}
                      className="h-7 text-xs gap-1 flex-shrink-0"
                    >
                      <Plus className="w-3 h-3" />
                      Agregar
                    </Button>
                  </div>

                  {assignedTasks.length > 0 && (
                    <div className="mt-2 space-y-1.5">
                      {assignedTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-2 bg-background rounded-lg group"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Badge variant="outline" className={cn("text-xs flex-shrink-0", getSourceColor(task.source))}>
                              {getSourceIcon(task.source)}
                            </Badge>
                            <span className="text-sm truncate">
                              {task.title}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTaskFromBlock(block.id, task.id)}
                            className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 flex-shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Tasks Section */}
      {unassignedTasks.length > 0 && (
        <Card className="p-4 border-dashed border-2">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Tareas sin asignar ({unassignedTasks.length})
          </h4>
          <div className="space-y-2">
            {unassignedTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className={cn("text-xs", getSourceColor(task.source))}>
                    {getSourceIcon(task.source)}
                  </Badge>
                  <span className="text-sm truncate">{task.title}</span>
                </div>
              </div>
            ))}
            {unassignedTasks.length > 5 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                +{unassignedTasks.length - 5} más...
              </p>
            )}
          </div>
        </Card>
      )}

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