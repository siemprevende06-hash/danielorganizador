import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DailyGuide } from '@/components/today/DailyGuide';
import { TaskAccordion } from '@/components/today/TaskAccordion';
import { TodayWorkout } from '@/components/today/TodayWorkout';
import { SystemHabitGroup, type SystemGroup } from '@/components/systems/SystemHabitGroup';
import { SystemsStatsPanel } from '@/components/systems/SystemsStatsPanel';
import { HobbyCards } from '@/components/systems/HobbyCards';
import { LanguageSkillCards } from '@/components/systems/LanguageSkillCards';
import { WorkoutVisual } from '@/components/systems/WorkoutVisual';
import { MySystemsSection } from '@/components/dashboard/MySystemsSection';
import { QuickStatsGrid } from '@/components/dashboard/QuickStatsGrid';
import { RoutineConfigBar } from '@/components/today/RoutineConfigBar';
import { CurrentBlockCard } from '@/components/today/CurrentBlockCard';
import { DailyTimelinePlanner } from '@/components/today/DailyTimelinePlanner';
import { TaskPoolPanel } from '@/components/today/TaskPoolPanel';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { useOverallSystemStreak } from '@/hooks/useOverallSystemStreak';
import { useDailyPlanData } from '@/hooks/useDailyPlanData';
import { useRoutineConfig } from '@/hooks/useRoutineConfig';
import { useRoutineBlocksDB } from '@/hooks/useRoutineBlocksDB';
import { useRoutineBlocks, type RoutineType, ROUTINES } from '@/hooks/useRoutineBlocks';
import { cn } from '@/lib/utils';
import { CalendarDays, Zap, Shield, TrendingUp, BookOpen, LayoutGrid, Sparkles, Utensils, Focus, Activity, CheckCircle2, Droplets, Dumbbell, Moon, Timer } from 'lucide-react';

