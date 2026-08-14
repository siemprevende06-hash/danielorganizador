import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isBefore } from "date-fns";
import { Flame, Trophy } from "lucide-react";
const SYSTEM_NAMES = {
    "rutina-activacion": "Activación",
    "alistamiento-desayuno": "Alistamiento",
    "rutina-desactivacion": "Desactivación",
    "entrenamiento-fisico": "Gym",
    "lectura": "Lectura",
    "musica": "Música",
    "ajedrez": "Ajedrez",
    "skincare-manana": "Skincare AM",
    "skincare-noche": "Skincare PM",
    "banarme-vestirme": "Baño/Vestirme",
};
export function MonthlySystemsStats({ monthDate }) {
    const [data, setData] = useState([]);
    const [streaks, setStreaks] = useState({});
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const today = new Date();
    const effectiveEnd = isBefore(monthEnd, today) ? monthEnd : today;
    const totalDays = eachDayOfInterval({ start: monthStart, end: effectiveEnd }).length;
    useEffect(() => {
        const load = async () => {
            const [trackingRes, streaksRes] = await Promise.all([
                supabase
                    .from("daily_systems_tracking")
                    .select("tracking_date, completions")
                    .gte("tracking_date", format(monthStart, "yyyy-MM-dd"))
                    .lte("tracking_date", format(monthEnd, "yyyy-MM-dd")),
                supabase
                    .from("system_habit_streaks")
                    .select("habit_id, current_streak, longest_streak"),
            ]);
            setData(trackingRes.data || []);
            const map = {};
            (streaksRes.data || []).forEach((s) => {
                map[s.habit_id] = { current: s.current_streak || 0, best: s.longest_streak || 0 };
            });
            setStreaks(map);
        };
        load();
    }, [monthDate.toISOString()]);
    const habitIds = Object.keys(SYSTEM_NAMES);
    const stats = habitIds.map(hid => {
        const completedDays = data.filter(r => {
            const c = (r.completions || {});
            return !!c[hid];
        }).length;
        const pct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;
        const s = streaks[hid];
        return { id: hid, name: SYSTEM_NAMES[hid], completedDays, pct, currentStreak: s?.current || 0, bestStreak: s?.best || 0 };
    });
    return (_jsxs(Card, { className: "p-4", children: [_jsx("h3", { className: "font-bold text-sm mb-3", children: "\uD83D\uDCCA Sistemas de Vida \u2014 Mes" }), _jsx("div", { className: "space-y-2", children: stats.map(s => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-xs items-center", children: [_jsx("span", { className: "text-muted-foreground", children: s.name }), _jsxs("div", { className: "flex items-center gap-2", children: [s.currentStreak > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-orange-500 text-[10px] font-medium", children: [_jsx(Flame, { className: "h-3 w-3" }), s.currentStreak] })), s.bestStreak > 0 && (_jsxs("span", { className: "flex items-center gap-0.5 text-yellow-600 text-[10px] font-medium", children: [_jsx(Trophy, { className: "h-3 w-3" }), s.bestStreak] })), _jsxs("span", { className: "font-medium", children: [s.completedDays, "/", totalDays, " (", s.pct, "%)"] })] })] }), _jsx(Progress, { value: s.pct, className: "h-1.5" })] }, s.id))) })] }));
}
