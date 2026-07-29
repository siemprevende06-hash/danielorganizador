import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Droplets, Clock, Hash, ExternalLink, Camera, Dumbbell, Moon, Sun, Flame, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WeekStreakBar } from "./WeekStreakBar";
import { useSystemHabitStreak } from "@/hooks/useSystemHabitStreaks";

export interface SystemHabit {
  id: string;
  name: string;
  hasWater?: boolean;
  hasTime?: boolean;
  hasCount?: boolean;
  countLabel?: string;
  linkTo?: string;
  isWorkout?: boolean;
  isSleepSchedule?: boolean;
  hasMealPhoto?: boolean;
}

export interface SystemGroup {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  habits: SystemHabit[];
}

interface Props {
  group: SystemGroup;
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  countData: Record<string, number>;
  waterData: Record<string, boolean>;
  onToggle: (habitId: string) => void;
  onTimeChange: (habitId: string, minutes: number) => void;
  onCountChange: (habitId: string, count: number) => void;
  onWaterToggle: (habitId: string) => void;
  // Workout
  workoutDuration?: number;
  workoutIntensity?: string;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  // Sleep
  wakeTime?: string;
  sleepTime?: string;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  // Meal photos
  mealPhotos?: Record<string, string>;
  onMealPhotoUpload?: (mealId: string, url: string) => void;
  // 3-state
  skipped?: Record<string, boolean>;
  onSkipToggle?: (habitId: string) => void;
}

export function SystemHabitGroup({
  group, completions, timeData, countData, waterData,
  onToggle, onTimeChange, onCountChange, onWaterToggle,
  workoutDuration, workoutIntensity, onWorkoutDurationChange, onWorkoutIntensityChange,
  wakeTime, sleepTime, onWakeTimeChange, onSleepTimeChange,
  mealPhotos, onMealPhotoUpload,
  skipped, onSkipToggle,
}: Props) {
  const [expanded, setExpanded] = useState(true);
  const navigate = useNavigate();
  const Icon = group.icon;
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const completedCount = group.habits.filter(h => completions[h.id]).length;
  const progress = group.habits.length > 0 ? (completedCount / group.habits.length) * 100 : 0;

  const handlePhotoUpload = async (mealId: string, file: File) => {
    try {
      const ext = file.name.split(".").pop();
      const path = `meals/${Date.now()}_${mealId}.${ext}`;
      const { error } = await supabase.storage.from("user-images").upload(path, file);
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("user-images").getPublicUrl(path);
      onMealPhotoUpload?.(mealId, urlData.publicUrl);
      toast.success("Foto guardada");
    } catch {
      toast.error("Error al subir foto");
    }
  };

  const getWakeTimeStatus = (time: string) => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    const mins = h * 60 + m;
    const target = 6 * 60 + 30;
    if (mins === target) return { label: "✅ Perfecto", color: "text-green-500" };
    if (mins < target) return { label: "⚠️ Muy temprano", color: "text-amber-500" };
    return { label: "⚠️ Tarde", color: "text-red-500" };
  };

  const getSleepTimeStatus = (time: string) => {
    if (!time) return null;
    const [h, m] = time.split(":").map(Number);
    const mins = h * 60 + m;
    const target = 22 * 60 + 30;
    if (mins <= target && mins >= 22 * 60) return { label: "✅ Perfecto", color: "text-green-500" };
    if (mins < 22 * 60) return { label: "✅ Temprano", color: "text-green-500" };
    return { label: "⚠️ Tarde", color: "text-red-500" };
  };

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={cn("p-2.5 rounded-xl", group.color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="text-left">
            <h3 className="font-semibold">{group.name}</h3>
            <p className="text-xs text-muted-foreground">{completedCount}/{group.habits.length} completados</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="w-20 h-2" />
          <Badge variant={progress === 100 ? "default" : "secondary"} className="text-xs">
            {Math.round(progress)}%
          </Badge>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2">
          {group.habits.map(habit => (
              <HabitRow
                key={habit.id}
                habit={habit}
                completions={completions}
                onToggle={onToggle}
                timeData={timeData}
                countData={countData}
                waterData={waterData}
                onTimeChange={onTimeChange}
                onCountChange={onCountChange}
                onWaterToggle={onWaterToggle}
                navigate={navigate}
                mealPhotos={mealPhotos}
                onMealPhotoUpload={onMealPhotoUpload}
                handlePhotoUpload={handlePhotoUpload}
                fileInputRefs={fileInputRefs}
                workoutDuration={workoutDuration}
                workoutIntensity={workoutIntensity}
                onWorkoutDurationChange={onWorkoutDurationChange}
                onWorkoutIntensityChange={onWorkoutIntensityChange}
                wakeTime={wakeTime}
                sleepTime={sleepTime}
                onWakeTimeChange={onWakeTimeChange}
                onSleepTimeChange={onSleepTimeChange}
                getWakeTimeStatus={getWakeTimeStatus}
                getSleepTimeStatus={getSleepTimeStatus}
                skipped={skipped}
                onSkipToggle={onSkipToggle}
              />
          ))}
        </div>
      )}
    </Card>
  );
}

