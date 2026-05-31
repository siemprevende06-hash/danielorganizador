import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trash2, CheckCircle2, Briefcase, GraduationCap, FolderKanban, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { DailyTaskSelector } from "./DailyTaskSelector";

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

interface DailyPlanChecklistProps {
  tasks: TaskItem[];
  completedTaskIds: Set<string>;
  onTasksChange: (tasks: TaskItem[]) => void;
  onToggleComplete: (taskId: string) => void;
  onRemoveTask: (taskId: string) => void;
  planDate: "today" | "tomorrow";
  onPlanDateChange: (date: "today" | "tomorrow") => void;
}

const getSourceIcon = (source: TaskItem["source"]) => {
  switch (source) {
    case "entrepreneurship":
      return <Briefcase className="h-3 w-3" />;
    case "university":
      return <GraduationCap className="h-3 w-3" />;
    case "project":
      return <FolderKanban className="h-3 w-3" />;
    default:
      return <ListTodo className="h-3 w-3" />;
  }
};

const getSourceLabel = (source: TaskItem["source"]) => {
  switch (source) {
    case "entrepreneurship":
      return "Emprendimiento";
    case "university":
      return "Universidad";
    case "project":
      return "Proyecto";
    default:
      return "General";
  }
};

export const DailyPlanChecklist = ({
  tasks,
  completedTaskIds,
  onTasksChange,
  onToggleComplete,
  onRemoveTask,
  planDate,
  onPlanDateChange,
}: DailyPlanChecklistProps) => {
  const completedCount = completedTaskIds.size;
  const totalCount = tasks.length;
  const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Plan del Día
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={planDate === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => onPlanDateChange("today")}
            >
              Hoy
            </Button>
            <Button
              variant={planDate === "tomorrow" ? "default" : "outline"}
              size="sm"
              onClick={() => onPlanDateChange("tomorrow")}
            >
              Mañana
            </Button>
          </div>
        </div>
        
        {totalCount > 0 && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{completedCount}/{totalCount}</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Task List */}
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-4">No hay tareas planificadas para {planDate === "today" ? "hoy" : "mañana"}</p>
            <DailyTaskSelector
              selectedTasks={tasks}
              onTasksChange={onTasksChange}
            />
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-all",
                    completedTaskIds.has(task.id) 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <Checkbox
                    checked={completedTaskIds.has(task.id)}
                    onCheckedChange={() => onToggleComplete(task.id)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium text-sm",
                      completedTaskIds.has(task.id) && "line-through text-muted-foreground"
                    )}>
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs gap-1">
                        {getSourceIcon(task.source)}
                        {task.sourceName || getSourceLabel(task.source)}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onRemoveTask(task.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="pt-2">
              <DailyTaskSelector
                selectedTasks={tasks}
                onTasksChange={onTasksChange}
              />
            </div>
          </>
        )}

        {/* Completion Message */}
        {totalCount > 0 && progressPercentage === 100 && (
          <div className="text-center py-4 bg-green-500/10 rounded-lg border border-green-500/30">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-green-600 dark:text-green-400">
              ¡Todas las tareas completadas!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
