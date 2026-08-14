import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dumbbell, Flame, Zap, Heart, Activity, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
const INTENSITIES = [
    { id: "light", label: "Suave", icon: Heart, color: "from-blue-400 to-blue-500" },
    { id: "moderate", label: "Media", icon: Activity, color: "from-emerald-400 to-emerald-500" },
    { id: "high", label: "Alta", icon: Flame, color: "from-orange-400 to-orange-500" },
    { id: "extreme", label: "Extrema", icon: Zap, color: "from-red-500 to-rose-600" },
];
const GOAL_MIN = 60;
const MIN_THRESHOLD = 30;
export const WorkoutVisual = ({ duration, intensity, onDurationChange, onIntensityChange, completed, onToggleCompleted, skipped, onSkip, }) => {
    const pct = Math.min(100, Math.round((duration / GOAL_MIN) * 100));
    const intensityInfo = INTENSITIES.find((i) => i.id === intensity) || INTENSITIES[1];
    const Icon = intensityInfo.icon;
    const ringColor = duration >= GOAL_MIN
        ? "ring-green-500/60"
        : duration >= MIN_THRESHOLD
            ? "ring-blue-500/60"
            : duration > 0
                ? "ring-amber-500/60"
                : "ring-red-500/40";
    // Calorías estimadas (simple, multiplicador por intensidad)
    const multiplier = { light: 5, moderate: 8, high: 11, extreme: 14 }[intensity] || 8;
    const estCal = duration * multiplier;
    return (_jsxs(Card, { className: cn("overflow-hidden ring-2 transition-all", ringColor), children: [_jsxs("div", { className: cn("p-4 bg-gradient-to-br text-white relative overflow-hidden", intensityInfo.color), children: [_jsx("div", { className: "absolute -right-4 -top-4 opacity-20", children: _jsx(Dumbbell, { className: "h-24 w-24" }) }), _jsxs("div", { className: "relative flex items-start justify-between", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-1", children: [_jsx(Dumbbell, { className: "h-5 w-5" }), _jsx("span", { className: "font-semibold", children: "Entrenamiento" })] }), _jsxs("p", { className: "text-3xl font-bold tabular-nums", children: [duration, _jsx("span", { className: "text-sm font-normal opacity-80", children: "min" })] }), _jsxs("p", { className: "text-[11px] opacity-90", children: ["~", estCal, " kcal \u00B7 ", intensityInfo.label] })] }), _jsx("button", { onClick: onToggleCompleted, className: cn("w-10 h-10 rounded-full border-2 border-white/40 flex items-center justify-center transition-all", completed && "bg-white text-emerald-600 scale-110"), children: _jsx(Icon, { className: cn("h-5 w-5", completed ? "" : "text-white") }) })] }), _jsx("div", { className: "mt-3 h-2 bg-white/20 rounded-full overflow-hidden", children: _jsx("div", { className: "h-full bg-white transition-all duration-700 ease-out", style: { width: `${pct}%` } }) }), _jsxs("div", { className: "flex items-center justify-between mt-1 text-[10px] opacity-80", children: [_jsx("span", { children: "0" }), _jsxs("span", { children: ["Min ", MIN_THRESHOLD] }), _jsxs("span", { children: ["Meta ", GOAL_MIN] })] })] }), _jsxs("div", { className: "p-3 space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("button", { onClick: onToggleCompleted, className: cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border", completed ? "bg-green-500 text-white border-green-500" : "bg-muted text-muted-foreground border-border hover:border-green-400"), children: [_jsx("div", { className: cn("w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center", completed ? "border-white" : "border-muted-foreground/50"), children: completed && _jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-white" }) }), completed ? "Hecho" : "Sin hacer"] }), _jsxs("button", { onClick: () => { onDurationChange(0); onSkip?.(); }, className: cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all border", skipped ? "bg-red-500/20 text-red-500 border-red-500/40" : "bg-muted text-muted-foreground border-border hover:border-red-400"), children: [_jsx(XCircle, { className: "h-3.5 w-3.5" }), skipped ? "Saltado" : "No hice"] }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: "Marca si entrenaste o no hoy" })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5", children: "Intensidad" }), _jsx("div", { className: "grid grid-cols-4 gap-1.5", children: INTENSITIES.map((it) => {
                                    const ItIcon = it.icon;
                                    const active = intensity === it.id;
                                    return (_jsxs("button", { onClick: () => onIntensityChange(it.id), className: cn("p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-all border", active
                                            ? `bg-gradient-to-br ${it.color} text-white border-transparent shadow-md scale-105`
                                            : "bg-muted hover:bg-muted/70 text-muted-foreground border-border"), children: [_jsx(ItIcon, { className: "h-3.5 w-3.5" }), _jsx("span", { className: "text-[9px] font-medium", children: it.label })] }, it.id));
                                }) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5", children: "Duraci\u00F3n" }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Input, { type: "number", min: 0, value: duration || "", onChange: (e) => onDurationChange(parseInt(e.target.value) || 0), className: "h-8 text-sm font-bold text-center flex-1", placeholder: "min" }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8 px-2 text-[10px]", onClick: () => onDurationChange(duration + 15), children: "+15" }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8 px-2 text-[10px]", onClick: () => onDurationChange(duration + 30), children: "+30" }), _jsx(Button, { size: "sm", variant: "outline", className: "h-8 px-2 text-[10px]", onClick: () => onDurationChange(duration + 60), children: "+60" })] })] }), _jsx(WeekStreakBar, { habitId: "entrenamiento-fisico", todayValue: duration, minThreshold: MIN_THRESHOLD, maxThreshold: GOAL_MIN, compact: true })] })] }));
};