const SOSTEN_GROUPS: SystemGroup[] = [
  {
    id: "estructural",
    name: "Hábitos Estructurales",
    icon: LayoutGrid,
    color: "bg-blue-500/20 text-blue-500",
    habits: [
      { id: "rutina-activacion", name: "Rutina de Activación", linkTo: "/activation-routine" },
      { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno" },
      { id: "horario-regular", name: "Horario Regular", isSleepSchedule: true },
      { id: "rutina-desactivacion", name: "Rutina de Desactivación", linkTo: "/deactivation-routine" },
    ],
  },
  {
    id: "apariencia",
    name: "Apariencia",
    icon: Sparkles,
    color: "bg-pink-500/20 text-pink-500",
    habits: [
      { id: "skincare-manana", name: "Skin Care Mañana" },
      { id: "skincare-noche", name: "Skin Care Noche" },
      { id: "banarme-vestirme", name: "Bañarme y Vestirme" },
    ],
  },
  {
    id: "alimentacion",
    name: "Alimentación y Agua",
    icon: Utensils,
    color: "bg-amber-500/20 text-amber-500",
    habits: [
      { id: "pre-entreno", name: "Pre-entreno", hasWater: true, hasMealPhoto: true },
      { id: "desayuno", name: "Desayuno", hasWater: true, hasMealPhoto: true },
      { id: "merienda-1", name: "Merienda 1", hasWater: true, hasMealPhoto: true },
      { id: "almuerzo", name: "Almuerzo", hasWater: true, hasMealPhoto: true },
      { id: "merienda-2", name: "Merienda 2", hasWater: true, hasMealPhoto: true },
      { id: "comida", name: "Comida", hasWater: true, hasMealPhoto: true },
      { id: "antes-dormir", name: "Antes de Dormir", hasWater: true, hasMealPhoto: true },
    ],
  },
];

const MEJORA_GROUPS: SystemGroup[] = [
  {
    id: "hobbys",
    name: "Mejora Hobbys",
    icon: BookOpen,
    color: "bg-purple-500/20 text-purple-500",
    habits: [
      { id: "lectura", name: "Lectura", hasTime: true },
      { id: "musica", name: "Música", hasTime: true },
      { id: "ajedrez", name: "Ajedrez", hasTime: true, hasCount: true, countLabel: "partidas" },
    ],
  },
];

const ALL_GROUPS = [...SOSTEN_GROUPS, ...MEJORA_GROUPS];
const TOTAL_HABITS = ALL_GROUPS.reduce((a, g) => a + g.habits.length, 0);
const WATER_HABIT_IDS = SOSTEN_GROUPS.flatMap(g => g.habits).filter(h => h.hasWater).map(h => h.id);
const TOTAL_WATER_HABITS = WATER_HABIT_IDS.length;

const ROUTINE_STYLES: Record<RoutineType, { active: string; inactive: string }> = {
  disciplina: { active: "bg-orange-500/20 border-orange-500/60 text-orange-500", inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40" },
  normal: { active: "bg-blue-500/20 border-blue-500/60 text-blue-500", inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40" },
  super: { active: "bg-purple-500/20 border-purple-500/60 text-purple-500", inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40" },
  descanso: { active: "bg-green-500/20 border-green-500/60 text-green-500", inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40" },
};

export default function DailyView() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const dayOfYear = Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000);
  const yearProgress = Math.round((dayOfYear / 365) * 100);

  const { data, loading, toggleCompletion, setTimeValue, setCountValue, toggleWater, setWorkAssignment, setMealPhoto, update } = useSystemsTracking();
  const { streak: overallStreak } = useOverallSystemStreak();

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

  const { blocks: routineBlocks, isLoaded: routineLoaded, routineType, setRoutineType, updateBlockFocus: updateRoutineBlockFocus } = useRoutineBlocks();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const completedHabits = ALL_GROUPS.reduce((sum, g) => sum + g.habits.filter(h => data.completions?.[h.id]).length, 0);
  const habitPct = TOTAL_HABITS > 0 ? Math.round((completedHabits / TOTAL_HABITS) * 100) : 0;
  const waterCompleted = WATER_HABIT_IDS.filter(id => data.completions?.[id]).length;
  const waterPct = TOTAL_WATER_HABITS > 0 ? Math.round((waterCompleted / TOTAL_WATER_HABITS) * 100) : 0;
  const totalBlocks = Object.keys(data.workAssignments).filter(id => !id.startsWith('__mode__')).length;
  const doneBlocks = Object.entries(data.workAssignments).filter(([id, area]) => area && !id.startsWith('__mode__') && data.blockCompletions?.[id]).length;
  const blockPct = totalBlocks > 0 ? Math.round((doneBlocks / totalBlocks) * 100) : 0;

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 pt-20 pb-24">
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary" />
              Mi Día
            </h1>
            <p className="text-sm text-muted-foreground capitalize mt-0.5 flex items-center gap-2">
              <CalendarDays className="w-3.5 h-3.5" />
              {formattedDate}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono">
            Día {dayOfYear} · {yearProgress}% del año
          </Badge>
        </div>

        <SystemsStatsPanel
          completions={data.completions}
          waterData={data.waterData}
          timeData={data.timeData}
          totalHabits={TOTAL_HABITS}
          blockCompletions={data.blockCompletions}
          workoutDuration={data.workoutDuration}
          wakeTime={data.wakeTime}
          sleepTime={data.sleepTime}
          currentStreak={overallStreak.current}
          longestStreak={overallStreak.longest}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Indicadores de Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase">Hábitos</span>
                </div>
                <p className="text-2xl font-bold">{completedHabits}<span className="text-sm text-muted-foreground">/{TOTAL_HABITS}</span></p>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full transition-all" style={{ width: `${habitPct}%` }} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase">Agua</span>
                </div>
                <p className="text-2xl font-bold">{waterCompleted}<span className="text-sm text-muted-foreground">/{TOTAL_WATER_HABITS}</span></p>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${waterPct}%` }} />
                </div>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase">Ejercicio</span>
                </div>
                <p className="text-2xl font-bold">{data.workoutDuration || 0}<span className="text-sm text-muted-foreground"> min</span></p>
                <p className="text-[10px] text-muted-foreground">Intensidad: {data.workoutIntensity || 0}/10</p>
              </div>
              <div className="rounded-lg bg-muted/30 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Moon className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-medium uppercase">Sueño</span>
                </div>
                <p className="text-lg font-bold">{data.wakeTime || '—'}<span className="text-xs text-muted-foreground"> / {data.sleepTime || '—'}</span></p>
                <p className="text-[10px] text-muted-foreground">Despertar / Dormir</p>
              </div>
            </div>
            {totalBlocks > 0 && (
              <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Timer className="h-3.5 w-3.5" />
                    <span>Bloques de trabajo</span>
                  </div>
                  <span className="font-medium">{doneBlocks}/{totalBlocks}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full transition-all" style={{ width: `${blockPct}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DailyGuide />

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Focus className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-bold uppercase tracking-wide">FOCUS</h2>
          </div>
          <QuickStatsGrid timeframe="today" />
        </Card>

        <MySystemsSection />

        <Card className="border-blue-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              Sostén
            </CardTitle>
            <p className="text-xs text-muted-foreground">Lo que te mantiene de pie</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {SOSTEN_GROUPS.map(group => (
              <SystemHabitGroup
                key={group.id}
                group={group}
                completions={data.completions}
                timeData={data.timeData}
                countData={data.countData}
                waterData={data.waterData}
                onToggle={toggleCompletion}
                onTimeChange={setTimeValue}
                onCountChange={setCountValue}
                onWaterToggle={toggleWater}
                workoutDuration={data.workoutDuration}
                workoutIntensity={data.workoutIntensity}
                onWorkoutDurationChange={v => update("workoutDuration", v)}
                onWorkoutIntensityChange={v => update("workoutIntensity", v)}
                wakeTime={data.wakeTime}
                sleepTime={data.sleepTime}
                onWakeTimeChange={v => update("wakeTime", v)}
                onSleepTimeChange={v => update("sleepTime", v)}
                mealPhotos={data.mealPhotos}
                onMealPhotoUpload={setMealPhoto}
              />
            ))}
          </CardContent>
        </Card>

        <Card className="border-purple-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Mejora
            </CardTitle>
            <p className="text-xs text-muted-foreground">Lo que te transforma</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Mejora Física</p>
              <WorkoutVisual
                duration={data.workoutDuration}
                intensity={data.workoutIntensity}
                onDurationChange={(v) => update("workoutDuration", v)}
                onIntensityChange={(v) => update("workoutIntensity", v)}
                completed={!!data.completions["entrenamiento-fisico"]}
                onToggleCompleted={() => toggleCompletion("entrenamiento-fisico")}
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Mejora Hobbys</p>
              <HobbyCards
                todayMinutes={{
                  lectura: data.timeData["lectura"] || 0,
                  musica: data.timeData["musica"] || 0,
                  ajedrez: data.timeData["ajedrez"] || 0,
                }}
                countData={{ ajedrez: data.countData["ajedrez"] || 0 }}
                onTimeChange={setTimeValue}
                onCountChange={setCountValue}
              />
            </div>

            <div>
              <LanguageSkillCards completions={{}} onToggle={() => {}} />
            </div>
          </CardContent>
        </Card>

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
            onUpdateFocus={updateRoutineBlockFocus}
          />
          <div className="lg:sticky lg:top-20 lg:self-start h-[calc(100vh-280px)]">
            <TaskPoolPanel
              unassignedTasks={unassignedTasks}
              onTaskCreated={refreshTasks}
            />
          </div>
        </div>

        <Separator />

        <TodayWorkout />

        <TaskAccordion />
      </div>
    </div>
  );
}
