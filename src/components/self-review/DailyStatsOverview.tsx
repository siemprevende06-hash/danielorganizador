import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Zap, Shield, TrendingUp, Focus, Clock, CheckCircle2, Droplets,
  Dumbbell, Moon, Timer, Target, Activity, BookOpen, GraduationCap,
  Briefcase, FolderKanban, ListTodo, Gamepad2, Brain
} from "lucide-react";
import type { SystemsTrackingData } from "@/hooks/useDailyReview";

interface Props {
  systemsTracking: SystemsTrackingData | null;
  blocksCompleted: number;
  blocksTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
}

const SOSTEN_HABIT_IDS = [
  "rutina-activacion", "alistamiento-desayuno", "horario-regular",
  "rutina-desactivacion", "skincare-manana", "skincare-noche",
  "banarme-vestirme",
  "pre-entreno", "desayuno", "merienda-1", "almuerzo",
  "merienda-2", "comida", "antes-dormir", "suplementos",
];

const MEJORA_HABIT_IDS = ["lectura", "musica", "ajedrez", "game"];
const FOCUS_AREA_IDS = ["universidad", "emprendimiento", "proyectos", "tareas"];

const TIME_GOALS: Record<string, number> = {
  lectura: 30, musica: 30, ajedrez: 15, game: 30,
  universidad: 120, emprendimiento: 60, proyectos: 60, tareas: 60,
  idiomas: 60, gym: 45,
};

const WATER_HABIT_IDS = ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"];

