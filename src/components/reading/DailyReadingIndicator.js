import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { ReadingTrendChart } from "@/components/reading/ReadingTrendChart";
import { cn } from "@/lib/utils";
const todayKey = () => new Date().toISOString().split("T")[0];
function pageStatsToday(rows) {
    const today = new Date();
    const iso = (d) => d.toISOString().split("T")[0];
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const wk = iso(weekStart), ms = iso(monthStart), td = iso(today);
    const totals = { today: 0, week: 0, month: 0 };
    (rows || []).forEach((r) => {
        const pages = r.pages_done || 0;
        if (r.stat_date === td)
            totals.today += pages;
        if (r.stat_date >= wk && r.stat_date <= td)
            totals.week += pages;
        if (r.stat_date >= ms && r.stat_date <= td)
            totals.month += pages;
    });
    return totals;
}
export function DailyReadingIndicator({ dailyPagesGoal = 0, dailyMinutesGoal = 30 }) {
    const [minutesToday, setMinutesToday] = useState(0);
    const [pages, setPages] = useState({ today: 0, week: 0, month: 0 });
    const [loading, setLoading] = useState(true);
    const load = async () => {
        const today = todayKey();
        const [langR, systemsR, focusR, pagesR] = await Promise.all([
            supabase.from("language_sessions").select("reading_duration").eq("session_date", today),
            supabase.from("daily_systems_tracking").select("time_data,completions").eq("tracking_date", today).maybeSingle(),
            supabase.from("focus_sessions").select("duration_seconds,activity_type").gte("started_at", `${today}T00:00:00`),
            supabase.from("daily_area_stats").select("stat_date, pages_done").eq("area_id", "lectura").gte("stat_date", today.slice(0, 7) + "-01"),
        ]);
        const fromLang = (langR.data || []).reduce((a, s) => a + (s.reading_duration || 0), 0);
        const td = systemsR.data?.time_data || {};
        const fromSystems = td.lectura || td.reading || 0;
        const fromFocus = (focusR.data || [])
            .filter((s) => (s.activity_type || "").toLowerCase().includes("lectura") || (s.activity_type || "").toLowerCase().includes("reading"))
            .reduce((a, s) => a + Math.round((s.duration_seconds || 0) / 60), 0);
        setMinutesToday(fromLang + fromSystems + fromFocus);
        setPages(pageStatsToday(pagesR.data));
        setLoading(false);
    };
    useEffect(() => {
        load();
        const ch = supabase
            .channel("reading_today")
            .on("postgres_changes", { event: "*", schema: "public", table: "daily_systems_tracking" }, load)
            .on("postgres_changes", { event: "*", schema: "public", table: "language_sessions" }, load)
            .subscribe();
        return () => { supabase.removeChannel(ch); };
    }, []);
    const pct = Math.min(100, Math.round((minutesToday / dailyMinutesGoal) * 100));
    const onTrack = minutesToday >= dailyMinutesGoal;
    return (_jsx(Card, { className: cn("border-l-4", onTrack ? "border-l-green-500" : "border-l-amber-500"), children: _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "w-4 h-4 text-muted-foreground" }), _jsx("span", { className: "text-sm font-semibold uppercase tracking-wide", children: "Lectura de hoy" })] }), _jsxs(Badge, { variant: onTrack ? "default" : "secondary", className: "text-xs", children: [_jsx(Flame, { className: "w-3 h-3 mr-1" }), minutesToday, " / ", dailyMinutesGoal, " min"] })] }), _jsx(Progress, { value: pct, className: "h-2" }), _jsxs("div", { className: "grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: pages.today }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["p\u00E1g hoy"] })] }), _jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: pages.week }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["p\u00E1g semana"] })] }), _jsxs("div", { className: "rounded-xl bg-muted/50 p-2 text-center", children: [_jsx("p", { className: "text-lg font-bold leading-none", children: pages.month }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: ["p\u00E1g mes"] })] })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground", children: [dailyPagesGoal > 0 ? (_jsxs("span", { className: "flex items-center gap-1", children: [_jsx(BookOpen, { className: "w-3 h-3" }), " Meta sugerida: ", dailyPagesGoal, " p\u00E1g/d\u00EDa"] })) : _jsx("span", {}), _jsx("span", { children: onTrack ? "Meta cumplida ✓" : `${dailyMinutesGoal - minutesToday} min restantes` })] }), _jsx("div", { className: "pt-1", children: _jsx(WeekStreakBar, { habitId: "lectura", todayValue: minutesToday, maxThreshold: dailyMinutesGoal, compact: true }) }), _jsx("div", { className: "pt-1 border-t border-border/40", children: _jsx(ReadingTrendChart, {}) })] }) }));
}
