import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { Zap, Shield, TrendingUp, Focus, Clock, CheckCircle2, Droplets, Dumbbell, Moon, Timer, Target, Activity, GraduationCap, Briefcase, FolderKanban, ListTodo, Brain, Sun } from "lucide-react";
import { MySystemsSection } from "@/components/dashboard/MySystemsSection";
const SOSTEN_HABIT_IDS = [
    "rutina-activacion", "alistamiento-desayuno", "horario-regular",
    "rutina-desactivacion", "skincare-manana", "skincare-noche",
    "banarme-vestirme",
    "pre-entreno", "desayuno", "merienda-1", "almuerzo",
    "merienda-2", "comida", "antes-dormir", "suplementos",
];
const MEJORA_HABIT_IDS = ["lectura", "musica", "ajedrez", "game"];
const FOCUS_AREA_IDS = ["universidad", "emprendimiento", "proyectos", "tareas"];
const TIME_GOALS = {
    lectura: 30, musica: 30, ajedrez: 15, game: 30,
    universidad: 120, emprendimiento: 60, proyectos: 60, tareas: 60,
    idiomas: 60, gym: 45,
};
const WATER_HABIT_IDS = ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"];
const semaphore = (value, min, max) => {
    if (value >= max)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo" };
    if (value >= min)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo" };
    if (value > 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Incompleto" };
    return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
};
const pctSemaphore = (pct) => {
    if (pct >= 90)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Excelente" };
    if (pct >= 60)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Bien" };
    if (pct >= 30)
        return { ring: "ring-amber-500/60", bg: "bg-amber-500/10", text: "text-amber-600", label: "Regular" };
    return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Bajo" };
};
function StatCard({ icon: Icon, label, value, suffix, pct, color, minThreshold, maxThreshold }) {
    const sem = typeof value === 'number' && minThreshold !== undefined && maxThreshold !== undefined
        ? semaphore(value, minThreshold, maxThreshold)
        : pctSemaphore(pct);
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: label })] }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] }), _jsxs("div", { className: "flex items-baseline gap-1 mb-1.5", children: [_jsx("span", { className: "text-2xl font-bold", children: value }), suffix && _jsx("span", { className: "text-[10px] text-muted-foreground", children: suffix }), maxThreshold && _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: ["/", maxThreshold] })] }), _jsx(Progress, { value: pct, className: "h-1.5" })] }));
}
function TimeStatCard({ icon: Icon, label, spent, goal, unit = "min" }) {
    const pct = goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
    const sem = semaphore(spent, goal * 0.6, goal);
    const max = goal;
    const spark = [0, 0, 0, 0, 0, 0, spent];
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: label })] }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] }), _jsxs("div", { className: "flex items-baseline gap-1 mb-1.5", children: [_jsx("span", { className: "text-2xl font-bold", children: spent }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: unit }), _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: ["/", goal] })] }), _jsx(Progress, { value: pct, className: "h-1.5 mb-1.5" }), _jsx("div", { className: "flex items-end gap-0.5 h-5 mb-1", children: spark.map((v, i) => (_jsx("div", { className: "flex-1 rounded-sm", style: {
                        height: `${Math.max(6, (v / Math.max(1, max)) * 100)}%`,
                        backgroundColor: i === 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                    } }, i))) })] }));
}
export function DailyStatsOverview({ systemsTracking, blocksCompleted, blocksTotal, tasksCompleted, tasksTotal, habitsCompleted, habitsTotal, focusMinutes, }) {
    const [activeTab, setActiveTab] = useState('general');
    const hasSystemsData = systemsTracking !== null;
    const completions = systemsTracking?.completions || {};
    const timeData = systemsTracking?.timeData || {};
    const waterData = systemsTracking?.waterData || {};
    const blockCompletions = systemsTracking?.blockCompletions || {};
    const wakeTime = systemsTracking?.wakeTime || '';
    const sleepTime = systemsTracking?.sleepTime || '';
    const workoutDuration = systemsTracking?.workoutDuration || 0;
    const workoutIntensity = systemsTracking?.workoutIntensity || '';
    const pct = (done, total) => total > 0 ? Math.round((done / total) * 100) : 0;
    const sostenDone = hasSystemsData ? SOSTEN_HABIT_IDS.filter(id => completions[id]).length : habitsCompleted;
    const sostenTotal = hasSystemsData ? SOSTEN_HABIT_IDS.length : habitsTotal;
    const sostenPct = pct(sostenDone, sostenTotal);
    const mejoraTime = MEJORA_HABIT_IDS.reduce((s, id) => s + (timeData[id] || 0), 0) + (workoutDuration || 0);
    const mejoraPcts = MEJORA_HABIT_IDS.map(id => {
        const spent = timeData[id] || 0;
        const goal = TIME_GOALS[id] || 30;
        return goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
    });
    if (workoutDuration > 0)
        mejoraPcts.push(Math.min(100, Math.round((workoutDuration / 45) * 100)));
    const mejoraScore = hasSystemsData && mejoraPcts.length > 0
        ? Math.round(mejoraPcts.reduce((a, b) => a + b, 0) / mejoraPcts.length)
        : pct(tasksCompleted + habitsCompleted, tasksTotal + habitsTotal);
    const focusPcts = FOCUS_AREA_IDS.map(id => {
        const spent = timeData[id] || 0;
        const goal = TIME_GOALS[id] || 60;
        return goal > 0 ? Math.min(100, Math.round((spent / goal) * 100)) : 0;
    });
    const focusScore = hasSystemsData && focusPcts.length > 0
        ? Math.round(focusPcts.reduce((a, b) => a + b, 0) / focusPcts.length)
        : pct(tasksCompleted, tasksTotal);
    const totalScore = hasSystemsData
        ? Math.round(sostenPct * 0.10 + mejoraScore * 0.40 + focusScore * 0.50)
        : Math.round((pct(habitsCompleted, habitsTotal) + pct(tasksCompleted, tasksTotal) + pct(blocksCompleted, blocksTotal)) / 3);
    const totalMinutes = Object.values(timeData).reduce((a, b) => a + b, 0);
    const waterCount = WATER_HABIT_IDS.filter(id => completions[id] || waterData[id]).length;
    const waterTotal = WATER_HABIT_IDS.length;
    const totalBlocksSys = Object.values(blockCompletions).length || blocksTotal;
    const doneBlocks = Object.values(blockCompletions).filter(Boolean).length;
    const getSleepHours = () => {
        if (!wakeTime || !sleepTime)
            return null;
        const [wh, wm] = wakeTime.split(":").map(Number);
        const [sh, sm] = sleepTime.split(":").map(Number);
        const wake = wh * 60 + wm;
        const sleep = sh * 60 + sm;
        let diff = wake > sleep ? (24 * 60 - sleep) + wake : (wake - sleep + 24 * 60);
        return Math.round(diff / 6) / 10;
    };
    const sleepHours = getSleepHours();
    const TABS = [
        { id: 'general', label: 'General', icon: Activity, color: 'text-primary' },
        { id: 'sosten', label: 'Sostén', icon: Shield, color: 'text-blue-500' },
        { id: 'mejora', label: 'Mejora', icon: TrendingUp, color: 'text-purple-500' },
        { id: 'enfoque', label: 'Enfoque', icon: Focus, color: 'text-amber-500' },
    ];
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(ScoreCard, { icon: Shield, label: "Sost\u00E9n", value: `${sostenPct}%`, pct: sostenPct, color: "blue" }), _jsx(ScoreCard, { icon: TrendingUp, label: "Mejora", value: `${mejoraScore}%`, pct: mejoraScore, color: "purple" }), _jsx(ScoreCard, { icon: Brain, label: "Enfoque", value: `${focusScore}%`, pct: focusScore, color: "amber" }), _jsx(ScoreCard, { icon: Zap, label: "Total", value: `${totalScore}%`, pct: totalScore, color: "emerald" })] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2", children: TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (_jsxs("button", { onClick: () => setActiveTab(tab.id), className: cn("rounded-2xl p-3 text-left transition-all border-0 overflow-hidden", isActive
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                            : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), children: [_jsx("div", { className: "flex items-center mb-1.5", children: _jsx(tab.icon, { className: cn("w-5 h-5", isActive ? "text-primary-foreground" : tab.color) }) }), _jsx("div", { className: cn("text-xs font-semibold leading-tight", isActive ? "text-primary-foreground" : ""), children: tab.label })] }, tab.id));
                }) }), _jsxs("div", { className: "space-y-4", children: [activeTab === 'general' && (_jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx(StatCard, { icon: CheckCircle2, label: "H\u00E1bitos", value: habitsCompleted, suffix: `/${habitsTotal}`, pct: pct(habitsCompleted, habitsTotal), color: "green", minThreshold: habitsTotal * 0.6, maxThreshold: habitsTotal }), _jsx(StatCard, { icon: Droplets, label: "Agua", value: waterCount, suffix: `/${waterTotal}`, pct: pct(waterCount, waterTotal), color: "blue", minThreshold: Math.round(waterTotal * 0.6), maxThreshold: waterTotal }), _jsx(TimeStatCard, { icon: Dumbbell, label: "Ejercicio", spent: workoutDuration, goal: 45 }), _jsx(StatCard, { icon: Moon, label: "Sue\u00F1o", value: sleepHours !== null ? `${sleepHours}h` : '—', suffix: "", pct: sleepHours ? Math.min(100, Math.round(sleepHours / 8 * 100)) : 0, color: "indigo" }), _jsx(StatCard, { icon: Timer, label: "Bloques", value: doneBlocks || blocksCompleted, suffix: `/${totalBlocksSys || blocksTotal}`, pct: pct(doneBlocks || blocksCompleted, totalBlocksSys || blocksTotal), color: "amber" }), _jsx(StatCard, { icon: Target, label: "Tareas", value: tasksCompleted, suffix: `/${tasksTotal}`, pct: pct(tasksCompleted, tasksTotal), color: "rose" }), _jsx(StatCard, { icon: Clock, label: "Tiempo invertido", value: totalMinutes, suffix: " min", pct: totalMinutes > 0 ? Math.min(100, Math.round(totalMinutes / 480 * 100)) : 0, color: "primary" }), _jsx(TimeStatCard, { icon: Focus, label: "Minutos de foco", spent: focusMinutes, goal: 120 })] })), activeTab === 'sosten' && (hasSystemsData ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3", children: [
                                    { id: "estructural", name: "Estructurales", icon: Sun, habits: ["rutina-activacion", "alistamiento-desayuno", "horario-regular", "rutina-desactivacion"] },
                                    { id: "apariencia", name: "Apariencia", icon: Sun, habits: ["skincare-manana", "skincare-noche", "banarme-vestirme"] },
                                    { id: "alimentacion", name: "Alimentación", icon: Sun, habits: ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir", "suplementos"] },
                                ].map(g => {
                                    const done = g.habits.filter(h => completions[h]).length;
                                    const total = g.habits.length;
                                    const pctVal = pct(done, total);
                                    return (_jsx(StatCard, { icon: Shield, label: g.name, value: done, suffix: `/${total}`, pct: pctVal, color: "blue", minThreshold: Math.round(total * 0.6), maxThreshold: total }, g.id));
                                }) }), _jsx(StatCard, { icon: Droplets, label: "Agua", value: waterCount, suffix: `/${waterTotal}`, pct: pct(waterCount, waterTotal), color: "blue", minThreshold: Math.round(waterTotal * 0.6), maxThreshold: waterTotal }), _jsx("div", { className: "flex flex-wrap gap-1.5", children: SOSTEN_HABIT_IDS.map(h => (_jsx("span", { className: cn("text-[9px] px-2 py-0.5 rounded-full font-medium border", completions[h] ? "bg-green-500/15 text-green-600 border-green-500/30" : "bg-muted text-muted-foreground border-transparent"), children: h.replace(/-/g, ' ') }, h))) })] })) : (_jsxs(Card, { className: "p-6 text-center ring-2 ring-muted", children: [_jsx(Activity, { className: "w-8 h-8 text-muted-foreground/40 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Usa la p\u00E1gina 'Hoy' para trackear tus h\u00E1bitos de Sost\u00E9n y verlos aqu\u00ED." })] }))), activeTab === 'mejora' && _jsx(MySystemsSection, {}), activeTab === 'enfoque' && (hasSystemsData ? (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3", children: [
                                    { id: "universidad", name: "Universidad", icon: GraduationCap, goal: 120 },
                                    { id: "emprendimiento", name: "Emprendimiento", icon: Briefcase, goal: 60 },
                                    { id: "proyectos", name: "Proyectos", icon: FolderKanban, goal: 60 },
                                    { id: "tareas", name: "Tareas generales", icon: ListTodo, goal: 60 },
                                ].map(item => (_jsx(TimeStatCard, { icon: item.icon, label: item.name, spent: timeData[item.id] || 0, goal: item.goal }, item.id))) }), _jsx(StatCard, { icon: Target, label: "Tareas completadas", value: tasksCompleted, suffix: `/${tasksTotal}`, pct: pct(tasksCompleted, tasksTotal), color: "rose", minThreshold: Math.round(tasksTotal * 0.6), maxThreshold: tasksTotal })] })) : (_jsxs(Card, { className: "p-6 text-center ring-2 ring-muted", children: [_jsx(Activity, { className: "w-8 h-8 text-muted-foreground/40 mx-auto mb-2" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Usa la p\u00E1gina 'Hoy' para registrar tu enfoque y verlo aqu\u00ED." })] })))] })] }));
}
function ScoreCard({ icon: Icon, label, value, pct, color }) {
    const sem = pctSemaphore(pct);
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all", sem.ring, sem.bg), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("div", { className: "w-8 h-8 rounded-lg flex items-center justify-center bg-muted", children: _jsx(Icon, { className: "w-4 h-4 text-muted-foreground" }) }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] }), _jsx("p", { className: "text-lg font-bold", children: value }), _jsx("p", { className: "text-[10px] text-muted-foreground uppercase tracking-wider font-medium", children: label }), _jsx(Progress, { value: pct, className: "h-1.5 mt-1.5" })] }));
}
