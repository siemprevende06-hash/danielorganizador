import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { BookOpen, Music2, Crown, Image as ImageIcon, ArrowRight, Plus, Save, XCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { useReadingLibrary } from "@/hooks/useReadingLibrary";
import { useMusicRepertoire } from "@/hooks/useMusicRepertoire";
import { useChessTracking } from "@/hooks/useChessTracking";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { WeekStreakBar } from "./WeekStreakBar";
import { toast } from "sonner";
/** Color semáforo: rojo (0) · azul (>0 y <mín) · azul (≥mín y <máx) · verde (máx exacto) · dorado (>máx = extra) */
const semaphore = (value, min, max) => {
    if (value <= 0)
        return { ring: "ring-red-500/60", bg: "bg-red-500/5", text: "text-red-500", label: "Sin hacer" };
    if (value > max)
        return { ring: "ring-amber-500/60", bg: "bg-amber-500/10", text: "text-amber-600", label: "Extra ✓" };
    if (value >= max)
        return { ring: "ring-green-500/60", bg: "bg-green-500/10", text: "text-green-600", label: "Máximo ✓" };
    if (value >= min)
        return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "Mínimo ✓" };
    return { ring: "ring-blue-500/60", bg: "bg-blue-500/10", text: "text-blue-600", label: "En progreso" };
};
export const HobbyCards = ({ todayMinutes, onTimeChange, onCountChange, countData, skipped, onSkipToggle }) => {
    return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(ReadingCard, { todayMin: todayMinutes.lectura || 0, onChange: (v) => onTimeChange("lectura", v), onSkip: () => onSkipToggle?.("lectura"), skipped: !!skipped?.lectura }), _jsx(MusicCard, { todayMin: todayMinutes.musica || 0, onChange: (v) => onTimeChange("musica", v), onSkip: () => onSkipToggle?.("musica"), skipped: !!skipped?.musica }), _jsx(ChessCard, { todayMin: todayMinutes.ajedrez || 0, todayGames: countData.ajedrez || 0, onMinChange: (v) => onTimeChange("ajedrez", v), onGamesChange: (v) => onCountChange("ajedrez", v), onSkip: () => onSkipToggle?.("ajedrez"), skipped: !!skipped?.ajedrez })] }));
};
// ============== LECTURA ==============
const ReadingCard = ({ todayMin, onChange, onSkip, skipped }) => {
    const { books, getCurrentlyReading, getStats } = useReadingLibrary();
    const [weekPages, setWeekPages] = useState(0);
    const [draft, setDraft] = useState(todayMin);
    const current = getCurrentlyReading();
    const stats = getStats();
    const MIN_GOAL = 15;
    const MAX_GOAL = 30;
    const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
    const isSkipped = skipped && todayMin === 0;
    useEffect(() => setDraft(todayMin), [todayMin]);
    useEffect(() => {
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const wp = books
            .filter(b => b.status !== "to_read" && new Date(b.updated_at) >= startOfWeek)
            .reduce((a, b) => a + (b.pages_read || 0), 0);
        setWeekPages(wp);
    }, [books]);
    const progress = current?.pages_total ? Math.round((current.pages_read / current.pages_total) * 100) : 0;
    const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));
    return (_jsxs(Card, { className: cn("overflow-hidden p-0 ring-2 transition-all", sem.ring), children: [_jsxs("div", { className: "ios-grad-header p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-white/20", children: _jsx(BookOpen, { className: "h-4 w-4 text-white" }) }), _jsx("span", { className: "text-white font-semibold text-sm", children: "Lectura" })] }), _jsx(Link, { to: "/reading-library", children: _jsx(ArrowRight, { className: "h-4 w-4 text-white/80" }) })] }), _jsxs("div", { className: cn("p-4 space-y-3", sem.bg), children: [current ? (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-14 h-18 rounded-md bg-muted flex-shrink-0 overflow-hidden border", children: current.cover_image_url ? (_jsx("img", { src: current.cover_image_url, alt: current.title, className: "w-full h-full object-cover" })) : (_jsx("div", { className: "w-full h-full flex items-center justify-center", children: _jsx(ImageIcon, { className: "h-5 w-5 text-muted-foreground/40" }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold truncate", children: current.title }), _jsx("p", { className: "text-[11px] text-muted-foreground truncate", children: current.author || "—" }), _jsx(Progress, { value: progress, className: "h-1.5 mt-1" }), _jsxs("p", { className: "text-[10px] text-muted-foreground mt-0.5", children: [current.pages_read, "/", current.pages_total || "?", " p\u00E1g"] })] })] })) : (_jsxs("div", { className: "text-center py-2", children: [_jsx("p", { className: "text-xs text-muted-foreground", children: "Sin libro activo" }), _jsx(Link, { to: "/reading-library", children: _jsxs(Button, { size: "sm", variant: "outline", className: "mt-1 h-7 text-[11px]", children: [_jsx(Plus, { className: "h-3 w-3" }), " Agregar"] }) })] })), _jsxs("div", { className: "bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Hoy (min)" }), _jsx("span", { className: cn("text-[10px] font-bold", sem.text), children: sem.label })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "number", min: 0, value: draft || "", onChange: (e) => setDraft(parseInt(e.target.value) || 0), onBlur: () => draft !== todayMin && onChange(draft), className: "h-8 text-sm font-bold text-center", placeholder: "0" }), _jsx(Button, { size: "sm", className: "h-8 px-2", onClick: () => { onChange(draft); toast.success("Guardado"); }, children: _jsx(Save, { className: "h-3 w-3" }) }), _jsxs("button", { onClick: () => { onChange(0); onSkip?.(); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), title: "No lo hice", children: [_jsx(XCircle, { className: "h-3 w-3" }), isSkipped ? "Saltado" : "No hice"] })] }), _jsx(Progress, { value: todayPct, className: "h-1.5" }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center", children: ["Min ", MIN_GOAL, " \u00B7 M\u00E1x ", MAX_GOAL, " min"] })] }), _jsx(WeekStreakBar, { habitId: "lectura", todayValue: todayMin, minThreshold: MIN_GOAL, maxThreshold: MAX_GOAL, compact: true }), _jsxs("div", { className: "grid grid-cols-3 gap-1.5 pt-1.5 border-t", children: [_jsx(Stat, { label: "Hoy", value: `${todayMin}m` }), _jsx(Stat, { label: "Sem", value: `${weekPages}p` }), _jsx(Stat, { label: "Mes", value: `${stats.thisYearBooks}/24` })] })] })] }));
};
// ============== MÚSICA ==============
const MusicCard = ({ todayMin, onChange, onSkip, skipped }) => {
    const { songs, getSongsByInstrument } = useMusicRepertoire();
    const [instrument, setInstrument] = useState("piano");
    const [weekMin, setWeekMin] = useState(0);
    const [monthMin, setMonthMin] = useState(0);
    const [draft, setDraft] = useState(todayMin);
    const MIN_GOAL = 15;
    const MAX_GOAL = 30;
    const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
    const isSkipped = skipped && todayMin === 0;
    useEffect(() => setDraft(todayMin), [todayMin]);
    const learning = useMemo(() => getSongsByInstrument(instrument).find(s => s.status === "learning"), [songs, instrument]);
    useEffect(() => {
        (async () => {
            const startOfWeek = new Date();
            startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            const { data } = await supabase
                .from("music_practice_sessions")
                .select("duration_minutes, practice_date, instrument")
                .eq("instrument", instrument)
                .gte("practice_date", startOfMonth.toISOString().split("T")[0]);
            const w = (data || []).filter(d => new Date(d.practice_date) >= startOfWeek)
                .reduce((a, d) => a + (d.duration_minutes || 0), 0);
            const m = (data || []).reduce((a, d) => a + (d.duration_minutes || 0), 0);
            setWeekMin(w);
            setMonthMin(m);
        })();
    }, [instrument]);
    const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));
    return (_jsxs(Card, { className: cn("overflow-hidden p-0 ring-2 transition-all", sem.ring), children: [_jsxs("div", { className: "ios-grad-header p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-white/20", children: _jsx(Music2, { className: "h-4 w-4 text-white" }) }), _jsx("span", { className: "text-white font-semibold text-sm", children: "M\u00FAsica" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("span", { className: "text-[10px] text-white/80", children: instrument === "piano" ? "🎹" : "🎸" }), _jsx(Switch, { checked: instrument === "guitar", onCheckedChange: c => setInstrument(c ? "guitar" : "piano"), className: "scale-75 data-[state=checked]:bg-white/40 data-[state=unchecked]:bg-white/20" })] })] }), _jsxs("div", { className: cn("p-4 space-y-3", sem.bg), children: [learning ? (_jsxs("div", { className: "flex gap-3", children: [_jsx("div", { className: "w-14 h-14 rounded-md bg-gradient-to-br from-primary/20 to-primary/5 flex-shrink-0 flex items-center justify-center border", children: _jsx(Music2, { className: "h-5 w-5 text-primary/60" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold truncate", children: learning.title }), _jsx("p", { className: "text-[11px] text-muted-foreground truncate", children: learning.artist || "—" }), _jsx(Badge, { variant: "outline", className: "mt-0.5 text-[9px] h-4 capitalize", children: learning.difficulty })] })] })) : (_jsxs("div", { className: "text-center py-2", children: [_jsxs("p", { className: "text-xs text-muted-foreground", children: ["Sin canci\u00F3n en ", instrument] }), _jsx(Link, { to: "/music-dashboard", children: _jsxs(Button, { size: "sm", variant: "outline", className: "mt-1 h-7 text-[11px]", children: [_jsx(Plus, { className: "h-3 w-3" }), " Agregar"] }) })] })), _jsxs("div", { className: "bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Hoy (min)" }), _jsx("span", { className: cn("text-[10px] font-bold", sem.text), children: sem.label })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Input, { type: "number", min: 0, value: draft || "", onChange: (e) => setDraft(parseInt(e.target.value) || 0), onBlur: () => draft !== todayMin && onChange(draft), className: "h-8 text-sm font-bold text-center", placeholder: "0" }), _jsx(Button, { size: "sm", className: "h-8 px-2", onClick: () => { onChange(draft); toast.success("Guardado"); }, children: _jsx(Save, { className: "h-3 w-3" }) }), _jsxs("button", { onClick: () => { onChange(0); onSkip?.(); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), title: "No lo hice", children: [_jsx(XCircle, { className: "h-3 w-3" }), isSkipped ? "Saltado" : "No hice"] })] }), _jsx(Progress, { value: todayPct, className: "h-1.5" }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center", children: ["Min ", MIN_GOAL, " \u00B7 M\u00E1x ", MAX_GOAL, " min"] })] }), _jsx(WeekStreakBar, { habitId: "musica", variant: "bars", timeDataKey: "musica", todayValue: todayMin, minThreshold: MIN_GOAL, maxThreshold: MAX_GOAL, compact: true }), _jsxs("div", { className: "grid grid-cols-3 gap-1.5 pt-1.5 border-t", children: [_jsx(Stat, { label: "Hoy", value: `${todayMin}m` }), _jsx(Stat, { label: "Sem", value: `${weekMin}m` }), _jsx(Stat, { label: "Mes", value: `${monthMin}m` })] })] })] }));
};
// ============== AJEDREZ ==============
const ChessCard = ({ todayMin, todayGames, onMinChange, onGamesChange, onSkip, skipped, }) => {
    const { stats, goals } = useChessTracking();
    const MIN_GOAL = 10;
    const MAX_GOAL = 20;
    const sem = semaphore(todayMin, MIN_GOAL, MAX_GOAL);
    const isSkipped = skipped && todayMin === 0;
    const [draftMin, setDraftMin] = useState(todayMin);
    const [draftGames, setDraftGames] = useState(todayGames);
    useEffect(() => setDraftMin(todayMin), [todayMin]);
    useEffect(() => setDraftGames(todayGames), [todayGames]);
    const todayPct = Math.min(100, Math.round((todayMin / MAX_GOAL) * 100));
    return (_jsxs(Card, { className: cn("overflow-hidden p-0 ring-2 transition-all", sem.ring), children: [_jsxs("div", { className: "ios-grad-header p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "p-1.5 rounded-lg bg-white/20", children: _jsx(Crown, { className: "h-4 w-4 text-white" }) }), _jsx("span", { className: "text-white font-semibold text-sm", children: "Ajedrez" })] }), _jsx(Link, { to: "/chess", children: _jsx(ArrowRight, { className: "h-4 w-4 text-white/80" }) })] }), _jsxs("div", { className: cn("p-4 space-y-3", sem.bg), children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-2xl font-bold", children: stats.currentElo }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["ELO ", goals?.target_elo ? `· obj ${goals.target_elo}` : ""] })] }), _jsx(Link, { to: "/chess", children: _jsxs(Button, { size: "sm", variant: "outline", className: "h-7 text-[11px]", children: [_jsx(Plus, { className: "h-3 w-3" }), " Sesi\u00F3n"] }) })] }), _jsxs("div", { className: "bg-card/80 backdrop-blur rounded-lg p-2 border space-y-1.5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-[10px] text-muted-foreground uppercase tracking-wider", children: "Hoy" }), _jsx("span", { className: cn("text-[10px] font-bold", sem.text), children: sem.label })] }), _jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [_jsxs("div", { children: [_jsx(Input, { type: "number", min: 0, value: draftMin || "", onChange: (e) => setDraftMin(parseInt(e.target.value) || 0), onBlur: () => draftMin !== todayMin && onMinChange(draftMin), className: "h-8 text-sm font-bold text-center", placeholder: "min" }), _jsx("p", { className: "text-[9px] text-center text-muted-foreground mt-0.5", children: "minutos" })] }), _jsxs("div", { children: [_jsx(Input, { type: "number", min: 0, value: draftGames || "", onChange: (e) => setDraftGames(parseInt(e.target.value) || 0), onBlur: () => draftGames !== todayGames && onGamesChange(draftGames), className: "h-8 text-sm font-bold text-center", placeholder: "part." }), _jsx("p", { className: "text-[9px] text-center text-muted-foreground mt-0.5", children: "partidas" })] })] }), _jsx("div", { className: "flex justify-center pt-1", children: _jsxs("button", { onClick: () => { onMinChange(0); onSkip?.(); }, className: cn("flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors", isSkipped ? "bg-red-500/20 text-red-500" : "bg-muted text-muted-foreground hover:bg-red-500/10"), title: "No lo hice", children: [_jsx(XCircle, { className: "h-3 w-3" }), isSkipped ? "Saltado" : "No hice"] }) }), _jsx(Progress, { value: todayPct, className: "h-1.5" }), _jsxs("p", { className: "text-[9px] text-muted-foreground text-center", children: ["Min ", MIN_GOAL, " \u00B7 M\u00E1x ", MAX_GOAL, " min"] })] }), _jsx(WeekStreakBar, { habitId: "ajedrez", todayValue: todayMin, minThreshold: MIN_GOAL, maxThreshold: MAX_GOAL, compact: true }), _jsxs("div", { className: "grid grid-cols-3 gap-1.5 pt-1.5 border-t", children: [_jsx(Stat, { label: "Hoy", value: `${stats.today.games}p` }), _jsx(Stat, { label: "Sem", value: `${stats.week.games}p` }), _jsx(Stat, { label: "Mes", value: `${stats.month.games}p` })] })] })] }));
};
const Stat = ({ label, value }) => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "font-semibold text-xs", children: value }), _jsx("p", { className: "text-[9px] text-muted-foreground uppercase tracking-wider", children: label })] }));
