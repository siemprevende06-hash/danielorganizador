import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle2, XCircle } from "lucide-react";
const SYSTEM_NAMES = {
    "rutina-activacion": "Activación",
    "alistamiento-desayuno": "Alistamiento",
    "horario-regular": "Horario",
    "rutina-desactivacion": "Desactivación",
    "entrenamiento-fisico": "Gym",
    "lectura": "Lectura",
    "musica": "Música",
    "ajedrez": "Ajedrez",
    "skincare-manana": "Skincare AM",
    "skincare-noche": "Skincare PM",
    "banarme-vestirme": "Baño/Vestirme",
};
const STRUCTURAL_IDS = new Set([
    "rutina-activacion",
    "alistamiento-desayuno",
    "horario-regular",
    "rutina-desactivacion",
]);
export function WeeklySystemsStats({ weekStart }) {
    const [data, setData] = useState([]);
    const [streaks, setStreaks] = useState({});
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    useEffect(() => {
        const load = async () => {
            const [trackingRes, streaksRes] = await Promise.all([
                supabase
                    .from("daily_systems_tracking")
                    .select("tracking_date, completions, block_completions")
                    .gte("tracking_date", format(weekStart, "yyyy-MM-dd"))
                    .lte("tracking_date", format(weekEnd, "yyyy-MM-dd"))
                    .order("tracking_date"),
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
    }, [weekStart.toISOString()]);
    const habitIds = Object.keys(SYSTEM_NAMES).filter(hid => STRUCTURAL_IDS.has(hid));
    return (_jsxs(Card, { className: "p-4", children: [_jsxs("h3", { className: "font-bold text-sm mb-3", children: ["\uD83D\uDCCA Sistemas de Vida \u2014 Semana ", _jsx("span", { className: "ml-1 text-[10px] font-medium text-muted-foreground", children: "(Estructurales)" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full text-xs", children: [_jsx("thead", { children: _jsxs("tr", { children: [_jsx("th", { className: "text-left py-1 pr-2", children: "Sistema" }), days.map(d => (_jsx("th", { className: "text-center px-1 py-1", children: format(d, "EEE", { locale: es }).slice(0, 2) }, d.toISOString()))), _jsx("th", { className: "text-center px-1 py-1 text-orange-500", children: "\uD83D\uDD25" }), _jsx("th", { className: "text-center px-1 py-1 text-yellow-600", children: "\uD83C\uDFC6" })] }) }), _jsx("tbody", { children: habitIds.map(hid => (_jsxs("tr", { className: "border-t border-border/30", children: [_jsx("td", { className: "py-1 pr-2 text-muted-foreground whitespace-nowrap", children: SYSTEM_NAMES[hid] }), days.map(d => {
                                        const dayStr = format(d, "yyyy-MM-dd");
                                        const row = data.find(r => r.tracking_date === dayStr);
                                        const completions = (row?.completions || {});
                                        const done = !!completions[hid];
                                        return (_jsx("td", { className: "text-center px-1 py-1", children: row ? (done ? (_jsx(CheckCircle2, { className: "h-3.5 w-3.5 text-green-500 mx-auto" })) : (_jsx(XCircle, { className: "h-3.5 w-3.5 text-red-400/50 mx-auto" }))) : (_jsx("span", { className: "text-muted-foreground/30", children: "\u2014" })) }, d.toISOString()));
                                    }), _jsx("td", { className: "text-center px-1 py-1", children: streaks[hid]?.current > 0 && (_jsx("span", { className: "text-xs font-bold text-orange-500", children: streaks[hid].current })) }), _jsx("td", { className: "text-center px-1 py-1", children: streaks[hid]?.best > 0 && (_jsx("span", { className: "text-xs font-bold text-yellow-600", children: streaks[hid].best })) })] }, hid))) })] }) })] }));
}