function HabitRow({
  habit, completions, onToggle, timeData, countData, waterData,
  onTimeChange, onCountChange, onWaterToggle, navigate,
  mealPhotos, onMealPhotoUpload, handlePhotoUpload, fileInputRefs,
  workoutDuration, workoutIntensity,
  onWorkoutDurationChange, onWorkoutIntensityChange,
  wakeTime, sleepTime, onWakeTimeChange, onSleepTimeChange,
  getWakeTimeStatus, getSleepTimeStatus,
  skipped, onSkipToggle,
}: {
  habit: SystemHabit;
  completions: Record<string, boolean>;
  onToggle: (id: string) => void;
  timeData: Record<string, number>;
  countData: Record<string, number>;
  waterData: Record<string, boolean>;
  onTimeChange: (id: string, v: number) => void;
  onCountChange: (id: string, v: number) => void;
  onWaterToggle: (id: string) => void;
  navigate: (path: string) => void;
  mealPhotos?: Record<string, string>;
  onMealPhotoUpload?: (id: string, url: string) => void;
  handlePhotoUpload: (id: string, file: File) => Promise<void>;
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>;
  workoutDuration?: number;
  workoutIntensity?: string;
  onWorkoutDurationChange?: (v: number) => void;
  onWorkoutIntensityChange?: (v: string) => void;
  wakeTime?: string;
  sleepTime?: string;
  onWakeTimeChange?: (v: string) => void;
  onSleepTimeChange?: (v: string) => void;
  getWakeTimeStatus: (time: string) => { label: string; color: string } | null;
  getSleepTimeStatus: (time: string) => { label: string; color: string } | null;
  skipped?: Record<string, boolean>;
  onSkipToggle?: (id: string) => void;
}) {
  const { streak } = useSystemHabitStreak(habit.id);
  const isSkipped = !!skipped?.[habit.id];
  const isDone = !!completions[habit.id];
  const noData = !isDone && !isSkipped;
  const checkState = isSkipped ? false : isDone ? true : "indeterminate";

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 p-3 rounded-lg border transition-all",
          isDone
            ? "bg-primary/5 border-primary/20"
            : isSkipped
            ? "bg-red-500/5 border-red-500/20"
            : "bg-background border-border hover:border-primary/30"
        )}
      >
        <div className="flex items-center gap-1">
          <Checkbox
            checked={checkState}
            onCheckedChange={() => onToggle(habit.id)}
            className="h-5 w-5"
          />
          {(streak.current > 0 || streak.best > 0) && (
            <div className="flex items-center gap-0.5 text-[10px] font-medium">
              {streak.current > 0 && (
                <span className="flex items-center gap-0.5 text-orange-500">
                  <Flame className="h-2.5 w-2.5" />
                  <span>{streak.current}</span>
                </span>
              )}
              {streak.best > 0 && (
                <span className="flex items-center gap-0.5 text-yellow-600">
                  <Trophy className="h-2.5 w-2.5" />
                  <span>{streak.best}</span>
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className={cn(
            "text-sm font-medium truncate",
            isDone && "line-through text-muted-foreground",
            isSkipped && "text-red-400/60"
          )}>
            {habit.name}
            {isSkipped && <span className="ml-1.5 text-[9px] text-red-400 font-normal">(No lo hice)</span>}
          </span>
          <WeekStreakBar
            habitId={habit.id}
            todayCompleted={!!completions[habit.id]}
            todayValue={timeData[habit.id] || (completions[habit.id] ? 30 : 0)}
            minThreshold={1}
            maxThreshold={30}
            compact
            hideStreak
            className="shrink-0"
          />
        </div>

        {habit.linkTo && (
          <button
            onClick={(e) => { e.stopPropagation(); navigate(habit.linkTo!); }}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <ExternalLink className="h-3 w-3" /> Ver
          </button>
        )}

        {habit.hasTime && (
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={timeData[habit.id] || ""}
              onChange={e => onTimeChange(habit.id, parseInt(e.target.value) || 0)}
              placeholder="min"
              className="w-16 h-7 text-xs text-center"
            />
          </div>
        )}

        {habit.hasCount && (
          <div className="flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={countData[habit.id] || ""}
              onChange={e => onCountChange(habit.id, parseInt(e.target.value) || 0)}
              placeholder={habit.countLabel || "#"}
              className="w-16 h-7 text-xs text-center"
            />
          </div>
        )}

        {habit.hasWater && (
          <button
            onClick={(e) => { e.stopPropagation(); onWaterToggle(habit.id); }}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
              waterData[habit.id]
                ? "bg-blue-500/20 text-blue-500"
                : "bg-muted text-muted-foreground hover:bg-blue-500/10"
            )}
          >
            <Droplets className="h-3.5 w-3.5" />
            300ml
          </button>
        )}

        {habit.hasMealPhoto && (
          <>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={el => { fileInputRefs.current[habit.id] = el; }}
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handlePhotoUpload(habit.id, file);
              }}
            />
            <button
              onClick={(e) => { e.stopPropagation(); fileInputRefs.current[habit.id]?.click(); }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors",
                mealPhotos?.[habit.id]
                  ? "bg-green-500/20 text-green-600"
                  : "bg-muted text-muted-foreground hover:bg-primary/10"
              )}
            >
              <Camera className="h-3.5 w-3.5" />
              {mealPhotos?.[habit.id] ? "✓" : "Foto"}
            </button>
          </>
        )}
      </div>

      {habit.hasMealPhoto && mealPhotos?.[habit.id] && (
        <div className="ml-8 mt-1">
          <img src={mealPhotos[habit.id]} alt={habit.name} className="w-20 h-20 rounded-lg object-cover border" />
        </div>
      )}

      {habit.isWorkout && (
        <div className="ml-8 mt-2 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="number"
              min={0}
              value={workoutDuration || ""}
              onChange={e => onWorkoutDurationChange?.(parseInt(e.target.value) || 0)}
              placeholder="min"
              className="w-16 h-7 text-xs text-center"
            />
            <span className="text-xs text-muted-foreground">min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={workoutIntensity || "moderate"} onValueChange={v => onWorkoutIntensityChange?.(v)}>
              <SelectTrigger className="h-7 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Baja</SelectItem>
                <SelectItem value="moderate">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="extreme">Extrema</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {habit.isSleepSchedule && (
        <div className="ml-8 mt-2 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Sun className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs">Desperté:</span>
              <Input
                type="time"
                value={wakeTime || ""}
                onChange={e => onWakeTimeChange?.(e.target.value)}
                className="w-28 h-7 text-xs"
              />
              {wakeTime && (
                <span className={cn("text-[10px] font-medium", getWakeTimeStatus(wakeTime)?.color)}>
                  {getWakeTimeStatus(wakeTime)?.label}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Moon className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs">Dormí:</span>
              <Input
                type="time"
                value={sleepTime || ""}
                onChange={e => onSleepTimeChange?.(e.target.value)}
                className="w-28 h-7 text-xs"
              />
              {sleepTime && (
                <span className={cn("text-[10px] font-medium", getSleepTimeStatus(sleepTime)?.color)}>
                  {getSleepTimeStatus(sleepTime)?.label}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground">Meta: 6:30 AM despertar · 10:30 PM dormir</p>
        </div>
      )}
    </div>
  );
}
