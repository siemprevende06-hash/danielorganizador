import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  Zap, Shield, TrendingUp, Focus, Clock, CheckCircle2, Droplets,
  Dumbbell, Moon, Timer, Target, Activity, BookOpen, GraduationCap,
  Briefcase, FolderKanban, ListTodo, Gamepad2, Brain, Flame, Trophy,
  Sparkles, LayoutGrid, Utensils
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

  const TABS = [
    { id: 'general' as const, label: 'General', icon: Activity, color: 'text-primary' },
    { id: 'sosten' as const, label: 'Sostén', icon: Shield, color: 'text-blue-500' },
    { id: 'mejora' as const, label: 'Mejora', icon: TrendingUp, color: 'text-purple-500' },
    { id: 'enfoque' as const, label: 'Enfoque', icon: Focus, color: 'text-amber-500' },
  ];

  return (
    <div className="space-y-4">
      {/* Score Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ScoreCard icon={Shield} label="Sostén" value={`${sostenPct}%`} pct={sostenPct} color="blue" />
        <ScoreCard icon={TrendingUp} label="Mejora" value={`${mejoraScore}%`} pct={mejoraScore} color="purple" />
        <ScoreCard icon={Brain} label="Enfoque" value={`${focusScore}%`} pct={focusScore} color="amber" />
        <ScoreCard icon={Zap} label="Total" value={`${totalScore}%`} pct={totalScore} color="emerald" />
      </div>

      {/* Tab Navigation - glass cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TABS.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative rounded-2xl p-3 text-left transition-all border-0 backdrop-blur-xl overflow-hidden",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : "bg-white/80 dark:bg-zinc-900/80 shadow-sm hover:shadow-md"
              )}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={cn("text-lg", isActive ? "text-primary-foreground" : tab.color)}>
                  <tab.icon className="w-5 h-5" />
                </span>
              </div>
              <div className={cn("text-xs font-semibold leading-tight", isActive ? "text-primary-foreground" : "")}>
                {tab.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'general' && <GeneralTab
          habitsDone={habitsCompleted} habitsTotal={habitsTotal}
          waterCount={waterCount} waterTotal={waterTotal}
          workoutDuration={workoutDuration} workoutIntensity={workoutIntensity}
          wakeTime={wakeTime} sleepTime={sleepTime} sleepHours={sleepHours}
          blocksDone={doneBlocks || blocksCompleted} blocksTotal={totalBlocksSys || blocksTotal}
          tasksDone={tasksCompleted} tasksTotal={tasksTotal}
          totalMinutes={totalMinutes} focusMinutes={focusMinutes}
          sostenPct={sostenPct} mejoraPct={mejoraScore} focusPct={focusScore}
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
      </div>
    </div>
  );
}

function ScoreCard({ icon: Icon, label, value, pct, color }: {
  icon: any; label: string; value: string; pct: number; color: string;
}) {
  const colors: Record<string, { border: string; bg: string; text: string; bar: string }> = {
    blue: { border: "border-blue-500/30", bg: "bg-blue-500/10", text: "text-blue-500", bar: "bg-blue-500" },
    purple: { border: "border-purple-500/30", bg: "bg-purple-500/10", text: "text-purple-500", bar: "bg-purple-500" },
    amber: { border: "border-amber-500/30", bg: "bg-amber-500/10", text: "text-amber-500", bar: "bg-amber-500" },
    emerald: { border: "border-emerald-500/30", bg: "bg-emerald-500/10", text: "text-emerald-500", bar: "bg-emerald-500" },
  };
  const c = colors[color] || colors.blue;

  return (
    <Card className={cn("border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden")}>
      <div className={cn("h-1 w-full", c.bg)} />
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
            <Icon className={cn("w-4 h-4", c.text)} />
          </div>
          <span className={cn("text-lg font-bold", c.text)}>{value}</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <Progress value={pct} className="h-1.5" indicatorClassName={c.bar} />
      </CardContent>
    </Card>
  );
}

function GeneralTab({
  habitsDone, habitsTotal, waterCount, waterTotal,
  workoutDuration, workoutIntensity, wakeTime, sleepTime, sleepHours,
  blocksDone, blocksTotal, tasksDone, tasksTotal,
  totalMinutes, focusMinutes, sostenPct, mejoraPct, focusPct,
}: {
  habitsDone: number; habitsTotal: number;
  waterCount: number; waterTotal: number;
  workoutDuration: number; workoutIntensity: string;
  wakeTime: string; sleepTime: string; sleepHours: number | null;
  blocksDone: number; blocksTotal: number;
  tasksDone: number; tasksTotal: number;
  totalMinutes: number; focusMinutes: number;
  sostenPct: number; mejoraPct: number; focusPct: number;
}) {
  const items = [
    { icon: CheckCircle2, label: "Hábitos", value: habitsDone, suffix: `/${habitsTotal}`, pct: habitsTotal > 0 ? Math.round(habitsDone/habitsTotal*100) : 0, barColor: "bg-green-500", iconColor: "text-green-500" },
    { icon: Droplets, label: "Agua", value: waterCount, suffix: `/${waterTotal}`, pct: waterTotal > 0 ? Math.round(waterCount/waterTotal*100) : 0, barColor: "bg-blue-500", iconColor: "text-blue-500" },
    { icon: Dumbbell, label: "Ejercicio", value: workoutDuration, suffix: " min", sub: `Intensidad: ${workoutIntensity}`, pct: workoutDuration > 0 ? Math.min(100, Math.round(workoutDuration/45*100)) : 0, barColor: "bg-orange-500", iconColor: "text-orange-500" },
    { icon: Moon, label: "Sueño", value: wakeTime || '—', suffix: sleepTime ? ` / ${sleepTime}` : '', sub: sleepHours ? `${sleepHours}h` : '', pct: sleepHours ? Math.min(100, Math.round(sleepHours/8*100)) : 0, barColor: "bg-indigo-500", iconColor: "text-indigo-500" },
    { icon: Timer, label: "Bloques", value: blocksDone, suffix: `/${blocksTotal}`, pct: blocksTotal > 0 ? Math.round(blocksDone/blocksTotal*100) : 0, barColor: "bg-amber-500", iconColor: "text-amber-500" },
    { icon: Target, label: "Tareas", value: tasksDone, suffix: `/${tasksTotal}`, pct: tasksTotal > 0 ? Math.round(tasksDone/tasksTotal*100) : 0, barColor: "bg-rose-500", iconColor: "text-rose-500" },
    { icon: Clock, label: "Tiempo invertido", value: totalMinutes, suffix: " min", pct: 0, barColor: "", iconColor: "text-primary" },
    { icon: Focus, label: "Minutos de foco", value: focusMinutes, suffix: " min", pct: focusMinutes > 0 ? Math.min(100, Math.round(focusMinutes/120*100)) : 0, barColor: "bg-purple-500", iconColor: "text-purple-500" },
  ];

  return (
    <>
      {/* Score breakdown chips */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Sostén", pct: sostenPct, color: "blue" },
          { label: "Mejora", pct: mejoraPct, color: "purple" },
          { label: "Enfoque", pct: focusPct, color: "amber" },
        ].map(s => (
          <div key={s.label} className={cn(
            "rounded-2xl p-3 text-center border-0 backdrop-blur-xl",
            "bg-white/80 dark:bg-zinc-900/80 shadow-sm"
          )}>
            <p className={cn("text-lg font-bold", `text-${s.color}-500`)}>{s.pct}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <Progress value={s.pct} className="h-1 mt-1.5" indicatorClassName={`bg-${s.color}-500`} />
          </div>
        ))}
      </div>

      {/* Indicator cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-2xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm p-3 space-y-1.5">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <item.icon className={cn("h-3.5 w-3.5", item.iconColor)} />
              <span className="text-[10px] font-medium uppercase">{item.label}</span>
            </div>
            <p className="text-xl font-bold">{item.value}<span className="text-xs text-muted-foreground font-normal">{item.suffix}</span></p>
            {item.sub && <p className="text-[10px] text-muted-foreground">{item.sub}</p>}
            {item.pct > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5">
                <div className={cn("h-1.5 rounded-full transition-all", item.barColor)} style={{ width: `${item.pct}%` }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </>
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
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total Sostén</span>
          <span className="text-lg font-bold text-blue-500">{sostenDone}/{sostenTotal}</span>
        </div>
        <Progress value={sostenTotal > 0 ? Math.round(sostenDone/sostenTotal*100) : 0} className="h-2" indicatorClassName="bg-blue-500" />
        <div className="space-y-4 pt-1">
          {groups.map(g => {
            const done = g.habits.filter(h => completions[h]).length;
            const pct = g.habits.length > 0 ? Math.round(done/g.habits.length*100) : 0;
            return (
              <div key={g.id}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className={cn("font-semibold", g.color)}>{g.name}</span>
                  <span className="text-muted-foreground">{done}/{g.habits.length}</span>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {g.habits.map(h => (
                    <span key={h} className={cn(
                      "text-[9px] px-2 py-0.5 rounded-full font-medium",
                      completions[h] ? "bg-green-500/15 text-green-600 border border-green-500/20" : "bg-muted text-muted-foreground border border-transparent"
                    )}>
                      {h.replace(/-/g, ' ')}
                    </span>
                  ))}
                </div>
                <Progress value={pct} className="h-1.5" indicatorClassName={g.bar} />
              </div>
            );
          })}
        </div>
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium"><Droplets className="w-3.5 h-3.5 text-blue-500" /> Agua</span>
            <span className="font-bold text-blue-500">{waterCount}/{waterTotal}</span>
          </div>
          <Progress value={waterTotal > 0 ? Math.round(waterCount/waterTotal*100) : 0} className="h-1.5 mt-1.5" indicatorClassName="bg-blue-500" />
        </div>
      </CardContent>
    </Card>
  );
}

function MejoraTab({ timeData, completions, workoutDuration, workoutIntensity }: {
  timeData: Record<string, number>; completions: Record<string, boolean>;
  workoutDuration: number; workoutIntensity: string;
}) {
  const items = [
    { id: "lectura", name: "Lectura", icon: BookOpen, color: "text-cyan-500", bar: "bg-cyan-500", goal: 30 },
    { id: "musica", name: "Música", icon: BookOpen, color: "text-pink-500", bar: "bg-pink-500", goal: 30 },
    { id: "ajedrez", name: "Ajedrez", icon: Gamepad2, color: "text-emerald-500", bar: "bg-emerald-500", goal: 15 },
    { id: "game", name: "Game (Seducción)", icon: Gamepad2, color: "text-purple-500", bar: "bg-purple-500", goal: 30 },
    { id: "idiomas", name: "Idiomas", icon: GraduationCap, color: "text-indigo-500", bar: "bg-indigo-500", goal: 60 },
  ];

  const avgPct = items.length > 0
    ? Math.round(items.reduce((s, i) => s + Math.min(100, ((timeData[i.id]||0)/i.goal)*100), 0) / items.length)
    : 0;

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Progreso Mejora</span>
          <span className="text-lg font-bold text-purple-500">{avgPct}%</span>
        </div>
        <Progress value={avgPct} className="h-2" indicatorClassName="bg-purple-500" />
        <div className="space-y-3 pt-1">
          {items.map(item => {
            const spent = timeData[item.id] || 0;
            const pct = Math.min(100, Math.round((spent / item.goal) * 100));
            const done = completions[item.id];
            return (
              <div key={item.id} className={cn("rounded-xl p-3 transition-colors", done ? "bg-green-500/5" : "bg-muted/20")}>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium">
                    <item.icon className={cn("w-3.5 h-3.5", item.color)} />
                    <span>{item.name}</span>
                    {done && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                  </span>
                  <span className="text-muted-foreground">{spent}/{item.goal} min</span>
                </div>
                <Progress value={pct} className="h-1.5" indicatorClassName={item.bar} />
              </div>
            );
          })}
        </div>
        {workoutDuration > 0 && (
          <div className="pt-3 border-t border-border/50 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium"><Dumbbell className="w-3.5 h-3.5 text-orange-500" /> Entreno</span>
              <span className="text-muted-foreground">{workoutDuration} min · {workoutIntensity}</span>
            </div>
            <Progress value={Math.min(100, Math.round(workoutDuration/45*100))} className="h-1.5" indicatorClassName="bg-orange-500" />
          </div>
        )}
      </CardContent>
    </Card>
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

  const totalMin = areas.reduce((s, a) => s + (timeData[a.id]||0), 0);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400" />
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Horas invertidas hoy</span>
          <span className="text-lg font-bold text-amber-500">{totalMin} min</span>
        </div>
        <div className="space-y-3 pt-1">
          {areas.map(area => {
            const spent = timeData[area.id] || 0;
            const pct = Math.min(100, Math.round((spent / area.goal) * 100));
            const isDone = completions[area.id];
            return (
              <div key={area.id} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
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
        <div className="pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-medium"><Target className="w-3.5 h-3.5 text-rose-500" /> Tareas completadas</span>
            <span className="font-bold text-rose-500">{tasksDone}/{tasksTotal}</span>
          </div>
          <Progress value={tasksTotal > 0 ? Math.round(tasksDone/tasksTotal*100) : 0} className="h-1.5 mt-1.5" indicatorClassName="bg-rose-500" />
        </div>
      </CardContent>
    </Card>
  );
}