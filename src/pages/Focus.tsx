import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRoutineBlocks, formatTimeDisplay, type RoutineBlock } from "@/hooks/useRoutineBlocks";
import { useFocusSessions } from "@/hooks/useFocusSessions";
import { supabase } from "@/integrations/supabase/client";
import { Play, Pause, RotateCcw, Target, Clock, CheckCircle2, Plus, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AvailableTask {
  id: string;
  title: string;
  source: string;
  priority?: string;
  area_id?: string;
}

interface BlockTask {
  id: string;
  title: string;
  completed: boolean;
  source: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export default function Focus() {
  const { blocks, isLoaded, getCurrentBlock, getBlockDurationMinutes, getBlockProgress } = useRoutineBlocks();
  const { 
    startSession, 
    endSession, 
    getTodayStats, 
    getWeekStats, 
    loading: statsLoading 
  } = useFocusSessions();
  
  const todayStats = getTodayStats();
  const weeklyStats = getWeekStats();
  
  const [currentBlock, setCurrentBlock] = useState<RoutineBlock | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroTime, setPomodoroTime] = useState(0);
  const [blockProgress, setBlockProgress] = useState(0);
  const [blockTasks, setBlockTasks] = useState<BlockTask[]>([]);
  
  // Task selection
  const [availableTasks, setAvailableTasks] = useState<AvailableTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [customTaskTitle, setCustomTaskTitle] = useState("");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [focusedTask, setFocusedTask] = useState<{ id?: string; title: string; area?: string } | null>(null);

  // Load available tasks
  useEffect(() => {
    const loadTasks = async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const [tasksResult, entTasksResult] = await Promise.all([
        supabase.from('tasks').select('id, title, priority, source, area_id')
          .eq('completed', false)
          .gte('due_date', `${today}T00:00:00`)
          .order('priority', { ascending: false }),
        supabase.from('entrepreneurship_tasks').select('id, title')
          .eq('completed', false)
          .eq('due_date', today)
      ]);

      const tasks: AvailableTask[] = [
        ...(tasksResult.data || []).map(t => ({ ...t, source: t.source || 'general' })),
        ...(entTasksResult.data || []).map(t => ({ id: t.id, title: t.title, source: 'entrepreneurship' }))
      ];

      setAvailableTasks(tasks);
    };

    loadTasks();
  }, []);

  const loadBlockTasks = useCallback(async (blockId: string) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, completed, source')
        .eq('routine_block_id', blockId);

      if (error) throw error;
      setBlockTasks(data || []);
    } catch (error) {
      console.error('Error loading block tasks:', error);
      setBlockTasks([]);
    }
  }, []);

  const initializeTimer = useCallback(() => {
    const block = getCurrentBlock();
    setCurrentBlock(block);
    
    if (block) {
      const durationMinutes = getBlockDurationMinutes(block);
      setPomodoroTime(durationMinutes * 60);
      setTimeRemaining(durationMinutes * 60);
      setBlockProgress(getBlockProgress(block));
      loadBlockTasks(block.id);
    } else {
      setBlockTasks([]);
    }
  }, [getCurrentBlock, getBlockDurationMinutes, getBlockProgress, loadBlockTasks]);

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
            handleSessionEnd(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  const handleStartFocus = async () => {
    let taskTitle = customTaskTitle;
    let taskId: string | undefined;
    let taskArea: string | undefined;

    if (selectedTaskId) {
      const task = availableTasks.find(t => t.id === selectedTaskId);
      if (task) {
        taskTitle = task.title;
        taskId = task.id;
        taskArea = task.area_id || task.source;
      }
    }

    if (!taskTitle.trim()) {
      toast.error("Selecciona o escribe una tarea para enfocarte");
      return;
    }

    setFocusedTask({ id: taskId, title: taskTitle, area: taskArea });
    
    const session = await startSession(taskTitle, taskId, taskArea, currentBlock?.id);
    if (session) {
      setActiveSessionId(session.id);
      setIsRunning(true);
      toast.success(`Sesión de focus iniciada: ${taskTitle}`);
    }
  };

  const handleSessionEnd = async (completed: boolean = false) => {
    if (activeSessionId) {
      await endSession(activeSessionId, completed);
      setActiveSessionId(null);
      setIsRunning(false);
      toast.success(completed ? "¡Sesión completada!" : "Sesión pausada");
    }
  };

  const toggleTimer = () => {
    if (isRunning) {
      handleSessionEnd(false);
    } else {
      handleStartFocus();
    }
  };

  const resetTimer = () => {
    if (currentBlock) {
      const durationMinutes = getBlockDurationMinutes(currentBlock);
      setTimeRemaining(durationMinutes * 60);
      setIsRunning(false);
      if (activeSessionId) {
        handleSessionEnd(false);
      }
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const task = blockTasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;

      setBlockTasks(prev => 
        prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const progressPercent = pomodoroTime > 0 ? ((pomodoroTime - timeRemaining) / pomodoroTime) * 100 : 0;
  const completedCount = blockTasks.filter(t => t.completed).length;

  const getSourceBadge = (source: string) => {
    const sourceColors: Record<string, string> = {
      'university': 'bg-blue-500/20 text-blue-700',
      'universidad': 'bg-blue-500/20 text-blue-700',
      'entrepreneurship': 'bg-purple-500/20 text-purple-700',
      'emprendimiento': 'bg-purple-500/20 text-purple-700',
      'general': 'bg-green-500/20 text-green-700',
    };
    const sourceNames: Record<string, string> = {
      'university': 'Universidad',
      'universidad': 'Universidad',
      'entrepreneurship': 'Emprendimiento',
      'emprendimiento': 'Emprendimiento',
      'general': 'General',
    };
    return { color: sourceColors[source] || 'bg-muted', name: sourceNames[source] || source };
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 pt-24 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Task Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              ¿En qué te vas a enfocar?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={selectedTaskId} onValueChange={(v) => {
              setSelectedTaskId(v);
              setCustomTaskTitle("");
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una tarea pendiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">-- Ninguna (escribir manual) --</SelectItem>
                {availableTasks.map(task => (
                  <SelectItem key={task.id} value={task.id}>
                    {task.priority === 'high' && '⚠️ '}
                    {task.title}
                    <span className="text-muted-foreground ml-2">({getSourceBadge(task.source).name})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">o</span>
            </div>

            <div className="flex gap-2">
              <Input 
                placeholder="Escribir tarea manualmente..."
                value={customTaskTitle}
                onChange={(e) => {
                  setCustomTaskTitle(e.target.value);
                  setSelectedTaskId("");
                }}
                disabled={!!selectedTaskId}
              />
              <Button variant="outline" size="icon" onClick={() => {
                setSelectedTaskId("");
                setCustomTaskTitle("");
              }}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {focusedTask && (
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/30">
                <p className="text-sm text-muted-foreground">Enfocado en:</p>
                <p className="font-semibold">{focusedTask.title}</p>
                {focusedTask.area && (
                  <Badge className="mt-1" variant="outline">{focusedTask.area}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Focus Block */}
          <div className="lg:col-span-2">
            <Card className="h-full border-2 border-primary/20">
              <CardHeader className="text-center pb-2">
                {currentBlock ? (
                  <>
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
                    <CardTitle className="text-3xl md:text-4xl font-bold">
                      {currentBlock.title}
                    </CardTitle>
                  </>
                ) : (
                  <CardTitle className="text-2xl">Sin bloque activo</CardTitle>
                )}
              </CardHeader>
              
              <CardContent className="flex flex-col items-center justify-center space-y-6 pt-4">
                {/* Timer */}
                <div className="relative w-56 h-56 md:w-64 md:h-64">
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
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl md:text-5xl font-mono font-bold">
                      {formatTime(timeRemaining)}
                    </span>
                    {currentBlock && (
                      <span className="text-muted-foreground mt-2 text-sm">
                        {getBlockDurationMinutes(currentBlock)} min total
                      </span>
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    onClick={toggleTimer}
                    className="w-32"
                    disabled={!currentBlock && !selectedTaskId && !customTaskTitle}
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
                {currentBlock && (
                  <div className="w-full max-w-md space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progreso del bloque</span>
                      <span>{Math.round(blockProgress)}%</span>
                    </div>
                    <Progress value={blockProgress} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Side Panel */}
          <div className="space-y-4">
            {/* Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4" />
                  Estadísticas de Focus
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Hoy</span>
                  <span className="font-semibold">{todayStats.totalMinutes} min ({todayStats.sessionsCount} sesiones)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Esta semana</span>
                  <span className="font-semibold">{weeklyStats.totalHours}h</span>
                </div>
                {weeklyStats.longestSession > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Sesión más larga</span>
                    <span className="font-semibold">{weeklyStats.longestSession} min</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Block Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="w-4 h-4" />
                  Tareas del Bloque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blockTasks.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4 text-sm">
                      No hay tareas asignadas
                    </p>
                  ) : (
                    blockTasks.map((task) => {
                      const sourceBadge = getSourceBadge(task.source);
                      return (
                        <div
                          key={task.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all text-sm ${
                            task.completed
                              ? 'bg-primary/10 border-primary/30'
                              : 'bg-card hover:bg-muted/50 border-border'
                          }`}
                          onClick={() => toggleTask(task.id)}
                        >
                          <div className="flex items-center gap-2">
                            <Checkbox
                              checked={task.completed}
                              onCheckedChange={() => toggleTask(task.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.title}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {blockTasks.length > 0 && (
                  <div className="mt-4 pt-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Completadas</span>
                      <span className="font-semibold">{completedCount}/{blockTasks.length}</span>
                    </div>
                    <Progress value={(completedCount / blockTasks.length) * 100} className="mt-2 h-2" />
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
