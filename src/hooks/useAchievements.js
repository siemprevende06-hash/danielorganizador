import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
const ACHIEVEMENT_DEFS = [
    { key: 'first_task', title: 'Primera Tarea', desc: 'Completaste tu primera tarea', icon: '✅', category: 'tareas' },
    { key: 'tasks_10', title: 'Productivo', desc: 'Completaste 10 tareas', icon: '🔥', category: 'tareas' },
    { key: 'tasks_50', title: 'Máquina', desc: 'Completaste 50 tareas', icon: '⚡', category: 'tareas' },
    { key: 'tasks_100', title: 'Imparable', desc: 'Completaste 100 tareas', icon: '💎', category: 'tareas' },
    { key: 'streak_3', title: 'Constancia', desc: '3 días seguidos completando áreas', icon: '🔥', category: 'rachas' },
    { key: 'streak_7', title: 'Semana Perfecta', desc: '7 días de racha', icon: '🌟', category: 'rachas' },
    { key: 'streak_30', title: 'Mes Legendario', desc: '30 días de racha', icon: '👑', category: 'rachas' },
    { key: 'focus_60', title: 'Focus Master', desc: '60 minutos de focus en un día', icon: '🎯', category: 'focus' },
    { key: 'focus_300', title: 'Deep Worker', desc: '300 minutos de focus en un día', icon: '🧠', category: 'focus' },
    { key: 'books_1', title: 'Lector', desc: 'Terminaste tu primer libro', icon: '📖', category: 'lectura' },
    { key: 'books_5', title: 'Bibliófilo', desc: 'Terminaste 5 libros', icon: '📚', category: 'lectura' },
    { key: 'gym_10', title: 'Guerrero del Gym', desc: '10 días de gym', icon: '💪', category: 'físico' },
    { key: 'gym_30', title: 'Bestia', desc: '30 días de gym', icon: '🏋️', category: 'físico' },
    { key: 'blocks_full', title: 'Día Completo', desc: 'Completaste todos los bloques del día', icon: '🏆', category: 'rutina' },
    { key: 'review_7', title: 'Reflexivo', desc: '7 autocríticas seguidas', icon: '📝', category: 'reflexión' },
];
export function useAchievements() {
    const [achievements, setAchievements] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchAchievements = useCallback(async () => {
        const { data } = await supabase.from('achievements').select('*').order('unlocked_at', { ascending: false });
        setAchievements(data || []);
        setLoading(false);
    }, []);
    useEffect(() => { fetchAchievements(); }, [fetchAchievements]);
    const unlock = useCallback(async (key) => {
        const def = ACHIEVEMENT_DEFS.find(d => d.key === key);
        if (!def)
            return;
        if (achievements.some(a => a.achievement_key === key))
            return;
        const { error } = await supabase.from('achievements').upsert({
            achievement_key: key,
            achievement_title: def.title,
            achievement_description: def.desc,
            icon: def.icon,
            category: def.category,
        }, { onConflict: 'achievement_key' });
        if (!error) {
            toast.success(`🏆 ¡Logro desbloqueado: ${def.title}!`, { description: def.desc });
            fetchAchievements();
        }
    }, [achievements, fetchAchievements]);
    const checkAchievements = useCallback(async () => {
        // Check task milestones
        const { count: taskCount } = await supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('completed', true);
        if (taskCount && taskCount >= 1)
            await unlock('first_task');
        if (taskCount && taskCount >= 10)
            await unlock('tasks_10');
        if (taskCount && taskCount >= 50)
            await unlock('tasks_50');
        if (taskCount && taskCount >= 100)
            await unlock('tasks_100');
        // Check streaks
        const { data: streaks } = await supabase.from('area_streaks').select('current_streak').order('current_streak', { ascending: false }).limit(1);
        const maxStreak = streaks?.[0]?.current_streak || 0;
        if (maxStreak >= 3)
            await unlock('streak_3');
        if (maxStreak >= 7)
            await unlock('streak_7');
        if (maxStreak >= 30)
            await unlock('streak_30');
        // Check focus
        const today = new Date().toISOString().split('T')[0];
        const { data: focusToday } = await supabase.from('focus_sessions').select('duration_minutes').gte('start_time', today);
        const totalFocus = focusToday?.reduce((s, f) => s + (f.duration_minutes || 0), 0) || 0;
        if (totalFocus >= 60)
            await unlock('focus_60');
        if (totalFocus >= 300)
            await unlock('focus_300');
        // Check books
        const { count: booksCount } = await supabase.from('reading_library').select('*', { count: 'exact', head: true }).eq('status', 'read');
        if (booksCount && booksCount >= 1)
            await unlock('books_1');
        if (booksCount && booksCount >= 5)
            await unlock('books_5');
    }, [unlock]);
    return { achievements, loading, checkAchievements, allDefs: ACHIEVEMENT_DEFS, unlock };
}