export function DailyStatsOverview({
  systemsTracking, blocksCompleted, blocksTotal,
  tasksCompleted, tasksTotal, habitsCompleted, habitsTotal,
  focusMinutes,
}: Props) {
  const [activeTab, setActiveTab] = useState<'general' | 'sosten' | 'mejora' | 'enfoque'>('general');

  const completions = systemsTracking?.completions || {};
  const timeData = systemsTracking?.timeData || {};
  const waterData = systemsTracking?.waterData || {};
  const blockCompletions = systemsTracking?.blockCompletions || {};
  const wakeTime = systemsTracking?.wakeTime || '';
  const sleepTime = systemsTracking?.sleepTime || '';
  const workoutDuration = systemsTracking?.workoutDuration || 0;
  const workoutIntensity = systemsTracking?.workoutIntensity || '';

  const pct = (done: number, total: number) => total > 0 ? Math.round((done / total) * 100) : 0;

  const sostenDone = SOSTEN_HABIT_IDS.filter(id => completions[id]).length;
  const sostenTotal = SOSTEN_HABIT_IDS.length;
  const sostenPct = pct(sostenDone, sostenTotal);

  const mejoraTime = MEJORA_HABIT_IDS.reduce((s, id) => s + (timeData[id] || 0), 0) + (workoutDuration || 0);
  const mejoraPcts = MEJORA_HABIT_IDS.map(id => {
    const spent = timeData[id] || 0;
    const goal = TIME_GOALS[id] || 30;
    return goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
  });
  if (workoutDuration > 0) mejoraPcts.push(Math.min(100, Math.round((workoutDuration / 45) * 100)));
  const mejoraScore = mejoraPcts.length > 0 ? Math.round(mejoraPcts.reduce((a, b) => a + b, 0) / mejoraPcts.length) : 0;

  const focusPcts = FOCUS_AREA_IDS.map(id => {
    const spent = timeData[id] || 0;
    const goal = TIME_GOALS[id] || 60;
    return goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
  });
  const focusScore = focusPcts.length > 0 ? Math.round(focusPcts.reduce((a, b) => a + b, 0) / focusPcts.length) : 0;

  const totalScore = Math.round(sostenPct * 0.10 + mejoraScore * 0.40 + focusScore * 0.50);

  const totalMinutes = Object.values(timeData).reduce((a, b) => a + b, 0);
  const waterCount = WATER_HABIT_IDS.filter(id => completions[id] || waterData[id]).length;
  const waterTotal = WATER_HABIT_IDS.length;
  const totalBlocksSys = Object.values(blockCompletions).length || blocksTotal;
  const doneBlocks = Object.values(blockCompletions).filter(Boolean).length;

  const getSleepHours = () => {
    if (!wakeTime || !sleepTime) return null;
    const [wh, wm] = wakeTime.split(":").map(Number);
    const [sh, sm] = sleepTime.split(":").map(Number);
    const wake = wh * 60 + wm;
    const sleep = sh * 60 + sm;
    let diff = wake > sleep ? (24 * 60 - sleep) + wake : (wake - sleep + 24 * 60);
    return Math.round(diff / 6) / 10;
  };
  const sleepHours = getSleepHours();

  const tabHeader = (id: 'general' | 'sosten' | 'mejora' | 'enfoque', label: string, icon: React.ReactNode) => (
    <button
      key={id}
      onClick={() => setActiveTab(id)}
      className={cn(
        "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
        activeTab === id
          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
          : "bg-muted/50 text-muted-foreground hover:bg-muted"
      )}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <Card className="border-border overflow-hidden">
      <CardContent className="pt-6 space-y-5">
        {/* Score Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreCard icon={Shield} label="Sostén" value={`${sostenPct}%`} color="text-blue-500" bgColor="bg-blue-500/10" />
          <ScoreCard icon={TrendingUp} label="Mejora" value={`${mejoraScore}%`} color="text-purple-500" bgColor="bg-purple-500/10" />
          <ScoreCard icon={Brain} label="Enfoque" value={`${focusScore}%`} color="text-amber-500" bgColor="bg-amber-500/10" />
          <ScoreCard icon={Zap} label="Total" value={`${totalScore}%`} color="text-emerald-500" bgColor="bg-emerald-500/10" />
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {tabHeader('general', 'General', <Activity className="w-4 h-4" />)}
          {tabHeader('sosten', 'Sostén', <Shield className="w-4 h-4" />)}
          {tabHeader('mejora', 'Mejora', <TrendingUp className="w-4 h-4" />)}
          {tabHeader('enfoque', 'Enfoque', <Focus className="w-4 h-4" />)}
        </div>

        {/* Tab Content */}
        {activeTab === 'general' && <GeneralTab
          habitsDone={habitsCompleted} habitsTotal={habitsTotal}
          waterCount={waterCount} waterTotal={waterTotal}
          workoutDuration={workoutDuration} workoutIntensity={workoutIntensity}
          wakeTime={wakeTime} sleepTime={sleepTime} sleepHours={sleepHours}
          blocksDone={doneBlocks || blocksCompleted} blocksTotal={totalBlocksSys || blocksTotal}
          tasksDone={tasksCompleted} tasksTotal={tasksTotal}
          totalMinutes={totalMinutes} focusMinutes={focusMinutes}
        />}

        {activeTab === 'sosten' && <SostenTab
          completions={completions} sostenDone={sostenDone} sostenTotal={sostenTotal}
          waterCount={waterCount} waterTotal={waterTotal}
        />}

        {activeTab === 'mejora' && <MejoraTab
          timeData={timeData} completions={completions}
          workoutDuration={workoutDuration} workoutIntensity={workoutIntensity}
        />}

        {activeTab === 'enfoque' && <EnfoqueTab
          timeData={timeData} completions={completions}
          tasksDone={tasksCompleted} tasksTotal={tasksTotal}
        />}
      </CardContent>
    </Card>
  );
}

function ScoreCard({ icon: Icon, label, value, color, bgColor }: {
  icon: any; label: string; value: string; color: string; bgColor: string;
}) {
  return (
    <Card className="p-3 text-center">
      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5", bgColor)}>
        <Icon className={cn("w-4 h-4", color)} />
      </div>
      <p className={cn("text-lg font-bold", color)}>{value}</p>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
    </Card>
  );
}

