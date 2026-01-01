import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Flame, Trophy, Clock, ImagePlus, X, ListPlus, BookOpen, Briefcase, FolderKanban, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import { BlockTaskAssigner, TaskItem } from "@/components/routine/BlockTaskAssigner";

export interface RoutineBlock {
  id: string;
  title: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  specificTask?: string;
  tasks?: string[];
  genericTasks?: string[];
  currentStreak: number;
  longestStreak?: number;
  maxStreak: number;
  weeklyCompletion: boolean[];
  coverImage?: string;
  isHalfTime?: boolean;
  effortLevel?: "minimum" | "normal" | "maximum";
  notDone?: boolean[];
  isAdjusted?: boolean;
  adjustmentFactor?: number;
}

interface RoutineBlockCardProps {
  block: RoutineBlock;
  onUpdate: (block: RoutineBlock) => void;
  onComplete: () => void;
  dailyTasks?: TaskItem[];
  onAssignTasks?: (blockId: string, taskIds: string[]) => void;
  onToggleTaskComplete?: (taskId: string) => void;
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

export const RoutineBlockCard = ({ block, onUpdate, onComplete, dailyTasks = [], onAssignTasks, onToggleTaskComplete }: RoutineBlockCardProps) => {
  const [specificTask, setSpecificTask] = useState(block.specificTask || "");
  const [completedGenericTasks, setCompletedGenericTasks] = useState<Set<number>>(new Set());
  const [timeProgress, setTimeProgress] = useState(0);
  const [coverImage, setCoverImage] = useState(block.coverImage || "");
  const [effortLevel, setEffortLevel] = useState<"minimum" | "normal" | "maximum">(block.effortLevel || "normal");
  const [showTaskAssigner, setShowTaskAssigner] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadImage, uploading } = useImageUpload();

  // Get tasks assigned to this block
  const assignedTasks = dailyTasks.filter(t => t.routine_block_id === block.id);

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
      
      const totalDuration = endMinutes - startMinutes;
      const activeDuration = block.isHalfTime ? totalDuration / 2 : totalDuration;
      const elapsed = currentMinutes - startMinutes;
      
      // If in half time mode and past the active duration, cap at 50%
      if (block.isHalfTime && elapsed > activeDuration) {
        return 50;
      }
      
