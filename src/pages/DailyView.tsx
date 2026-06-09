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
import { DayTimeline } from '@/components/systems/DayTimeline';
import { HobbyCards } from '@/components/systems/HobbyCards';
import { LanguageSkillCards } from '@/components/systems/LanguageSkillCards';
import { WorkoutVisual } from '@/components/systems/WorkoutVisual';
import { useSystemsTracking } from '@/hooks/useSystemsTracking';
import { CalendarDays, Zap, Shield, TrendingUp, BookOpen, LayoutGrid, Sparkles, Utensils } from 'lucide-react';

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

const AREA_LABELS: Record<string, string> = {
  universidad: "🎓 Universidad",
  emprendimiento: "💼 Emprendimiento",
  proyectos: "💻 Proyectos",
  idiomas: "🌐 Idiomas",
};

export default function DailyView() {
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: es });
  const dayOfYear = Math.ceil((today.getTime() - new Date(today.getFullYear(), 0, 1).getTime()) / 86400000);
  const yearProgress = Math.round((dayOfYear / 365) * 100);

  const { data, loading, toggleCompletion, setTimeValue, setCountValue, toggleWater, setWorkAssignment, toggleBlock, setMealPhoto, update } = useSystemsTracking();

  const workBlockLabels: Record<string, string> = {};
  Object.entries(data.workAssignments).forEach(([blockId, area]) => {
    if (area) workBlockLabels[blockId] = AREA_LABELS[area] || area;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

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
        />

        <DailyGuide />

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
              <LanguageSkillCards times={data.timeData} onTimeChange={setTimeValue} />
            </div>
          </CardContent>
        </Card>

        <Separator className="my-2" />

        <DayTimeline
          workBlockAssignments={workBlockLabels}
          blockCompletions={data.blockCompletions}
          onToggleBlock={toggleBlock}
        />

        <Separator className="my-2" />

        <TodayWorkout />

        <TaskAccordion />
      </div>
    </div>
  );
}
