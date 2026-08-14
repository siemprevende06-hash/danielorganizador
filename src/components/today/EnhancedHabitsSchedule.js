import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { getCubaDate } from '@/lib/cubaTime';
import { WeekStreakBar } from '@/components/systems/WeekStreakBar';
import { ChevronUp, Flame } from 'lucide-react';
const HABITS = [
    { id: 'meditation', title: 'Meditación', time: '5:00', period: 'morning' },
    { id: 'gym', title: 'Gym', time: '5:30-7:00', period: 'morning' },
    { id: 'water-morning', title: 'Agua 1L', time: 'antes 8:00', period: 'morning' },
    { id: 'walk', title: 'Caminata 10min', time: 'almuerzo', period: 'day' },
    { id: 'water-day', title: 'Agua 2L', time: 'antes 3:00 PM', period: 'day' },
    { id: 'sunlight', title: 'Luz solar 15min', time: 'mediodía', period: 'day' },
    { id: 'stretching', title: 'Estiramientos', time: '8:30 PM', period: 'night' },
    { id: 'skincare', title: 'Skincare', time: '8:45 PM', period: 'night' },
    { id: 'journaling', title: 'Journaling', time: '9:00 PM', period: 'night' },
];
// Key mirrors both the display state and the streak trigger key
const streakKey = (id) => `streak:enh_${id}`;
export const EnhancedHabitsSchedule = () => {
    const [completed, setCompleted] = useState({});
    const [rowId, setRowId] = useState(null);
    const [expandedHabit, setExpandedHabit] = useState(null);
    const today = getCubaDate();
    const load = useCallback(async () => {
        const { data } = await supabase
            .from('daily_systems_tracking')
            .select('id, completions')
            .eq('tracking_date', today)
            .maybeSingle();
        const comp = data?.completions || {};
        const state = {};
        HABITS.forEach(h => {
            const v = comp[streakKey(h.id)];
            state[h.id] = v === true || v === 'true' || v === 'min' || v === 'max';
        });
        setCompleted(state);
        setRowId(data?.id ?? null);
    }, [today]);
    useEffect(() => { load(); }, [load]);
    const toggleHabit = async (id) => {
        const next = { ...completed, [id]: !completed[id] };
        setCompleted(next);
        // Read latest row to merge (avoid stale)
        const { data: row } = await supabase
            .from('daily_systems_tracking')
            .select('id, completions')
            .eq('tracking_date', today)
            .maybeSingle();
        const merged = { ...(row?.completions || {}) };
        HABITS.forEach(h => {
            const key = streakKey(h.id);
            if (next[h.id])
                merged[key] = 'min';
            else
                delete merged[key];
        });
        if (row?.id) {
            await supabase
                .from('daily_systems_tracking')
                .update({ completions: merged })
                .eq('id', row.id);
            setRowId(row.id);
        }
        else {
            const { data: inserted } = await supabase
                .from('daily_systems_tracking')
                .upsert({ tracking_date: today, completions: merged }, { onConflict: 'tracking_date' })
                .select('id')
                .single();
            setRowId(inserted?.id ?? null);
        }
    };
    const groupedHabits = {
        morning: HABITS.filter(h => h.period === 'morning'),
        day: HABITS.filter(h => h.period === 'day'),
        night: HABITS.filter(h => h.period === 'night'),
    };
    const completedCount = HABITS.filter(h => completed[h.id]).length;
    const totalCount = HABITS.length;
    const percentage = Math.round((completedCount / totalCount) * 100);
    const renderPeriod = (title, icon, list, timeRange) => (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm font-medium text-muted-foreground", children: [_jsx("span", { children: icon }), _jsx("span", { children: title }), _jsxs("span", { className: "text-xs", children: ["(", timeRange, ")"] })] }), _jsx("div", { className: "space-y-1 pl-6", children: list.map(habit => {
                    const isDone = !!completed[habit.id];
                    const habitStreakId = `enh_${habit.id}`;
                    const isExpanded = expandedHabit === habit.id;
                    return (_jsxs("div", { children: [_jsxs("div", { className: cn("flex items-center gap-3 py-1.5 px-2 rounded-md transition-colors", isDone && "bg-green-500/10"), children: [_jsx(Checkbox, { checked: isDone, onCheckedChange: () => toggleHabit(habit.id), className: "h-4 w-4" }), _jsx("span", { className: cn("text-sm flex-1", isDone && "line-through text-muted-foreground"), children: habit.title }), _jsx("span", { className: "text-xs text-muted-foreground", children: habit.time }), _jsx("button", { onClick: () => setExpandedHabit(isExpanded ? null : habit.id), className: "h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted/40 text-muted-foreground transition-colors", title: "Ver racha semanal", children: isExpanded ? _jsx(ChevronUp, { className: "h-3.5 w-3.5" }) : _jsx(Flame, { className: "h-3.5 w-3.5" }) })] }), isExpanded && (_jsx("div", { className: "pl-2 pr-2 pb-2 pt-1", children: _jsx(WeekStreakBar, { habitId: habitStreakId, todayCompleted: isDone, compact: true, hideStreak: true, className: "pl-6" }) }))] }, habit.id));
                }) })] }));
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsx(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground", children: "\uD83D\uDCCB H\u00E1bitos del D\u00EDa" }), _jsxs(Badge, { variant: percentage >= 80 ? "default" : "secondary", children: [completedCount, "/", totalCount, " (", percentage, "%)"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [renderPeriod('MAÑANA', '☀️', groupedHabits.morning, '5-8 AM'), renderPeriod('DÍA', '🌤️', groupedHabits.day, '8 AM - 6 PM'), renderPeriod('NOCHE', '🌙', groupedHabits.night, '6-9 PM')] })] }));
};