      const progress = ((elapsed) / (totalDuration)) * 100;
      return Math.min(100, Math.max(0, progress));
    };

    setTimeProgress(calculateProgress());
    const interval = setInterval(() => {
      setTimeProgress(calculateProgress());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [block.startTime, block.endTime, block.isHalfTime]);

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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = await uploadImage(file, 'routine-blocks');
      if (imageUrl) {
        setCoverImage(imageUrl);
        onUpdate({ ...block, coverImage: imageUrl });
      }
    }
  };

  const setEffortLevelHandler = (level: "minimum" | "normal" | "maximum" | undefined) => {
    setEffortLevel(level || "normal");
    onUpdate({ ...block, effortLevel: level });
  };

  const removeCoverImage = () => {
    setCoverImage("");
    onUpdate({ ...block, coverImage: "" });
  };

  const isBlockComplete = () => {
    const hasSpecificTask = specificTask.trim() !== "";
    const allGenericComplete = !block.genericTasks || 
      block.genericTasks.length === 0 || 
      completedGenericTasks.size === block.genericTasks.length;
    return hasSpecificTask && allGenericComplete;
  };

  const getBorderColor = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const isNotDone = block.notDone?.[dayIndex] || false;
    
    if (isNotDone) return "border-red-500";
    
    switch (effortLevel) {
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

  const handleMarkNotDone = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    const newNotDone = [...(block.notDone || [false, false, false, false, false, false, false])];
    const isCurrentlyNotDone = newNotDone[dayIndex];
    
    // Toggle the not done status
    newNotDone[dayIndex] = !isCurrentlyNotDone;
    
    const newWeekly = [...block.weeklyCompletion];
    if (!isCurrentlyNotDone) {
      // Marking as not done, so remove completion
      newWeekly[dayIndex] = false;
    }
    
    onUpdate({ 
      ...block, 
      notDone: newNotDone,
      weeklyCompletion: newWeekly,
      effortLevel: !isCurrentlyNotDone ? undefined : block.effortLevel, // Reset effort level when marking as not done
    });
  };

  const isMarkedNotDone = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    return block.notDone?.[dayIndex] || false;
  };

  return (
    <Card className={cn("hover:shadow-lg transition-all overflow-hidden border-2", getBorderColor())}>
      {coverImage && (
        <div className="relative w-full h-32 overflow-hidden">
          <img 
            src={coverImage} 
            alt={`${block.title} cover`}
            className="w-full h-full object-cover"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={removeCoverImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
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
        {/* Effort Level Buttons */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Nivel de Esfuerzo</label>
          <div className="flex gap-2">
          <Button
            variant={effortLevel === "minimum" ? "default" : "outline"}
            size="sm"
            onClick={() => setEffortLevelHandler(effortLevel === "minimum" ? undefined : "minimum")}
            className={cn(
              "flex-1",
              effortLevel === "minimum" && "bg-blue-500 hover:bg-blue-600"
            )}
          >
            Mínimo
          </Button>
          <Button
            variant={effortLevel === "normal" ? "default" : "outline"}
            size="sm"
            onClick={() => setEffortLevelHandler(effortLevel === "normal" ? undefined : "normal")}
            className={cn(
              "flex-1",
              effortLevel === "normal" && "bg-green-500 hover:bg-green-600"
            )}
          >
            Normal
          </Button>
          <Button
            variant={effortLevel === "maximum" ? "default" : "outline"}
            size="sm"
            onClick={() => setEffortLevelHandler(effortLevel === "maximum" ? undefined : "maximum")}
            className={cn(
              "flex-1",
              effortLevel === "maximum" && "bg-yellow-500 hover:bg-yellow-600"
            )}
          >
            Máximo
          </Button>
          </div>
        </div>

        {/* Cover Image Upload */}
        {!coverImage && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <ImagePlus className="h-4 w-4 mr-2" />
              Agregar Portada
            </Button>
          </div>
        )}
        {/* Time Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progreso en tiempo real {block.isHalfTime && "(Modo reducido)"}</span>
            <span>{Math.round(timeProgress)}%</span>
          </div>
          {block.isHalfTime ? (
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
              {/* Active time - first 50% */}
              <div
                className="absolute h-full bg-primary transition-all"
                style={{ 
                  width: `${Math.min(timeProgress * 2, 50)}%`,
                  left: 0 
                }}
              />
              {/* Rest time - second 50% */}
              <div
                className="absolute h-full bg-blue-500/50 transition-all"
                style={{ 
                  width: '50%',
                  left: '50%' 
                }}
              />
            </div>
          ) : (
            <Progress value={timeProgress} className="h-2" />
          )}
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

        {/* Assigned Daily Tasks */}
        {dailyTasks.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Tareas Asignadas</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTaskAssigner(true)}
              >
                <ListPlus className="h-4 w-4 mr-1" />
                Asignar
              </Button>
            </div>
            {assignedTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground py-2">
                Sin tareas asignadas a este bloque
              </p>
            ) : (
              <div className="space-y-2">
                {assignedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer border border-border"
                    onClick={() => onToggleTaskComplete?.(task.id)}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => onToggleTaskComplete?.(task.id)}
                    />
                    <div className="flex-1 min-w-0">
                      <span className={cn(
                        "text-sm block truncate",
                        task.completed && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </span>
                      <Badge variant="outline" className="text-xs mt-1">
                        {getSourceIcon(task.source)}
                        <span className="ml-1">{task.sourceName || task.source}</span>
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {/* Task Assigner Dialog */}
        <BlockTaskAssigner
          open={showTaskAssigner}
          onOpenChange={setShowTaskAssigner}
          blockId={block.id}
          blockTitle={block.title}
          dailyTasks={dailyTasks}
          onAssignTasks={(taskIds) => onAssignTasks?.(block.id, taskIds)}
        />

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

        {/* Mark as Not Done Button */}
        <Button
          onClick={handleMarkNotDone}
          className="w-full"
          variant={isMarkedNotDone() ? "outline" : "destructive"}
        >
          <X className="h-4 w-4 mr-2" />
          {isMarkedNotDone() ? "Desmarcar: No lo hice" : "No lo hice"}
        </Button>

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
