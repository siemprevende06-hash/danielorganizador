import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { isToday } from "date-fns";
import { lifeAreas, centralAreas } from "@/lib/data";
import type { Task } from "@/lib/definitions";
import { Plus, Clock, X, ImagePlus, Briefcase, GraduationCap, Code } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { useImageUpload } from "@/hooks/useImageUpload";

interface TaskWithBlock extends Task {
  blockId?: string;
}

interface RoutineBlock {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  specificTask?: string;
  genericTasks?: string[];
  currentStreak: number;
  maxStreak: number;
  weeklyCompletion: boolean[];
  coverImage?: string;
  isHalfTime?: boolean;
  effortLevel?: "minimum" | "normal" | "maximum";
  notDone?: boolean[];
}

interface TimeWindow {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  blocks: RoutineBlock[];
}

export default function Index() {
  const [tasks, setTasks] = useState<TaskWithBlock[]>([]);
  const [routineBlocks, setRoutineBlocks] = useState<RoutineBlock[]>([]);
  const [blockTasks, setBlockTasks] = useState<{ [blockId: string]: string[] }>({});
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    setIsClient(true);
    
    // Load routine blocks from localStorage (same as DailyRoutine page)
    const storedBlocks = localStorage.getItem('dailyRoutineBlocks');
    if (storedBlocks) {
      setRoutineBlocks(JSON.parse(storedBlocks));
    } else {
      const initialBlocks: RoutineBlock[] = [
        { id: "1", title: "Rutina Activación", startTime: "05:00", endTime: "05:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "2", title: "Idiomas", startTime: "05:30", endTime: "06:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "3", title: "Gym", startTime: "06:00", endTime: "07:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "4", title: "Alistamiento y Desayuno", startTime: "07:00", endTime: "07:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "5", title: "Focus Emprendimiento", startTime: "07:30", endTime: "08:25", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "6", title: "Lectura", startTime: "08:25", endTime: "08:40", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "7", title: "Viaje a CUJAE (Podcast)", startTime: "08:40", endTime: "09:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "8", title: "1er Deep Work", startTime: "09:00", endTime: "10:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "9", title: "2do Deep Work", startTime: "10:30", endTime: "11:50", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "10", title: "3er Deep Work", startTime: "12:00", endTime: "13:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "11", title: "Almuerzo (Game y Ajedrez)", startTime: "13:20", endTime: "14:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "12", title: "4to Deep Work", startTime: "14:00", endTime: "15:20", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "13", title: "5to Deep Work", startTime: "15:30", endTime: "16:50", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "14", title: "Viaje a Casa (Podcast)", startTime: "16:50", endTime: "17:05", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "15", title: "Rutina de Llegada", startTime: "17:05", endTime: "17:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "16", title: "Focus Universidad", startTime: "17:30", endTime: "19:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "17", title: "Comida y Serie", startTime: "19:00", endTime: "19:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "18", title: "PS4", startTime: "19:30", endTime: "20:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "19", title: "Guitarra o Piano", startTime: "20:00", endTime: "20:30", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "20", title: "Bloque de Emergencia", startTime: "20:30", endTime: "21:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "21", title: "Emergencia Deep Work", startTime: "21:00", endTime: "23:00", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
        { id: "22", title: "Sueño", startTime: "23:00", endTime: "04:55", currentStreak: 0, maxStreak: 0, weeklyCompletion: [false, false, false, false, false, false, false], notDone: [false, false, false, false, false, false, false] },
      ];
      setRoutineBlocks(initialBlocks);
    }

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

    // Load university tasks from subjects
    const universitySubjects = localStorage.getItem('universitySubjects');
    if (universitySubjects) {
      try {
        const subjects = JSON.parse(universitySubjects);
        const mappedTasks = subjects.flatMap((subject: any) => {
          if (Array.isArray(subject.tasks)) {
            return subject.tasks.map((task: any) => ({
              id: task.id,
              title: `${subject.name}: ${task.title}`,
              description: task.description,
              completed: task.completed,
              status: (task.completed ? 'completada' : 'pendiente') as 'completada' | 'pendiente',
              areaId: 'universidad',
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            }));
          }
          return [];
        });
        setTasks(prev => [...prev, ...mappedTasks]);
      } catch (e) {
        console.error("Error loading university tasks:", e);
      }
    }

    // Load study sessions
    const studySessions = localStorage.getItem('studySessions');
    if (studySessions) {
      try {
        const sessions = JSON.parse(studySessions);
        const sessionTasks = sessions.map((session: any) => ({
          id: session.id,
          title: `Estudio: ${session.topic}`,
          description: `Duración: ${session.duration}`,
          completed: session.completed,
          status: session.completed ? 'completada' : 'pendiente',
          areaId: 'universidad',
          dueDate: session.dueDate ? new Date(session.dueDate) : (session.date ? new Date(session.date) : undefined),
        }));
        setTasks(prev => [...prev, ...sessionTasks]);
      } catch (e) {
        console.error("Error loading study sessions:", e);
      }
    }

    // Load entrepreneurship tasks
    const entrepreneurshipTasks = localStorage.getItem('entrepreneurshipTasks');
    if (entrepreneurshipTasks) {
      try {
        const tasksData = JSON.parse(entrepreneurshipTasks);
        const mappedTasks = Object.entries(tasksData).flatMap(([project, tasks]: [string, any]) => {
          if (Array.isArray(tasks)) {
            return tasks.map((task: any) => ({
              id: task.id,
              title: `${project}: ${task.title}`,
              description: task.description,
              completed: task.completed,
              status: (task.completed ? 'completada' : 'pendiente') as 'completada' | 'pendiente',
              areaId: 'emprendimiento',
              dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
            }));
          }
          return [];
        });
        setTasks(prev => [...prev, ...mappedTasks]);
      } catch (e) {
        console.error("Error loading entrepreneurship tasks:", e);
      }
    }

    // Load project tasks
    const projectsData = localStorage.getItem('webProjects');
    if (projectsData) {
      try {
        const projects = JSON.parse(projectsData);
        const projectTasks = projects.flatMap((project: any) =>
          (project.tasks || []).map((task: any) => ({
            id: task.id,
            title: `${project.name}: ${task.title}`,
            completed: task.completed,
            status: task.completed ? 'completada' : 'pendiente',
            areaId: 'web',
            dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          }))
        );
        setTasks(prev => [...prev, ...projectTasks]);
      } catch (e) {
        console.error("Error loading project tasks:", e);
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

  // Define time windows with their blocks based on time ranges
  const timeWindows: TimeWindow[] = [
    {
      id: "morning",
      title: "Activación Matinal",
      startTime: "5:00 AM",
      endTime: "9:00 AM",
      blocks: routineBlocks.filter(block => {
        const hour = parseInt(block.startTime.split(':')[0]);
        return hour >= 5 && hour < 9;
      }),
    },
    {
      id: "deep-work-morning",
      title: "Trabajo Profundo - Mañana",
      startTime: "9:00 AM",
      endTime: "1:20 PM",
      blocks: routineBlocks.filter(block => {
        const hour = parseInt(block.startTime.split(':')[0]);
        return hour >= 9 && hour < 14;
      }),
    },
    {
      id: "afternoon",
      title: "Tarde",
      startTime: "2:00 PM",
      endTime: "7:00 PM",
      blocks: routineBlocks.filter(block => {
        const hour = parseInt(block.startTime.split(':')[0]);
        return hour >= 14 && hour < 19;
      }),
    },
    {
      id: "evening",
      title: "Rutina Vespertina",
      startTime: "7:00 PM",
      endTime: "9:00 PM",
      blocks: routineBlocks.filter(block => {
        const hour = parseInt(block.startTime.split(':')[0]);
        return hour >= 19 && hour < 21;
      }),
    },
    {
      id: "night",
      title: "Emergencia Deep Work",
      startTime: "9:00 PM",
      endTime: "11:00 PM",
      blocks: routineBlocks.filter(block => {
        const hour = parseInt(block.startTime.split(':')[0]);
        return hour >= 21 && hour < 23;
      }),
    },
  ];


  useEffect(() => {
    if (isClient) {
      localStorage.setItem("routineBlockTasks", JSON.stringify(blockTasks));
    }
  }, [blockTasks, isClient]);

  if (!isClient) {
    return null;
  }

  // Filter today's tasks (only tasks with today's date)
  const todayTasks = tasks.filter(task => {
    if (!task.dueDate) return false; // Exclude tasks without a date
    return isToday(task.dueDate); // Only include tasks due today
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

  const handleUpdateBlock = (blockId: string, updates: Partial<RoutineBlock>) => {
    setRoutineBlocks(prev => {
      const updatedBlocks = prev.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      );
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(updatedBlocks));
      return updatedBlocks;
    });
  };

  const handleMarkNotDone = (blockId: string) => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    setRoutineBlocks(prev => {
      const updatedBlocks = prev.map(block => {
        if (block.id === blockId) {
          const newNotDone = [...(block.notDone || [false, false, false, false, false, false, false])];
          const isCurrentlyNotDone = newNotDone[dayIndex];
          
          // Toggle the not done status
          newNotDone[dayIndex] = !isCurrentlyNotDone;
          
          const newWeekly = [...block.weeklyCompletion];
          if (!isCurrentlyNotDone) {
            // Marking as not done, so remove completion
            newWeekly[dayIndex] = false;
          }
          
          return {
            ...block,
            notDone: newNotDone,
            weeklyCompletion: newWeekly,
            effortLevel: !isCurrentlyNotDone ? undefined : block.effortLevel, // Reset effort level when marking as not done
          };
        }
        return block;
      });
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(updatedBlocks));
      return updatedBlocks;
    });
  };

  const handleImageUpload = async (blockId: string, file: File) => {
    const imageUrl = await uploadImage(file, 'routine-blocks');
    if (imageUrl) {
      handleUpdateBlock(blockId, { coverImage: imageUrl });
    }
  };

  // Convert 24h time to 12h AM/PM format
  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  const getBlockStatus = (block: RoutineBlock) => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const isNotDone = block.notDone?.[dayIndex] || false;
    const isCompleted = block.weeklyCompletion[dayIndex] || false;
    
    if (isNotDone) return "not-done";
    if (isCompleted) return "completed";
    return "neutral";
  };

  const getBorderColor = (block: RoutineBlock) => {
    const status = getBlockStatus(block);
    
    if (status === "not-done") return "border-red-500";
    
    // If not marked as not done, use effort level
    switch (block.effortLevel) {
      case "minimum":
        return "border-blue-500";
      case "normal":
        return "border-green-500";
      case "maximum":
        return "border-yellow-500";
      default:
        return "border-border"; // Default white/neutral border
    }
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
                const blockStatus = getBlockStatus(block);
                return (
                  <Card
                    key={block.id}
                    className={cn(
                      "transition-all hover:shadow-md border-2 overflow-hidden",
                      getBorderColor(block),
                      blockStatus === "not-done" && "bg-red-500/5"
                    )}
                  >
                    {block.coverImage && (
                      <div className="relative w-full h-24 overflow-hidden">
                        <img 
                          src={block.coverImage} 
                          alt={`${block.title} cover`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-5 w-5"
                          onClick={() => handleUpdateBlock(block.id, { coverImage: "" })}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <CardHeader className="pb-3">
                      <div className="space-y-1">
                        <CardTitle className="text-sm font-semibold leading-tight">
                          {block.title}
                        </CardTitle>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {convertTo12Hour(block.startTime)} - {convertTo12Hour(block.endTime)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* Effort Level Buttons */}
                      <div className="flex gap-1">
                        <Button
                          variant={block.effortLevel === "minimum" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateBlock(block.id, { 
                            effortLevel: block.effortLevel === "minimum" ? undefined : "minimum" 
                          })}
                          className={cn(
                            "flex-1 h-7 text-xs",
                            block.effortLevel === "minimum" && "bg-blue-500 hover:bg-blue-600"
                          )}
                        >
                          Mín
                        </Button>
                        <Button
                          variant={block.effortLevel === "normal" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateBlock(block.id, { 
                            effortLevel: block.effortLevel === "normal" ? undefined : "normal" 
                          })}
                          className={cn(
                            "flex-1 h-7 text-xs",
                            block.effortLevel === "normal" && "bg-green-500 hover:bg-green-600"
                          )}
                        >
                          Norm
                        </Button>
                        <Button
                          variant={block.effortLevel === "maximum" ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleUpdateBlock(block.id, { 
                            effortLevel: block.effortLevel === "maximum" ? undefined : "maximum" 
                          })}
                          className={cn(
                            "flex-1 h-7 text-xs",
                            block.effortLevel === "maximum" && "bg-yellow-500 hover:bg-yellow-600"
                          )}
                        >
                          Máx
                        </Button>
                      </div>

                      {/* Cover Image Upload */}
                      {!block.coverImage && (
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleImageUpload(block.id, file);
                            }}
                            className="hidden"
                            id={`upload-${block.id}`}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById(`upload-${block.id}`)?.click()}
                            className="w-full h-7 text-xs"
                          >
                            <ImagePlus className="h-3 w-3 mr-1" />
                            Portada
                          </Button>
                        </div>
                      )}

                      {/* Block default info */}
                      {block.specificTask && (
                        <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded">
                          • {block.specificTask}
                        </div>
                      )}
                      {block.genericTasks && block.genericTasks.length > 0 && (
                        <div className="space-y-1">
                          {block.genericTasks.map((task, idx) => (
                            <div
                              key={idx}
                              className="text-xs text-muted-foreground px-2 py-1 bg-muted/30 rounded"
                            >
                              • {task}
                            </div>
                          ))}
                        </div>
                      )}

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

                      {/* Mark as Not Done button */}
                      <Button 
                        variant={blockStatus === "not-done" ? "outline" : "destructive"}
                        size="sm" 
                        className="w-full h-8 text-xs"
                        onClick={() => handleMarkNotDone(block.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        {blockStatus === "not-done" ? "Desmarcar: No lo hice" : "No lo hice"}
                      </Button>

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

      <Separator className="my-8" />

      {/* Panel de Vida */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Panel de Vida</h2>
        
        {/* Hábitos */}
        <Card>
          <CardHeader>
            <CardTitle>Hábitos del Día</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const habitBlocks = [
                { id: "1", name: "Rutina de Activación", blockTitle: "Rutina Activación" },
                { id: "4", name: "Alistamiento y Desayuno", blockTitle: "Alistamiento y Desayuno" },
                { id: "15", name: "Rutina de Llegada", blockTitle: "Rutina de Llegada" },
                { id: "20", name: "Rutina de Desactivación", blockTitle: "Bloque de Emergencia" },
              ];

              return habitBlocks.map(habit => {
                const block = routineBlocks.find(b => b.id === habit.id);
                const today = new Date().getDay();
                const dayIndex = today === 0 ? 6 : today - 1;
                const isCompleted = block?.weeklyCompletion[dayIndex] || false;

                return (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 transition-colors",
                      isCompleted 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-red-500 bg-red-500/10"
                    )}
                  >
                    <span className="font-medium">{habit.name}</span>
                    <Badge 
                      variant="default" 
                      className={isCompleted ? "bg-green-500" : "bg-red-500"}
                    >
                      {isCompleted ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>
                );
              });
            })()}
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8" />

      {/* Panel de Control */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Panel de Control</h2>
        
        <Card>
          <CardHeader>
            <CardTitle>Profesional Académico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              // Emprendimiento
              const entrepreneurshipBlocks = routineBlocks.filter(b => 
                b.title.toLowerCase().includes("emprendimiento") ||
                b.title.toLowerCase().includes("focus emprendimiento")
              );

              const hasEntrepreneurshipBlocks = entrepreneurshipBlocks.some(block => {
                const today = new Date().getDay();
                const dayIndex = today === 0 ? 6 : today - 1;
                return block.weeklyCompletion[dayIndex];
              });

              const hasAssignedEntrepreneurshipTasks = Object.values(blockTasks).some(taskIds => 
                taskIds.some(taskId => {
                  const task = getTaskById(taskId);
                  return task?.areaId === "proyectos-personales" && task.completed;
                })
              );

              const isEntrepreneurshipCompleted = hasEntrepreneurshipBlocks || hasAssignedEntrepreneurshipTasks;

              // Universidad
              const universityBlocks = routineBlocks.filter(b => 
                b.title.toLowerCase().includes("universidad") ||
                b.title.toLowerCase().includes("focus universidad")
              );

              const hasUniversityBlocks = universityBlocks.some(block => {
                const today = new Date().getDay();
                const dayIndex = today === 0 ? 6 : today - 1;
                return block.weeklyCompletion[dayIndex];
              });

              const hasAssignedUniversityTasks = Object.values(blockTasks).some(taskIds => 
                taskIds.some(taskId => {
                  const task = getTaskById(taskId);
                  return task?.areaId === "universidad" && task.completed;
                })
              );

              const isUniversityCompleted = hasUniversityBlocks || hasAssignedUniversityTasks;

              // Proyectos (Web/Code)
              const projectBlocks = routineBlocks.filter(b => 
                b.title.toLowerCase().includes("proyecto") ||
                b.title.toLowerCase().includes("deep work")
              );

              const hasProjectBlocks = projectBlocks.some(block => {
                const today = new Date().getDay();
                const dayIndex = today === 0 ? 6 : today - 1;
                return block.weeklyCompletion[dayIndex];
              });

              const hasAssignedProjectTasks = Object.values(blockTasks).some(taskIds => 
                taskIds.some(taskId => {
                  const task = getTaskById(taskId);
                  return task?.areaId === "proyectos-personales" && task.completed;
                })
              );

              const isProjectCompleted = hasProjectBlocks || hasAssignedProjectTasks;

              return (
                <>
                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 transition-colors",
                      isEntrepreneurshipCompleted 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-red-500 bg-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5" />
                      <span className="font-medium">Emprendimiento</span>
                    </div>
                    <Badge 
                      variant="default" 
                      className={isEntrepreneurshipCompleted ? "bg-green-500" : "bg-red-500"}
                    >
                      {isEntrepreneurshipCompleted ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 transition-colors",
                      isUniversityCompleted 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-red-500 bg-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      <span className="font-medium">Universidad</span>
                    </div>
                    <Badge 
                      variant="default" 
                      className={isUniversityCompleted ? "bg-green-500" : "bg-red-500"}
                    >
                      {isUniversityCompleted ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>

                  <div
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border-2 transition-colors",
                      isProjectCompleted 
                        ? "border-green-500 bg-green-500/10" 
                        : "border-red-500 bg-red-500/10"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      <span className="font-medium">Proyectos Web</span>
                    </div>
                    <Badge 
                      variant="default" 
                      className={isProjectCompleted ? "bg-green-500" : "bg-red-500"}
                    >
                      {isProjectCompleted ? "Completado" : "Pendiente"}
                    </Badge>
                  </div>
                </>
              );
            })()}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