function GeneralTab({
  habitsDone, habitsTotal, waterCount, waterTotal,
  workoutDuration, workoutIntensity, wakeTime, sleepTime, sleepHours,
  blocksDone, blocksTotal, tasksDone, tasksTotal,
  totalMinutes, focusMinutes,
}: {
  habitsDone: number; habitsTotal: number;
  waterCount: number; waterTotal: number;
  workoutDuration: number; workoutIntensity: string;
  wakeTime: string; sleepTime: string; sleepHours: number | null;
  blocksDone: number; blocksTotal: number;
  tasksDone: number; tasksTotal: number;
  totalMinutes: number; focusMinutes: number;
}) {
  const items = [
    { icon: CheckCircle2, label: "Hábitos", value: `${habitsDone}/${habitsTotal}`, color: "text-green-500", pct: habitsTotal > 0 ? Math.round(habitsDone/habitsTotal*100) : 0, barColor: "bg-green-500" },
    { icon: Droplets, label: "Agua", value: `${waterCount}/${waterTotal}`, color: "text-blue-500", pct: waterTotal > 0 ? Math.round(waterCount/waterTotal*100) : 0, barColor: "bg-blue-500" },
    { icon: Dumbbell, label: "Ejercicio", value: `${workoutDuration} min`, color: "text-orange-500", sub: `Intensidad: ${workoutIntensity}`, pct: workoutDuration > 0 ? Math.min(100, Math.round(workoutDuration/45*100)) : 0, barColor: "bg-orange-500" },
    { icon: Moon, label: "Sueño", value: wakeTime ? `${wakeTime} - ${sleepTime}` : '--', color: "text-indigo-500", sub: sleepHours ? `${sleepHours}h` : '', pct: sleepHours ? Math.min(100, Math.round(sleepHours/8*100)) : 0, barColor: "bg-indigo-500" },
    { icon: Timer, label: "Bloques", value: `${blocksDone}/${blocksTotal}`, color: "text-amber-500", pct: blocksTotal > 0 ? Math.round(blocksDone/blocksTotal*100) : 0, barColor: "bg-amber-500" },
    { icon: Target, label: "Tareas", value: `${tasksDone}/${tasksTotal}`, color: "text-rose-500", pct: tasksTotal > 0 ? Math.round(tasksDone/tasksTotal*100) : 0, barColor: "bg-rose-500" },
    { icon: Clock, label: "Tiempo total", value: `${totalMinutes} min`, color: "text-primary", pct: 0, barColor: "" },
    { icon: Focus, label: "Minutos de foco", value: `${focusMinutes} min`, color: "text-purple-500", pct: focusMinutes > 0 ? Math.min(100, Math.round(focusMinutes/120*100)) : 0, barColor: "bg-purple-500" },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg bg-muted/30 p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <item.icon className={cn("h-3.5 w-3.5", item.color)} />
            <span className="text-[10px] font-medium uppercase">{item.label}</span>
          </div>
          <p className="text-base font-bold">{item.value}</p>
          {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
          {item.pct > 0 && (
            <Progress value={item.pct} className={cn("h-1.5", item.barColor)} />
          )}
        </div>
      ))}
    </div>
  );
}

