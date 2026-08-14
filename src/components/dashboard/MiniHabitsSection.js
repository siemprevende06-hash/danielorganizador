import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { getCached, setCache } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { getSetting, setSetting } from "@/lib/settings";
import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
const MINI_HABITS_SETTING = "mini_habits_defs";
const DEFAULT_MINI_HABITS = [
    { id: "mini-nofap", label: "No FAP", emoji: "🚫" },
    { id: "mini-nosocial", label: "No Redes Sociales +30min", emoji: "📵" },
];
const todayKey = () => new Date().toISOString().split("T")[0];
async function loadDefsFromBackend() {
    try {
        const v = await getSetting(MINI_HABITS_SETTING);
        const arr = v;
        if (Array.isArray(arr) && arr.length > 0)
            return arr;
    }
    catch { }
    // seed defaults
    try {
        await setSetting(MINI_HABITS_SETTING, DEFAULT_MINI_HABITS);
    }
    catch { }
    return DEFAULT_MINI_HABITS;
}
export function MiniHabitsSection() {
    const [defs, setDefs] = useState([]);
    const [completions, setCompletions] = useState({});
    const [recordId, setRecordId] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            setDefs(await loadDefsFromBackend());
        })();
        (async () => {
            const today = todayKey();
            let row = null;
            try {
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .select("id, completions")
                    .eq("tracking_date", today)
                    .maybeSingle();
                row = data;
                if (row)
                    await setCache("daily_systems_tracking", `mini_${today}`, row);
            }
            catch {
                row = await getCached("daily_systems_tracking", `mini_${today}`);
            }
            if (row) {
                setRecordId(row.id);
                setCompletions(row.completions || {});
            }
            setLoading(false);
        })();
    }, []);
    const toggle = async (id) => {
        const next = { ...completions, [id]: !completions[id] };
        setCompletions(next);
        const payload = { completions: next, tracking_date: todayKey() };
        if (recordId) {
            await cachedMutation("daily_systems_tracking", "update", payload, { id: recordId });
        }
        else {
            const { queued } = await cachedMutation("daily_systems_tracking", "upsert", payload, undefined, "tracking_date");
            if (!queued) {
                const { data } = await supabase
                    .from("daily_systems_tracking")
                    .upsert(payload, { onConflict: "tracking_date" })
                    .select("id")
                    .single();
                if (data)
                    setRecordId(data.id);
            }
        }
    };
    if (loading)
        return null;
    const done = defs.filter(d => completions[d.id]).length;
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Zap, { className: "h-4 w-4 text-yellow-500" }), _jsx("h2", { className: "text-sm font-bold uppercase tracking-wide", children: "Mini H\u00E1bitos" }), _jsxs("span", { className: "text-[10px] text-muted-foreground ml-auto", children: [done, "/", defs.length] })] }), _jsx(Progress, { value: defs.length > 0 ? (done / defs.length) * 100 : 0, className: "h-1.5 mb-3" }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-2", children: defs.map(d => {
                    const isDone = !!completions[d.id];
                    return (_jsxs("button", { onClick: () => toggle(d.id), className: cn("flex items-center gap-2 text-left py-2.5 px-3 rounded-lg transition-all ring-1", isDone
                            ? "bg-green-500/10 ring-green-500/50 text-green-600 font-medium"
                            : "bg-muted/40 ring-muted/30 text-muted-foreground hover:bg-muted/60"), children: [_jsx("span", { className: "text-lg", children: d.emoji }), _jsx("span", { className: "text-xs flex-1", children: d.label }), isDone && _jsx("span", { className: "text-sm", children: "\u2713" })] }, d.id));
                }) })] }));
}
