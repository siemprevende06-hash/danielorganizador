import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Briefcase, GraduationCap, FolderKanban, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TaskItem {
  id: string;
  title: string;
  description?: string;
  source: "tasks" | "entrepreneurship" | "project" | "university";
  sourceId?: string;
  sourceName?: string;
  dueDate?: string;
  completed?: boolean;
}

interface DailyTaskSelectorProps {
  selectedTasks: TaskItem[];
  onTasksChange: (tasks: TaskItem[]) => void;
  routineBlockId?: string;
}

export const DailyTaskSelector = ({ selectedTasks, onTasksChange, routineBlockId }: DailyTaskSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [generalTasks, setGeneralTasks] = useState<TaskItem[]>([]);
  const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState<TaskItem[]>([]);
  const [projectTasks, setProjectTasks] = useState<TaskItem[]>([]);
  const [universityTasks, setUniversityTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadAllTasks();
    }
  }, [open]);

  const loadAllTasks = async () => {
    setLoading(true);
    try {
      // Load general tasks
      const { data: tasksData } = await supabase
        .from("tasks")
        .select("*")
        .or("source.eq.general,source.eq.university,source.eq.study_session,source.eq.project")
        .eq("completed", false)
        .order("created_at", { ascending: false });

      if (tasksData) {
        const mapped = tasksData.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          source: (t.source === "university" || t.source === "study_session" ? "university" : 
                  t.source === "project" ? "project" : "tasks") as TaskItem["source"],
          dueDate: t.due_date || undefined,
          completed: t.completed || false,
        }));
        
        setGeneralTasks(mapped.filter(t => t.source === "tasks"));
        setUniversityTasks(mapped.filter(t => t.source === "university"));
        setProjectTasks(mapped.filter(t => t.source === "project"));
      }

      // Load entrepreneurship tasks
      const { data: entTasks } = await supabase
        .from("entrepreneurship_tasks")
        .select("*, entrepreneurships(name)")
        .eq("completed", false)
        .order("created_at", { ascending: false });

      if (entTasks) {
        setEntrepreneurshipTasks(entTasks.map(t => ({
          id: t.id,
          title: t.title,
          description: t.description || undefined,
          source: "entrepreneurship" as const,
          sourceId: t.entrepreneurship_id,
          sourceName: t.entrepreneurships?.name,
          dueDate: t.due_date || undefined,
          completed: t.completed,
        })));
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const isTaskSelected = (taskId: string) => {
    return selectedTasks.some(t => t.id === taskId);
  };

  const toggleTask = (task: TaskItem) => {
    if (isTaskSelected(task.id)) {
      onTasksChange(selectedTasks.filter(t => t.id !== task.id));
    } else {
      onTasksChange([...selectedTasks, task]);
    }
  };

  const renderTaskList = (tasks: TaskItem[], emptyMessage: string) => {
    if (loading) {
      return <p className="text-sm text-muted-foreground py-4 text-center">Cargando...</p>;
    }
    
    if (tasks.length === 0) {
      return <p className="text-sm text-muted-foreground py-4 text-center">{emptyMessage}</p>;
    }

    return (
      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
            onClick={() => toggleTask(task)}
          >
            <Checkbox
              checked={isTaskSelected(task.id)}
              onCheckedChange={() => toggleTask(task)}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{task.title}</p>
              {task.description && (
                <p className="text-xs text-muted-foreground truncate">{task.description}</p>
              )}
              {task.sourceName && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {task.sourceName}
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Agregar Tareas
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Seleccionar Tareas para el Día</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="gap-1 text-xs">
              <ListTodo className="h-3 w-3" />
              General
            </TabsTrigger>
            <TabsTrigger value="entrepreneurship" className="gap-1 text-xs">
              <Briefcase className="h-3 w-3" />
              Emprendimiento
            </TabsTrigger>
            <TabsTrigger value="university" className="gap-1 text-xs">
              <GraduationCap className="h-3 w-3" />
              Universidad
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-1 text-xs">
              <FolderKanban className="h-3 w-3" />
              Proyectos
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="general" className="mt-0">
              {renderTaskList(generalTasks, "No hay tareas generales pendientes")}
            </TabsContent>
            <TabsContent value="entrepreneurship" className="mt-0">
              {renderTaskList(entrepreneurshipTasks, "No hay tareas de emprendimiento pendientes")}
            </TabsContent>
            <TabsContent value="university" className="mt-0">
              {renderTaskList(universityTasks, "No hay tareas de universidad pendientes")}
            </TabsContent>
            <TabsContent value="projects" className="mt-0">
              {renderTaskList(projectTasks, "No hay tareas de proyectos pendientes")}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {selectedTasks.length} tarea(s) seleccionada(s)
          </p>
          <Button onClick={() => setOpen(false)}>Listo</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
