import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useRoutineBlocks, formatTimeDisplay, type RoutineBlock } from "@/hooks/useRoutineBlocks";
import { Play, Pause, RotateCcw, Target, Clock, CheckCircle2 } from "lucide-react";

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Focus() {
  const { blocks, isLoaded, getCurrentBlock, getBlockDurationMinutes, getBlockProgress } = useRoutineBlocks();
  const [currentBlock, setCurrentBlock] = useState<RoutineBlock | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [blockProgress, setBlockProgress] = useState(0);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const initializeTimer = useCallback(() => {
    const block = getCurrentBlock();
    setCurrentBlock(block);
    
    if (block) {
      const durationMinutes = getBlockDurationMinutes(block);
      setPomodoroTime(durationMinutes * 60);
      setTimeRemaining(durationMinutes * 60);
      setBlockProgress(getBlockProgress(block));
    }
  }, [getCurrentBlock, getBlockDurationMinutes, getBlockProgress]);

  useEffect(() => {
    if (isLoaded) {
      initializeTimer();
    }
  }, [isLoaded, initializeTimer]);

  useEffect(() => {
    if (!isLoaded) return;

    const blockInterval = setInterval(() => {
      const newBlock = getCurrentBlock();
      if (newBlock?.id !== currentBlock?.id) {
        initializeTimer();
        setIsRunning(false);
        setCompletedTasks(new Set());
      } else if (newBlock) {
        setBlockProgress(getBlockProgress(newBlock));
      }
    }, 60000);

    return () => clearInterval(blockInterval);
  }, [isLoaded, currentBlock?.id, initializeTimer, getCurrentBlock, getBlockProgress]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (currentBlock) {
      const durationMinutes = getBlockDurationMinutes(currentBlock);
      setTimeRemaining(durationMinutes * 60);
      setIsRunning(false);
    }
  };

  const toggleTask = (task: string) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(task)) {
        newSet.delete(task);
      } else {
        newSet.add(task);
      }
      return newSet;
    });
  };

  const progressPercent = pomodoroTime > 0 ? ((pomodoroTime - timeRemaining) / pomodoroTime) * 100 : 0;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!currentBlock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">No hay bloque activo</h2>
            <p className="text-muted-foreground">
              No hay ningún bloque de rutina programado para este momento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const assignedTasks = currentBlock.tasks || [];

  return (
    <div className="min-h-screen bg-background p-6 pt-24">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Focus Block - Takes 2 columns */}
          <div className="lg:col-span-2">
            <Card className="h-full border-2 border-primary/20">
              <CardHeader className="text-center pb-2">
                <div className="flex items-center justify-center gap-2 mb-2">
                  {currentBlock.isFocusBlock && (
                    <Badge variant="default" className="bg-primary">
                      <Target className="w-3 h-3 mr-1" />
                      Foco Profundo
                    </Badge>
                  )}
                  <Badge variant="outline">
                    {formatTimeDisplay(currentBlock.startTime)} - {formatTimeDisplay(currentBlock.endTime)}
                  </Badge>
                </div>
                <CardTitle className="text-4xl md:text-5xl font-bold">
                  {currentBlock.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="flex flex-col items-center justify-center space-y-8 pt-4">
                {/* Pomodoro Timer */}
                <div className="relative w-64 h-64 md:w-80 md:h-80">
                  {/* Background circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45} ${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  
                  {/* Timer display */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl md:text-6xl font-mono font-bold">
                      {formatTime(timeRemaining)}
                    </span>
                    <span className="text-muted-foreground mt-2">
                      {getBlockDurationMinutes(currentBlock)} min total
                    </span>
                  </div>
                </div>

                {/* Timer controls */}
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={toggleTimer}
                    className="w-32"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Iniciar
                      </>
                    )}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={resetTimer}
                  >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Reiniciar
                  </Button>
                </div>

                {/* Block progress */}
                <div className="w-full max-w-md space-y-2">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Progreso del bloque</span>
                    <span>{Math.round(blockProgress)}%</span>
                  </div>
                  <Progress value={blockProgress} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tasks Panel */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Tareas del Bloque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignedTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No hay tareas asignadas a este bloque
                    </p>
                  ) : (
                    assignedTasks.map((task, index) => (
                      <div
                        key={index}
                        onClick={() => toggleTask(task)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          completedTasks.has(task)
                            ? 'bg-primary/10 border-primary/30 line-through text-muted-foreground'
                            : 'bg-card hover:bg-muted/50 border-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            completedTasks.has(task)
                              ? 'bg-primary border-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {completedTasks.has(task) && (
                              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
                            )}
                          </div>
                          <span className="font-medium">{task}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {assignedTasks.length > 0 && (
                  <div className="mt-6 pt-4 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completadas</span>
                      <span className="font-semibold">
                        {completedTasks.size} / {assignedTasks.length}
                      </span>
                    </div>
                    <Progress 
                      value={(completedTasks.size / assignedTasks.length) * 100} 
                      className="mt-2 h-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
