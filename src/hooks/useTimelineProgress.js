import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, differenceInDays } from 'date-fns';
const AREA_CONFIG = {
    universidad: { icon: '🎓', label: 'Universidad' },
    emprendimiento: { icon: '💼', label: 'Emprendimiento' },
    proyectos: { icon: '🚀', label: 'Proyectos' },
    gym: { icon: '💪', label: 'Gym' },
    idiomas: { icon: '🌍', label: 'Idiomas' },
    lectura: { icon: '📖', label: 'Lectura' },
    musica: { icon: '🎹', label: 'Música' },
    general: { icon: '📋', label: 'General' },
};
export function useTimelineProgress() {
    const [loading, setLoading] = useState(true);
    const [todayData, setTodayData] = useState({ tasks: [], entrepreneurshipTasks: [], focusSessions: [] });
    const [weekData, setWeekData] = useState({ tasks: [], objectives: [], dailyReviews: [] });
    const [monthData, setMonthData] = useState({ tasks: [], dailyReviews: [] });
    const [quarterData, setQuarterData] = useState({ goals: [] });
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfMonth(today);
    const monthEnd = endOfMonth(today);
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
    const monthStartStr = format(monthStart, 'yyyy-MM-dd');
    const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
    useEffect(() => {
        loadAllData();
    }, [todayStr]);
    const loadAllData = async () => {
        setLoading(true);
        // Load all data in parallel
        const [todayTasksRes, todayEntrepreneurshipRes, focusSessionsRes, weekTasksRes, weekEntrepreneurshipRes, weekObjectivesRes, monthTasksRes, monthEntrepreneurshipRes, dailyReviewsRes, quarterGoalsRes, habitHistoryRes,] = await Promise.all([
            // Today's tasks
            supabase.from('tasks').select('*').gte('due_date', `${todayStr}T00:00:00`).lte('due_date', `${todayStr}T23:59:59`),
            supabase.from('entrepreneurship_tasks').select('*').eq('due_date', todayStr),
            supabase.from('focus_sessions').select('*').gte('start_time', `${todayStr}T00:00:00`).lte('start_time', `${todayStr}T23:59:59`),
            // Week's tasks
            supabase.from('tasks').select('*').gte('due_date', `${weekStartStr}T00:00:00`).lte('due_date', `${weekEndStr}T23:59:59`),
            supabase.from('entrepreneurship_tasks').select('*').gte('due_date', weekStartStr).lte('due_date', weekEndStr),
            supabase.from('weekly_objectives').select('*').eq('week_start_date', weekStartStr),
            // Month's tasks
            supabase.from('tasks').select('*').gte('due_date', `${monthStartStr}T00:00:00`).lte('due_date', `${monthEndStr}T23:59:59`),
            supabase.from('entrepreneurship_tasks').select('*').gte('due_date', monthStartStr).lte('due_date', monthEndStr),
            // Daily reviews for month
            supabase.from('daily_reviews').select('*').gte('review_date', monthStartStr).lte('review_date', monthEndStr),
            // Quarter goals
            supabase.from('twelve_week_goals').select('*').eq('year', today.getFullYear()).eq('quarter', Math.ceil((today.getMonth() + 1) / 3)),
            // Habit history for today
            supabase.from('habit_history').select('*'),
        ]);
        setTodayData({
            tasks: todayTasksRes.data || [],
            entrepreneurshipTasks: todayEntrepreneurshipRes.data || [],
            focusSessions: focusSessionsRes.data || [],
        });
        setWeekData({
            tasks: [...(weekTasksRes.data || []), ...(weekEntrepreneurshipRes.data || [])],
            objectives: weekObjectivesRes.data || [],
            dailyReviews: dailyReviewsRes.data || [],
        });
        setMonthData({
            tasks: [...(monthTasksRes.data || []), ...(monthEntrepreneurshipRes.data || [])],
            dailyReviews: dailyReviewsRes.data || [],
        });
        setQuarterData({
            goals: quarterGoalsRes.data || [],
        });
        setLoading(false);
    };
    // Calculate today's progress
    const todayProgress = useMemo(() => {
        const allTasks = [...todayData.tasks, ...todayData.entrepreneurshipTasks];
        const tasksCompleted = allTasks.filter((t) => t.completed).length;
        const tasksTotal = allTasks.length;
        // Calculate hours worked from focus sessions
        const hoursWorked = todayData.focusSessions.reduce((acc, s) => {
            return acc + (s.duration_minutes || 0);
        }, 0) / 60;
        // Group by area
        const areaMap = {};
        allTasks.forEach((task) => {
            const areaId = task.area_id || task.task_type || 'general';
            const normalizedArea = areaId.toLowerCase();
            if (!areaMap[normalizedArea]) {
                const config = AREA_CONFIG[normalizedArea] || AREA_CONFIG.general;
                areaMap[normalizedArea] = {
                    area: config.label,
                    areaId: normalizedArea,
                    icon: config.icon,
                    tasksCompleted: 0,
                    tasksTotal: 0,
                    hoursWorked: 0,
                    todayPercent: 0,
                };
            }
            areaMap[normalizedArea].tasksTotal++;
            if (task.completed) {
                areaMap[normalizedArea].tasksCompleted++;
            }
        });
        // Add weekly objectives to area breakdown
        weekData.objectives.forEach((obj) => {
            const areaId = obj.area?.toLowerCase() || 'general';
            if (areaMap[areaId]) {
                areaMap[areaId].weeklyObjective = {
                    title: obj.title,
                    currentValue: obj.current_value || 0,
                    targetValue: obj.target_value || 1,
                    percent: obj.target_value ? ((obj.current_value || 0) / obj.target_value) * 100 : 0,
                };
            }
        });
        // Calculate percentages
        Object.values(areaMap).forEach(area => {
            area.todayPercent = area.tasksTotal > 0 ? (area.tasksCompleted / area.tasksTotal) * 100 : 0;
        });
        const score = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
        return {
            tasksCompleted,
            tasksTotal,
            hoursWorked: Math.round(hoursWorked * 10) / 10,
            areaBreakdown: Object.values(areaMap).sort((a, b) => b.tasksTotal - a.tasksTotal),
            score,
        };
    }, [todayData, weekData.objectives]);
    // Calculate week's progress
    const weekProgress = useMemo(() => {
        const tasksCompleted = weekData.tasks.filter((t) => t.completed).length;
        const tasksTotal = weekData.tasks.length;
        const daysElapsed = differenceInDays(today, weekStart) + 1;
        const daysRemaining = 7 - daysElapsed;
        const objectivesProgress = weekData.objectives.map((obj) => ({
            id: obj.id,
            area: obj.area,
            title: obj.title,
            currentValue: obj.current_value || 0,
            targetValue: obj.target_value || 1,
            percent: obj.target_value ? ((obj.current_value || 0) / obj.target_value) * 100 : 0,
        }));
        const averagePercent = objectivesProgress.length > 0
            ? objectivesProgress.reduce((sum, o) => sum + o.percent, 0) / objectivesProgress.length
            : tasksTotal > 0 ? (tasksCompleted / tasksTotal) * 100 : 0;
        // On track if average progress >= (days elapsed / 7) * 100
        const expectedProgress = (daysElapsed / 7) * 100;
        const onTrack = averagePercent >= expectedProgress - 10; // 10% margin
        return {
            tasksCompleted,
            tasksTotal,
            objectivesProgress,
            daysRemaining,
            daysElapsed,
            onTrack,
            averagePercent: Math.round(averagePercent),
        };
    }, [weekData, today, weekStart]);
    // Calculate month's progress
    const monthProgress = useMemo(() => {
        const tasksCompleted = monthData.tasks.filter((t) => t.completed).length;
        const tasksTotal = monthData.tasks.length;
        const totalDays = differenceInDays(monthEnd, monthStart) + 1;
        const daysProductiveCount = monthData.dailyReviews.filter((r) => (r.overall_rating || 0) >= 3).length;
        const scores = monthData.dailyReviews.map((r) => r.overall_rating || 0);
        const averageScore = scores.length > 0
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10
            : 0;
        // Determine trend based on last 7 days vs previous 7
        const sortedReviews = [...monthData.dailyReviews].sort((a, b) => new Date(b.review_date).getTime() - new Date(a.review_date).getTime());
        let trend = 'stable';
        if (sortedReviews.length >= 4) {
            const recent = sortedReviews.slice(0, 3).reduce((sum, r) => sum + (r.overall_rating || 0), 0) / 3;
            const older = sortedReviews.slice(3, 6).reduce((sum, r) => sum + (r.overall_rating || 0), 0) / Math.min(3, sortedReviews.length - 3);
            if (recent > older + 0.5)
                trend = 'up';
            else if (recent < older - 0.5)
                trend = 'down';
        }
        return {
            tasksCompleted,
            tasksTotal,
            daysProductiveCount,
            totalDays,
            averageScore,
            trend,
        };
    }, [monthData, monthStart, monthEnd]);
    // Calculate quarter's progress
    const quarterProgress = useMemo(() => {
        const currentQuarter = Math.ceil((today.getMonth() + 1) / 3);
        const quarterStartMonth = (currentQuarter - 1) * 3;
        const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1);
        const weekNumber = Math.ceil(differenceInDays(today, quarterStart) / 7) + 1;
        const goalsProgress = quarterData.goals.map((goal) => ({
            id: goal.id,
            title: goal.title,
            category: goal.category,
            progressPercent: goal.progress_percentage || 0,
        }));
        const averageProgress = goalsProgress.length > 0
            ? goalsProgress.reduce((sum, g) => sum + g.progressPercent, 0) / goalsProgress.length
            : 0;
        // On track if progress >= (week / 12) * 100
        const expectedProgress = (weekNumber / 12) * 100;
        const onTrack = averageProgress >= expectedProgress - 15;
        return {
            goalsProgress,
            weekNumber,
            totalWeeks: 12,
            onTrack,
        };
    }, [quarterData, today]);
    // Calculate projections
    const projections = useMemo(() => {
        const todayPending = todayProgress.tasksTotal - todayProgress.tasksCompleted;
        const currentWeeklyPercent = weekProgress.averagePercent;
        // If today's tasks are completed, how much would weekly improve?
        const potentialWeeklyImprovement = todayPending > 0 && weekProgress.tasksTotal > 0
            ? (todayPending / weekProgress.tasksTotal) * 100
            : 0;
        const weeklyCompletionIfTodayDone = Math.min(100, currentWeeklyPercent + potentialWeeklyImprovement);
        // Monthly impact - how much would this day contribute
        const monthlyImpact = monthProgress.totalDays > 0
            ? (1 / monthProgress.totalDays) * 100
            : 0;
        return {
            weeklyCompletionIfTodayDone: Math.round(weeklyCompletionIfTodayDone),
            currentWeeklyPercent,
            monthlyImpact: Math.round(monthlyImpact * 10) / 10,
        };
    }, [todayProgress, weekProgress, monthProgress]);
    return {
        today: todayProgress,
        week: weekProgress,
        month: monthProgress,
        quarter: quarterProgress,
        projections,
        loading,
    };
}
