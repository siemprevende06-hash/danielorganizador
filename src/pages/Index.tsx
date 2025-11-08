import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { formatISO, isToday, parseISO } from "date-fns";
import { lifeAreas, centralAreas, focusedDayRoutine } from "@/lib/data";
import type { Task, RoutineTaskGroup } from "@/lib/definitions";
import { Plus, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TaskWithBlock extends Task {
  blockId?: string;
}

export default function Index() {
  const [tasks, setTasks] = useState<TaskWithBlock[]>([]);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineTaskGroup[]>(focusedDayRoutine);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

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

    // Load routine blocks with tasks
    const storedBlocks = localStorage.getItem("routineBlockTasks");
    if (storedBlocks) {
      try {
        const parsed = JSON.parse(storedBlocks);
        setRoutineBlocks(focusedDayRoutine.map(block => ({
          ...block,
          tasks: parsed[block.id] || block.tasks
        })));
      } catch (e) {
        console.error("Error loading routine blocks:", e);
      }
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      // Save routine blocks to localStorage
      const blockTasks: { [key: string]: string[] } = {};
      routineBlocks.forEach(block => {
        blockTasks[block.id] = block.tasks;
      });
      localStorage.setItem("routineBlockTasks", JSON.stringify(blockTasks));
    }
  }, [routineBlocks, isClient]);

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

    // Update in localStorage
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

    setRoutineBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, tasks: [...block.tasks, task.title] }
          : block
      )
    );
    setSelectedBlock(null);
  };

  const handleRemoveTaskFromBlock = (blockId: string, taskTitle: string) => {
    setRoutineBlocks(prev =>
      prev.map(block =>
        block.id === blockId
          ? { ...block, tasks: block.tasks.filter(t => t !== taskTitle) }
          : block
      )
    );
  };

  const getPriorityColor = (priority?: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-warning';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
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
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Tareas del Día</h2>
        {tasksByArea.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No tienes tareas programadas para hoy
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {tasksByArea.map(({ area, tasks }) => {
              const Icon = area.icon;
              return (
                <Card key={area.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-5 w-5" />
                      {area.name}
                      <Badge variant="secondary" className="ml-auto">
                        {tasks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {tasks.map(task => (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(task.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <p
                            className={cn(
                              "font-medium",
                              task.completed && "line-through text-muted-foreground",
                              !task.completed && getPriorityColor(task.priority)
                            )}
                          >
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-sm text-muted-foreground">
                              {task.description}
                            </p>
                          )}
                        </div>
                        {task.priority && (
                          <Badge
                            variant={
                              task.priority === 'high'
                                ? 'destructive'
                                : task.priority === 'medium'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {task.priority === 'high' ? 'Alta' : task.priority === 'medium' ? 'Media' : 'Baja'}
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

      {/* Routine Blocks */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold">Bloques de Rutina</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {routineBlocks.map(block => (
            <Card
              key={block.id}
              className={cn(block.isFocusBlock && "border-primary")}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <span>{block.title}</span>
                  {block.isFocusBlock && (
                    <Badge variant="default">Focus</Badge>
                  )}
                </CardTitle>
                {block.startTime && block.endTime && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {block.startTime} - {block.endTime}
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {block.tasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                    >
                      <span>{task}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTaskFromBlock(block.id, task)}
                        className="h-6 w-6 p-0"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                <Dialog
                  open={selectedBlock === block.id}
                  onOpenChange={(open) => setSelectedBlock(open ? block.id : null)}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Tarea
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        Agregar tarea a: {block.title}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {todayTasks.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No hay tareas disponibles para hoy
                        </p>
                      ) : (
                        todayTasks.map(task => (
                          <button
                            key={task.id}
                            onClick={() => handleAddTaskToBlock(task.id, block.id)}
                            className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <p className="font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-sm text-muted-foreground">
                                {task.description}
                              </p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