function SostenTab({ completions, sostenDone, sostenTotal, waterCount, waterTotal }: {
  completions: Record<string, boolean>; sostenDone: number; sostenTotal: number;
  waterCount: number; waterTotal: number;
}) {
  const groups = [
    { id: "estructural", name: "Estructurales", color: "text-blue-500", bar: "bg-blue-500", habits: ["rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion"] },
    { id: "apariencia", name: "Apariencia", color: "text-pink-500", bar: "bg-pink-500", habits: ["skincare-manana", "skincare-noche", "banarme-vestirme"] },
    { id: "alimentacion", name: "Alimentación", color: "text-amber-500", bar: "bg-amber-500", habits: ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir", "suplementos"] },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Total Sostén</span>
        <span className="text-lg font-bold text-blue-500">{sostenDone}/{sostenTotal}</span>
      </div>
      <Progress value={sostenTotal > 0 ? sostenDone/sostenTotal*100 : 0} className="h-2" indicatorClassName="bg-blue-500" />
      <div className="space-y-3 pt-2">
        {groups.map(g => {
          const done = g.habits.filter(h => completions[h]).length;
          const pct = g.habits.length > 0 ? Math.round(done/g.habits.length*100) : 0;
          return (
            <div key={g.id}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className={cn("font-medium", g.color)}>{g.name}</span>
                <span className="text-muted-foreground">{done}/{g.habits.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {g.habits.map(h => (
                  <span key={h} className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded-full",
                    completions[h] ? "bg-green-500/20 text-green-600" : "bg-muted text-muted-foreground"
                  )}>
                    {h.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
              <Progress value={pct} className="h-1 mt-1" indicatorClassName={g.bar} />
            </div>
          );
        })}
      </div>
      <div className="pt-2 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Agua</span>
          <span className="font-bold">{waterCount}/{waterTotal} vasos</span>
        </div>
      </div>
    </div>
  );
}

function MejoraTab({ timeData, completions, workoutDuration, workoutIntensity }: {
  timeData: Record<string, number>; completions: Record<string, boolean>;
  workoutDuration: number; workoutIntensity: string;
}) {
  const items = [
    { id: "lectura", name: "Lectura", icon: BookOpen, color: "text-cyan-500", goal: 30 },
    { id: "musica", name: "Música", icon: BookOpen, color: "text-pink-500", goal: 30 },
    { id: "ajedrez", name: "Ajedrez", icon: Gamepad2, color: "text-emerald-500", goal: 15 },
    { id: "game", name: "Game (Seducción)", icon: Gamepad2, color: "text-purple-500", goal: 30 },
    { id: "idiomas", name: "Idiomas", icon: GraduationCap, color: "text-indigo-500", goal: 60 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Progreso Mejora</span>
        <span className="text-lg font-bold text-purple-500">{Math.round(items.reduce((s, i) => s + Math.min(100, ((timeData[i.id]||0)/i.goal)*100), 0) / items.length)}%</span>
      </div>
      <div className="space-y-3">
        {items.map(item => {
          const spent = timeData[item.id] || 0;
          const pct = Math.min(100, Math.round((spent / item.goal) * 100));
          return (
            <div key={item.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                  <span>{item.name}</span>
                </span>
                <span className="text-muted-foreground">{spent}/{item.goal} min</span>
              </div>
              <Progress value={pct} className="h-1.5" indicatorClassName={item.color.replace('text-', 'bg-')} />
            </div>
          );
        })}
      </div>
      {workoutDuration > 0 && (
        <div className="pt-3 border-t border-border space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5"><Dumbbell className="w-3.5 h-3.5 text-orange-500" /> Entreno</span>
            <span className="text-muted-foreground">{workoutDuration} min · {workoutIntensity}</span>
          </div>
          <Progress value={Math.min(100, Math.round(workoutDuration/45*100))} className="h-1.5" indicatorClassName="bg-orange-500" />
        </div>
      )}
    </div>
  );
}

function EnfoqueTab({ timeData, completions, tasksDone, tasksTotal }: {
  timeData: Record<string, number>; completions: Record<string, boolean>;
  tasksDone: number; tasksTotal: number;
}) {
  const areas = [
    { id: "universidad", name: "Universidad", icon: GraduationCap, color: "text-blue-500", bar: "bg-blue-500", goal: 120 },
    { id: "emprendimiento", name: "Emprendimiento", icon: Briefcase, color: "text-purple-500", bar: "bg-purple-500", goal: 60 },
    { id: "proyectos", name: "Proyectos", icon: FolderKanban, color: "text-amber-500", bar: "bg-amber-500", goal: 60 },
    { id: "tareas", name: "Tareas generales", icon: ListTodo, color: "text-rose-500", bar: "bg-rose-500", goal: 60 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Horas invertidas hoy</span>
        <span className="text-lg font-bold text-amber-500">{areas.reduce((s, a) => s + (timeData[a.id]||0), 0)} min</span>
      </div>
      <div className="space-y-3">
        {areas.map(area => {
          const spent = timeData[area.id] || 0;
          const pct = Math.min(100, Math.round((spent / area.goal) * 100));
          const isDone = completions[area.id];
          return (
            <div key={area.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <area.icon className={cn("w-3.5 h-3.5", area.color)} />
                  <span>{area.name}</span>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                </span>
                <span className="text-muted-foreground">{spent}/{area.goal} min</span>
              </div>
              <Progress value={pct} className="h-2" indicatorClassName={area.bar} />
            </div>
          );
        })}
      </div>
      <div className="pt-3 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-rose-500" /> Tareas completadas</span>
          <span className="font-bold">{tasksDone}/{tasksTotal}</span>
        </div>
      </div>
    </div>
  );
}