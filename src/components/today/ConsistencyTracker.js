import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { GraduationCap, Briefcase, Rocket, Dumbbell, Globe, Music, Guitar, BookOpen, Gamepad2, Tv, Trophy, Check, Clock, } from 'lucide-react';
import { cn } from '@/lib/utils';
export const ConsistencyTracker = () => {
    const [pillars, setPillars] = useState([]);
    const [secondaryGoals, setSecondaryGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dayScore, setDayScore] = useState(0);
    const today = format(new Date(), 'yyyy-MM-dd');
    useEffect(() => {
        loadConsistencyData();
    }, []);
    const loadConsistencyData = async () => {
        try {
            // Fetch all data in parallel
            const [tasksResult, entrepreneurshipTasksResult, habitHistoryResult, languageSessionResult, exerciseLogsResult,] = await Promise.all([
                supabase.from('tasks').select('*').eq('completed', true),
                supabase.from('entrepreneurship_tasks').select('*').eq('completed', true),
                supabase.from('habit_history').select('*'),
                supabase.from('language_sessions').select('*').eq('session_date', today),
                supabase.from('exercise_logs').select('*').eq('log_date', today),
            ]);
            const tasks = tasksResult.data || [];
            const entrepreneurshipTasks = entrepreneurshipTasksResult.data || [];
            const habitHistory = habitHistoryResult.data || [];
            const languageSessions = languageSessionResult.data || [];
            const exerciseLogs = exerciseLogsResult.data || [];
            // Calculate today's completed tasks by area
            const todayTasks = tasks.filter((t) => {
                const completedDate = t.updated_at?.split('T')[0];
                return completedDate === today;
            });
            const universityTasks = todayTasks.filter((t) => t.area_id === 'universidad').length;
            const entrepreneurshipToday = entrepreneurshipTasks.filter((t) => {
                const completedDate = t.updated_at?.split('T')[0];
                return completedDate === today;
            }).length;
            const projectTasks = todayTasks.filter((t) => t.area_id === 'proyectos-personales').length;
            // Get habit statuses
            const getHabitCompleted = (habitId) => {
                const habit = habitHistory.find((h) => h.habit_id === habitId);
                if (!habit)
                    return false;
                const dates = habit.completed_dates || [];
                return dates.includes(today);
            };
            const getHabitStreak = (habitId) => {
                const habit = habitHistory.find((h) => h.habit_id === habitId);
                return habit?.current_streak || 0;
            };
            // Check gym completion
            const gymCompleted = exerciseLogs.length > 0 || getHabitCompleted('habit-entrenamiento');
            // Check language session
            const languageCompleted = languageSessions.length > 0;
            const languageMinutes = languageSessions.reduce((sum, s) => sum + (s.total_duration || 0), 0);
            // Build pillars status
            const pillarsData = [
                {
                    id: 'universidad',
                    name: 'Universidad',
                    icon: GraduationCap,
                    completed: universityTasks > 0,
                    details: universityTasks > 0 ? `${universityTasks} tareas` : 'Sin actividad',
                    streak: 0, // Would need historical data
                },
                {
                    id: 'emprendimiento',
                    name: 'Emprendimiento',
                    icon: Briefcase,
                    completed: entrepreneurshipToday > 0,
                    details: entrepreneurshipToday > 0 ? `${entrepreneurshipToday} tareas` : 'Sin actividad',
                    streak: 0,
                },
                {
                    id: 'proyecto',
                    name: 'Proyecto',
                    icon: Rocket,
                    completed: projectTasks > 0,
                    details: projectTasks > 0 ? `${projectTasks} tareas` : 'Sin actividad',
                    streak: 0,
                },
                {
                    id: 'gym',
                    name: 'Gym',
                    icon: Dumbbell,
                    completed: gymCompleted,
                    details: gymCompleted ? 'Completado' : 'Pendiente',
                    streak: getHabitStreak('habit-entrenamiento'),
                },
                {
                    id: 'idiomas',
                    name: 'Idiomas',
                    icon: Globe,
                    completed: languageCompleted,
                    details: languageCompleted ? `${languageMinutes} min` : 'Pendiente',
                    streak: getHabitStreak('habit-idiomas'),
                },
            ];
            // Build secondary goals
            const secondaryData = [
                {
                    id: 'piano',
                    name: 'Piano',
                    icon: Music,
                    completed: getHabitCompleted('habit-piano'),
                    duration: '30 min',
                },
                {
                    id: 'guitarra',
                    name: 'Guitarra',
                    icon: Guitar,
                    completed: getHabitCompleted('habit-guitarra'),
                    duration: '30 min',
                },
                {
                    id: 'lectura',
                    name: 'Lectura',
                    icon: BookOpen,
                    completed: languageSessions.some((s) => s.reading_completed) || getHabitCompleted('habit-lectura'),
                    duration: '30 min',
                },
                {
                    id: 'ajedrez',
                    name: 'Ajedrez',
                    icon: Gamepad2,
                    completed: getHabitCompleted('habit-ajedrez'),
                    duration: '1 partida',
                },
                {
                    id: 'got',
                    name: 'Game of Thrones',
                    icon: Tv,
                    completed: getHabitCompleted('habit-got'),
                    duration: '1 capítulo',
                },
            ];
            setPillars(pillarsData);
            setSecondaryGoals(secondaryData);
            // Calculate day score
            const pillarScore = pillarsData.filter((p) => p.completed).length * 15;
            const secondaryScore = secondaryData.filter((s) => s.completed).length * 5;
            setDayScore(Math.min(100, pillarScore + secondaryScore));
        }
        catch (error) {
            console.error('Error loading consistency data:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-20 bg-muted rounded" })] }) }) }));
    }
    const completedPillars = pillars.filter((p) => p.completed).length;
    const completedSecondary = secondaryGoals.filter((s) => s.completed).length;
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(Trophy, { className: "w-4 h-4" }), "Mi Constancia Hoy"] }), _jsxs(Badge, { variant: dayScore >= 70 ? 'default' : 'outline', children: [dayScore, "/100 pts"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { children: [_jsxs("h4", { className: "text-xs font-medium text-muted-foreground mb-2", children: ["PILARES PRINCIPALES (", completedPillars, "/", pillars.length, ")"] }), _jsx("div", { className: "grid gap-2", children: pillars.map((pillar) => {
                                    const Icon = pillar.icon;
                                    return (_jsxs("div", { className: cn('flex items-center gap-3 p-2 rounded-md border transition-colors', pillar.completed
                                            ? 'bg-green-500/10 border-green-500/20'
                                            : 'bg-muted/30 border-muted'), children: [_jsx("div", { className: cn('w-8 h-8 rounded-full flex items-center justify-center', pillar.completed ? 'bg-green-500/20' : 'bg-muted'), children: _jsx(Icon, { className: cn('w-4 h-4', pillar.completed ? 'text-green-600' : 'text-muted-foreground') }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium text-sm", children: pillar.name }), pillar.completed && _jsx(Check, { className: "w-3 h-3 text-green-600" })] }), _jsx("span", { className: "text-xs text-muted-foreground", children: pillar.details })] }), pillar.streak > 0 && (_jsxs(Badge, { variant: "outline", className: "text-xs", children: ["\uD83D\uDD25 ", pillar.streak] }))] }, pillar.id));
                                }) })] }), _jsxs("div", { className: "pt-2 border-t", children: [_jsxs("h4", { className: "text-xs font-medium text-muted-foreground mb-2", children: ["METAS SECUNDARIAS (", completedSecondary, "/", secondaryGoals.length, ")"] }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: secondaryGoals.map((goal) => {
                                    const Icon = goal.icon;
                                    return (_jsxs("div", { className: cn('flex items-center gap-2 p-2 rounded-md border text-sm', goal.completed
                                            ? 'bg-green-500/10 border-green-500/20'
                                            : 'bg-muted/30 border-muted'), children: [_jsx(Icon, { className: cn('w-4 h-4', goal.completed ? 'text-green-600' : 'text-muted-foreground') }), _jsx("span", { className: goal.completed ? 'text-green-700' : 'text-muted-foreground', children: goal.name }), goal.completed ? (_jsx(Check, { className: "w-3 h-3 text-green-600 ml-auto" })) : (_jsx(Clock, { className: "w-3 h-3 text-muted-foreground ml-auto" }))] }, goal.id));
                                }) })] }), _jsxs("div", { className: "pt-2 border-t space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Puntuaci\u00F3n del d\u00EDa" }), _jsxs("span", { className: "font-medium", children: [dayScore, "/100"] })] }), _jsx(Progress, { value: dayScore, className: "h-2" })] })] })] }));
};
