import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Clock, Sun, Moon, Dumbbell, Coffee, Languages, Target, BookOpen, Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoutinePresets } from "@/hooks/useRoutinePresets";
import { supabase } from "@/integrations/supabase/client";
const TYPE_ICON = {
    morning: Sun,
    night: Moon,
    gym: Dumbbell,
    meal: Coffee,
    languages: Languages,
    music: Music,
    learning: BookOpen,
    focus: Target,
};
const TYPE_COLOR = {
    morning: "text-amber-500 bg-amber-500/10 border-amber-500/30",
    night: "text-indigo-500 bg-indigo-500/10 border-indigo-500/30",
    gym: "text-red-500 bg-red-500/10 border-red-500/30",
    meal: "text-orange-500 bg-orange-500/10 border-orange-500/30",
    languages: "text-green-500 bg-green-500/10 border-green-500/30",
    music: "text-pink-500 bg-pink-500/10 border-pink-500/30",
    learning: "text-cyan-500 bg-cyan-500/10 border-cyan-500/30",
    focus: "text-primary bg-primary/10 border-primary/40",
};
const toMin = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};
export function PresetSchedulePicker({ persistToToday = true, selectedPresetId: controlledId, onSelectPreset, className, compact = false, }) {
    const { presets, isLoading } = useRoutinePresets();
    const [internalId, setInternalId] = useState(null);
    const [now, setNow] = useState(() => {
        const d = new Date();
        return d.getHours() * 60 + d.getMinutes();
    });
    useEffect(() => {
        const i = setInterval(() => {
            const d = new Date();
            setNow(d.getHours() * 60 + d.getMinutes());
        }, 60000);
        return () => clearInterval(i);
    }, []);
    // Load saved selection for today
    useEffect(() => {
        if (controlledId !== undefined)
            return;
        (async () => {
            const today = new Date().toISOString().split("T")[0];
            const { data } = await supabase
                .from("daily_plans")
                .select("preset_id")
                .eq("plan_date", today)
                .maybeSingle();
            if (data?.preset_id)
                setInternalId(data.preset_id);
        })();
    }, [controlledId]);
    const selectedId = controlledId !== undefined ? controlledId : internalId;
    const selected = useMemo(() => presets.find(p => p.id === selectedId) || presets.find(p => p.is_default) || presets[0], [presets, selectedId]);
    const schedule = useMemo(() => {
        const raw = selected?.modified_blocks?.schedule;
        return Array.isArray(raw) ? raw : [];
    }, [selected]);
    const handleChange = async (id) => {
        const preset = presets.find(p => p.id === id);
        if (!preset)
            return;
        setInternalId(id);
        onSelectPreset?.(id, preset);
        if (persistToToday) {
            const today = new Date().toISOString().split("T")[0];
            await supabase
                .from("daily_plans")
                .upsert({
                plan_date: today,
                mode: "normal",
                preset_id: id,
                wake_time: preset.wake_time,
                sleep_time: preset.sleep_time,
                excluded_blocks: preset.excluded_block_ids,
            }, { onConflict: "plan_date" });
        }
    };
    if (isLoading)
        return null;
    const preset5am = presets.find(p => /5\s*am|5:00|súper enfoque/i.test(p.name));
    return (_jsxs(Card, { className: cn("p-4 space-y-3", className), children: [_jsxs("div", { className: "flex items-center justify-between gap-3 flex-wrap", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-primary" }), _jsx("h3", { className: "text-sm font-semibold", children: "Rutina del d\u00EDa" })] }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap", children: [preset5am && preset5am.id !== selected?.id && (_jsxs("button", { type: "button", onClick: () => handleChange(preset5am.id), className: "text-[11px] px-2 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition flex items-center gap-1", children: [_jsx(Sun, { className: "h-3 w-3" }), " Aplicar Rutina 5 AM"] })), _jsxs(Select, { value: selected?.id || "", onValueChange: handleChange, children: [_jsx(SelectTrigger, { className: "h-8 w-auto min-w-[180px] text-xs", children: _jsx(SelectValue, { placeholder: "Elegir rutina..." }) }), _jsx(SelectContent, { children: presets.map(p => (_jsxs(SelectItem, { value: p.id, children: [p.name, " \u00B7 ", p.sleep_hours ?? "?", "h"] }, p.id))) })] })] })] }), selected?.description && !compact && (_jsx("p", { className: "text-xs text-muted-foreground", children: selected.description })), schedule.length > 0 ? (_jsx("div", { className: "space-y-1", children: schedule.map((item, idx) => {
                    const startM = toMin(item.start);
                    const endM = toMin(item.end);
                    const isCurrent = now >= startM && now < endM;
                    const isPast = now >= endM;
                    const Icon = TYPE_ICON[item.type || "focus"] || Clock;
                    const color = TYPE_COLOR[item.type || "focus"] || TYPE_COLOR.focus;
                    return (_jsxs("div", { className: cn("flex items-center gap-2 px-2 py-1.5 rounded-md border text-xs transition", color, isCurrent && "ring-2 ring-primary shadow-sm", isPast && !isCurrent && "opacity-50"), children: [_jsx(Icon, { className: "h-3.5 w-3.5 shrink-0" }), _jsxs("span", { className: "font-mono text-[11px] tabular-nums w-[88px] shrink-0", children: [item.start, "\u2013", item.end] }), _jsx("span", { className: "font-medium truncate flex-1", children: item.title }), isCurrent && (_jsx(Badge, { variant: "default", className: "text-[9px] px-1.5 py-0 h-4", children: "Ahora" }))] }, idx));
                }) })) : (_jsxs("p", { className: "text-xs text-muted-foreground italic", children: ["Esta rutina usa los bloques est\u00E1ndar configurados. Despertar ", selected?.wake_time?.slice(0, 5), " \u00B7 Dormir ", selected?.sleep_time?.slice(0, 5), "."] }))] }));
}
