import { useState, useEffect } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { RoutineStreakCard } from "@/components/routine/RoutineStreakCard";
import { DailyPlanChecklist } from "@/components/routine/DailyPlanChecklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Battery, Dumbbell, Briefcase, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";

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
}

interface TaskItem {
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

type EnergyMode = "normal" | "lowEnergy" | "gymHalf" | "entrepreneurshipHalf";

const ROUTINE_STREAK_KEY = "routineStreakData";
const DAILY_PLAN_KEY = "dailyPlanTasks";

const DailyRoutine = () => {
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [energyMode, setEnergyMode] = useState<EnergyMode>("normal");
  const { getSelectedMode, selectedModeId, isLoaded: modesLoaded, modes } = usePerformanceModes();
  
  // Streak state
  const [routineStreak, setRoutineStreak] = useState({
    currentStreak: 0,
    maxStreak: 0,
    totalDaysCompleted: 0,
    lastCompletedDate: "",
    weeklyCompletion: [false, false, false, false, false, false, false],
  });

  // Daily plan state
  const [dailyTasks, setDailyTasks] = useState<TaskItem[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(new Set());
  const [planDate, setPlanDate] = useState<"today" | "tomorrow">("today");

  // Load streak data
  useEffect(() => {
    const stored = localStorage.getItem(ROUTINE_STREAK_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if it's a new day and reset weekly if needed
        const today = new Date().toDateString();
        const lastDate = parsed.lastCompletedDate ? new Date(parsed.lastCompletedDate).toDateString() : "";
        
        // Reset streak if more than 1 day has passed
        if (lastDate && lastDate !== today) {
          const lastDateObj = new Date(parsed.lastCompletedDate);
          const todayObj = new Date();
          const diffDays = Math.floor((todayObj.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
          
          if (diffDays > 1) {
            parsed.currentStreak = 0;
          }
        }
        
        // Reset weekly completion on Monday
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1 && lastDate !== today) {
          parsed.weeklyCompletion = [false, false, false, false, false, false, false];
        }
        
        setRoutineStreak(parsed);
      } catch {
        // Use default
      }
    }
  }, []);

  // Load daily plan tasks
  useEffect(() => {
    const dateKey = planDate === "today" 
      ? new Date().toISOString().split('T')[0]
      : new Date(Date.now() + 86400000).toISOString().split('T')[0];
    
    const stored = localStorage.getItem(`${DAILY_PLAN_KEY}_${dateKey}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDailyTasks(parsed.tasks || []);
        setCompletedTaskIds(new Set(parsed.completedIds || []));
      } catch {
        setDailyTasks([]);
        setCompletedTaskIds(new Set());
      }
    } else {
      setDailyTasks([]);
      setCompletedTaskIds(new Set());
    }
  }, [planDate]);

  // Save daily plan tasks
  useEffect(() => {
    if (dailyTasks.length > 0 || completedTaskIds.size > 0) {
      const dateKey = planDate === "today" 
        ? new Date().toISOString().split('T')[0]
        : new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      localStorage.setItem(`${DAILY_PLAN_KEY}_${dateKey}`, JSON.stringify({
        tasks: dailyTasks,
        completedIds: Array.from(completedTaskIds),
      }));
    }
  }, [dailyTasks, completedTaskIds, planDate]);

  // Save streak data
  useEffect(() => {
    localStorage.setItem(ROUTINE_STREAK_KEY, JSON.stringify(routineStreak));
  }, [routineStreak]);

  const loadBlocks = () => {
    const storedBlocks = localStorage.getItem('dailyRoutineBlocks');
    if (storedBlocks) {
      try {
        const parsed = JSON.parse(storedBlocks);
        if (parsed && parsed.length > 0) {
          setBlocks(parsed);
          return;
        }
      } catch {
        // Continue to fallback
      }
    }
    
    if (modesLoaded && modes.length > 0) {
      const mode = modes.find(m => m.id === selectedModeId) || modes[0];
      if (mode) {
        const routineBlocks = mode.blocks.map(block => ({
          ...block,
          currentStreak: 0,
          maxStreak: 0,
          weeklyCompletion: [false, false, false, false, false, false, false],
        }));
        setBlocks(routineBlocks);
        localStorage.setItem('dailyRoutineBlocks', JSON.stringify(routineBlocks));
      }
    }
  };

  useEffect(() => {
    const handleRoutineUpdate = () => {
      loadBlocks();
    };
    window.addEventListener('routineBlocksUpdated', handleRoutineUpdate);
    
    return () => {
      window.removeEventListener('routineBlocksUpdated', handleRoutineUpdate);
    };
  }, []);

  useEffect(() => {
    if (modesLoaded) {
      loadBlocks();
    }
  }, [modesLoaded, selectedModeId, modes]);

  useEffect(() => {
    if (blocks.length > 0) {
      localStorage.setItem('dailyRoutineBlocks', JSON.stringify(blocks));
    }
  }, [blocks]);

  const updateBlock = (updatedBlock: RoutineBlock) => {
    setBlocks(blocks.map(block => 
      block.id === updatedBlock.id ? updatedBlock : block
    ));
  };

  const completeBlock = (blockId: string) => {
    setBlocks(blocks.map(block => {
      if (block.id === blockId) {
        const today = new Date().getDay();
        const dayIndex = today === 0 ? 6 : today - 1;
        const newWeekly = [...block.weeklyCompletion];
        newWeekly[dayIndex] = true;
        
        const newStreak = block.currentStreak + 1;
        return {
          ...block,
          currentStreak: newStreak,
          maxStreak: Math.max(block.maxStreak, newStreak),
          weeklyCompletion: newWeekly
        };
      }
      return block;
    }));
  };

  // Check if routine is complete for the day and update streak
  const checkAndUpdateRoutineStreak = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    const allBlocksComplete = blocks.every(b => b.weeklyCompletion[dayIndex]);
    
    if (allBlocksComplete && blocks.length > 0) {
      const todayStr = new Date().toISOString();
      
      // Only update if not already updated today
      if (routineStreak.lastCompletedDate !== new Date().toDateString()) {
        const newWeeklyCompletion = [...routineStreak.weeklyCompletion];
        newWeeklyCompletion[dayIndex] = true;
        
        setRoutineStreak(prev => ({
          currentStreak: prev.currentStreak + 1,
          maxStreak: Math.max(prev.maxStreak, prev.currentStreak + 1),
          totalDaysCompleted: prev.totalDaysCompleted + 1,
          lastCompletedDate: todayStr,
          weeklyCompletion: newWeeklyCompletion,
        }));
      }
    }
  };

  useEffect(() => {
    checkAndUpdateRoutineStreak();
  }, [blocks]);

  const handleTasksChange = (tasks: TaskItem[]) => {
    setDailyTasks(tasks);
  };

  const handleToggleComplete = (taskId: string) => {
    setCompletedTaskIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleRemoveTask = (taskId: string) => {
    setDailyTasks(prev => prev.filter(t => t.id !== taskId));
    setCompletedTaskIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  };

  const handleAssignTasksToBlock = (blockId: string, taskIds: string[]) => {
    setDailyTasks(prev => prev.map(task => {
      if (taskIds.includes(task.id)) {
        return { ...task, routine_block_id: blockId };
      } else if (task.routine_block_id === blockId) {
        // Remove from this block if not in the new selection
        return { ...task, routine_block_id: undefined };
      }
      return task;
    }));
  };

  // Create a merged task list with completion status
  const tasksWithCompletion = dailyTasks.map(task => ({
    ...task,
    completed: completedTaskIds.has(task.id),
  }));

  const completedBlocks = blocks.filter(b => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    return b.weeklyCompletion[dayIndex];
  }).length;
  const progressPercentage = blocks.length > 0 ? (completedBlocks / blocks.length) * 100 : 0;

  const toggleEnergyMode = (mode: EnergyMode) => {
    if (energyMode === mode) {
      setEnergyMode("normal");
      setBlocks(blocks.map(block => ({ ...block, isHalfTime: false })));
    } else {
      setEnergyMode(mode);
      setBlocks(blocks.map(block => {
        let shouldHalf = false;
        
        if (mode === "lowEnergy" && block.title === "Idiomas") {
          shouldHalf = true;
        } else if (mode === "gymHalf" && block.title === "Gym") {
          shouldHalf = true;
        } else if (mode === "entrepreneurshipHalf" && block.title === "Focus Emprendimiento") {
          shouldHalf = true;
        }
        
        return { ...block, isHalfTime: shouldHalf };
      }));
    }
  };

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 space-y-6" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          Rutina Diaria
        </h1>
        <p className="text-muted-foreground mt-1">
          Bloques estructurados para máxima productividad
        </p>
      </header>

      {/* Streak Card */}
      <RoutineStreakCard
        currentStreak={routineStreak.currentStreak}
        maxStreak={routineStreak.maxStreak}
        totalDaysCompleted={routineStreak.totalDaysCompleted}
        weeklyCompletion={routineStreak.weeklyCompletion}
      />

      {/* Daily Plan Checklist */}
      <DailyPlanChecklist
        tasks={dailyTasks}
        completedTaskIds={completedTaskIds}
        onTasksChange={handleTasksChange}
        onToggleComplete={handleToggleComplete}
        onRemoveTask={handleRemoveTask}
        planDate={planDate}
        onPlanDateChange={setPlanDate}
      />

      {/* Mode Selection and Energy Mode Buttons */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3">
          <Button
            variant={energyMode === "lowEnergy" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("lowEnergy")}
            className={cn("transition-all")}
          >
            <Battery className="h-4 w-4 mr-2" />
            Mínimo por Energía
          </Button>
          <Button
            variant={energyMode === "gymHalf" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("gymHalf")}
          >
            <Dumbbell className="h-4 w-4 mr-2" />
            Gym Reducido
          </Button>
          <Button
            variant={energyMode === "entrepreneurshipHalf" ? "default" : "outline"}
            onClick={() => toggleEnergyMode("entrepreneurshipHalf")}
          >
            <Briefcase className="h-4 w-4 mr-2" />
            Emprendimiento Reducido
          </Button>
        </div>
        <Link to="/performance-modes">
          <Button variant="outline">
            <Settings2 className="h-4 w-4 mr-2" />
            Cambiar Modo de Rendimiento
          </Button>
        </Link>
      </div>

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
            onUpdate={updateBlock}
            onComplete={() => completeBlock(block.id)}
            dailyTasks={tasksWithCompletion}
            onAssignTasks={handleAssignTasksToBlock}
            onToggleTaskComplete={handleToggleComplete}
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
