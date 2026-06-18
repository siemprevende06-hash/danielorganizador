import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass, Activity } from "lucide-react";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { WheelOfLife } from "@/components/WheelOfLife";
import { HombreTopWheel } from "@/components/HombreTopWheel";
import { RealStatsDashboard } from "@/components/dashboard/RealStatsDashboard";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
import { QuickStatsGrid } from "@/components/dashboard/QuickStatsGrid";
import { SostenSection } from "@/components/dashboard/SostenSection";
import { MiniHabitsSection } from "@/components/dashboard/MiniHabitsSection";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { DayProgressHeader } from "@/components/today/DayProgressHeader";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { TaskPoolPanel } from "@/components/today/TaskPoolPanel";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useWheelScores } from "@/hooks/useWheelScores";
import { useHombreTopScores } from "@/hooks/useHombreTopScores";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useEffect, useState } from "react";

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  const formattedDate = format(time, "EEEE, d 'de' MMMM", { locale: es });
  const formattedTime = format(time, "h:mm a");
  return (
    <div className="text-center">
      <h1 className="text-4xl md:text-5xl font-bold text-foreground uppercase tracking-tight">INICIO</h1>
      <p className="text-lg text-muted-foreground capitalize mt-1">{formattedDate}</p>
      <p className="text-2xl font-light text-muted-foreground/70 mt-0.5 tabular-nums">{formattedTime}</p>
    </div>
  );
}

export default function Index() {
  const {
    blocks, blocksLoaded,
    tasksByBlock, unassignedTasks,
    assignTaskToBlock, removeTaskFromBlock, refreshTasks,
    toggleBlockComplete, isBlockCompleted,
    completedBlocks, completedTasks, dayScore,
    tasks,
  } = useDailyPlanData();

  const { getCurrentBlock, getBlockProgress } = useRoutineBlocksDB();
  const currentBlock = getCurrentBlock();
  const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;

  const { timeframe } = useTimeframe();
  const { scores: wheelScores, average: wheelAvg, loading: wheelLoading } = useWheelScores(timeframe);
  const { scores: hommeScores, average: hommeAvg, loading: hommeLoading } = useHombreTopScores(timeframe);

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <ClockWidget />
        <TimeframeSelector />
        <DayProgressHeader
          blocksTotal={blocks.length}
          blocksCompleted={completedBlocks.length}
          tasksTotal={tasks.length}
          tasksCompleted={completedTasks.length}
          dayScore={dayScore}
          currentBlockName={currentBlock?.title}
          currentBlockProgress={currentProgress}
          loading={!blocksLoaded}
        />

        {/* Compact indicators grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="scale-[0.97] origin-top-left">
            <RealStatsDashboard />
          </div>
          <Card className="p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Focus className="h-3.5 w-3.5 text-primary" />
              <h3 className="text-[10px] font-bold uppercase tracking-wide">FOCUS</h3>
            </div>
            <QuickStatsGrid />
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <MySystemsSection />
          <SostenSection />
          <MiniHabitsSection />
        </div>

        {/* Timeline + Task Pool */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <DailyTimelinePlanner
            blocks={blocks}
            tasksByBlock={tasksByBlock}
            onToggleBlock={toggleBlockComplete}
            isBlockCompleted={isBlockCompleted}
            onDropTask={assignTaskToBlock}
            onRemoveTask={removeTaskFromBlock}
          />
          <div className="lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]">
            <TaskPoolPanel
              unassignedTasks={unassignedTasks}
              onTaskCreated={refreshTasks}
            />
          </div>
        </div>

        {/* Wheel of Life + Hombre Top side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wide text-center mb-1">RUEDA DE LA VIDA</h2>
            <WheelOfLife
              values={wheelScores.map((s) => Math.round(s.value / 10))}
              average={Math.round(wheelAvg / 10)}
              loading={wheelLoading}
            />
          </Card>
          <Card className="p-3">
            <h2 className="text-[10px] font-bold uppercase tracking-wide text-center mb-1">HOMBRE TOP</h2>
            <p className="text-[9px] text-muted-foreground text-center mb-1">Lo que una mujer busca en un hombre</p>
            <HombreTopWheel
              values={hommeScores.map((s) => s.value)}
              average={hommeAvg}
              loading={hommeLoading}
            />
          </Card>
        </div>

        <Separator />

        <DailyMotivation />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <Link to="/focus">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <Focus className="w-4 h-4" />
              Focus
            </Button>
          </Link>
          <Link to="/day-planner">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <CalendarPlus className="w-4 h-4" />
              Planificar
            </Button>
          </Link>
          <Link to="/self-review">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <ClipboardCheck className="w-4 h-4" />
              Autocrítica
            </Button>
          </Link>
          <Link to="/confidence-steps">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <Compass className="w-4 h-4" />
              Escalones
            </Button>
          </Link>
          <Link to="/vida-daniel">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <BarChart3 className="w-4 h-4" />
              Estadísticas
            </Button>
          </Link>
          <Link to="/punto-partida">
            <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1.5 text-xs hover:bg-foreground hover:text-background transition-colors">
              <Activity className="w-4 h-4" />
              P. Partida
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
