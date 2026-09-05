import { useState, useEffect, useMemo } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { RoutineStreakCard } from "@/components/routine/RoutineStreakCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useRoutineBlocks, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import { useRoutineConfig } from "@/hooks/useRoutineConfig";
import { useDailyPlanData, type TaskItem as PlanTask } from "@/hooks/useDailyPlanData";
import type { TaskItem as AssignerTask } from "@/components/routine/BlockTaskAssigner";

const ROUTINE_STREAK_KEY = "routineStreakData";
const DEFAULT_WEEK = [false, false, false, false, false, false, false];

const ROUTINE_STYLES: Record<RoutineType, { active: string; inactive: string; glow: string }> = {
  disciplina: {
    active: "bg-orange-500/20 border-orange-500/60 text-orange-500 shadow-lg shadow-orange-500/10",
    inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40 hover:text-orange-400/80",
    glow: "shadow-orange-500/20",
  },
  normal: {
    active: "bg-blue-500/20 border-blue-500/60 text-blue-500 shadow-lg shadow-blue-500/10",
    inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40 hover:text-blue-400/80",
    glow: "shadow-blue-500/20",
  },
  super: {
    active: "bg-purple-500/20 border-purple-500/60 text-purple-500 shadow-lg shadow-purple-500/10",
    inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40 hover:text-purple-400/80",
    glow: "shadow-purple-500/20",
  },
  descanso: {
    active: "bg-green-500/20 border-green-500/60 text-green-500 shadow-lg shadow-green-500/10",
    inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40 hover:text-green-400/80",
    glow: "shadow-green-500/20",
  },
  equilibrio: {
    active: "bg-cyan-500/20 border-cyan-500/60 text-cyan-500 shadow-lg shadow-cyan-500/10",
    inactive: "border-cyan-500/20 text-cyan-400/60 hover:border-cyan-500/40 hover:text-cyan-400/80",
    glow: "shadow-cyan-500/20",
  },
};

const toAssignerSource = (source: string): AssignerTask["source"] => {
  if (source === "entrepreneurship") return "entrepreneurship";
  if (source === "project") return "project";
  if (source === "university") return "university";
  return "tasks";
};

const toAssignerTask = (t: PlanTask, blockId?: string): AssignerTask => ({
  id: t.id,
  title: t.title,
  description: t.description,
  source: toAssignerSource(t.source),
  sourceName: t.sourceName,
  completed: t.completed,
  routine_block_id: blockId !== undefined ? blockId : t.routine_block_id,
});

