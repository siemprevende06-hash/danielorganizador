import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Focus, CalendarPlus, ClipboardCheck, BarChart3, Compass, Activity } from "lucide-react";
import { QuickDaySummary } from "@/components/today/QuickDaySummary";
import { DayProgressHeader } from "@/components/today/DayProgressHeader";
import { WheelOfLife } from "@/components/WheelOfLife";
import { HombreTopWheel } from "@/components/HombreTopWheel";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyMotivation } from "@/components/today/DailyMotivation";
import { WeekContext } from "@/components/today/WeekContext";
import { DailyTimelinePlanner } from "@/components/today/DailyTimelinePlanner";
import { TaskPoolPanel } from "@/components/today/TaskPoolPanel";
import { RoutineConfigBar } from "@/components/today/RoutineConfigBar";
import { CurrentBlockCard } from "@/components/today/CurrentBlockCard";
import { usePillarProgress } from "@/hooks/usePillarProgress";
import { useDailyPlanData } from "@/hooks/useDailyPlanData";
import { useRoutineBlocksDB } from "@/hooks/useRoutineBlocksDB";
import { useRoutineConfig } from "@/hooks/useRoutineConfig";
import { useRoutineBlocks, type RoutineType, ROUTINES } from "@/hooks/useRoutineBlocks";
import { GoalPredictions } from "@/components/dashboard/GoalPredictions";
import { WeekComparisonCard } from "@/components/dashboard/WeekComparisonCard";
import { ProductivityPatterns } from "@/components/dashboard/ProductivityPatterns";
import { AchievementsDisplay } from "@/components/dashboard/AchievementsDisplay";
import { WeeklySummaryCard } from "@/components/dashboard/WeeklySummaryCard";
import { RealStatsDashboard } from "@/components/dashboard/RealStatsDashboard";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
import { SostenSection } from "@/components/dashboard/SostenSection";
import { MiniHabitsSection } from "@/components/dashboard/MiniHabitsSection";
import { FocusIndicatorsSection } from "@/components/today/FocusIndicatorsSection";
import { useNotifications } from "@/hooks/useNotifications";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useHombreTopScores } from "@/hooks/useHombreTopScores";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import NotionCalendar from "@/components/calendar/NotionCalendar";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const ROUTINE_STYLES: Record<RoutineType, { active: string; inactive: string }> = {
  disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
  normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
  super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
  descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};

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
  const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress();
  const { requestPermission } = useNotifications();
  const { timeframe, view } = useTimeframe();
  const { scores: areaScores, averages, loading: areaLoading } = useAreaScores(timeframe, view);
  const {
    scores: hommeScores,
    average: hommeAvg,
    esfuerzoAverage,
    resultadosAverage,
    loading: hommeLoading,
  } = useHombreTopScores(timeframe, view);

  const {
    blocks: rawBlocks, blocksLoaded,
    tasksByBlock, unassignedTasks,
    assignTaskToBlock, removeTaskFromBlock, refreshTasks,
    toggleBlockComplete, isBlockCompleted,
    completedBlocks, completedTasks, dayScore,
    tasks,
  } = useDailyPlanData();

  const {
    adjustedBlocks,
    wakeTime, setWakeTime,
    focusBlock, setFocusBlock,
    sleepTime, setSleepTime,
    lateWake, setLateWake,
    musicInstrument, setMusicInstrument,
    presetName,
  } = useRoutineConfig();

  const { getCurrentBlock, getBlockProgress, updateBlockFocus } = useRoutineBlocksDB();
  const currentBlock = getCurrentBlock();
  const currentProgress = currentBlock ? getBlockProgress(currentBlock) : 0;

  const { blocks: routineBlocks, isLoaded: routineLoaded, routineType, setRoutineType } = useRoutineBlocks();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      requestPermission();
    }
  }, [requestPermission]);

  const wheelValues = areaScores.map((s) => Math.round(s.esfuerzo / 10))
  const wheelValues2 = areaScores.map((s) => Math.round(s.resultados / 10))
  const wheelAvg = Math.round(averages.esfuerzo / 10)
  const wheelAvg2 = Math.round(averages.resultados / 10)

  const hommeValues = hommeScores.map((s) => s.esfuerzo)
  const hommeValues2 = hommeScores.map((s) => s.resultados)

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-6">
        <ClockWidget />

        <TimeframeSelector />

        <DayProgressHeader
          blocksTotal={adjustedBlocks.length}
          blocksCompleted={completedBlocks.length}
          tasksTotal={tasks.length}
          tasksCompleted={completedTasks.length}
          dayScore={dayScore}
          currentBlockName={currentBlock?.title}
          currentBlockProgress={currentProgress}
          loading={!blocksLoaded}
        />

        {/* Wheels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-2">RUEDA DE LA VIDA — 10 ÁREAS</h2>
            <WheelOfLife
              values={wheelValues}
              values2={wheelValues2}
              average={wheelAvg}
              average2={wheelAvg2}
              view={view}
              loading={areaLoading}
            />
          </Card>
          <Card className="p-4">
            <h2 className="text-sm font-bold uppercase tracking-wide text-center mb-2">HOMBRE TOP</h2>
            <p className="text-xs text-muted-foreground text-center mb-3">Lo que una mujer busca en un hombre</p>
            <HombreTopWheel
              values={hommeValues}
              values2={hommeValues2}
              average={esfuerzoAverage}
              average2={resultadosAverage}
              view={view}
              loading={hommeLoading}
            />
          </Card>
        </div>

        <QuickDaySummary />

        <RealStatsDashboard />

        <FocusIndicatorsSection />

        <MySystemsSection />

        <SostenSection />

        <MiniHabitsSection />

        <Separator />

        {/* Routine Selector - iPhone-style Segmented Control */}
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
                <span className="text-xl leading-none transition-transform duration-300">{r.icon}</span>
                <span className={cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70")}>{r.shortLabel}</span>
                <span className={cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40")}>{r.wakeTime}—{r.sleepTime}</span>
              </button>
            );
          })}
        </div>

        {/* Daily Schedule — Routine Config + Current Block + Timeline + Task Pool */}
        <RoutineConfigBar
          wakeTime={wakeTime}
          onWakeChange={setWakeTime}
          focusBlock={focusBlock}
          onFocusChange={setFocusBlock}
          sleepTime={sleepTime}
          onSleepChange={setSleepTime}
          lateWake={lateWake}
          onLateWakeChange={setLateWake}
          musicInstrument={musicInstrument}
          onMusicInstrumentChange={setMusicInstrument}
          presetName={presetName}
        />

        <CurrentBlockCard
          currentBlock={currentBlock}
          blockProgress={currentProgress}
          tasksByBlock={tasksByBlock}
        />

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          <DailyTimelinePlanner
            blocks={routineLoaded && routineBlocks.length > 0 ? routineBlocks : adjustedBlocks}
            tasksByBlock={tasksByBlock}
            onToggleBlock={toggleBlockComplete}
            isBlockCompleted={isBlockCompleted}
            onDropTask={assignTaskToBlock}
            onRemoveTask={removeTaskFromBlock}
            onUpdateFocus={updateBlockFocus}
          />
          <div className="lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]">
            <TaskPoolPanel
              unassignedTasks={unassignedTasks}
              onTaskCreated={refreshTasks}
            />
          </div>
        </div>

        <Separator />

        <Card>
          <CardContent className="pt-6">
            <PillarProgressGrid pillars={pillars} overallScore={overallScore} loading={pillarsLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <SecondaryGoalsProgress goals={secondaryGoals} loading={pillarsLoading} />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GoalPredictions />
          <WeekComparisonCard />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ProductivityPatterns />
          <AchievementsDisplay />
        </div>

        <WeeklySummaryCard />

        <WeekContext />

        {/* Notion-style Monthly Calendar */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wide">CALENDARIO MENSUAL</h2>
            <Link to="/monthly" className="text-[9px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
              Ver detalle →
            </Link>
          </div>
          <NotionCalendar />
        </div>

        <DailyMotivation />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Link to="/focus" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <Focus className="w-5 h-5" />
              <span className="text-xs">Focus Mode</span>
            </Button>
          </Link>
          <Link to="/day-planner" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <CalendarPlus className="w-5 h-5" />
              <span className="text-xs">Planificar</span>
            </Button>
          </Link>
          <Link to="/self-review" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <ClipboardCheck className="w-5 h-5" />
              <span className="text-xs">Autocrítica</span>
            </Button>
          </Link>
          <Link to="/confidence-steps" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <Compass className="w-5 h-5" />
              <span className="text-xs">Escalones</span>
            </Button>
          </Link>
          <Link to="/vida-daniel" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Estadísticas</span>
            </Button>
          </Link>
          <Link to="/punto-partida" className="block">
            <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2 hover:bg-foreground hover:text-background transition-colors">
              <Activity className="w-5 h-5" />
              <span className="text-xs">Punto Partida</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
