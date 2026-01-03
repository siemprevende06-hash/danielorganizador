import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Clock, ChevronRight, Target, AlertTriangle, Plus, Zap } from "lucide-react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { supabase } from "@/integrations/supabase/client";
import { BlockAIAssistant } from "./BlockAIAssistant";
import { BlockTaskAssigner, TaskItem } from "@/components/routine/BlockTaskAssigner";
import { PomodoroTracker } from "./PomodoroTracker";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";

interface BlockTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  source: string;
  goalTitle?: string;
  goalProgress?: number;
  goalCategory?: string;
  contributionPercent?: number;
}

export function CurrentBlockHighlight() {
  const { blocks, getCurrentBlock, getBlockProgress, isLoaded } = useRoutineBlocksDB();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blockTasks, setBlockTasks] = useState<BlockTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [assignerOpen, setAssignerOpen] = useState(false);
  const [availableTasks, setAvailableTasks] = useState<TaskItem[]>([]);
  const [quarterlyGoals, setQuarterlyGoals] = useState<Array<{ id: string; title: string; category: string; progress_percentage: number }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentBlock = getCurrentBlock();

  useEffect(() => {
    loadQuarterlyGoals();
    loadAvailableTasks();
  }, []);

  useEffect(() => {
    if (currentBlock) {
      loadBlockTasks(currentBlock.id);
    }
  }, [currentBlock?.id, quarterlyGoals]);

  const loadQuarterlyGoals = async () => {
    const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    const { data } = await supabase
      .from('twelve_week_goals')
      .select('id, title, category, progress_percentage')
      .eq('quarter', currentQuarter)
      .eq('year', new Date().getFullYear())
      .eq('status', 'active');
    
    setQuarterlyGoals(data || []);
  };

  const loadAvailableTasks = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load regular tasks
    const { data: regularTasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, source, area_id, routine_block_id')
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    // Load entrepreneurship tasks
    const { data: entrepreneurshipTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, title, completed')
      .eq('due_date', today);

    const mapped: TaskItem[] = [
      ...(regularTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        source: (t.source || 'tasks') as TaskItem['source'],
        routine_block_id: t.routine_block_id || undefined
      })),
      ...(entrepreneurshipTasks || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        source: 'entrepreneurship' as const
      }))
    ];

    setAvailableTasks(mapped);
  };

  const loadBlockTasks = async (blockId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load tasks assigned to this block
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, area_id, source')
      .eq('routine_block_id', blockId)
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    const mappedTasks: BlockTask[] = (tasks || []).map(t => {
      const linkedGoal = findLinkedGoal(t.area_id, t.source);
      return {
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority || undefined,
        source: t.source || 'general',
        goalTitle: linkedGoal?.title,
        goalProgress: linkedGoal?.progress_percentage,
        goalCategory: linkedGoal?.category,
        contributionPercent: linkedGoal ? Math.round(100 / Math.max(1, quarterlyGoals.filter(g => g.category === linkedGoal.category).length)) : undefined
      };
    });

    // Also add the block's default tasks
    const blockDefaultTasks = (currentBlock?.tasks || []).map((task: string, idx: number) => ({
      id: `default-${idx}`,
      title: task,
      completed: completedTasks.has(`default-${idx}`),
      priority: undefined,
      source: 'block'
    }));

    setBlockTasks([...mappedTasks, ...blockDefaultTasks]);
  };

  const findLinkedGoal = (areaId?: string | null, source?: string) => {
    const categoryMap: Record<string, string> = {
      university: 'universidad',
      entrepreneurship: 'emprendimiento',
      projects: 'proyectos',
      gym: 'salud',
      piano: 'desarrollo_personal',
      reading: 'desarrollo_personal'
    };
    
    const category = categoryMap[areaId || source || ''];
    if (!category) return null;
    
    return quarterlyGoals.find(g => 
      g.category.toLowerCase().includes(category) || 
      category.includes(g.category.toLowerCase())
    );
  };

  const handleAssignTasks = async (taskIds: string[]) => {
    if (!currentBlock) return;
    
    // Get currently assigned tasks to this block
    const currentlyAssigned = availableTasks
      .filter(t => t.routine_block_id === currentBlock.id)
      .map(t => t.id);
    
    // Tasks to unassign (were assigned, now not selected)
    const toUnassign = currentlyAssigned.filter(id => !taskIds.includes(id));
    
    // Tasks to assign (newly selected)
    const toAssign = taskIds.filter(id => !currentlyAssigned.includes(id));

    // Unassign tasks
    for (const taskId of toUnassign) {
      await supabase
        .from('tasks')
        .update({ routine_block_id: null })
        .eq('id', taskId);
    }

    // Assign new tasks
    for (const taskId of toAssign) {
      await supabase
        .from('tasks')
        .update({ routine_block_id: currentBlock.id })
        .eq('id', taskId);
    }

    toast.success(`${taskIds.length} tareas asignadas al bloque`);
    loadBlockTasks(currentBlock.id);
    loadAvailableTasks();
  };

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      universidad: 'from-blue-500 to-blue-600',
      emprendimiento: 'from-purple-500 to-purple-600',
      salud: 'from-green-500 to-green-600',
      desarrollo_personal: 'from-amber-500 to-amber-600',
      proyectos: 'from-emerald-500 to-emerald-600'
    };
    return colors[category?.toLowerCase() || ''] || 'from-primary to-primary';
  };

  const getCategoryIcon = (category?: string) => {
    const icons: Record<string, string> = {
      universidad: '📚',
      emprendimiento: '💼',
      salud: '💪',
      desarrollo_personal: '🎯',
      proyectos: '🚀'
    };
    return icons[category?.toLowerCase() || ''] || '🎯';
  };

  if (!isLoaded) {
    return (
      <Card className="border-2 border-foreground bg-card">
        <CardContent className="p-6">
          <div className="animate-pulse h-40 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!currentBlock) {
    // Find next block
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const nextBlock = blocks.find(block => {
      const [startH, startM] = block.startTime.split(':').map(Number);
      return startH * 60 + startM > currentMinutes;
    });

    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-2">No hay bloque activo en este momento</p>
          {nextBlock && (
            <div className="flex items-center justify-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>Próximo: <strong>{nextBlock.title}</strong> a las {formatTime(nextBlock.startTime)}</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const progress = getBlockProgress(currentBlock);
  
  // Calculate time remaining
  const [endHour, endMinute] = currentBlock.endTime.split(':').map(Number);
  const endTimeMinutes = endHour * 60 + endMinute;
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const remainingMinutes = Math.max(0, endTimeMinutes - currentMinutes);

  // Find next block
  const currentIndex = blocks.findIndex(b => b.id === currentBlock.id);
  const nextBlock = currentIndex >= 0 && currentIndex < blocks.length - 1 
    ? blocks[currentIndex + 1] 
    : null;

  const toggleTask = async (taskId: string) => {
    if (taskId.startsWith('default-')) {
      setCompletedTasks(prev => {
        const next = new Set(prev);
        if (next.has(taskId)) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    } else {
      const task = blockTasks.find(t => t.id === taskId);
      if (task) {
        await supabase
          .from('tasks')
          .update({ completed: !task.completed })
          .eq('id', taskId);
        
        setBlockTasks(prev => 
          prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        );
      }
    }
  };

  function formatTime(time: string) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  }

  const completedCount = blockTasks.filter(t => t.completed || completedTasks.has(t.id)).length;
  const taskProgress = blockTasks.length > 0 ? (completedCount / blockTasks.length) * 100 : progress;
  const hasHighPriority = blockTasks.some(t => t.priority === 'high' && !t.completed);

  return (
    <Card className={`border-2 ${hasHighPriority ? 'border-destructive' : 'border-foreground'} bg-card shadow-lg`}>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full animate-pulse ${hasHighPriority ? 'bg-destructive' : 'bg-foreground'}`} />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bloque Actual
            </span>
            {hasHighPriority && (
              <span className="flex items-center gap-1 text-xs text-destructive">
                <AlertTriangle className="w-3 h-3" />
                Prioridad Alta
              </span>
            )}
          </div>
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(currentBlock.startTime)} - {formatTime(currentBlock.endTime)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {currentBlock.title}
        </h2>

        {/* Why this matters */}
        <p className="text-sm text-muted-foreground mb-4">
          Este bloque contribuye a tu progreso diario y metas trimestrales.
        </p>

        {/* Pomodoro Tracker - for blocks >= 60 minutes */}
        {remainingMinutes > 0 && (() => {
          const [startH, startM] = currentBlock.startTime.split(':').map(Number);
          const [endH, endM] = currentBlock.endTime.split(':').map(Number);
          const blockDuration = (endH * 60 + endM) - (startH * 60 + startM);
          
          if (blockDuration >= 60) {
            return (
              <div className="mb-4">
                <PomodoroTracker
                  blockStartTime={currentBlock.startTime}
                  blockEndTime={currentBlock.endTime}
                  cycleDuration={30}
                />
              </div>
            );
          }
          return null;
        })()}

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso del bloque</span>
            <span className="font-mono font-medium">{Math.round(taskProgress)}%</span>
          </div>
          <Progress value={taskProgress} className="h-2" />
        </div>

        {/* Tasks */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Qué hacer ahora:
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAssignerOpen(true)}
              className="h-7 text-xs gap-1"
            >
              <Plus className="w-3 h-3" />
              Asignar tareas
            </Button>
          </div>

          {blockTasks.length === 0 ? (
            <div className="text-center py-6 bg-muted/30 rounded-lg border border-dashed border-border">
              <p className="text-sm text-muted-foreground mb-2">No hay tareas asignadas a este bloque</p>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={() => setAssignerOpen(true)}
                className="gap-1"
              >
                <Plus className="w-4 h-4" />
                Asignar tareas del día
              </Button>
            </div>
          ) : (
            blockTasks.map((task) => (
              <div
                key={task.id}
                className={`rounded-lg overflow-hidden transition-all ${
                  task.priority === 'high' && !task.completed
                    ? 'ring-2 ring-destructive/50'
                    : 'border border-border'
                }`}
              >
                {/* Goal Connection Header */}
                {task.goalTitle && (
                  <div className={`px-3 py-1.5 bg-gradient-to-r ${getCategoryColor(task.goalCategory)} text-white flex items-center justify-between`}>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <span>{getCategoryIcon(task.goalCategory)}</span>
                      <span className="truncate">{task.goalTitle}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 bg-white/30 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white rounded-full transition-all" 
                          style={{ width: `${task.goalProgress || 0}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold">{task.goalProgress || 0}%</span>
                    </div>
                  </div>
                )}
                
                {/* Task Content */}
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-full flex items-start gap-3 p-3 transition-colors text-left ${
                    task.completed || completedTasks.has(task.id) ? 'bg-muted/50' : 'bg-card hover:bg-muted/30'
                  }`}
                >
                  {task.completed || completedTasks.has(task.id) ? (
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <span className={task.completed || completedTasks.has(task.id) ? "line-through text-muted-foreground" : "text-foreground font-medium"}>
                      {task.title}
                    </span>
                    
                    {/* Contribution indicator */}
                    {task.contributionPercent && !task.completed && (
                      <div className="flex items-center gap-2 mt-2">
                        <Zap className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-muted-foreground">
                          Completar esto aporta ~{task.contributionPercent}% a tu meta
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {task.priority === 'high' && !task.completed && (
                    <span className="px-2 py-0.5 bg-destructive/20 text-destructive text-xs rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Alta
                    </span>
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Task Assigner Dialog */}
        {currentBlock && (
          <BlockTaskAssigner
            open={assignerOpen}
            onOpenChange={setAssignerOpen}
            blockId={currentBlock.id}
            blockTitle={currentBlock.title}
            dailyTasks={availableTasks}
            onAssignTasks={handleAssignTasks}
          />
        )}

        {/* AI Assistant */}
        <div className="mb-4">
          <BlockAIAssistant 
            dayContext={{
              currentTime: format(currentTime, "HH:mm"),
              currentBlock: {
                title: currentBlock.title,
                startTime: currentBlock.startTime,
                endTime: currentBlock.endTime,
                remainingMinutes,
              },
              tasks: blockTasks.map(t => ({
                id: t.id,
                title: t.title,
                completed: t.completed || completedTasks.has(t.id),
                priority: t.priority,
                goalTitle: t.goalTitle,
                goalProgress: t.goalProgress,
              })),
              completedTasksCount: completedCount,
              totalTasksCount: blockTasks.length,
              goals: [],
              blocksCompleted: currentIndex,
              blocksTotal: blocks.length,
              nextBlock: nextBlock ? { title: nextBlock.title, startTime: nextBlock.startTime } : undefined,
              weekNumber: Math.ceil((differenceInDays(new Date(), new Date(new Date().getFullYear(), 0, 1)) + 1) / 7) % 12 || 12,
              daysRemainingInQuarter: 84 - (differenceInDays(new Date(), new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1)) % 84),
            }}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-mono">
              {remainingMinutes > 0 
                ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m restantes`
                : 'Bloque terminado'
              }
            </span>
          </div>
          
          {nextBlock && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
              <span>Siguiente: {nextBlock.title}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
