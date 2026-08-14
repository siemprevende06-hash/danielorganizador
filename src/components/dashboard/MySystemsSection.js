import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { format, subDays } from "date-fns";
import { Activity, Dumbbell, Languages, Music, Gamepad2, BookOpen, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "@/components/systems/WeekStreakBar";
import { useMusicRepertoire } from "@/hooks/useMusicRepertoire";
const todayKey = () => new Date().toISOString().split("T")[0];
const semaphore = (value, min, max) => {
    if (value > max)
        return { ring: "ring-amber-400/60", bg: "bg-amber-400/10", text: "text-amber-500", label: "Extra ✦", dot: "bg-amber-400" };
    if (value >= max)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓", dot: "bg-green-500" };
    if (value >= min)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓", dot: "bg-blue-500" };
    if (value > 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Incompleto", dot: "bg-red-400" };
    return { ring: "ring-red-500/40", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer", dot: "bg-gray-400" };
};
function SystemCardView({ c }) {
    const Icon = c.icon;
    const sem = semaphore(c.todayValue, c.minThreshold, c.maxThreshold);
    const goalPct = c.maxThreshold > 0 ? Math.min(100, Math.round((c.todayValue / c.maxThreshold) * 100)) : 0;
    const max = Math.max(1, ...c.spark);
    return (_jsx(Link, { to: c.route || "/systems", className: "block relative", children: _jsxs(Card, { className: cn("p-3 ring-2 transition-all h-full", sem.ring, sem.bg), children: [_jsx("div", { className: cn("absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900", sem.dot) }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: c.label })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [c.streak > 0 && _jsxs("span", { className: "text-[10px] text-orange-500", children: ["\uD83D\uDD25", c.streak] }), _jsx("span", { className: cn("text-[10px] font-semibold", sem.text), children: sem.label })] })] }), c.schedule && (_jsx("p", { className: "text-[10px] text-muted-foreground mb-1.5 font-mono", children: c.schedule })), _jsxs("div", { className: "flex items-baseline gap-1 mb-1.5", children: [_jsx("span", { className: "text-2xl font-bold", children: c.todayValue }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: c.unit }), c.maxThreshold > 0 && (_jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: ["/", c.maxThreshold] }))] }), c.maxThreshold > 0 && (_jsx(Progress, { value: goalPct, className: "h-1.5 mb-1.5" })), c.spark.length > 0 && (_jsx("div", { className: "flex items-end gap-0.5 h-5 mb-1", children: c.spark.map((v, i) => (_jsx("div", { className: "flex-1 rounded-sm", style: {
                            height: `${Math.max(6, (v / max) * 100)}%`,
                            backgroundColor: i === 6 ? "hsl(var(--primary))" : "hsl(var(--muted-foreground) / 0.4)",
                        } }, i))) })), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Semana: ", c.weekTotal, c.unit && ` ${c.unit}`] })] }) }));
}
export function MySystemsSection() {
    const [cards, setCards] = useState([]);
    const [idiomasCard, setIdiomasCard] = useState(null);
    const [gymCard, setGymCard] = useState(null);
    const [musicaMin, setMusicaMin] = useState(0);
    const [loading, setLoading] = useState(true);
    const { getSongsByInstrument } = useMusicRepertoire();
    const pianoLearning = getSongsByInstrument("piano").find(s => s.status === "learning");
    const guitarLearning = getSongsByInstrument("guitar").find(s => s.status === "learning");
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
                await setCache("daily_systems_tracking", `systems_7d_${today}`, rows);
                await setCache("system_habit_streaks", "all", streaksR.data || []);
                const todayRow = rows.find((r) => r.tracking_date === today);
                const td = todayRow?.time_data || {};
                setMusicaMin(Number(td["musica"]) || 0);
                const result = buildCards(rows, streaks, today);
                setCards(result.cards);
                setIdiomasCard(result.idiomasCard);
                setGymCard(result.gymCard);
            }
            catch {
                const today = todayKey();
                const start = format(subDays(new Date(), 6), "yyyy-MM-dd");
                const cachedRows = await getCached("daily_systems_tracking", `systems_7d_${today}`);
                const cachedStreaks = await getCached("system_habit_streaks", "all");
                if (cachedRows) {
                    const sMap = {};
                    (cachedStreaks || []).forEach((s) => sMap[s.habit_id] = s.current_streak || 0);
                    const todayRow = cachedRows.find((r) => r.tracking_date === today);
                    const td = todayRow?.time_data || {};
                    setMusicaMin(Number(td["musica"]) || 0);
                    const result = buildCards(cachedRows, sMap, today);
                    setCards(result.cards);
                    setIdiomasCard(result.idiomasCard);
                    setGymCard(result.gymCard);
                }
            }
            setLoading(false);
        })();
    }, []);
    function buildCards(rows, streaks, today) {
        const minutesByDay = (key) => {
            const arr = [];
            for (let i = 6; i >= 0; i--) {
                const d = format(subDays(new Date(), i), "yyyy-MM-dd");
                const row = rows.find((r) => r.tracking_date === d);
                const t = row?.time_data || {};
                arr.push(Number(t[key]) || 0);
            }
            return arr;
        };
        const gymByDay = () => {
            const arr = [];
            for (let i = 6; i >= 0; i--) {
                const d = format(subDays(new Date(), i), "yyyy-MM-dd");
                const row = rows.find((r) => r.tracking_date === d);
                arr.push(Number(row?.workout_duration) || 0);
            }
            return arr;
        };
        const sum = (a) => a.reduce((x, y) => x + y, 0);
        const last = (a) => a[a.length - 1] || 0;
        const gameSpark = minutesByDay("game");
        const gymSpark = gymByDay();
        const cards = [
            {
                id: "lectura", label: "Lectura", icon: BookOpen, route: "/reading-library",
                schedule: "8:30 - 9:00 AM",
                todayValue: last(minutesByDay("lectura")), unit: "min",
                minThreshold: 15, maxThreshold: 30,
                weekTotal: sum(minutesByDay("lectura")), streak: streaks.lectura || 0, spark: minutesByDay("lectura"),
            },
            {
                id: "ajedrez", label: "Ajedrez", icon: Crown, route: "/chess",
                schedule: "1:20 - 2:00 PM",
                todayValue: last(minutesByDay("ajedrez")), unit: "min",
                minThreshold: 10, maxThreshold: 20,
                weekTotal: sum(minutesByDay("ajedrez")), streak: streaks.ajedrez || 0, spark: minutesByDay("ajedrez"),
            },
            {
                id: "game", label: "Game (Seducción)", icon: Gamepad2, route: "/systems",
                schedule: "1:20 - 2:00 PM",
                todayValue: last(gameSpark), unit: "min",
                minThreshold: 10, maxThreshold: 20,
                weekTotal: sum(gameSpark), streak: streaks.game || 0, spark: gameSpark,
            },
        ];
        const idiomasSpark = minutesByDay("idiomas");
        const iCard = {
            id: "idiomas", label: "Idiomas", icon: Languages, route: "/languages-dashboard",
            schedule: "5:00 - 6:30 PM",
            todayValue: last(idiomasSpark), unit: "min",
            minThreshold: 30, maxThreshold: 90,
            weekTotal: sum(idiomasSpark), streak: streaks.idiomas || 0, spark: idiomasSpark,
        };
        const gCard = {
            id: "gym", label: "Gym", icon: Dumbbell, route: "/gym",
            schedule: "6:00 - 7:00 PM",
            todayValue: last(gymSpark), unit: "min",
            minThreshold: 30, maxThreshold: 60,
            weekTotal: sum(gymSpark), streak: streaks.gym || 0, spark: gymSpark,
        };
        return { cards, idiomasCard: iCard, gymCard: gCard };
    }
    const musicaSem = semaphore(musicaMin, 15, 30);
    if (loading)
        return null;
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("h2", { className: "text-sm font-bold uppercase tracking-wide flex items-center gap-2", children: [_jsx(Activity, { className: "h-4 w-4" }), "Mis Sistemas (acumulativos)"] }), _jsx(Link, { to: "/systems", className: "text-xs text-muted-foreground hover:text-foreground", children: "Ver todo \u2192" })] }), _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2", children: "Hobbies Mentales" }), _jsx("div", { className: "grid grid-cols-3 gap-3 mb-5", children: cards.map(c => _jsx(SystemCardView, { c: c }, c.id)) }), idiomasCard && (_jsx("div", { className: "grid grid-cols-3 gap-3 mb-5", children: _jsx("div", { className: "col-span-3", children: _jsx(SystemCardView, { c: idiomasCard }) }) })), _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2", children: "Hobbies Art\u00EDsticos" }), _jsx("div", { className: "grid grid-cols-3 gap-3 mb-5", children: _jsx(Link, { to: "/music-dashboard", className: "col-span-3 block relative", children: _jsxs(Card, { className: cn("p-3 ring-2 h-full", musicaSem.ring, musicaSem.bg), children: [_jsx("div", { className: cn("absolute top-2 right-2 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900", musicaSem.dot) }), _jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Music, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: "M\u00FAsica" })] }), _jsx("span", { className: cn("text-[10px] font-semibold", musicaSem.text), children: musicaSem.label })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 mb-2", children: [_jsxs("div", { className: "rounded-lg bg-muted/30 p-2", children: [_jsxs("div", { className: "flex items-center gap-1 mb-1", children: [_jsx("span", { className: "text-sm", children: "\uD83C\uDFB9" }), _jsx("span", { className: "text-[10px] font-semibold", children: "Piano" })] }), pianoLearning ? (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium truncate", children: pianoLearning.title }), _jsx("p", { className: "text-[9px] text-muted-foreground truncate", children: pianoLearning.artist }), _jsx(Badge, { variant: "outline", className: "mt-0.5 text-[8px] h-3.5 capitalize", children: pianoLearning.difficulty })] })) : (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Sin canci\u00F3n" }))] }), _jsxs("div", { className: "rounded-lg bg-muted/30 p-2", children: [_jsxs("div", { className: "flex items-center gap-1 mb-1", children: [_jsx("span", { className: "text-sm", children: "\uD83C\uDFB8" }), _jsx("span", { className: "text-[10px] font-semibold", children: "Guitarra" })] }), guitarLearning ? (_jsxs("div", { children: [_jsx("p", { className: "text-xs font-medium truncate", children: guitarLearning.title }), _jsx("p", { className: "text-[9px] text-muted-foreground truncate", children: guitarLearning.artist }), _jsx(Badge, { variant: "outline", className: "mt-0.5 text-[8px] h-3.5 capitalize", children: guitarLearning.difficulty })] })) : (_jsx("p", { className: "text-[10px] text-muted-foreground", children: "Sin canci\u00F3n" }))] })] }), _jsx("div", { className: "flex items-center justify-between text-xs mb-1", children: _jsxs("span", { className: "font-bold", children: [musicaMin, " ", _jsx("span", { className: "text-[10px] text-muted-foreground font-normal", children: "min hoy" })] }) }), _jsx(WeekStreakBar, { habitId: "musica", todayValue: musicaMin, minThreshold: 15, maxThreshold: 30, compact: true, hideStreak: true })] }) }) }), _jsx("p", { className: "text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2", children: "Entrenamiento" }), _jsx("div", { className: "grid grid-cols-3 gap-3", children: gymCard && (_jsx("div", { className: "col-span-3", children: _jsx(SystemCardView, { c: gymCard }) })) })] }));
}
