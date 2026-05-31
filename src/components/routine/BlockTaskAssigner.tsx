import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BookOpen, Briefcase, FolderKanban, ListTodo } from "lucide-react";

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  source: "tasks" | "entrepreneurship" | "project" | "university";
  sourceId?: string;
  sourceName?: string;
  dueDate?: string;
  completed?: boolean;
  routine_block_id?: string;
}

interface BlockTaskAssignerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  blockId: string;
  blockTitle: string;
  dailyTasks: TaskItem[];
  onAssignTasks: (taskIds: string[]) => void;
}

const getSourceIcon = (source: string) => {
  switch (source) {
    case "university":
      return <BookOpen className="h-3 w-3" />;
    case "entrepreneurship":
      return <Briefcase className="h-3 w-3" />;
    case "project":
      return <FolderKanban className="h-3 w-3" />;
    default:
      return <ListTodo className="h-3 w-3" />;
  }
};

const getSourceColor = (source: string) => {
  switch (source) {
    case "university":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "entrepreneurship":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "project":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
    default:
      return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  }
};

export const BlockTaskAssigner = ({
  open,
  onOpenChange,
  blockId,
  blockTitle,
  dailyTasks,
  onAssignTasks,
}: BlockTaskAssignerProps) => {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(() => {
    const assigned = dailyTasks
      .filter((t) => t.routine_block_id === blockId)
      .map((t) => t.id);
    return new Set(assigned);
  });

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSave = () => {
    onAssignTasks(Array.from(selectedTaskIds));
    onOpenChange(false);
  };

  // Filter tasks that are either unassigned or assigned to this block
  const availableTasks = dailyTasks.filter(
    (t) => !t.routine_block_id || t.routine_block_id === blockId
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Asignar Tareas a: {blockTitle}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-4">
          {availableTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No hay tareas disponibles. Agrega tareas al Plan del Día primero.
            </p>
          ) : (
            availableTasks.map((task) => (
              <div
                key={task.id}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedTaskIds.has(task.id)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50 border-border"
                )}
                onClick={() => toggleTask(task.id)}
              >
                <Checkbox
                  checked={selectedTaskIds.has(task.id)}
                  onCheckedChange={() => toggleTask(task.id)}
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
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getSourceColor(task.source))}
                    >
                      {getSourceIcon(task.source)}
                      <span className="ml-1">
                        {task.sourceName ||
                          (task.source === "tasks" ? "General" : task.source)}
                      </span>
                    </Badge>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>
            Guardar ({selectedTaskIds.size} tareas)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
