import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, subWeeks } from 'date-fns';
function parseDay(row) {
    const completions = (row.completions || {});
    const timeData = (row.time_data || {});
    const waterData = (row.water_data || {});
    const blockCompletions = (row.block_completions || {});
    const entries = Object.entries(completions);
    const totalHabits = entries.length;
    const habitsDone = entries.filter(([, v]) => v).length;
    const completionPct = totalHabits > 0 ? Math.round((habitsDone / totalHabits) * 100) : 0;
    const totalMinutes = Object.values(timeData).reduce((a, b) => a + b, 0) + (row.workout_duration || 0);
    const waterGlasses = Object.values(waterData).filter(Boolean).length;
    const blocksCompleted = Object.values(blockCompletions).filter(Boolean).length;
    return {
        date: row.tracking_date,
        completionPct,
        habitsDone,
        totalHabits,
        totalMinutes,
        waterGlasses,
        blocksCompleted,
        workoutMinutes: row.workout_duration || 0,
        wakeTime: row.wake_time || '',
        sleepTime: row.sleep_time || '',
    };
}
export function useTimeRangeStats() {
    const [stats, setStats] = useState({
        day: { completionPct: 0, habitsDone: 0, totalHabits: 0, totalMinutes: 0, waterGlasses: 0, blocksCompleted: 0, workoutMinutes: 0, wakeTime: '', sleepTime: '', hasData: false },
        week: { activeDays: 0, avgCompletionPct: 0, bestDay: 0, worstDay: 100, totalMinutes: 0, totalWorkouts: 0, avgMinutesPerDay: 0, trend: 'stable', previousWeekAvg: 0 },
        month: { activeDays: 0, avgCompletionPct: 0, bestDay: 0, totalMinutes: 0 },
        quarter: { activeDays: 0, avgCompletionPct: 0, totalActiveDays: 0, overallConsistency: 0 },
        loading: true,
        currentStreak: 0,
    });
    const load = useCallback(async () => {
        const today = new Date();
        const todayStr = format(today, 'yyyy-MM-dd');
        const weekStart = format(startOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const weekEnd = format(endOfWeek(today, { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const monthStart = format(startOfMonth(today), 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(today), 'yyyy-MM-dd');
        const quarterStart = format(startOfQuarter(today), 'yyyy-MM-dd');
        const quarterEnd = format(endOfQuarter(today), 'yyyy-MM-dd');
        const prevWeekStart = format(startOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        const prevWeekEnd = format(endOfWeek(subWeeks(today, 1), { weekStartsOn: 1 }), 'yyyy-MM-dd');
        try {
            const [currentRow, weekRows, monthRows, quarterRows, prevWeekRows] = await Promise.all([
                supabase.from('daily_systems_tracking').select('*').eq('tracking_date', todayStr).maybeSingle(),
                supabase.from('daily_systems_tracking').select('*').gte('tracking_date', weekStart).lte('tracking_date', weekEnd).order('tracking_date'),
                supabase.from('daily_systems_tracking').select('*').gte('tracking_date', monthStart).lte('tracking_date', monthEnd).order('tracking_date'),
                supabase.from('daily_systems_tracking').select('*').gte('tracking_date', quarterStart).lte('tracking_date', quarterEnd).order('tracking_date'),
                supabase.from('daily_systems_tracking').select('*').gte('tracking_date', prevWeekStart).lte('tracking_date', prevWeekEnd).order('tracking_date'),
            ]);
            // TODAY
            let dayStats = null;
            if (currentRow.data) {
                dayStats = parseDay(currentRow.data);
            }
            // WEEK
            const weekDays = (weekRows.data || []).map(r => parseDay(r));
            const weekActiveDays = weekDays.length;
            const weekAvgCompletion = weekDays.length > 0 ? Math.round(weekDays.reduce((a, d) => a + d.completionPct, 0) / weekDays.length) : 0;
            const weekBest = weekDays.length > 0 ? Math.max(...weekDays.map(d => d.completionPct)) : 0;
            const weekWorst = weekDays.length > 0 ? Math.min(...weekDays.map(d => d.completionPct)) : 0;
            const weekTotalMinutes = weekDays.reduce((a, d) => a + d.totalMinutes, 0);
            const weekWorkouts = weekDays.filter(d => d.workoutMinutes > 0).length;
            // PREV WEEK
            const prevWeekDays = (prevWeekRows.data || []).map(r => parseDay(r));
            const prevWeekAvg = prevWeekDays.length > 0 ? Math.round(prevWeekDays.reduce((a, d) => a + d.completionPct, 0) / prevWeekDays.length) : 0;
            let trend = 'stable';
            if (weekAvgCompletion > prevWeekAvg + 5)
                trend = 'up';
            else if (weekAvgCompletion < prevWeekAvg - 5)
                trend = 'down';
            // MONTH
            const monthDays = (monthRows.data || []).map(r => parseDay(r));
            const monthActiveDays = monthDays.length;
            const monthAvgCompletion = monthDays.length > 0 ? Math.round(monthDays.reduce((a, d) => a + d.completionPct, 0) / monthDays.length) : 0;
            const monthBest = monthDays.length > 0 ? Math.max(...monthDays.map(d => d.completionPct)) : 0;
            const monthTotalMinutes = monthDays.reduce((a, d) => a + d.totalMinutes, 0);
            // QUARTER
            const quarterDays = (quarterRows.data || []).map(r => parseDay(r));
            const quarterActiveDays = quarterDays.length;
            const quarterAvgCompletion = quarterDays.length > 0 ? Math.round(quarterDays.reduce((a, d) => a + d.completionPct, 0) / quarterDays.length) : 0;
            // Compute current streak
            let streak = 0;
            const sorted = [...quarterDays].sort((a, b) => b.date.localeCompare(a.date));
            for (const d of sorted) {
                if (d.completionPct >= 50)
                    streak++;
                else
                    break;
            }
            // Quarter total days (including non-tracked)
            const quarterDaysTotal = Math.round((new Date(quarterEnd).getTime() - new Date(quarterStart).getTime()) / 86400000) + 1;
            const overallConsistency = Math.round((quarterActiveDays / quarterDaysTotal) * 100);
            setStats({
                day: {
                    completionPct: dayStats?.completionPct || 0,
                    habitsDone: dayStats?.habitsDone || 0,
                    totalHabits: dayStats?.totalHabits || 0,
                    totalMinutes: dayStats?.totalMinutes || 0,
                    waterGlasses: dayStats?.waterGlasses || 0,
                    blocksCompleted: dayStats?.blocksCompleted || 0,
                    workoutMinutes: dayStats?.workoutMinutes || 0,
                    wakeTime: dayStats?.wakeTime || '',
                    sleepTime: dayStats?.sleepTime || '',
                    hasData: !!dayStats,
                },
                week: {
                    activeDays: weekActiveDays,
                    avgCompletionPct: weekAvgCompletion,
                    bestDay: weekBest,
                    worstDay: weekWorst,
                    totalMinutes: weekTotalMinutes,
                    totalWorkouts: weekWorkouts,
                    avgMinutesPerDay: weekActiveDays > 0 ? Math.round(weekTotalMinutes / weekActiveDays) : 0,
                    trend,
                    previousWeekAvg: prevWeekAvg,
                },
                month: {
                    activeDays: monthActiveDays,
                    avgCompletionPct: monthAvgCompletion,
                    bestDay: monthBest,
                    totalMinutes: monthTotalMinutes,
                },
                quarter: {
                    activeDays: quarterActiveDays,
                    avgCompletionPct: quarterAvgCompletion,
                    totalActiveDays: quarterDaysTotal,
                    overallConsistency,
                },
                loading: false,
                currentStreak: streak,
            });
        }
        catch (error) {
            console.error('Error loading time range stats:', error);
            setStats(prev => ({ ...prev, loading: false }));
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    return stats;
}
