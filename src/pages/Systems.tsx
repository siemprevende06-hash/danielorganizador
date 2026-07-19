import { useState } from "react";
import { Brain, Dumbbell, BookOpen, Sparkles, Utensils, LayoutGrid, Shield, TrendingUp, Target, GraduationCap, Briefcase, Code2, Languages, ListTodo, BarChart3, Gamepad2, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SystemHabitGroup, type SystemGroup } from "@/components/systems/SystemHabitGroup";
import { SystemsStatsPanel } from "@/components/systems/SystemsStatsPanel";
import { SystemCirclesOverview } from "@/components/systems/SystemCirclesOverview";
import { DayTimeline } from "@/components/systems/DayTimeline";
import { WorkBlockSquares } from "@/components/systems/WorkBlockSquares";
import { TodayTasksList } from "@/components/systems/TodayTasksList";
import { SystemsWeeklyChart } from "@/components/systems/SystemsWeeklyChart";
import { FocusTasksPanel } from "@/components/systems/FocusTasksPanel";
import { Challenge90Days } from "@/components/systems/Challenge90Days";
import { MacroSectionCard } from "@/components/systems/MacroSectionCard";
import { ProgressContribution } from "@/components/systems/ProgressContribution";
import { VisionAntiVisionPanel } from "@/components/systems/VisionAntiVisionPanel";
import { DetailedStatsPanel } from "@/components/systems/DetailedStatsPanel";
import { ConfidenceFromFacts } from "@/components/systems/ConfidenceFromFacts";
import { useSystemsTracking } from "@/hooks/useSystemsTracking";
import { useOverallSystemStreak } from "@/hooks/useOverallSystemStreak";
import { HobbyCards } from "@/components/systems/HobbyCards";
import { LanguageSkillCards } from "@/components/systems/LanguageSkillCards";
import { WorkoutVisual } from "@/components/systems/WorkoutVisual";
import { OfflineIndicator } from "@/components/systems/OfflineIndicator";
import { PresetSchedulePicker } from "@/components/routine/PresetSchedulePicker";
import { WheelOfLife } from "@/components/WheelOfLife";
import { HombreTopWheel } from "@/components/HombreTopWheel";
import { TimeframeSelector } from "@/components/TimeframeSelector";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { useAreaScores } from "@/hooks/useAreaScores";
import { useHombreTopScores } from "@/hooks/useHombreTopScores";

// === HÁBITOS DE SOSTÉN (te mantienen) ===
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
      { id: "suplementos", name: "Suplementos" },
    ],
  },
];

// === MEJORA Y TRABAJO DIARIO (te transforma) ===
// Nota: workout y idiomas se renderizan con componentes visuales dedicados
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
      { id: "game", name: "Game", hasTime: true },
    ],
  },
];

