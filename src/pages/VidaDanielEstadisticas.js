import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PhysicalTransformation } from '@/components/vida-daniel/PhysicalTransformation';
import { ProfessionalSection } from '@/components/vida-daniel/ProfessionalSection';
import { PersonalDevelopmentSection } from '@/components/vida-daniel/PersonalDevelopmentSection';
import { HabitsSection } from '@/components/vida-daniel/HabitsSection';
import { AppearanceSection } from '@/components/vida-daniel/AppearanceSection';
import { ExecutiveSummary } from '@/components/vida-daniel/ExecutiveSummary';
import { LifeRadarChart } from '@/components/vida-daniel/LifeRadarChart';
import { Loader2 } from 'lucide-react';
const VidaDanielEstadisticas = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadAllStats();
    }, []);
    const loadAllStats = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            // Fetch all data in parallel
            const [habitsRes, subjectsRes, examsRes, tasksRes, entrepreneurshipsRes, entrepreneurshipTasksRes, projectsRes, goalsRes, routineCompletionsRes] = await Promise.all([
                supabase.from('habit_history').select('*'),
                supabase.from('university_subjects').select('*'),
                supabase.from('exams').select('*').eq('status', 'pending'),
                supabase.from('tasks').select('*'),
                supabase.from('entrepreneurships').select('*'),
                supabase.from('entrepreneurship_tasks').select('*'),
                supabase.from('projects').select('*'),
                supabase.from('twelve_week_goals').select('*'),
                supabase.from('routine_completions').select('*').gte('completion_date', startOfMonth)
            ]);
            const habits = habitsRes.data || [];
            const subjects = subjectsRes.data || [];
            const exams = examsRes.data || [];
            const tasks = tasksRes.data || [];
            const entrepreneurships = entrepreneurshipsRes.data || [];
            const entrepreneurshipTasks = entrepreneurshipTasksRes.data || [];
            const projects = projectsRes.data || [];
            const goals = goalsRes.data || [];
            const routineCompletions = routineCompletionsRes.data || [];
            // Process habits
            const habitStats = habits.map(habit => {
                const completedDates = habit.completed_dates || [];
                const completedToday = completedDates.includes(today);
                const currentStreak = habit.current_streak || 0;
                const daysInMonth = new Date().getDate();
                const completedThisMonth = completedDates.filter(d => d >= startOfMonth).length;
                const monthlyCompletion = Math.round((completedThisMonth / daysInMonth) * 100);
                return {
                    id: habit.habit_id,
                    name: habit.habit_id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                    completedToday,
                    currentStreak,
                    monthlyCompletion,
                    trend: currentStreak > 5 ? 'up' : currentStreak > 0 ? 'stable' : 'down'
                };
            });
            // University stats
            const uniTasks = tasks.filter(t => t.source === 'university');
            const completedUniTasksToday = uniTasks.filter(t => t.completed && t.updated_at?.startsWith(today)).length;
            const uniGeneralScore = subjects.length > 0 ? Math.round((1 - (exams.length / (subjects.length * 2))) * 10) : 5;
            // Entrepreneurship stats
            const entStats = entrepreneurships.map(ent => {
                const entTasks = entrepreneurshipTasks.filter(t => t.entrepreneurship_id === ent.id);
                const completed = entTasks.filter(t => t.completed).length;
                const completedToday = entTasks.some(t => t.completed && t.updated_at?.startsWith(today));
                return {
                    name: ent.name,
                    completedTasks: completed,
                    totalTasks: entTasks.length,
                    generalScore: entTasks.length > 0 ? Math.round((completed / entTasks.length) * 10) : 0,
                    completedToday,
                    streak: completedToday ? 1 : 0
                };
            });
            // Projects stats
            const activeProjects = projects.filter(p => p.status === 'active').length;
            const completedProjects = projects.filter(p => p.status === 'completed').length;
            // Personal development from goals
            const devGoals = goals.filter(g => ['piano', 'guitarra', 'lectura', 'italiano', 'ingles', 'idiomas'].some(keyword => g.title.toLowerCase().includes(keyword) || g.category.toLowerCase().includes(keyword)));
            const personalDevStats = devGoals.map(goal => ({
                name: goal.title,
                generalScore: Math.round((goal.progress_percentage || 0) / 10),
                completedToday: false,
                streak: 0,
                progress: goal.progress_percentage || 0
            }));
            // Default personal dev if none found
            if (personalDevStats.length === 0) {
                ['Guitarra', 'Piano', 'Lectura', 'Italiano', 'Inglés'].forEach(name => {
                    personalDevStats.push({
                        name,
                        generalScore: 3,
                        completedToday: false,
                        streak: 0,
                        progress: 0
                    });
                });
            }
            // Routines
            const activationCompletions = routineCompletions.filter(r => r.routine_type === 'activation');
            const deactivationCompletions = routineCompletions.filter(r => r.routine_type === 'deactivation');
            const daysInMonth = new Date().getDate();
            // Skincare habit
            const skincareHabit = habits.find(h => h.habit_id.toLowerCase().includes('skincare') || h.habit_id.toLowerCase().includes('skin'));
            const skincareCompletedDates = skincareHabit?.completed_dates || [];
            // Calculate global score
            const allScores = [
                uniGeneralScore,
                ...entStats.map(e => e.generalScore),
                habitStats.length > 0 ? Math.round(habitStats.reduce((acc, h) => acc + h.monthlyCompletion, 0) / habitStats.length / 10) : 5,
                ...personalDevStats.map(p => p.generalScore)
            ].filter(s => s > 0);
            const globalScore = allScores.length > 0
                ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length * 10) / 10
                : 5;
            // Productive days (days with at least one routine completed)
            const uniqueDays = new Set(routineCompletions.map(r => r.completion_date));
            setStats({
                habits: habitStats,
                university: {
                    subjects: subjects.length,
                    pendingExams: exams.length,
                    pendingTasks: uniTasks.filter(t => !t.completed).length,
                    generalScore: uniGeneralScore,
                    completedToday: completedUniTasksToday > 0,
                    streak: 0
                },
                entrepreneurship: entStats,
                projects: {
                    active: activeProjects,
                    completed: completedProjects,
                    generalScore: projects.length > 0 ? Math.round((completedProjects / projects.length) * 10) : 5,
                    completedToday: false,
                    streak: 0
                },
                personalDevelopment: personalDevStats,
                appearance: {
                    skincare: {
                        completedToday: skincareCompletedDates.includes(today),
                        streak: skincareHabit?.current_streak || 0,
                        monthlyCompletion: Math.round((skincareCompletedDates.filter(d => d >= startOfMonth).length / daysInMonth) * 100)
                    },
                    generalScore: 7,
                    goals: [
                        { name: 'Sin acné', achieved: true, progress: 100 },
                        { name: 'Pelado', achieved: true, progress: 100 },
                        { name: 'Músculos definidos', achieved: false, progress: 35 },
                        { name: 'Buena postura', achieved: false, progress: 70 }
                    ]
                },
                routines: {
                    activation: {
                        completedToday: activationCompletions.some(r => r.completion_date === today),
                        streak: activationCompletions.length,
                        monthlyCompletion: Math.round((activationCompletions.length / daysInMonth) * 100)
                    },
                    deactivation: {
                        completedToday: deactivationCompletions.some(r => r.completion_date === today),
                        streak: deactivationCompletions.length,
                        monthlyCompletion: Math.round((deactivationCompletions.length / daysInMonth) * 100)
                    }
                },
                globalScore,
                productiveDaysThisMonth: uniqueDays.size,
                totalDaysThisMonth: daysInMonth
            });
        }
        catch (error) {
            console.error('Error loading stats:', error);
        }
        finally {
            setLoading(false);
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen pt-20 flex items-center justify-center", children: _jsx(Loader2, { className: "h-8 w-8 animate-spin text-primary" }) }));
    }
    if (!stats) {
        return (_jsx("div", { className: "min-h-screen pt-20 flex items-center justify-center", children: _jsx("p", { className: "text-muted-foreground", children: "Error al cargar estad\u00EDsticas" }) }));
    }
    return (_jsx("div", { className: "min-h-screen pt-20 pb-8 px-4", children: _jsxs("div", { className: "container mx-auto max-w-7xl space-y-8", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsx("h1", { className: "text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent", children: "Vida Daniel" }), _jsx("p", { className: "text-muted-foreground", children: "Estad\u00EDsticas y progreso personal basado en hechos" })] }), _jsx(ExecutiveSummary, { stats: stats }), _jsx(LifeRadarChart, { stats: stats }), _jsx(PhysicalTransformation, {}), _jsx(ProfessionalSection, { stats: stats }), _jsx(PersonalDevelopmentSection, { stats: stats }), _jsx(HabitsSection, { stats: stats }), _jsx(AppearanceSection, { stats: stats })] }) }));
};
export default VidaDanielEstadisticas;
