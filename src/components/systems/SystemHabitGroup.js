import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, Droplets, Clock, Hash, ExternalLink, Camera, Dumbbell, Moon, Sun, Flame, Trophy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WeekStreakBar } from "./WeekStreakBar";
import { useSystemHabitStreak } from "@/hooks/useSystemHabitStreaks";
export function SystemHabitGroup({ group, completions, timeData, countData, waterData, onToggle, onTimeChange, onCountChange, onWaterToggle, workoutDuration, workoutIntensity, onWorkoutDurationChange, onWorkoutIntensityChange, wakeTime, sleepTime, onWakeTimeChange, onSleepTimeChange, mealPhotos, onMealPhotoUpload, skipped, onSkipToggle, }) {
    const [expanded, setExpanded] = useState(true);
    const navigate = useNavigate();
    const Icon = group.icon;
    const fileInputRefs = useRef({});
    const completedCount = group.habits.filter(h => completions[h.id]).length;
    const progress = group.habits.length > 0 ? (completedCount / group.habits.length) * 100 : 0;
    const handlePhotoUpload = async (mealId, file) => {
        try {
            const ext = file.name.split(".").pop();
            const path = `meals/${Date.now()}_${mealId}.${ext}`;
            const { error } = await supabase.storage.from("user-images").upload(path, file);
            if (error)
                throw error;
            const { data: urlData } = supabase.storage.from("user-images").getPublicUrl(path);
            onMealPhotoUpload?.(mealId, urlData.publicUrl);
            toast.success("Foto guardada");
        }
        catch {
            toast.error("Error al subir foto");
        }
    };
    const getWakeTimeStatus = (time) => {
        if (!time)
            return null;
        const [h, m] = time.split(":").map(Number);
        const mins = h * 60 + m;
        const target = 6 * 60 + 30;
        if (mins === target)
            return { label: "✅ Perfecto", color: "text-green-500" };
        if (mins < target)
            return { label: "⚠️ Muy temprano", color: "text-amber-500" };
        return { label: "⚠️ Tarde", color: "text-red-500" };
    };
    const getSleepTimeStatus = (time) => {
        if (!time)
            return null;
        const [h, m] = time.split(":").map(Number);
        const mins = h * 60 + m;
        const target = 22 * 60 + 30;
        if (mins <= target && mins >= 22 * 60)
            return { label: "✅ Perfecto", color: "text-green-500" };
        if (mins < 22 * 60)
            return { label: "✅ Temprano", color: "text-green-500" };
        return { label: "⚠️ Tarde", color: "text-red-500" };
    };
    return (_jsxs(Card, { className: "overflow-hidden", children: [_jsxs("button", { onClick: () => setExpanded(!expanded), className: "w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("p-2.5 rounded-xl", group.color), children: _jsx(Icon, { className: "h-5 w-5" }) }), _jsxs("div", { className: "text-left", children: [_jsx("h3", { className: "font-semibold", children: group.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [completedCount, "/", group.habits.length, " completados"] })] })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Progress, { value: progress, className: "w-20 h-2" }), _jsxs(Badge, { variant: progress === 100 ? "default" : "secondary", className: "text-xs", children: [Math.round(progress), "%"] }), expanded ? _jsx(ChevronUp, { className: "h-4 w-4 text-muted-foreground" }) : _jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })] })] }), expanded && (_jsx("div", { className: "px-4 pb-4 space-y-2", children: group.habits.map(habit => (_jsx(HabitRow, { habit: habit, completions: completions, onToggle: onToggle, timeData: timeData, countData: countData, waterData: waterData, onTimeChange: onTimeChange, onCountChange: onCountChange, onWaterToggle: onWaterToggle, navigate: navigate, mealPhotos: mealPhotos, onMealPhotoUpload: onMealPhotoUpload, handlePhotoUpload: handlePhotoUpload, fileInputRefs: fileInputRefs, workoutDuration: workoutDuration, workoutIntensity: workoutIntensity, onWorkoutDurationChange: onWorkoutDurationChange, onWorkoutIntensityChange: onWorkoutIntensityChange, wakeTime: wakeTime, sleepTime: sleepTime, onWakeTimeChange: onWakeTimeChange, onSleepTimeChange: onSleepTimeChange, getWakeTimeStatus: getWakeTimeStatus, getSleepTimeStatus: getSleepTimeStatus, skipped: skipped, onSkipToggle: onSkipToggle }, habit.id))) }))] }));
}
function HabitRow({ habit, completions, onToggle, timeData, countData, waterData, onTimeChange, onCountChange, onWaterToggle, navigate, mealPhotos, onMealPhotoUpload, handlePhotoUpload, fileInputRefs, workoutDuration, workoutIntensity, onWorkoutDurationChange, onWorkoutIntensityChange, wakeTime, sleepTime, onWakeTimeChange, onSleepTimeChange, getWakeTimeStatus, getSleepTimeStatus, skipped, onSkipToggle, }) {
    const { streak } = useSystemHabitStreak(habit.id);
    const isSkipped = !!skipped?.[habit.id];
    const isDone = !!completions[habit.id];
    const noData = !isDone && !isSkipped;
    const checkState = isSkipped ? false : isDone ? true : "indeterminate";
    return (_jsxs("div", { children: [_jsxs("div", { className: cn("flex items-center gap-2 p-3 rounded-lg border transition-all", isDone
                    ? "bg-primary/5 border-primary/20"
                    : isSkipped
                        ? "bg-red-500/5 border-red-500/20"
                        : "bg-background border-border hover:border-primary/30"), children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Checkbox, { checked: checkState, onCheckedChange: () => onToggle(habit.id), className: "h-5 w-5" }), (streak.current > 0 || streak.best > 0) && (_jsxs("div", { className: "flex items-center gap-0.5 text-[10px] font-medium", children: [streak.current > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-orange-500", children: [_jsx(Flame, { className: "h-2.5 w-2.5" }), _jsx("span", { children: streak.current })] })), streak.best > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-yellow-600", children: [_jsx(Trophy, { className: "h-2.5 w-2.5" }), _jsx("span", { children: streak.best })] }))] }))] }), _jsxs("div", { className: "flex-1 flex items-center gap-2 min-w-0", children: [_jsxs("span", { className: cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground", isSkipped && "text-red-400/60"), children: [habit.name, isSkipped && _jsx("span", { className: "ml-1.5 text-[9px] text-red-400 font-normal", children: "(No lo hice)" })] }), _jsx(WeekStreakBar, { habitId: habit.id, todayCompleted: !!completions[habit.id], todayValue: timeData[habit.id] || (completions[habit.id] ? 30 : 0), minThreshold: 1, maxThreshold: 30, compact: true, hideStreak: true, className: "shrink-0" })] }), habit.linkTo && (_jsxs("button", { onClick: (e) => { e.stopPropagation(); navigate(habit.linkTo); }, className: "flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors", children: [_jsx(ExternalLink, { className: "h-3 w-3" }), " Ver"] })), habit.hasTime && (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { type: "number", min: 0, value: timeData[habit.id] || "", onChange: e => onTimeChange(habit.id, parseInt(e.target.value) || 0), placeholder: "min", className: "w-16 h-7 text-xs text-center" })] })), habit.hasCount && (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Hash, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { type: "number", min: 0, value: countData[habit.id] || "", onChange: e => onCountChange(habit.id, parseInt(e.target.value) || 0), placeholder: habit.countLabel || "#", className: "w-16 h-7 text-xs text-center" })] })), habit.hasWater && (_jsxs("button", { onClick: (e) => { e.stopPropagation(); onWaterToggle(habit.id); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors", waterData[habit.id]
                            ? "bg-blue-500/20 text-blue-500"
                            : "bg-muted text-muted-foreground hover:bg-blue-500/10"), children: [_jsx(Droplets, { className: "h-3.5 w-3.5" }), "300ml"] })), habit.hasMealPhoto && (_jsxs(_Fragment, { children: [_jsx("input", { type: "file", accept: "image/*", className: "hidden", ref: el => { fileInputRefs.current[habit.id] = el; }, onChange: e => {
                                    const file = e.target.files?.[0];
                                    if (file)
                                        handlePhotoUpload(habit.id, file);
                                } }), _jsxs("button", { onClick: (e) => { e.stopPropagation(); fileInputRefs.current[habit.id]?.click(); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors", mealPhotos?.[habit.id]
                                    ? "bg-green-500/20 text-green-600"
                                    : "bg-muted text-muted-foreground hover:bg-primary/10"), children: [_jsx(Camera, { className: "h-3.5 w-3.5" }), mealPhotos?.[habit.id] ? "✓" : "Foto"] })] }))] }), habit.hasMealPhoto && mealPhotos?.[habit.id] && (_jsx("div", { className: "ml-8 mt-1", children: _jsx("img", { src: mealPhotos[habit.id], alt: habit.name, className: "w-20 h-20 rounded-lg object-cover border" }) })), habit.isWorkout && (_jsxs("div", { className: "ml-8 mt-2 flex items-center gap-3 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Clock, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsx(Input, { type: "number", min: 0, value: workoutDuration || "", onChange: e => onWorkoutDurationChange?.(parseInt(e.target.value) || 0), placeholder: "min", className: "w-16 h-7 text-xs text-center" }), _jsx("span", { className: "text-xs text-muted-foreground", children: "min" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Dumbbell, { className: "h-3.5 w-3.5 text-muted-foreground" }), _jsxs(Select, { value: workoutIntensity || "moderate", onValueChange: v => onWorkoutIntensityChange?.(v), children: [_jsx(SelectTrigger, { className: "h-7 w-24 text-xs", children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "light", children: "Baja" }), _jsx(SelectItem, { value: "moderate", children: "Media" }), _jsx(SelectItem, { value: "high", children: "Alta" }), _jsx(SelectItem, { value: "extreme", children: "Extrema" })] })] })] })] })), habit.isSleepSchedule && (_jsxs("div", { className: "ml-8 mt-2 space-y-2", children: [_jsx("div", { className: "flex items-center gap-3 flex-wrap", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Sun, { className: "h-3.5 w-3.5 text-amber-500" }), _jsx("span", { className: "text-xs", children: "Despert\u00E9:" }), _jsx(Input, { type: "time", value: wakeTime || "", onChange: e => onWakeTimeChange?.(e.target.value), className: "w-28 h-7 text-xs" }), wakeTime && (_jsx("span", { className: cn("text-[10px] font-medium", getWakeTimeStatus(wakeTime)?.color), children: getWakeTimeStatus(wakeTime)?.label }))] }) }), _jsx("div", { className: "flex items-center gap-3 flex-wrap", children: _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Moon, { className: "h-3.5 w-3.5 text-indigo-500" }), _jsx("span", { className: "text-xs", children: "Dorm\u00ED:" }), _jsx(Input, { type: "time", value: sleepTime || "", onChange: e => onSleepTimeChange?.(e.target.value), className: "w-28 h-7 text-xs" }), sleepTime && (_jsx("span", { className: cn("text-[10px] font-medium", getSleepTimeStatus(sleepTime)?.color), children: getSleepTimeStatus(sleepTime)?.label }))] }) }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Meta: 6:30 AM despertar \u00B7 10:30 PM dormir" })] }))] }));
}
