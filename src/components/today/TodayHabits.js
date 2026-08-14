import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
const DEFAULT_HABITS = [
    { id: 'activation-routine', name: 'Rutina Activación', completed: false },
    { id: 'gym', name: 'Ir al Gym', completed: false },
    { id: 'reading', name: 'Leer 20 páginas', completed: false },
    { id: 'piano', name: 'Practicar Piano', completed: false },
    { id: 'deactivation-routine', name: 'Rutina Desactivación', completed: false },
    { id: 'journaling', name: 'Journaling', completed: false }
];
export function TodayHabits() {
    const [habits, setHabits] = useState(DEFAULT_HABITS);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadHabits();
    }, []);
    const loadHabits = async () => {
        const today = new Date().toISOString().split('T')[0];
        const { data: habitHistory } = await supabase
            .from('habit_history')
            .select('habit_id, completed_dates');
        const updatedHabits = DEFAULT_HABITS.map(habit => {
            const history = habitHistory?.find(h => h.habit_id === habit.id);
            let completed = false;
            if (history?.completed_dates) {
                const dates = history.completed_dates;
                completed = dates.some((d) => d.date === today && d.status === 'completed');
            }
            return { ...habit, completed };
        });
        setHabits(updatedHabits);
        setLoading(false);
    };
    const toggleHabit = async (habitId) => {
        const today = new Date().toISOString().split('T')[0];
        const habit = habits.find(h => h.id === habitId);
        if (!habit)
            return;
        const newCompleted = !habit.completed;
        // Check if record exists
        const { data: existing } = await supabase
            .from('habit_history')
            .select('id, completed_dates')
            .eq('habit_id', habitId)
            .maybeSingle();
        if (existing) {
            const dates = existing.completed_dates || [];
            const todayIndex = dates.findIndex((d) => d.date === today);
            if (newCompleted) {
                if (todayIndex === -1) {
                    dates.push({ date: today, status: 'completed' });
                }
                else {
                    dates[todayIndex].status = 'completed';
                }
            }
            else {
                if (todayIndex !== -1) {
                    dates.splice(todayIndex, 1);
                }
            }
            await supabase
                .from('habit_history')
                .update({ completed_dates: dates })
                .eq('id', existing.id);
        }
        else {
            await supabase
                .from('habit_history')
                .insert({
                habit_id: habitId,
                completed_dates: newCompleted ? [{ date: today, status: 'completed' }] : [],
                current_streak: newCompleted ? 1 : 0
            });
        }
        setHabits(prev => prev.map(h => h.id === habitId ? { ...h, completed: newCompleted } : h));
        toast.success(newCompleted ? 'Hábito completado' : 'Hábito desmarcado');
    };
    if (loading) {
        return (_jsx("div", { className: "space-y-2", children: [1, 2, 3].map(i => (_jsx("div", { className: "animate-pulse h-10 bg-muted rounded" }, i))) }));
    }
    const completedCount = habits.filter(h => h.completed).length;
    return (_jsxs("div", { className: "space-y-2", children: [habits.map((habit) => (_jsxs("button", { onClick: () => toggleHabit(habit.id), className: `
            w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
            ${habit.completed
                    ? 'bg-success/10 border border-success/20'
                    : 'bg-card hover:bg-muted border border-transparent'}
          `, children: [habit.completed ? (_jsx(CheckCircle2, { className: "w-5 h-5 text-success flex-shrink-0" })) : (_jsx(Circle, { className: "w-5 h-5 text-muted-foreground flex-shrink-0" })), _jsx("span", { className: habit.completed ? 'text-success' : 'text-foreground', children: habit.name })] }, habit.id))), _jsxs("div", { className: "pt-3 mt-3 border-t border-border text-center", children: [_jsxs("span", { className: "text-sm text-muted-foreground", children: [completedCount, "/", habits.length, " h\u00E1bitos completados"] }), completedCount === habits.length && (_jsx("p", { className: "text-success text-sm mt-1 font-medium", children: "\u00A1D\u00EDa perfecto! \uD83C\uDF89" }))] })] }));
}
