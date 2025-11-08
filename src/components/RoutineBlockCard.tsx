import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Flame, Trophy, Clock, ImagePlus, X } from "lucide-react";
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
  coverImage?: string;
  isHalfTime?: boolean;
  effortLevel?: "minimum" | "normal" | "maximum";
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
  const [coverImage, setCoverImage] = useState(block.coverImage || "");
  const [effortLevel, setEffortLevel] = useState<"minimum" | "normal" | "maximum">(block.effortLevel || "normal");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Use createObjectURL instead of base64 to avoid localStorage size issues
      const imageUrl = URL.createObjectURL(file);
      setCoverImage(imageUrl);
      onUpdate({ ...block, coverImage: imageUrl });
    }
  };

  const setEffortLevelHandler = (level: "minimum" | "normal" | "maximum") => {
    setEffortLevel(level);
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
    switch (effortLevel) {
      case "minimum":
        return "border-blue-500";
      case "maximum":
        return "border-yellow-500";
      default:
        return "border-green-500";
    }
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
              onClick={() => setEffortLevelHandler("minimum")}
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
              onClick={() => setEffortLevelHandler("normal")}
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
              onClick={() => setEffortLevelHandler("maximum")}
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
