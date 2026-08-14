import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Music, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { MusicTrendChart } from "@/components/music/MusicTrendChart";
import { cn } from "@/lib/utils";
const todayKey = () => new Date().toISOString().split("T")[0];
function minutesStats(rows) {
    const today = new Date();
    const iso = (d) => d.toISOString().split("T")[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const wk = iso(weekStart), ms = iso(monthStart), td = iso(today);
    const totals = { today: 0, week: 0, month: 0 };
    (rows || []).forEach((r) => {
        const min = r.duration_minutes || 0;
        if (r.practice_date === td)
            totals.today += min;
        if (r.practice_date >= wk && r.practice_date <= td)
            totals.week += min;
        if (r.practice_date >= ms && r.practice_date <= td)
            totals.month += min;
    });
    return totals;
}
export function MusicDailyIndicator({ dailyMinutesGoal = 30 }) {
    const [minutesToday, setMinutesToday] = useState(0);
    const [minutes, setMinutes] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(true);
    const load = async () => {
        const today = todayKey();
        const [practiceR, systemsR] = await Promise.all([
            supabase.from("music_practice_sessions").select("practice_date, duration_minutes").gte("practice_date", today.slice(0, 7) + "-01"),
            supabase.from("daily_systems_tracking").select("time_data,completions").eq("tracking_date", today).maybeSingle(),
        ]);
        const fromPractice = (practiceR.data || []).reduce((a, s) => a + (s.duration_minutes || 0), 0);
        const td = systemsR.data?.time_data || {};
        const fromSystems = td.musica || 0;
        setMinutesToday(fromPractice + fromSystems);
        setMinutes(minutesStats(practiceR.data));
        setLoading(false);
    };
    useEffect(() => {
        load();
        const ch = supabase
            .channel("music_today")
            .on("postgres_changes", { event: "*", schema: "public", table: "music_practice_sessions" }, load)
            .on("postgres_changes", { event: "*", schema: "public", table: "daily_systems_tracking" }, load)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);
    const pct = Math.min(100, Math.round((minutesToday / dailyMinutesGoal) * 100));
    const onTrack = minutesToday >= dailyMinutesGoal;
    return (_jsx(Card, { className: cn("border-l-4", onTrack ? "border-l-green-500" : "border-l-amber-500"), children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Music, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-wide", children: "Pr\u00E1ctica de hoy" })] }), _jsxs(Badge, { variant: onTrack ? "default" : "secondary", className: "text-xs", children: [_jsx(Flame, { className: "w-3 h-3 mr-1" }), minutesToday, " / ", dailyMinutesGoal, " min"] })] }), _jsx(Progress, { value: pct, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: minutes.today }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["min hoy"] })] }), _jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: minutes.week }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["min semana"] })] }), _jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: minutes.month }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["min mes"] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(Clock, { className: "w-3 h-3" }), " Meta diaria: ", dailyMinutesGoal, " min"] }), _jsx("span", { children: onTrack ? "Meta cumplida ✓" : `${dailyMinutesGoal - minutesToday} min restantes` })] }), _jsx("div", { className: "pt-1", children: _jsx(WeekStreakBar, { habitId: "musica", todayValue: minutesToday, maxThreshold: dailyMinutesGoal, compact: true }) }), _jsx("div", { className: "pt-1 border-t border-border/40", children: _jsx(MusicTrendChart, {}) })] }) }));
}