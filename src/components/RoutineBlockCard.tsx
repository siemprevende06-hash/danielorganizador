import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Flame, Trophy, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

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
}

interface RoutineBlockCardProps {
  block: RoutineBlock;
  onUpdate: (block: RoutineBlock) => void;
  onComplete: () => void;
}

export const RoutineBlockCard = ({ block, onUpdate, onComplete }: RoutineBlockCardProps) => {
  const [specificTask, setSpecificTask] = useState(block.specificTask || "");
  const [completedGenericTasks, setCompletedGenericTasks] = useState<Set<number>>(new Set());
  const [timeProgress, setTimeProgress] = useState(0);

  useEffect(() => {
    const calculateProgress = () => {
      const now = new Date();
      const [startHour, startMin] = block.startTime.split(':').map(Number);
      const [endHour, endMin] = block.endTime.split(':').map(Number);
      
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      if (currentMinutes < startMinutes) return 0;
      if (currentMinutes > endMinutes) return 100;
      
      const progress = ((currentMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
      return Math.min(100, Math.max(0, progress));
    };

    setTimeProgress(calculateProgress());
    const interval = setInterval(() => {
      setTimeProgress(calculateProgress());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [block.startTime, block.endTime]);

  const toggleGenericTask = (index: number) => {
    const newCompleted = new Set(completedGenericTasks);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
    }
    setCompletedGenericTasks(newCompleted);
  };

  const handleSpecificTaskChange = (value: string) => {
    setSpecificTask(value);
    onUpdate({ ...block, specificTask: value });
  };

  const isBlockComplete = () => {
    const hasSpecificTask = specificTask.trim() !== "";
    const allGenericComplete = !block.genericTasks || 
      block.genericTasks.length === 0 || 
      completedGenericTasks.size === block.genericTasks.length;
    return hasSpecificTask && allGenericComplete;
  };

  return (
    <Card className="hover:shadow-lg transition-all">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{block.title}</CardTitle>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{block.startTime} - {block.endTime}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Flame className="h-4 w-4 text-orange-500" />
              {block.currentStreak}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              {block.maxStreak}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Time Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progreso en tiempo real</span>
            <span>{Math.round(timeProgress)}%</span>
          </div>
          <Progress value={timeProgress} className="h-2" />
        </div>

        {/* Specific Task Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tarea Específica del Bloque</label>
          <Input
            value={specificTask}
            onChange={(e) => handleSpecificTaskChange(e.target.value)}
            placeholder="¿Cuál es tu prioridad en este bloque?"
            className="w-full"
          />
        </div>

        {/* Generic Tasks Checklist */}
        {block.genericTasks && block.genericTasks.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Tareas del Bloque</label>
            <div className="space-y-2">
              {block.genericTasks.map((task, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleGenericTask(index)}
                >
                  <Checkbox
                    checked={completedGenericTasks.has(index)}
                    onCheckedChange={() => toggleGenericTask(index)}
                  />
                  <span className={cn(
                    "text-sm",
                    completedGenericTasks.has(index) && "line-through text-muted-foreground"
                  )}>
                    {task}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Weekly View */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Esta Semana</label>
          <div className="flex gap-2">
            {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((day, index) => (
              <div
                key={day}
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium border-2",
                  block.weeklyCompletion[index]
                    ? "bg-green-500 border-green-600 text-white"
                    : "bg-red-500 border-red-600 text-white"
                )}
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Complete Button */}
        <Button
          onClick={onComplete}
          disabled={!isBlockComplete()}
          className="w-full"
          variant={isBlockComplete() ? "default" : "outline"}
        >
          <CheckCircle2 className="h-4 w-4 mr-2" />
          Marcar Bloque Completo
        </Button>
      </CardContent>
    </Card>
  );
};
