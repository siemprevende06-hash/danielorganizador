import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { isToday } from "date-fns";
import { lifeAreas, centralAreas, focusedDayRoutine } from "@/lib/data";
import type { Task, RoutineTaskGroup } from "@/lib/definitions";
import { Plus, Clock, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

interface TaskWithBlock extends Task {
  blockId?: string;
}

interface TimeWindow {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  blocks: RoutineTaskGroup[];
}

export default function Index() {
  const [tasks, setTasks] = useState<TaskWithBlock[]>([]);
  const [blockTasks, setBlockTasks] = useState<{ [blockId: string]: string[] }>({});
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Define time windows with their blocks
  const timeWindows: TimeWindow[] = [
    {
      id: "morning",
      title: "Activación Matinal",
      startTime: "5:00 AM",
      endTime: "9:00 AM",
      blocks: focusedDayRoutine.filter(
        block => 
          block.id === "wake-up" ||
          block.id === "morning-routine" ||
          block.id === "breakfast" ||
          block.id === "planning" ||
          block.id === "morning-study"
      ),
    },
    {
      id: "deep-work-morning",
      title: "Trabajo Profundo - Mañana",
      startTime: "9:00 AM",
      endTime: "1:20 PM",
      blocks: focusedDayRoutine.filter(
        block =>
          block.id === "deep-work-block-1" ||
          block.id === "break-1" ||
          block.id === "deep-work-block-2" ||
          block.id === "break-2" ||
          block.id === "light-work"
      ),
    },
    {
      id: "afternoon",
      title: "Tarde",
      startTime: "2:00 PM",
      endTime: "7:00 PM",
      blocks: focusedDayRoutine.filter(
        block =>
          block.id === "lunch" ||
          block.id === "rest" ||
          block.id === "deep-work-block-3" ||
          block.id === "break-3" ||
          block.id === "deep-work-block-4" ||
          block.id === "review"
      ),
    },
    {
      id: "evening",
      title: "Rutina Vespertina",
      startTime: "7:00 PM",
      endTime: "9:00 PM",
      blocks: focusedDayRoutine.filter(
        block =>
          block.id === "exercise" ||
          block.id === "shower-evening" ||
          block.id === "dinner" ||
          block.id === "free-time"
      ),
    },
    {
      id: "night",
      title: "Desactivación Nocturna",
      startTime: "9:00 PM",
      endTime: "11:00 PM",
      blocks: focusedDayRoutine.filter(
        block =>
          block.id === "wind-down" ||
          block.id === "night-routine"
      ),
    },
  ];

  useEffect(() => {
    setIsClient(true);
    // Load tasks from localStorage
    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      try {
        const parsedTasks: Task[] = JSON.parse(storedTasks);
        setTasks(parsedTasks.map(task => ({ 
          ...task, 
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined 
        })));
      } catch (e) {
        console.error("Error loading tasks:", e);
      }
    }

    // Load block tasks
    const storedBlockTasks = localStorage.getItem("routineBlockTasks");
    if (storedBlockTasks) {
      try {
        setBlockTasks(JSON.parse(storedBlockTasks));
      } catch (e) {
        console.error("Error loading block tasks:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem("routineBlockTasks", JSON.stringify(blockTasks));
    }
  }, [blockTasks, isClient]);

  if (!isClient) {
    return null;
  }

  // Filter today's tasks
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false;
    return isToday(task.dueDate);
  });

  // Group tasks by area
  const allAreas = [...lifeAreas, ...centralAreas];
  const tasksByArea = allAreas.map(area => {
    const areaTasks = todayTasks.filter(task => task.areaId === area.id);
    return {
      area,
      tasks: areaTasks,
    };
  }).filter(group => group.tasks.length > 0);

  const handleToggleTask = (taskId: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed, status: !task.completed ? 'completada' : 'pendiente' }
          : task
      )
    );

    const storedTasks = localStorage.getItem("tasks");
    if (storedTasks) {
      try {
        const parsedTasks: Task[] = JSON.parse(storedTasks);
        const updated = parsedTasks.map(task =>
          task.id === taskId
            ? { ...task, completed: !task.completed, status: !task.completed ? 'completada' : 'pendiente' }
            : task
        );
        localStorage.setItem("tasks", JSON.stringify(updated));
      } catch (e) {
        console.error("Error updating task:", e);
      }
    }
  };

  const handleAddTaskToBlock = (taskId: string, blockId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    setBlockTasks(prev => ({
      ...prev,
      [blockId]: [...(prev[blockId] || []), task.id],
    }));
    setSelectedBlock(null);
  };

  const handleRemoveTaskFromBlock = (blockId: string, taskId: string) => {
    setBlockTasks(prev => ({
      ...prev,
      [blockId]: (prev[blockId] || []).filter(id => id !== taskId),
    }));
  };

  const getTaskById = (taskId: string) => {
    return tasks.find(t => t.id === taskId);
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          Hoy
        </h1>
        <p className="text-muted-foreground">
          {new Date().toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>

      {/* Today's Tasks by Area */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Tareas del Día por Área</h2>
        {tasksByArea.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tienes tareas programadas para hoy
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasksByArea.map(({ area, tasks }) => {
              const Icon = area.icon;
              return (
                <Card key={area.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Icon className="h-4 w-4" />
                      {area.name}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {tasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task.id)}
                          className="mt-0.5"
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              task.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.priority && (
                          <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                            {task.priority === 'high' ? 'A' : task.priority === 'medium' ? 'M' : 'B'}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Time Windows with Routine Blocks */}
      <section className="space-y-8">
        <h2 className="text-2xl font-semibold">Rutina del Día</h2>
        {timeWindows.map(window => (
          <div key={window.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <h3 className="text-xl font-semibold">{window.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {window.startTime} - {window.endTime}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {window.blocks.map(block => {
                const assignedTaskIds = blockTasks[block.id] || [];
                return (
                  <Card
                    key={block.id}
                    className={cn(
                      "transition-all hover:shadow-md",
                      block.isFocusBlock && "border-primary bg-primary/5"
                    )}
                  >
                    <CardHeader className="pb-3">
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-sm font-semibold leading-tight">
                            {block.title}
                          </CardTitle>
                          {block.isFocusBlock && (
                            <Badge variant="default" className="text-xs">Focus</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {block.startTime} - {block.endTime}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Default tasks */}
                      <div className="space-y-1">
                        {block.tasks.map((task, idx) => (
                          <div
                            key={idx}
                            className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded"
                          >
                            • {task}
                          </div>
                        ))}
                      </div>

                      {/* Assigned tasks from today */}
                      {assignedTaskIds.length > 0 && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground">
                            Tareas asignadas:
                          </p>
                          {assignedTaskIds.map(taskId => {
                            const task = getTaskById(taskId);
                            if (!task) return null;
                            return (
                              <div
                                key={taskId}
                                className="flex items-start gap-2 p-2 bg-primary/10 rounded text-xs"
                              >
                                <span className="flex-1 font-medium">{task.title}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTaskFromBlock(block.id, taskId)}
                                  className="h-5 w-5 p-0 hover:bg-destructive/20"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Add task button */}
                      <Dialog
                        open={selectedBlock === block.id}
                        onOpenChange={(open) => setSelectedBlock(open ? block.id : null)}
                      >
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            <Plus className="h-3 w-3 mr-1" />
                            Asignar Tarea
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>
                              Asignar tarea a: {block.title}
                            </DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 max-h-[500px] overflow-y-auto">
                            {tasksByArea.length === 0 ? (
                              <p className="text-center text-muted-foreground py-8">
                                No hay tareas disponibles para hoy
                              </p>
                            ) : (
                              tasksByArea.map(({ area, tasks }) => {
                                const Icon = area.icon;
                                return (
                                  <div key={area.id} className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm font-semibold sticky top-0 bg-background py-2">
                                      <Icon className="h-4 w-4" />
                                      {area.name}
                                    </div>
                                    <div className="space-y-1">
                                      {tasks.map(task => {
                                        const isAssigned = assignedTaskIds.includes(task.id);
                                        return (
                                          <button
                                            key={task.id}
                                            onClick={() => !isAssigned && handleAddTaskToBlock(task.id, block.id)}
                                            disabled={isAssigned}
                                            className={cn(
                                              "w-full text-left p-3 rounded-lg transition-colors",
                                              isAssigned 
                                                ? "bg-muted/50 cursor-not-allowed opacity-50" 
                                                : "hover:bg-muted cursor-pointer"
                                            )}
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="flex-1">
                                                <p className="font-medium text-sm">{task.title}</p>
                                                {task.description && (
                                                  <p className="text-xs text-muted-foreground mt-1">
                                                    {task.description}
                                                  </p>
                                                )}
                                              </div>
                                              <div className="flex gap-1">
                                                {task.priority && (
                                                  <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                                                    {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
                                                  </Badge>
                                                )}
                                                {isAssigned && (
                                                  <Badge variant="secondary" className="text-xs">
                                                    Asignada
                                                  </Badge>
                                                )}
                                              </div>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