const DailyRoutine = () => {
  const {
    blocks: routineBlocks,
    isLoaded,
    routineType,
    setRoutineType,
    updateBlock,
  } = useRoutineBlocks();

  const { adjustedBlocks } = useRoutineConfig();
  const {
    tasksByBlock,
    unassignedTasks,
    tasks,
    toggleTaskDone,
    toggleBlockComplete,
    isBlockCompleted,
    assignTaskToBlock,
    removeTaskFromBlock,
  } = useDailyPlanData();

  const [routineStreak, setRoutineStreak] = useState({
    currentStreak: 0,
    maxStreak: 0,
    totalDaysCompleted: 0,
    lastCompletedDate: "",
    weeklyCompletion: [...DEFAULT_WEEK],
  });

  // Mismos bloques que la sección "plan" de la página Daily
  const blocks = useMemo(
    () => (isLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks),
    [isLoaded, routineBlocks, adjustedBlocks]
  );

  const currentRoutine = ROUTINES.find(r => r.type === routineType) || ROUTINES[0];

  // Une todas las tareas del día con su bloque del plan (fallback routine_block_id)
  const dailyTasks: AssignerTask[] = useMemo(() => {
    const map = new Map<string, AssignerTask>();
    for (const [blockId, blockTasks] of Object.entries(tasksByBlock)) {
      for (const t of blockTasks) {
        map.set(t.id, toAssignerTask(t, blockId));
      }
    }
    for (const t of unassignedTasks) {
      if (!map.has(t.id)) map.set(t.id, toAssignerTask(t));
    }
    for (const t of tasks) {
      if (!map.has(t.id)) map.set(t.id, toAssignerTask(t));
    }
    return Array.from(map.values());
  }, [tasksByBlock, unassignedTasks, tasks]);

  useEffect(() => {
    const stored = localStorage.getItem(ROUTINE_STREAK_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const today = new Date().toDateString();
        const lastDate = parsed.lastCompletedDate ? new Date(parsed.lastCompletedDate).toDateString() : "";

        if (lastDate && lastDate !== today) {
          const lastDateObj = new Date(parsed.lastCompletedDate);
          const todayObj = new Date();
          const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays > 1) parsed.currentStreak = 0;
        }

        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1 && lastDate !== today) {
          parsed.weeklyCompletion = [...DEFAULT_WEEK];
        }

        setRoutineStreak(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ROUTINE_STREAK_KEY, JSON.stringify(routineStreak));
  }, [routineStreak]);

  const completeBlock = (blockId: string) => {
    toggleBlockComplete(blockId);
    const target = blocks.find(b => b.id === blockId);
    if (!target) return;
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    const newWeekly = [...(target.weeklyCompletion || DEFAULT_WEEK)];
    newWeekly[dayIndex] = true;
    const newStreak = (target.currentStreak || 0) + 1;
    updateBlock({
      ...target,
      weeklyCompletion: newWeekly,
      currentStreak: newStreak,
      maxStreak: Math.max(target.maxStreak || 0, newStreak),
    });
  };

  useEffect(() => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    if (blocks.length === 0) return;
    const allComplete = blocks.every(b => b.weeklyCompletion?.[dayIndex]);

    if (allComplete && routineStreak.lastCompletedDate !== new Date().toDateString()) {
      const newWeeklyCompletion = [...routineStreak.weeklyCompletion];
      newWeeklyCompletion[dayIndex] = true;
      setRoutineStreak(prev => ({
        currentStreak: prev.currentStreak + 1,
        maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
        totalDaysCompleted: prev.totalDaysCompleted + 1,
        lastCompletedDate: new Date().toISOString(),
        weeklyCompletion: newWeeklyCompletion,
      }));
    }
  }, [blocks, routineStreak]);

  const handleAssignTasks = (blockId: string, taskIds: string[]) => {
    const currentIds = dailyTasks.filter(t => t.routine_block_id === blockId).map(t => t.id);
    const target = new Set(taskIds);
    for (const id of currentIds) {
      if (!target.has(id)) removeTaskFromBlock(id);
    }
    for (const id of taskIds) {
      if (!currentIds.includes(id)) assignTaskToBlock(id, blockId);
    }
  };

  const completedBlocks = blocks.filter(b => isBlockCompleted(b.id)).length;
  const progressPercentage = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Cargando rutina...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 space-y-6" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      {/* Notion-style Routine Selector */}
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Rutina Diaria</h1>
            <p className="text-muted-foreground mt-1">
              {currentRoutine.totalBlocks} bloques · {currentRoutine.wakeTime} — {currentRoutine.sleepTime}
            </p>
          </div>
          <Link to="/routine-day">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-accent/50">
              <Settings2 className="h-3.5 w-3.5" />
              Editar
            </button>
          </Link>
        </header>

        {/* iPhone-style Segmented Control */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {ROUTINES.map((r) => {
            const style = ROUTINE_STYLES[r.type];
            const isActive = routineType === r.type;
            return (
              <button
                key={r.type}
                onClick={() => setRoutineType(r.type)}
                className={cn(
                  "flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]",
                  isActive ? style.active : `${style.inactive} bg-transparent`,
                  isActive && "scale-[1.02]"
                )}
              >
                <span className={cn(
                  "text-xl leading-none transition-transform duration-300",
                  isActive && "scale-110"
                )}>
                  {r.icon}
                </span>
                <span className={cn(
                  "text-xs font-semibold tracking-tight whitespace-nowrap transition-all",
                  isActive ? "opacity-100" : "opacity-70"
                )}>
                  {r.shortLabel}
                </span>
                <span className={cn(
                  "text-[10px] font-mono tracking-tight transition-all",
                  isActive ? "opacity-80" : "opacity-40"
                )}>
                  {r.wakeTime}—{r.sleepTime}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Streak Card */}
      <RoutineStreakCard
        currentStreak={routineStreak.currentStreak}
        maxStreak={routineStreak.maxStreak}
        totalDaysCompleted={routineStreak.totalDaysCompleted}
        weeklyCompletion={routineStreak.weeklyCompletion}
      />

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progreso del Día</span>
            <Badge variant="outline" className="text-lg">
              {completedBlocks}/{blocks.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={progressPercentage} className="h-3" />
            <p className="text-sm text-muted-foreground text-right">
              {Math.round(progressPercentage)}% completado
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6">
        {blocks.map(block => (
          <RoutineBlockCard
            key={block.id}
            block={block}
            onUpdate={(updated) => updateBlock(updated)}
            onComplete={() => completeBlock(block.id)}
            dailyTasks={dailyTasks}
            onAssignTasks={handleAssignTasks}
            onToggleTaskComplete={(taskId) => toggleTaskDone(taskId)}
          />
        ))}
      </div>

      {progressPercentage === 100 && (
        <Card className="border-2 border-green-500">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">¡Día Completado Perfectamente!</h3>
            <p className="text-muted-foreground">
              Has completado todos los bloques. Tu disciplina es inquebrantable.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DailyRoutine;