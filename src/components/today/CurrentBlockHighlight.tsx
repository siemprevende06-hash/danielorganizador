import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, ChevronRight } from "lucide-react";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";

interface BlockTask {
  id: string;
  title: string;
  completed: boolean;
}

export function CurrentBlockHighlight() {
  const { blocks, getCurrentBlock, getBlockProgress, isLoaded } = useRoutineBlocksDB();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  if (!isLoaded) {
    return (
      <Card className="border-2 border-foreground bg-card">
        <CardContent className="p-6">
          <div className="animate-pulse h-32 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const currentBlock = getCurrentBlock();
  
  if (!currentBlock) {
    return (
      <Card className="border border-border bg-card">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No hay bloque activo en este momento</p>
          <p className="text-sm text-muted-foreground mt-2">
            Siguiente bloque disponible pronto
          </p>
        </CardContent>
      </Card>
    );
  }

  const progress = getBlockProgress(currentBlock);
  const tasks: BlockTask[] = (currentBlock.tasks || []).map((task: string, idx: number) => ({
    id: `${currentBlock.id}-${idx}`,
    title: task,
    completed: completedTasks.has(`${currentBlock.id}-${idx}`)
  }));

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

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const formatTime = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  const completedCount = tasks.filter(t => t.completed).length;
  const taskProgress = tasks.length > 0 ? (completedCount / tasks.length) * 100 : 0;

  return (
    <Card className="border-2 border-foreground bg-card shadow-lg">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-foreground rounded-full animate-pulse" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Bloque Actual
            </span>
          </div>
          <span className="text-sm font-mono text-muted-foreground">
            {formatTime(currentBlock.startTime)} - {formatTime(currentBlock.endTime)}
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-foreground mb-4">
          {currentBlock.title}
        </h2>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Progreso del bloque</span>
            <span className="font-mono font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="space-y-2 mb-4">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-muted transition-colors text-left"
              >
                {task.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                )}
                <span className={task.completed ? "line-through text-muted-foreground" : "text-foreground"}>
                  {task.title}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span className="text-sm">
              {remainingMinutes > 0 
                ? `Quedan ${remainingMinutes} minutos`
                : 'Bloque terminado'
              }
            </span>
          </div>
          
          {nextBlock && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ChevronRight className="w-4 h-4" />
              <span>Siguiente: {nextBlock.title} ({formatTime(nextBlock.startTime)})</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
