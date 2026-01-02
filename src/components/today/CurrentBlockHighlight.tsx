import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, ChevronRight, Target, AlertTriangle } from "lucide-react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { supabase } from "@/integrations/supabase/client";
import { BlockAIAssistant } from "./BlockAIAssistant";
import { format, differenceInDays } from "date-fns";

interface BlockTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  goalConnection?: string;
  goalTitle?: string;
  goalProgress?: number;
}

export function CurrentBlockHighlight() {
  const { blocks, getCurrentBlock, getBlockProgress, isLoaded } = useRoutineBlocksDB();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [blockTasks, setBlockTasks] = useState<BlockTask[]>([]);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const currentBlock = getCurrentBlock();

  useEffect(() => {
    if (currentBlock) {
      loadBlockTasks(currentBlock.id);
    }
  }, [currentBlock?.id]);

  const loadBlockTasks = async (blockId: string) => {
    const today = new Date().toISOString().split('T')[0];
    
    // Load tasks assigned to this block
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, title, completed, priority, area_id')
      .eq('routine_block_id', blockId)
      .gte('due_date', `${today}T00:00:00`)
      .lte('due_date', `${today}T23:59:59`);

    const mappedTasks: BlockTask[] = (tasks || []).map(t => ({
      id: t.id,
      title: t.title,
      completed: t.completed || false,
      priority: t.priority || undefined,
      goalConnection: t.area_id ? getAreaLabel(t.area_id) : undefined
    }));

    // Also add the block's default tasks
    const blockDefaultTasks = (currentBlock?.tasks || []).map((task: string, idx: number) => ({
      id: `default-${idx}`,
      title: task,
      completed: completedTasks.has(`default-${idx}`),
      priority: undefined,
      goalConnection: undefined
    }));

    setBlockTasks([...mappedTasks, ...blockDefaultTasks]);
  };

  const getAreaLabel = (areaId: string) => {
    const labels: Record<string, string> = {
      university: '→ Meta: Universidad',
      entrepreneurship: '→ Meta: Emprendimiento',
      projects: '→ Meta: Proyectos',
      gym: '→ Meta: Gym',
      piano: '→ Meta: Piano',
      reading: '→ Meta: Lectura'
    };
    return labels[areaId] || '';
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

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso del bloque</span>
            <span className="font-mono font-medium">{Math.round(taskProgress)}%</span>
          </div>
          <Progress value={taskProgress} className="h-2" />
        </div>

        {/* Tasks */}
        {blockTasks.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
              Qué hacer ahora:
            </p>
            {blockTasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                  task.priority === 'high' && !task.completed
                    ? 'bg-destructive/10 hover:bg-destructive/20 border-l-4 border-l-destructive'
                    : 'hover:bg-muted'
                }`}
              >
                {task.completed || completedTasks.has(task.id) ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <span className={task.completed || completedTasks.has(task.id) ? "line-through text-muted-foreground" : "text-foreground"}>
                    {task.title}
                  </span>
                  {task.goalConnection && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      {task.goalConnection}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
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
