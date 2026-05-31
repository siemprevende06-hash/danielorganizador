import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { focusedDayRoutine } from "@/lib/data";

export default function CurrentRoutineBlock() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const currentHour = new Date().getHours();

  const getCurrentBlock = () => {
    return focusedDayRoutine.find((block) => {
      if (!block.startTime || !block.endTime) return false;
      const [startHour] = block.startTime.split(":").map(Number);
      const [endHour] = block.endTime.split(":").map(Number);
      return currentHour >= startHour && currentHour < endHour;
    });
  };

  const currentBlock = getCurrentBlock();

  const toggleTask = (blockId: string, taskIndex: number) => {
    const key = `${blockId}-${taskIndex}`;
    setCompletedTasks((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  if (!currentBlock) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No hay bloque de rutina activo en este momento</p>
      </div>
    );
  }

  const totalTasks = currentBlock.tasks.length;
  const completedCount = currentBlock.tasks.filter((_, idx) =>
    completedTasks.has(`${currentBlock.id}-${idx}`)
  ).length;
  const progress = (completedCount / totalTasks) * 100;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{currentBlock.title}</h3>
          <p className="text-sm text-muted-foreground">
            {currentBlock.startTime} - {currentBlock.endTime}
          </p>
        </div>
        <Badge variant={currentBlock.isFocusBlock ? "default" : "secondary"}>
          {currentBlock.isFocusBlock ? "Foco Profundo" : "Rutina"}
        </Badge>
      </div>

      <div className="space-y-2">
        {currentBlock.tasks.map((task, idx) => {
          const key = `${currentBlock.id}-${idx}`;
          const isCompleted = completedTasks.has(key);
          return (
            <div
              key={idx}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border transition-all",
                isCompleted && "bg-muted/50"
              )}
            >
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => toggleTask(currentBlock.id, idx)}
              />
              <span className={cn(isCompleted && "line-through text-muted-foreground")}>
                {task}
              </span>
              {isCompleted && <CheckCircle2 className="h-4 w-4 ml-auto text-success" />}
            </div>
          );
        })}
      </div>

      <div className="pt-4 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}
