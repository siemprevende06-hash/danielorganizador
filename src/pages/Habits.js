import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCached } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { getSetting, setSetting } from "@/lib/settings";
import { Dumbbell, Moon, Zap, Droplet, Target, Shirt, GraduationCap, Code, Briefcase, Book, Music, Globe, Crown, Plus, Trash2, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const MINI_HABITS_SETTING = "mini_habits_defs";
const DEFAULT_MINI_HABITS = [
    { id: "mini-nofap", label: "No FAP", emoji: "🚫" },
    { id: "mini-nosocial", label: "No Redes Sociales +30min", emoji: "📵" },
];
const STRUCTURAL_HABITS = [
    { id: "habit-sueno", title: "Horario regular de sueño", icon: Moon, area: "sueno" },
    { id: "habit-rutina-activacion", title: "Rutina de activación", icon: Zap, area: "rutina-activacion" },
    { id: "habit-entrenamiento", title: "Gym", icon: Dumbbell, area: "entrenamiento" },
    { id: "habit-desayuno", title: "Alistamiento y desayuno", icon: Shirt, area: "cuidado-personal" },
    { id: "habit-skincare-am", title: "Skin care (mañana)", icon: Droplet, area: "skincare" },
    { id: "habit-skincare-pm", title: "Skin care (noche)", icon: Droplet, area: "skincare" },
    { id: "habit-rutina-desactivacion", title: "Rutina de desactivación", icon: Moon, area: "rutina-desactivacion" },
    { id: "habit-alimentacion", title: "Alimentación y agua", icon: Target, area: "cuidado-personal" },
    { id: "habit-finanzas", title: "Control financiero diario", icon: Target, area: "finanzas" },
];
const FOCUS_HABITS = [
    { id: "habit-foco", title: "Foco", icon: Target, area: "focus" },
    { id: "habit-universidad", title: "Universidad", icon: GraduationCap, area: "universidad" },
    { id: "habit-emprendimiento", title: "Emprendimiento", icon: Briefcase, area: "emprendimiento" },
    { id: "habit-proyectos", title: "Proyectos y tareas", icon: Code, area: "proyectos-personales" },
];
const HOBBY_HABITS = [
    { id: "habit-lectura", title: "Lectura", icon: Book, area: "lectura" },
    { id: "habit-ajedrez", title: "Ajedrez", icon: Crown, area: "ajedrez" },
    { id: "habit-piano", title: "Piano", icon: Music, area: "musica" },
    { id: "habit-guitarra", title: "Guitarra", icon: Music, area: "musica" },
    { id: "habit-ingles", title: "Inglés", icon: Globe, area: "idiomas" },
    { id: "habit-italiano", title: "Italiano", icon: Globe, area: "idiomas" },
];
const todayKey = () => new Date().toISOString().split("T")[0];
async function loadMiniDefs() {
    try {
        const arr = await getSetting(MINI_HABITS_SETTING);
        if (Array.isArray(arr) && arr.length > 0)
            return arr;
    }
    catch { }
    await saveMiniDefs(DEFAULT_MINI_HABITS);
    return DEFAULT_MINI_HABITS;
}
async function saveMiniDefs(defs) {
    await setSetting(MINI_HABITS_SETTING, defs);
}
export default function HabitsPage() {
    const [miniDefs, setMiniDefs] = useState([]);
    const [completions, setCompletions] = useState({});
    const [recordId, setRecordId] = useState(null);
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newLabel, setNewLabel] = useState("");
    const [newEmoji, setNewEmoji] = useState("⭐");
    const [todayScore, setTodayScore] = useState(0);
    useEffect(() => {
        loadMiniDefs().then(setMiniDefs);
        (async () => {
            const today = todayKey();
            try {
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("id, completions")
                    .eq("tracking_date", today)
                    .maybeSingle();
                if (data) {
                    setRecordId(data.id);
                    setCompletions(data.completions || {});
                }
            }
            catch {
                const cached = await getCached("daily_systems_tracking", `mini_${today}`);
                if (cached)
                    setCompletions(cached.completions || {});
            }
        })();
    }, []);
    const allHabits = [...STRUCTURAL_HABITS, ...FOCUS_HABITS, ...HOBBY_HABITS];
    useEffect(() => {
        const miniDone = miniDefs.filter(d => completions[d.id]).length;
        const structDone = allHabits.filter(h => completions[h.id]).length;
        const total = miniDefs.length + allHabits.length;
        setTodayScore(total > 0 ? Math.round(((miniDone + structDone) / total) * 100) : 0);
    }, [completions, miniDefs]);
    const toggleMini = async (id) => {
        const next = { ...completions, [id]: !completions[id] };
        setCompletions(next);
        const payload = { completions: next, tracking_date: todayKey() };
        if (recordId) {
            await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
        }
        else {
            await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
        }
    };
    const addMini = () => {
        if (!newLabel.trim())
            return;
        const id = `mini-${Date.now()}`;
        const updated = [...miniDefs, { id, label: newLabel.trim(), emoji: newEmoji }];
        setMiniDefs(updated);
        saveMiniDefs(updated);
        setNewLabel("");
        setIsAddOpen(false);
        toast.success("Mini hábito creado");
    };
    const deleteMini = (id) => {
        const updated = miniDefs.filter(d => d.id !== id);
        setMiniDefs(updated);
        saveMiniDefs(updated);
        toast.success("Mini hábito eliminado");
    };
    const doneCount = miniDefs.filter(d => completions[d.id]).length;
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "H\u00E1bitos" }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: new Date().toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" }) })] }), _jsxs(Dialog, { open: isAddOpen, onOpenChange: setIsAddOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "h-8 text-xs rounded-full gap-1.5", children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), " Mini H\u00E1bito"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nuevo Mini H\u00E1bito" }) }), _jsxs("div", { className: "space-y-3 py-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Nombre" }), _jsx(Input, { value: newLabel, onChange: e => setNewLabel(e.target.value), placeholder: "Ej: No FAP", onKeyDown: e => e.key === "Enter" && addMini() })] }), _jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "Emoji" }), _jsx("div", { className: "flex gap-2 mt-1 flex-wrap", children: ["🚫", "📵", "⭐", "💪", "🧠", "🎯", "🔥", "⏰", "📚", "🎮", "🎵", "💧", "🌙", "☀️"].map(e => (_jsx("button", { onClick: () => setNewEmoji(e), className: cn("text-xl w-9 h-9 rounded-lg flex items-center justify-center transition-all", newEmoji === e ? "bg-primary/20 ring-2 ring-primary" : "bg-muted hover:bg-muted/70"), children: e }, e))) })] }), _jsx(Button, { onClick: addMini, className: "w-full rounded-full", children: "Crear" })] })] })] })] }), _jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" }), _jsxs(CardContent, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("span", { className: "text-xs font-medium text-muted-foreground", children: "Progreso de hoy" }), _jsxs("span", { className: "text-sm font-bold", children: [todayScore, "%"] })] }), _jsx(Progress, { value: todayScore, className: "h-1.5", indicatorClassName: "bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400" })] })] }), _jsx("div", { className: "grid grid-cols-3 gap-2.5", children: [
                        { label: "Mini Hábitos", value: `${doneCount}/${miniDefs.length}`, color: "from-purple-500 to-pink-400" },
                        { label: "Estructurales", value: `${STRUCTURAL_HABITS.filter(h => completions[h.id]).length}/${STRUCTURAL_HABITS.length}`, color: "from-blue-500 to-cyan-400" },
                        { label: "Hobbies", value: `${HOBBY_HABITS.filter(h => completions[h.id]).length}/${HOBBY_HABITS.length}`, color: "from-amber-500 to-orange-400" },
                    ].map((s, i) => (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-1 bg-gradient-to-r", s.color) }), _jsxs(CardContent, { className: "p-3.5 text-center space-y-1", children: [_jsx("div", { className: "text-lg font-bold tabular-nums", children: s.value }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: s.label })] })] }, i))) }), _jsxs(Tabs, { defaultValue: "mini", className: "space-y-4", children: [_jsxs(TabsList, { className: "grid grid-cols-3 w-full rounded-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl p-1 h-auto", children: [_jsx(TabsTrigger, { value: "mini", className: "rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground", children: "Mini H\u00E1bitos" }), _jsx(TabsTrigger, { value: "categorias", className: "rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground", children: "Estructurales" }), _jsx(TabsTrigger, { value: "hobbys", className: "rounded-full text-xs py-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground", children: "Hobbies" })] }), _jsx(TabsContent, { value: "mini", className: "space-y-2 mt-0", children: miniDefs.length === 0 ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(Sparkles, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsx("p", { className: "font-medium mb-1", children: "Sin mini h\u00E1bitos" }), _jsx("p", { className: "text-xs text-muted-foreground text-center", children: "Crea tu primer mini h\u00E1bito para empezar" })] }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-2", children: miniDefs.map(d => {
                                    const done = !!completions[d.id];
                                    return (_jsx(Card, { className: cn("border-0 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all", done ? "bg-white/80 dark:bg-zinc-950/80" : "bg-white/50 dark:bg-zinc-950/50"), children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { onClick: () => toggleMini(d.id), className: cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all", done ? "bg-green-500/15 text-green-500" : "bg-muted/50 text-muted-foreground"), children: _jsx("span", { className: "text-lg", children: d.emoji }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: cn("text-sm font-medium block truncate", done && "text-green-600 dark:text-green-400"), children: d.label }), done && _jsx("span", { className: "text-[10px] text-green-500 font-medium", children: "Completado \u2713" })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-8 w-8 shrink-0 rounded-full", onClick: () => deleteMini(d.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })] }) }) }, d.id));
                                }) })) }), _jsxs(TabsContent, { value: "categorias", className: "space-y-3 mt-0", children: [_jsx(StructuralCard, { title: "Estructurales (Base)", habits: STRUCTURAL_HABITS, completions: completions, onToggle: toggleMini }), _jsx(StructuralCard, { title: "\u00C1reas de Enfoque", habits: FOCUS_HABITS, completions: completions, onToggle: toggleMini })] }), _jsx(TabsContent, { value: "hobbys", className: "space-y-3 mt-0", children: _jsx(StructuralCard, { title: "Hobbies", habits: HOBBY_HABITS, completions: completions, onToggle: toggleMini }) })] })] }) }));
}
function StructuralCard({ title, habits, completions, onToggle, }) {
    const done = habits.filter(h => completions[h.id]).length;
    return (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: "h-1 bg-gradient-to-r from-primary to-primary/60" }), _jsxs(CardContent, { className: "p-4 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: title }), _jsxs(Badge, { variant: "outline", className: cn("text-[10px] rounded-full", done === habits.length && "bg-green-500/10 text-green-500 border-green-500/30"), children: [done, "/", habits.length] })] }), _jsx("div", { className: "space-y-1", children: habits.map(habit => {
                            const completed = !!completions[habit.id];
                            const Icon = habit.icon;
                            return (_jsxs("button", { onClick: () => onToggle(habit.id), className: cn("w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left", completed ? "bg-green-500/10" : "bg-muted/30 hover:bg-muted/50"), children: [_jsx("div", { className: cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all", completed ? "bg-green-500/15 text-green-500" : "bg-muted/50 text-muted-foreground"), children: _jsx(Icon, { className: "h-4 w-4" }) }), _jsx("span", { className: cn("text-sm flex-1", completed && "text-green-600 dark:text-green-400 font-medium"), children: habit.title }), completed && _jsx(CheckCircle2, { className: "h-4 w-4 text-green-500 shrink-0" })] }, habit.id));
                        }) })] })] }));
}
