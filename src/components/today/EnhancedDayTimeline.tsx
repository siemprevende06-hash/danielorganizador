import { useEffect, useState, useMemo } from "react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useBlockCompletions } from "@/hooks/useBlockCompletions";
import { supabase } from "@/integrations/supabase/client";
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Clock, 
  MoveRight,
  ChevronDown,
  ChevronUp,
  Sun,
  Moon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TimelineTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  source: string;
  routine_block_id?: string;
}

interface BlockWithTasks {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  tasks: TimelineTask[];
  status: 'current' | 'completed' | 'upcoming' | 'passed';
}

export function EnhancedDayTimeline() {
  const { blocks, isLoaded } = useRoutineBlocksDB();
  const { isBlockCompleted, toggleBlockComplete, refreshCompletions } = useBlockCompletions();
  const [blocksWithTasks, setBlocksWithTasks] = useState<BlockWithTasks[]>([]);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [startTime, setStartTime] = useState<'5:00' | '6:30'>('5:00');
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [taskToMove, setTaskToMove] = useState<TimelineTask | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Calculate current position in timeline
  const currentMinutes = useMemo(() => {
    return currentTime.getHours() * 60 + currentTime.getMinutes();
  }, [currentTime]);

  useEffect(() => {
    if (isLoaded && blocks.length > 0) {
      loadTasksForBlocks();
    }
  }, [isLoaded, blocks, startTime]);

  const loadTasksForBlocks = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Load regular tasks
    const { data: regularTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, source, routine_block_id')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    // Load entrepreneurship tasks
    const { data: entrepreneurshipTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, title, completed, routine_block_id')
      .eq('due_date', today);

    const allTasks: TimelineTask[] = [
      ...(regularTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority || undefined,
        source: t.source || 'general',
        routine_block_id: t.routine_block_id || undefined,
      })),
      ...(entrepreneurshipTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        source: 'entrepreneurship',
        routine_block_id: t.routine_block_id || undefined,
      })),
    ];

    // Filter blocks based on start time
    const startMinutes = startTime === '5:00' ? 5 * 60 : 6.5 * 60;
    
    const enrichedBlocks: BlockWithTasks[] = blocks
      .map(block => {
        const [startH, startM] = block.startTime.split(':').map(Number);
        const [endH, endM] = block.endTime.split(':').map(Number);
        const blockStartMinutes = startH * 60 + startM;
        const blockEndMinutes = endH * 60 + endM;

        // Determine status
        let status: 'current' | 'completed' | 'upcoming' | 'passed' = 'upcoming';
        if (currentMinutes >= blockStartMinutes && currentMinutes < blockEndMinutes) {
          status = 'current';
        } else if (currentMinutes >= blockEndMinutes) {
          status = 'passed';
        }

        // Check if block is manually completed
        if (isBlockCompleted(block.id)) {
          status = 'completed';
        }

        const blockTasks = allTasks.filter(t => t.routine_block_id === block.id);

        return {
          id: block.id,
          title: block.title,
          startTime: block.startTime,
          endTime: block.endTime,
          tasks: blockTasks,
          status,
        };
      })
      .filter(block => {
        const [h, m] = block.startTime.split(':').map(Number);
        const blockStartMinutes = h * 60 + m;
        return blockStartMinutes >= startMinutes || block.status === 'current';
      })
      .sort((a, b) => {
        const [aH, aM] = a.startTime.split(':').map(Number);
        const [bH, bM] = b.startTime.split(':').map(Number);
        return (aH * 60 + aM) - (bH * 60 + bM);
      });

    setBlocksWithTasks(enrichedBlocks);

    // Auto-expand current block
    const currentBlock = enrichedBlocks.find(b => b.status === 'current');
    if (currentBlock) {
      setExpandedBlocks(prev => new Set([...prev, currentBlock.id]));
    }
  };

  const toggleExpand = (blockId: string) => {
    setExpandedBlocks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(blockId)) {
        newSet.delete(blockId);
      } else {
        newSet.add(blockId);
      }
      return newSet;
    });
  };

  const toggleTask = async (task: TimelineTask) => {
    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    
    const { error } = await supabase
      .from(table)
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (error) {
      toast.error('Error al actualizar tarea');
      return;
    }

    await loadTasksForBlocks();
    toast.success(task.completed ? 'Tarea desmarcada' : 'Tarea completada');
  };

  const handleMoveTask = (task: TimelineTask) => {
    setTaskToMove(task);
    setMoveDialogOpen(true);
  };

  const moveTaskToBlock = async (newBlockId: string) => {
    if (!taskToMove) return;

    const table = taskToMove.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    
    const { error } = await supabase
      .from(table)
      .update({ routine_block_id: newBlockId })
      .eq('id', taskToMove.id);

    if (error) {
      toast.error('Error al mover tarea');
      return;
    }

    setMoveDialogOpen(false);
    setTaskToMove(null);
    await loadTasksForBlocks();
    toast.success('Tarea movida');
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const hour = h % 12 || 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const getBlockDuration = (start: string, end: string) => {
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    return (eH * 60 + eM) - (sH * 60 + sM);
  };

  const getTimelinePosition = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  if (!isLoaded) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse h-16 bg-muted rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with time selector */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Timeline del Día</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant={startTime === '5:00' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStartTime('5:00')}
            className="h-7 text-xs"
          >
            <Sun className="w-3 h-3 mr-1" />
            5:00 AM
          </Button>
          <Button
            variant={startTime === '6:30' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStartTime('6:30')}
            className="h-7 text-xs"
          >
            <Moon className="w-3 h-3 mr-1" />
            6:30 AM
          </Button>
        </div>
      </div>

      {/* Timeline blocks */}
      <div className="relative space-y-1">
        {blocksWithTasks.map((block, index) => {
          const isExpanded = expandedBlocks.has(block.id);
          const duration = getBlockDuration(block.startTime, block.endTime);
          const blockStartMinutes = getTimelinePosition(block.startTime);
          const blockEndMinutes = getTimelinePosition(block.endTime);
          const isNowInBlock = currentMinutes >= blockStartMinutes && currentMinutes < blockEndMinutes;
          const nowPosition = isNowInBlock 
            ? ((currentMinutes - blockStartMinutes) / (blockEndMinutes - blockStartMinutes)) * 100 
            : null;

          return (
            <div key={block.id} className="relative">
              {/* Time marker */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-muted-foreground w-16">
                  {formatTime(block.startTime)}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Block card */}
              <div
                className={cn(
                  "relative ml-4 border rounded-lg transition-all overflow-hidden",
                  block.status === 'current' && "ring-2 ring-primary bg-primary/5",
                  block.status === 'completed' && "bg-success/10 border-success/30",
                  block.status === 'passed' && !isBlockCompleted(block.id) && "opacity-60"
                )}
              >
                {/* Now indicator line */}
                {isNowInBlock && nowPosition !== null && (
                  <div 
                    className="absolute left-0 right-0 h-0.5 bg-destructive z-10 flex items-center"
                    style={{ top: `${nowPosition}%` }}
                  >
                    <span className="absolute -left-4 text-[10px] text-destructive font-bold bg-background px-1">
                      AHORA
                    </span>
                  </div>
                )}

                {/* Block header */}
                <button
                  onClick={() => toggleExpand(block.id)}
                  className="w-full flex items-center gap-3 p-3 text-left"
                >
                  <Checkbox
                    checked={block.status === 'completed' || isBlockCompleted(block.id)}
                    onCheckedChange={() => toggleBlockComplete(block.id, block.tasks.length)}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "font-medium text-sm",
                        (block.status === 'completed' || isBlockCompleted(block.id)) && "line-through text-muted-foreground"
                      )}>
                        {block.title}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5">
                        {duration} min
                      </Badge>
                    </div>
                    
                    {block.tasks.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-muted-foreground">
                          {block.tasks.filter(t => t.completed).length}/{block.tasks.length} tareas
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status indicator */}
                  <div className="flex items-center gap-2">
                    {block.status === 'current' && (
                      <Badge className="bg-primary text-primary-foreground text-[10px] animate-pulse">
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        EN CURSO
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Expanded tasks */}
                {isExpanded && block.tasks.length > 0 && (
                  <div className="px-3 pb-3 space-y-2 border-t">
                    {block.tasks.map(task => (
                      <div
                        key={task.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded bg-muted/50",
                          task.completed && "opacity-60"
                        )}
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => toggleTask(task)}
                          className="flex-shrink-0"
                        />
                        <span className={cn(
                          "flex-1 text-sm",
                          task.completed && "line-through text-muted-foreground"
                        )}>
                          {task.title}
                        </span>
                        {task.priority === 'high' && (
                          <Badge variant="destructive" className="text-[10px] h-5">
                            ALTA
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveTask(task)}
                          className="h-6 px-2"
                        >
                          <MoveRight className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Task preview when collapsed */}
                {!isExpanded && block.tasks.length > 0 && (
                  <div className="px-3 pb-2 flex flex-wrap gap-1">
                    {block.tasks.slice(0, 2).map(task => (
                      <Badge
                        key={task.id}
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          task.completed && "line-through opacity-60"
                        )}
                      >
                        {task.title.length > 25 ? task.title.substring(0, 25) + '...' : task.title}
                      </Badge>
                    ))}
                    {block.tasks.length > 2 && (
                      <Badge variant="outline" className="text-[10px]">
                        +{block.tasks.length - 2} más
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* End time marker */}
        {blocksWithTasks.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground w-16">
              {formatTime(blocksWithTasks[blocksWithTasks.length - 1].endTime)}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}
      </div>

      {/* Move task dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover tarea a otro bloque</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {blocksWithTasks
              .filter(b => b.id !== taskToMove?.routine_block_id)
              .map(block => (
                <Button
                  key={block.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => moveTaskToBlock(block.id)}
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {formatTime(block.startTime)} - {block.title}
                </Button>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
