import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";
import { Activity, Dumbbell, Moon, Utensils, Droplets, Pill, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRecompensas } from "@/hooks/useRecompensas";
const todayKey = () => new Date().toISOString().split("T")[0];
const semaphore = (value, min, max) => {
    if (value >= max)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓" };
    if (value >= min)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓" };
    if (value > 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Incompleto" };
    return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
};
const MEAL_IDS = ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"];
function calcSleepHours(wakeTime, sleepTime) {
    if (!wakeTime || !sleepTime)
        return 0;
    const [wh, wm] = wakeTime.split(":").map(Number);
    const [sh, sm] = sleepTime.split(":").map(Number);
    if (isNaN(wh) || isNaN(wm) || isNaN(sh) || isNaN(sm))
        return 0;
    const wakeMins = wh * 60 + wm;
    const sleepMins = sh * 60 + sm;
    const diff = sleepMins > wakeMins
        ? (24 * 60 - sleepMins + wakeMins)
        : (wakeMins - sleepMins);
    return Math.round((diff / 60) * 10) / 10;
}
function HealthCardView({ c }) {
    const Icon = c.icon;
    const sem = semaphore(c.todayValue, c.minThreshold, c.maxThreshold);
    const goalPct = c.maxThreshold > 0 ? Math.min(100, Math.round((c.todayValue / c.maxThreshold) * 100)) : 0;
    const max = Math.max(1, ...c.spark);
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg), children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: c.label })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [c.streak > 0 && _jsxs("span", { className: "text-[10px] text-orange-500", children: ["\uD83D\uDD25", c.streak] }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] })] }), _jsxs("div", { className: "flex items-baseline gap-1 mb-1.5", children: [_jsx("span", { className: "text-2xl font-bold", children: c.todayValue }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: c.unit }), c.maxThreshold > 0 && (_jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: ["/", c.maxThreshold] }))] }), c.maxThreshold > 0 && (_jsx(Progress, { value: goalPct, className: "h-1.5 mb-1.5" })), c.spark.length > 0 && (_jsx("div", { className: "flex items-end gap-0.5 h-5 mb-1", children: c.spark.map((v, i) => (_jsx("div", { className: "flex-1 rounded-sm", style: {
                        height: `${Math.max(6, (v / max) * 100)}%`,
                        backgroundColor: i === 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                    } }, i))) })), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Semana: ", c.weekTotal, c.unit && ` ${c.unit}`] })] }));
}
export function HealthSection() {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const { canjes } = useRecompensas();
    const canjesEstaSemana = canjes.filter(c => new Date(c.fecha) >= subDays(new Date(), 7)).length;
    useEffect(() => {
        (async () => {
            try {
                const today = todayKey();
                const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
                const [trackingR, streaksR] = await Promise.all([
                    supabase.from("daily_systems_tracking").select("*").gte("tracking_date", start).lte("tracking_date", today),
                    supabase.from("system_habit_streaks").select("*"),
                ]);
                const rows = trackingR.data || [];
                const streaks = {};
                (streaksR.data || []).forEach((s) => streaks[s.habit_id] = s.current_streak || 0);
                const result = buildCards(rows, streaks);
                setCards(result);
            }
            catch {
                setCards([]);
            }
            setLoading(false);
        })();
    }, []);
    function buildCards(rows, streaks) {
        const sum = (a) => a.reduce((x, y) => x + y, 0);
        const last = (a) => a[a.length - 1] || 0;
        const gymSpark = [];
        const sleepSpark = [];
        const mealSpark = [];
        const waterSpark = [];
        const suppSpark = [];
        for (let i = 6; i >= 0; i--) {
            const d = format(subDays(new Date(), i), "yyyy-MM-dd");
            const row = rows.find((r) => r.tracking_date === d);
            gymSpark.push(row?.workout_duration || 0);
            const hours = calcSleepHours(row?.wake_time, row?.sleep_time);
            sleepSpark.push(hours);
            const comps = row?.completions || {};
            const mealsDone = MEAL_IDS.filter(id => comps[id]).length;
            mealSpark.push(mealsDone);
            const wData = row?.water_data || {};
            const waterDone = MEAL_IDS.filter(id => wData[id]).length;
            waterSpark.push(waterDone);
            suppSpark.push(comps["suplementos"] ? 1 : 0);
        }
        const todayRow = rows.find((r) => r.tracking_date === todayKey());
        return [
            {
                id: "gym", label: "Gym", icon: Dumbbell,
                todayValue: todayRow?.workout_duration || 0, unit: "min",
                minThreshold: 30, maxThreshold: 60,
                weekTotal: sum(gymSpark), streak: streaks["gym"] || 0, spark: gymSpark,
            },
            {
                id: "sueno", label: "Sueño", icon: Moon,
                todayValue: calcSleepHours(todayRow?.wake_time, todayRow?.sleep_time), unit: "hrs",
                minThreshold: 7, maxThreshold: 8,
                weekTotal: Math.round(sum(sleepSpark) * 10) / 10, streak: streaks["horario-regular"] || 0, spark: sleepSpark,
            },
            {
                id: "alimentacion", label: "Alimentación", icon: Utensils,
                todayValue: last(mealSpark), unit: "",
                minThreshold: 5, maxThreshold: 7,
                weekTotal: sum(mealSpark), streak: 0, spark: mealSpark,
            },
            {
                id: "agua", label: "Agua", icon: Droplets,
                todayValue: last(waterSpark), unit: "",
                minThreshold: 5, maxThreshold: 7,
                weekTotal: sum(waterSpark), streak: 0, spark: waterSpark,
            },
            {
                id: "suplementos", label: "Suplementos", icon: Pill,
                todayValue: last(suppSpark), unit: "",
                minThreshold: 1, maxThreshold: 1,
                weekTotal: sum(suppSpark), streak: streaks["suplementos"] || 0, spark: suppSpark,
            },
            {
                id: "estres", label: "Control Estrés", icon: Heart,
                todayValue: canjesEstaSemana, unit: "canj.",
                minThreshold: 1, maxThreshold: 3,
                weekTotal: canjesEstaSemana, streak: 0, spark: [],
            },
        ];
    }
    if (loading)
        return null;
    return (_jsxs(Card, { className: "p-4 mt-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Activity, { className: "h-4 w-4 text-green-500" }), _jsx("h2", { className: "text-sm font-bold uppercase tracking-wide", children: "Salud" })] }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: cards.map(c => _jsx(HealthCardView, { c: c }, c.id)) })] }));
}
