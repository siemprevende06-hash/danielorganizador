import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Check, Star, Flame, Trophy } from "lucide-react";
import { useSystemHabitStreak } from "@/hooks/useSystemHabitStreaks";
import { getCubaDate } from "@/lib/cubaTime";
const DAY_LABELS = ["L", "Ma", "Mi", "J", "V", "S", "D"];
const getMondayOfWeek = (date) => {
    const [y, m, d] = getCubaDate(date).split("-").map(Number);
    const local = new Date(y, m - 1, d);
    const day = local.getDay();
    const diff = local.getDate() - day + (day === 0 ? -6 : 1);
    local.setDate(diff);
    local.setHours(0, 0, 0, 0);
    return local;
};
const dateKey = (d) => getCubaDate(d);
function getBarColor(minutes, minT, maxT) {
    if (minutes <= 0)
        return "bg-red-400";
    if (minutes > maxT)
        return "bg-amber-400";
    if (minutes >= maxT)
        return "bg-green-400";
    if (minutes >= minT)
        return "bg-blue-400";
    return "bg-blue-300/60";
}
function getBarLabel(minutes, minT, maxT) {
    if (minutes <= 0)
        return "";
    if (minutes > maxT)
        return "Extra";
    if (minutes >= maxT)
        return "Máx";
    if (minutes >= minT)
        return "Mín";
    return "";
}
export const WeekStreakBar = ({ habitId, weekStatuses, minThreshold = 1, maxThreshold = 30, todayValue, todayCompleted, compact = false, onShake, hideStreak = false, className, variant = "circles", timeDataKey, }) => {
    const [statuses, setStatuses] = useState(weekStatuses ?? Array(7).fill("none"));
    const [dailyMinutes, setDailyMinutes] = useState([]);
    const [shaking, setShaking] = useState(null);
    const [pulseStreak, setPulseStreak] = useState(false);
    const { streak: dbStreak } = useSystemHabitStreak(habitId);
    const streak = { current: dbStreak.current, best: dbStreak.best };
    const monday = useMemo(() => getMondayOfWeek(), []);
    const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return d;
    }), [monday]);
    // Cargar estados / minutos de la semana
    useEffect(() => {
        if (variant === "bars" && timeDataKey) {
            (async () => {
                const startStr = dateKey(weekDates[0]);
                const endStr = dateKey(weekDates[6]);
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("tracking_date, time_data")
                    .gte("tracking_date", startStr)
                    .lte("tracking_date", endStr)
                    .order("tracking_date", { ascending: true });
                const byDate = {};
                (data || []).forEach((row) => {
                    const td = row.time_data || {};
                    byDate[row.tracking_date] = (td[timeDataKey] || 0);
                });
                setDailyMinutes(weekDates.map(d => byDate[dateKey(d)] || 0));
            })();
        }
        else if (!weekStatuses) {
            (async () => {
                const sixtyAgo = new Date();
                sixtyAgo.setDate(sixtyAgo.getDate() - 60);
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("tracking_date, completions")
                    .gte("tracking_date", sixtyAgo.toISOString().split("T")[0])
                    .order("tracking_date", { ascending: true });
                const map = {};
                const key = `streak:${habitId}`;
                (data || []).forEach((row) => {
                    const c = (row.completions || {});
                    const v = c[key];
                    if (v === "max" || v === "min")
                        map[row.tracking_date] = v;
                    else if (v === true)
                        map[row.tracking_date] = "min";
                });
                const weekArr = weekDates.map((d) => {
                    const k = dateKey(d);
                    if (map[k]) {
                        if (d.getDay() === 0)
                            return "special";
                        return map[k];
                    }
                    return "none";
                });
                const todayIdx = weekDates.findIndex((d) => dateKey(d) === dateKey(new Date()));
                if (todayIdx >= 0) {
                    if (typeof todayValue === "number") {
                        if (todayValue >= maxThreshold)
                            weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "max";
                        else if (todayValue >= minThreshold)
                            weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "min";
                    }
                    if (todayCompleted && weekArr[todayIdx] === "none") {
                        weekArr[todayIdx] = weekDates[todayIdx].getDay() === 0 ? "special" : "min";
                    }
                }
                setStatuses(weekArr);
            })();
        }
    }, [habitId, weekStatuses, todayValue, todayCompleted, minThreshold, maxThreshold, variant, timeDataKey]);
    useEffect(() => {
        if (dbStreak.current > 0) {
            setPulseStreak(true);
            const t = setTimeout(() => setPulseStreak(false), 1200);
            return () => clearTimeout(t);
        }
    }, [dbStreak.current]);
    const handleClick = (idx) => {
        if (variant === "bars")
            return;
        if (statuses[idx] === "none") {
            setShaking(idx);
            onShake?.();
            setTimeout(() => setShaking(null), 500);
        }
    };
    const maxMin = Math.max(...dailyMinutes, 1);
    const sizeCircle = compact ? "w-6 h-6 text-[9px]" : "w-7 h-7 text-[10px]";
    if (variant === "bars") {
        return (_jsx("div", { className: cn(!hideStreak && "space-y-1.5", className), children: _jsxs("div", { className: cn("flex items-center", hideStreak ? "gap-1" : "justify-between"), children: [_jsx("div", { className: "flex items-end gap-1 h-20 w-full", children: weekDates.map((d, i) => {
                            const mins = dailyMinutes[i] || 0;
                            const pct = (mins / Math.max(maxMin, minThreshold)) * 100;
                            const isToday = dateKey(d) === dateKey(new Date());
                            const barColor = getBarColor(mins, minThreshold, maxThreshold);
                            const barLabel = getBarLabel(mins, minThreshold, maxThreshold);
                            return (_jsxs("div", { className: "flex-1 flex flex-col items-center gap-0.5", children: [_jsx("div", { className: "flex-1 w-full flex items-end justify-center", style: { minHeight: "4px" }, children: _jsx("div", { className: cn("w-full rounded-t-sm transition-all duration-300", barColor, isToday && "ring-1 ring-primary ring-offset-1 ring-offset-background"), style: { height: `${Math.max(4, pct)}%` }, title: `${mins} min` }) }), _jsx("span", { className: cn("text-[8px] font-medium", mins > 0 && barLabel ? "text-muted-foreground" : "text-muted-foreground/40"), children: barLabel || DAY_LABELS[i] })] }, i));
                        }) }), !hideStreak && (_jsxs("div", { className: cn("flex items-center gap-2 text-[10px] font-medium transition-all ml-1", pulseStreak && "scale-110"), children: [_jsxs("span", { className: "flex items-center gap-0.5 text-orange-500", children: [_jsx(Flame, { className: "h-3 w-3" }), _jsx("span", { className: cn(pulseStreak && "animate-[bounce_0.5s_ease-out]"), children: streak.current })] }), streak.best > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-yellow-600", children: [_jsx(Trophy, { className: "h-3 w-3" }), streak.best] }))] }))] }) }));
    }
    // Modo círculos (original)
    return (_jsx("div", { className: cn(!hideStreak && "space-y-1.5", className), children: _jsxs("div", { className: cn("flex items-center", hideStreak ? "gap-1" : "justify-between"), children: [_jsx("div", { className: cn("flex", hideStreak ? "gap-0.5" : "gap-1"), children: weekDates.map((d, i) => {
                        const status = statuses[i];
                        const isToday = dateKey(d) === dateKey(new Date());
                        const isSunday = d.getDay() === 0;
                        return (_jsxs("button", { onClick: () => handleClick(i), style: { animationDelay: `${i * 60}ms` }, className: cn("rounded-full flex items-center justify-center font-bold transition-all animate-fade-in relative", sizeCircle, status === "max" && "bg-amber-400 text-amber-950 shadow-[0_0_10px_rgba(251,191,36,0.6)] animate-[bounce_0.5s_ease-out]", status === "min" && "bg-amber-200 text-amber-900", status === "special" && "bg-gradient-to-br from-yellow-300 to-amber-500 text-white ring-2 ring-amber-400/60 animate-pulse", status === "none" && "bg-muted text-muted-foreground/60", shaking === i && "animate-[wiggle_0.4s_ease-in-out]", isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"), "aria-label": `${DAY_LABELS[i]} ${status}`, children: [status === "max" && _jsx(Check, { className: "h-3 w-3", strokeWidth: 3 }), status === "min" && _jsx(Check, { className: "h-3 w-3", strokeWidth: 2.5 }), status === "special" && _jsx(Star, { className: "h-3 w-3 fill-current" }), status === "none" && DAY_LABELS[i]] }, i));
                    }) }), !hideStreak && (_jsxs("div", { className: cn("flex items-center gap-2 text-[10px] font-medium transition-all ml-1", pulseStreak && "scale-110"), children: [_jsxs("span", { className: "flex items-center gap-0.5 text-orange-500", children: [_jsx(Flame, { className: "h-3 w-3" }), _jsx("span", { className: cn(pulseStreak && "animate-[bounce_0.5s_ease-out]"), children: streak.current })] }), streak.best > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-yellow-600", children: [_jsx(Trophy, { className: "h-3 w-3" }), streak.best] }))] }))] }) }));
};