// === FOCO (te avanza) — sin habits, son áreas de trabajo ===
const FOCO_AREAS = [
  { id: "universidad", name: "Universidad", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10", link: "/university" },
  { id: "emprendimiento", name: "Emprendimiento", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10", link: "/entrepreneurship" },
  { id: "proyectos", name: "Proyectos", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10", link: "/projects" },
  { id: "tareas", name: "Tareas", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10", link: "/tasks" },
];

const ALL_GROUPS = [...SOSTEN_GROUPS, ...MEJORA_GROUPS];
const TOTAL_HABITS = ALL_GROUPS.reduce((a, g) => a + g.habits.length, 0);

const AREA_LABELS: Record<string, string> = {
  universidad: "🎓 Universidad",
  emprendimiento: "💼 Emprendimiento",
  proyectos: "💻 Proyectos",
  idiomas: "🌐 Idiomas",
};

const countCompleted = (groups: SystemGroup[], completions: Record<string, boolean>) => {
  let done = 0, total = 0;
  groups.forEach(g => g.habits.forEach(h => {
    total++;
    if (completions[h.id]) done++;
  }));
  return { done, total };
};

export default function Systems() {
  const [showDetailed, setShowDetailed] = useState(false);
  const {
    data, loading,
    toggleCompletion, setTimeValue, setCountValue, toggleWater,
    setWorkAssignment, toggleBlock, setMealPhoto, update,
  } = useSystemsTracking();
  const { streak: overallStreak } = useOverallSystemStreak();
  const { timeframe, view } = useTimeframe();
  const { scores: areaScores, averages, loading: areaLoading } = useAreaScores(timeframe, view);
  const {
    scores: hommeScores,
    esfuerzoAverage,
    resultadosAverage,
    loading: hommeLoading,
  } = useHombreTopScores(timeframe, view);

  const wheelValues = areaScores.map((s) => Math.round(s.esfuerzo / 10));
  const wheelValues2 = areaScores.map((s) => Math.round(s.resultados / 10));
  const wheelAvg = Math.round(averages.esfuerzo / 10);
  const wheelAvg2 = Math.round(averages.resultados / 10);
  const hommeValues = hommeScores.map((s) => s.esfuerzo);
  const hommeValues2 = hommeScores.map((s) => s.resultados);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // === Cálculos de progreso por sección ===
  const sosten = countCompleted(SOSTEN_GROUPS, data.completions);
  const mejora = countCompleted(MEJORA_GROUPS, data.completions);

  const sostenPercent = sosten.total > 0 ? Math.round((sosten.done / sosten.total) * 100) : 0;
  const mejoraPercent = mejora.total > 0 ? Math.round((mejora.done / mejora.total) * 100) : 0;

  // Foco: % basado en celdas de 30min (3 por bloque × 7 bloques = 21). Excluir sentinel '__mode__'.
  const totalWorkBlocks = 21;
  const completedWorkBlocks = Object.entries(data.workAssignments)
    .filter(([cellId, area]) => area && !cellId.startsWith("__mode__") && data.blockCompletions[cellId]).length;
  const focoPercent = Math.round((completedWorkBlocks / totalWorkBlocks) * 100);

  // Progreso global del día
  const dailyPercent = Math.round((sostenPercent + mejoraPercent + focoPercent) / 3);

  // Contribuciones (estimadas por día)
  const weeklyContribution = dailyPercent / 7;
  const monthlyContribution = dailyPercent / 30;
  const quarterlyContribution = dailyPercent / 90;

  // Build work block labels for timeline
  const workBlockLabels: Record<string, string> = {};
  Object.entries(data.workAssignments).forEach(([blockId, area]) => {
    if (area && !blockId.startsWith("__mode__")) workBlockLabels[blockId] = AREA_LABELS[area] || area;
  });

  return (
    <div className="ios-systems min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 ios-fade-in">
          <div className="flex items-center justify-center gap-2">
            <div className="p-3 rounded-2xl ios-grad-header">
              <Brain className="h-7 w-7 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold" style={{ background: "linear-gradient(135deg, hsl(211 100% 50%), hsl(192 100% 50%))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Sistemas de Vida
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            3 fuerzas que definen tu día: Sostén · Mejora · Foco
          </p>
          <div className="flex justify-center"><OfflineIndicator /></div>
        </div>

        {/* Selector de rutina del día (presets) */}
        <PresetSchedulePicker />

        {/* Indicadores de esfuerzo: Rueda de la Vida + Hombre Top */}
        <TimeframeSelector />
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


        {/* Circles overview */}
        <SystemCirclesOverview
          groups={ALL_GROUPS}
          completions={data.completions}
          workAssignments={data.workAssignments}
          blockCompletions={data.blockCompletions}
        />

        {/* Progreso & Contribución */}
        <ProgressContribution
          dailyPercent={dailyPercent}
          weeklyPercent={Math.min(100, dailyPercent)}
          monthlyPercent={Math.min(100, Math.round(dailyPercent * 0.8))}
          quarterlyPercent={Math.min(100, Math.round(dailyPercent * 0.6))}
          weeklyContribution={weeklyContribution}
          monthlyContribution={monthlyContribution}
          quarterlyContribution={quarterlyContribution}
        />

        {/* Stats Panel */}
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

        {/* Switch para estadísticas detalladas */}
        <Card className="p-3 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <Label htmlFor="detailed-stats" className="text-sm font-medium cursor-pointer">
              Estadísticas Súper Detalladas
            </Label>
          </div>
          <Switch
            id="detailed-stats"
            checked={showDetailed}
            onCheckedChange={setShowDetailed}
          />
        </Card>

        {showDetailed && <DetailedStatsPanel totalHabits={TOTAL_HABITS} />}
        {/* === SECCIÓN 1: HÁBITOS DE SOSTÉN === */}
        <MacroSectionCard
          title="Hábitos de Sostén"
          subtitle="Lo que te mantiene de pie"
          icon={Shield}
          gradient="from-blue-500/10 to-blue-500/5"
          borderColor="border-blue-500/30"
          completed={sosten.done}
          total={sosten.total}
          description="Estructurales · Apariencia · Alimentación. Sin esto, todo lo demás se cae."
        >
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
        </MacroSectionCard>

        {/* === SECCIÓN 2: MEJORA Y TRABAJO DIARIO === */}
        <MacroSectionCard
          title="Mejora y Trabajo Diario"
          subtitle="Lo que te transforma como persona"
          icon={TrendingUp}
          gradient="from-purple-500/10 to-purple-500/5"
          borderColor="border-purple-500/30"
          completed={mejora.done}
          total={mejora.total}
          description="Idiomas · Hobbys · Físico. Pequeñas mejoras diarias = gran cambio anual."
        >
          {/* Mejora Física: visual destacado */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Mejora Física</p>
            <WorkoutVisual
              duration={data.workoutDuration}
              intensity={data.workoutIntensity}
              onDurationChange={(v) => update("workoutDuration", v)}
              onIntensityChange={(v) => update("workoutIntensity", v)}
              completed={!!data.completions["entrenamiento-fisico"]}
              onToggleCompleted={() => toggleCompletion("entrenamiento-fisico")}
            />
          </div>

          {/* Mejora Hobbys: lectura, música, ajedrez */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Mejora Hobbys</p>
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

          {/* Gaming */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Gaming</p>
            <Card className="p-3 ring-2 ring-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-semibold">Gaming</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    type="number"
                    min={0}
                    value={data.timeData["game"] || ""}
                    onChange={e => setTimeValue("game", parseInt(e.target.value) || 0)}
                    placeholder="min"
                    className="w-16 h-7 text-xs text-center"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">Tiempo diario para aprender seducción</p>
            </Card>
          </div>

          {/* Idiomas: 6 habilidades */}
          <LanguageSkillCards completions={data.completions} onToggle={toggleCompletion} timeMinutes={data.timeData?.idiomas || 0} onTimeChange={(m) => setTimeValue('idiomas', m)} />
        </MacroSectionCard>

        {/* === SECCIÓN 3: FOCO === */}
        <MacroSectionCard
          title="Foco"
          subtitle="Lo que te hace avanzar"
          icon={Target}
          gradient="from-amber-500/10 to-amber-500/5"
          borderColor="border-amber-500/30"
          completed={completedWorkBlocks}
          total={totalWorkBlocks}
          description="Universidad · Emprendimiento · Proyectos · Tareas. Aquí ocurre el progreso real."
        >
          <div className="grid grid-cols-2 gap-2">
            {FOCO_AREAS.map(area => {
              const Icon = area.icon;
              const blocksInArea = Object.entries(data.workAssignments)
                .filter(([_, a]) => a === area.id).length;
              return (
                <Link key={area.id} to={area.link}>
                  <Card className={`p-3 hover:scale-[1.02] transition-all ${area.bg} border-2 hover:border-primary/40`}>
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-5 w-5 ${area.color}`} />
                      <span className="font-semibold text-sm">{area.name}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {blocksInArea > 0 ? `${blocksInArea} bloque(s) hoy` : "Sin asignar"}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Tiempo manual para áreas FOCO */}
          <div className="space-y-1.5 pt-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">Tiempo dedicado hoy</p>
            <div className="grid grid-cols-2 gap-2">
              <Card className="p-3 ring-2 ring-purple-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-semibold">Universidad</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={data.timeData["universidad"] || ""}
                      onChange={e => setTimeValue("universidad", parseInt(e.target.value) || 0)}
                      placeholder="min"
                      className="w-16 h-7 text-xs text-center"
                    />
                  </div>
                </div>
              </Card>
              <Card className="p-3 ring-2 ring-amber-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-semibold">Emprendimiento</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      type="number"
                      min={0}
                      value={data.timeData["emprendimiento"] || ""}
                      onChange={e => setTimeValue("emprendimiento", parseInt(e.target.value) || 0)}
                      placeholder="min"
                      className="w-16 h-7 text-xs text-center"
                    />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <div className="pt-2">
            <FocusTasksPanel />
          </div>
          <div className="pt-2">
            <TodayTasksList />
          </div>
          <WorkBlockSquares
            cellAssignments={data.workAssignments}
            cellCompletions={data.blockCompletions}
            onAssignArea={setWorkAssignment}
            onToggleCell={toggleBlock}
          />
        </MacroSectionCard>

        {/* === CONEXIÓN: Visión vs Anti-Visión === */}
        <VisionAntiVisionPanel
          sostenPercent={sostenPercent}
          mejoraPercent={mejoraPercent}
          focoPercent={focoPercent}
        />

        {/* Confianza Basada en Hechos */}
        <ConfidenceFromFacts totalHabits={TOTAL_HABITS} />

        {/* Day Timeline */}
        <DayTimeline
          workBlockAssignments={workBlockLabels}
          blockCompletions={data.blockCompletions}
          onToggleBlock={toggleBlock}
        />

        {/* Link al Plan Identidad (movido a su propia página) */}
        <Link to="/plan-identidad">
          <Card className="p-4 hover:scale-[1.01] transition-all border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🪞</div>
              <div className="flex-1">
                <p className="font-bold">Plan Identidad</p>
                <p className="text-[11px] text-muted-foreground">
                  Punto A → Punto B, tareas y subtareas, Mi Porqué y Recompensas
                </p>
              </div>
              <span className="text-xs text-primary">Abrir →</span>
            </div>
          </Card>
        </Link>

        {/* 90 Day Challenge */}
        <Challenge90Days />

        {/* Statistics Charts */}
        <SystemsWeeklyChart />
      </div>
    </div>
  );
}
