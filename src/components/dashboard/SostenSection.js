import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cachedMutation } from "@/lib/supabaseCache";
import { getCached, setCache } from "@/lib/offlineCache";
import { LayoutGrid, Sparkles, Utensils, Heart, Moon, Dumbbell } from "lucide-react";
import { cn } from "@/lib/utils";
const todayKey = () => new Date().toISOString().split("T")[0];
const ESTRUCTURALES = [
    { id: "rutina-activacion", name: "Rutina de Activación" },
    { id: "alistamiento-desayuno", name: "Alistamiento y Desayuno" },
    { id: "horario-regular", name: "Horario Regular" },
    { id: "rutina-desactivacion", name: "Rutina de Desactivación" },
];
const APARIENCIA = [
    { id: "skincare-manana", name: "Skin Care Mañana" },
    { id: "skincare-noche", name: "Skin Care Noche" },
    { id: "banarme-vestirme", name: "Bañarme y Vestirme" },
];
const ALIMENTACION = [
    { id: "pre-entreno", name: "Pre-entreno" },
    { id: "desayuno", name: "Desayuno" },
    { id: "merienda-1", name: "Merienda 1" },
    { id: "almuerzo", name: "Almuerzo" },
    { id: "merienda-2", name: "Merienda 2" },
    { id: "comida", name: "Comida" },
    { id: "antes-dormir", name: "Antes de Dormir" },
];
export function SostenSection() {
    const [data, setData] = useState({ completions: {}, sleepQuality: 0, workoutDone: false });
    const [recordId, setRecordId] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            const today = todayKey();
            let row = null;
            try {
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("*")
                    .eq("tracking_date", today)
                    .maybeSingle();
                row = data;
                if (row) {
                    setRecordId(row.id);
                    await setCache("daily_systems_tracking", `sosten_${today}`, row);
                }
            }
            catch {
                const cached = await getCached("daily_systems_tracking", `sosten_${today}`);
                row = cached;
            }
            if (row) {
                setRecordId(row.id);
                setData({
                    completions: row.completions || {},
                    sleepQuality: row.sleep_quality || 0,
                    workoutDone: (row.workout_duration || 0) > 0,
                });
            }
            setLoading(false);
        })();
    }, []);
    const toggle = async (id) => {
        const newCompletions = { ...data.completions, [id]: !data.completions[id] };
        setData(prev => ({ ...prev, completions: newCompletions }));
        const payload = { completions: newCompletions, tracking_date: todayKey() };
        if (recordId) {
            await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
        }
        else {
            const { queued } = await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
            if (queued) {
                setRecordId("pending");
            }
        }
    };
    const setSleepQuality = async (v) => {
        setData(prev => ({ ...prev, sleepQuality: v }));
        const payload = { sleep_quality: v, tracking_date: todayKey() };
        if (recordId) {
            await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
        }
        else {
            await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
        }
    };
    const setWorkoutDone = async (v) => {
        setData(prev => ({ ...prev, workoutDone: v }));
        const payload = { workout_duration: v ? 1 : 0, tracking_date: todayKey() };
        if (recordId) {
            await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
        }
        else {
            await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
        }
    };
    const countDone = (habits) => habits.filter(h => data.completions[h.id]).length;
    if (loading)
        return null;
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Heart, { className: "h-4 w-4 text-amber-500" }), _jsx("h2", { className: "text-sm font-bold uppercase tracking-wide", children: "SOST\u00C9N" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-3", children: [_jsx(GroupCard, { title: "Estructurales", icon: LayoutGrid, color: "blue", habits: ESTRUCTURALES, completions: data.completions, done: countDone(ESTRUCTURALES), total: ESTRUCTURALES.length, onToggle: toggle }), _jsx(GroupCard, { title: "Apariencia", icon: Sparkles, color: "pink", habits: APARIENCIA, completions: data.completions, done: countDone(APARIENCIA), total: APARIENCIA.length, onToggle: toggle }), _jsxs(Card, { className: "p-3 ring-2 ring-amber-500/60 bg-amber-500/5", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Utensils, { className: "h-4 w-4 text-amber-500" }), _jsx("span", { className: "text-xs font-bold", children: "Salud" }), _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: [countDone(ALIMENTACION), "/", ALIMENTACION.length, " comidas"] })] }), _jsx("div", { className: "grid grid-cols-2 gap-1 mb-3", children: ALIMENTACION.map(h => {
                                    const done = !!data.completions[h.id];
                                    return (_jsxs("button", { onClick: () => toggle(h.id), className: cn("text-[10px] py-1 px-1.5 rounded text-left transition-all", done
                                            ? "bg-green-500/20 text-green-600 font-medium"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"), children: [done ? "✓ " : "", h.name] }, h.id));
                                }) }), _jsxs("div", { className: "mb-2", children: [_jsxs("div", { className: "flex items-center gap-1 mb-1", children: [_jsx(Moon, { className: "h-3 w-3 text-indigo-400" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Calidad del sue\u00F1o" }), _jsxs("span", { className: "text-[10px] font-bold ml-auto", children: [data.sleepQuality, "/10"] })] }), _jsx("div", { className: "flex gap-0.5", children: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (_jsx("button", { onClick: () => setSleepQuality(n), className: cn("flex-1 h-2 rounded-sm transition-all", n <= data.sleepQuality ? "bg-indigo-500" : "bg-muted") }, n))) })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-3 w-3 text-orange-400" }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: "Entrenamiento" }), _jsx("button", { onClick: () => setWorkoutDone(!data.workoutDone), className: cn("ml-auto text-[10px] px-2 py-0.5 rounded font-medium transition-all", data.workoutDone
                                            ? "bg-green-500/20 text-green-600"
                                            : "bg-muted/50 text-muted-foreground hover:bg-muted"), children: data.workoutDone ? "✓ Hecho" : "Marcar" })] })] })] })] }));
}
function GroupCard({ title, icon: Icon, color, habits, completions, done, total, onToggle, }) {
    const ringMap = {
        blue: "ring-blue-500/60",
        pink: "ring-pink-500/60",
    };
    const bgMap = {
        blue: "bg-blue-500/5",
        pink: "bg-pink-500/5",
    };
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return (_jsxs(Card, { className: cn("p-3 ring-2 transition-all", ringMap[color], bgMap[color]), children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(Icon, { className: "h-4 w-4 text-muted-foreground" }), _jsx("span", { className: "text-xs font-bold", children: title }), _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: [done, "/", total] })] }), _jsx(Progress, { value: pct, className: "h-1.5 mb-2" }), _jsx("div", { className: "space-y-1", children: habits.map(h => {
                    const done = !!completions[h.id];
                    return (_jsxs("button", { onClick: () => onToggle(h.id), className: cn("w-full text-left text-[11px] py-1.5 px-2 rounded transition-all flex items-center gap-2", done
                            ? "bg-green-500/15 text-green-600 font-medium"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted"), children: [_jsx("div", { className: cn("w-3 h-3 rounded border shrink-0 flex items-center justify-center transition-all", done ? "bg-green-500 border-green-500" : "border-muted-foreground/40"), children: done && _jsx("span", { className: "text-[8px] text-white font-bold", children: "\u2713" }) }), h.name] }, h.id));
                }) })] }));
}
