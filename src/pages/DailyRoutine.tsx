import { useState, useEffect } from "react";
import { RoutineBlockCard } from "@/components/RoutineBlockCard";
import { RoutineStreakCard } from "@/components/routine/RoutineStreakCard";
import { DailyPlanChecklist } from "@/components/routine/DailyPlanChecklist";
import { EmergencyModeToggle } from "@/components/routine/EmergencyModeToggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Battery, Dumbbell, Briefcase, Settings2, GraduationCap, FolderKanban, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useRoutineBlocksDB, type RoutineBlock as DBRoutineBlock } from "@/hooks/useRoutineBlocksDB";

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
  blockType?: string;
  defaultFocus?: string;
  currentFocus?: string;
  canSubdivide?: boolean;
  emergencyOnly?: boolean;
  notes?: string;
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
  const { 
    blocks: dbBlocks, 
    isLoaded, 
    emergencyMode, 
    toggleEmergencyMode, 
    getHoursByFocus,
    updateBlock: updateDBBlock 
  } = useRoutineBlocksDB();
  
  const [blocks, setBlocks] = useState<RoutineBlock[]>([]);
  const [energyMode, setEnergyMode] = useState<EnergyMode>("normal");
  
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

  // Convert DB blocks to UI blocks when loaded
  useEffect(() => {
    if (isLoaded && dbBlocks.length > 0) {
      const uiBlocks = dbBlocks.map(block => ({
        id: block.id,
        title: block.title,
        startTime: block.startTime,
        endTime: block.endTime,
        genericTasks: block.tasks,
        currentStreak: 0,
        maxStreak: 0,
        weeklyCompletion: [false, false, false, false, false, false, false],
        blockType: block.blockType,
        defaultFocus: block.defaultFocus,
        currentFocus: block.currentFocus,
        canSubdivide: block.canSubdivide,
        emergencyOnly: block.emergencyOnly,
        notes: block.notes,
      }));
      
      // Load saved streak data for each block
      const stored = localStorage.getItem('dailyRoutineBlocks');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const merged = uiBlocks.map(block => {
            const savedBlock = parsed.find((b: RoutineBlock) => b.id === block.id);
            if (savedBlock) {
              return {
                ...block,
                currentStreak: savedBlock.currentStreak || 0,
                maxStreak: savedBlock.maxStreak || 0,
                weeklyCompletion: savedBlock.weeklyCompletion || [false, false, false, false, false, false, false],
                coverImage: savedBlock.coverImage,
                specificTask: savedBlock.specificTask,
              };
            }
            return block;
          });
          setBlocks(merged);
        } catch {
          setBlocks(uiBlocks);
        }
      } else {
        setBlocks(uiBlocks);
      }
    }
  }, [isLoaded, dbBlocks]);

  // Load streak data
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
          
          if (diffDays > 1) {
            parsed.currentStreak = 0;
          }
        }
        
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

  // Save blocks to localStorage
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

  const checkAndUpdateRoutineStreak = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    
    const allBlocksComplete = blocks.every(b => b.weeklyCompletion[dayIndex]);
    
    if (allBlocksComplete && blocks.length > 0) {
      const todayStr = new Date().toISOString();
      
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
        return { ...task, routine_block_id: undefined };
      }
      return task;
    }));
  };

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
        
        if (mode === "lowEnergy" && block.title.includes("Idiomas")) {
          shouldHalf = true;
        } else if (mode === "gymHalf" && block.title === "Gym") {
          shouldHalf = true;
        } else if (mode === "entrepreneurshipHalf" && block.title === "Focus") {
          shouldHalf = true;
        }
        
        return { ...block, isHalfTime: shouldHalf };
      }));
    }
  };

  // Calculate hours for emergency mode
  const hours = isLoaded ? getHoursByFocus() : { universidad: 0, emprendimiento: 0, proyectos: 0, otros: 0 };
  const normalHours = 9; // 5 deep work blocks (7.5h) + 1 focus block (1.5h)
  const emergencyHours = 12.5; // With all dynamic blocks converted

  return (
    <div className="container mx-auto px-4 pt-20 pb-8 space-y-6" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      <header>
        <h1 className="text-3xl font-bold text-foreground">
          Rutina Diaria
        </h1>
        <p className="text-muted-foreground mt-1">
          18 bloques estructurados • Despertar 5:00 AM
        </p>
      </header>

      {/* Hours Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Distribución del Día
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
              <div className="flex items-center gap-2 text-blue-500 mb-1">
                <GraduationCap className="h-4 w-4" />
                <span className="text-xs font-medium">Universidad</span>
              </div>
              <p className="text-xl font-bold">{hours.universidad.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 text-purple-500 mb-1">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs font-medium">Emprendimiento</span>
              </div>
              <p className="text-xl font-bold">{hours.emprendimiento.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-500 mb-1">
                <FolderKanban className="h-4 w-4" />
                <span className="text-xs font-medium">Proyectos</span>
              </div>
              <p className="text-xl font-bold">{hours.proyectos.toFixed(1)}h</p>
            </div>
            <div className="p-3 rounded-lg bg-muted border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="h-4 w-4" />
                <span className="text-xs font-medium">Otros</span>
              </div>
              <p className="text-xl font-bold">{hours.otros.toFixed(1)}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Emergency Mode Toggle */}
      <EmergencyModeToggle
        isActive={emergencyMode}
        onToggle={toggleEmergencyMode}
        normalHours={normalHours}
        emergencyHours={emergencyHours}
      />

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
        <Link to="/routine-day">
          <Button variant="outline">
            <Settings2 className="h-4 w-4 mr-2" />
            Configurar Bloques
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