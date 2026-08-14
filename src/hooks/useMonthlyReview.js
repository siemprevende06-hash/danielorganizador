import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, eachDayOfInterval } from "date-fns";
export function useMonthlyReview(referenceDate) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const date = referenceDate || new Date();
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthStartStr = format(monthStart, "yyyy-MM-dd");
    const monthEndStr = format(monthEnd, "yyyy-MM-dd");
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true);
            const dayStrs = days.map(d => format(d, "yyyy-MM-dd"));
            const [trackingRes, reviewsRes, tasksRes, entTasksRes, focusRes, blocksRes,] = await Promise.all([
                supabase
                    .from("daily_systems_tracking")
                    .select("*")
                    .gte("tracking_date", monthStartStr)
                    .lte("tracking_date", monthEndStr)
                    .order("tracking_date"),
                supabase
                    .from("daily_reviews")
                    .select("*")
                    .gte("review_date", monthStartStr)
                    .lte("review_date", monthEndStr),
                supabase
                    .from("tasks")
                    .select("id, completed, due_date")
                    .gte("due_date", `${monthStartStr}T00:00:00`)
                    .lte("due_date", `${monthEndStr}T23:59:59`),
                supabase
                    .from("entrepreneurship_tasks")
                    .select("id, completed, due_date")
                    .gte("due_date", monthStartStr)
                    .lte("due_date", monthEndStr),
                supabase
                    .from("focus_sessions")
                    .select("duration_minutes, start_time")
                    .eq("completed", true)
                    .gte("start_time", monthStartStr)
                    .lte("start_time", `${monthEndStr}T23:59:59`),
                supabase
                    .from("block_completions")
                    .select("*")
                    .eq("completed", true)
                    .gte("completion_date", monthStartStr)
                    .lte("completion_date", monthEndStr),
            ]);
            const trackingRows = trackingRes.data || [];
            const reviews = reviewsRes.data || [];
            const tasks = tasksRes.data || [];
            const entTasks = entTasksRes.data || [];
            const focusSessions = focusRes.data || [];
            const blockComps = blocksRes.data || [];
            const allTasks = [...tasks, ...entTasks];
            const totalTasksCompleted = allTasks.filter(t => t.completed).length;
            const totalTasks = allTasks.length;
            const totalFocusMinutes = focusSessions.reduce((s, f) => s + (f.duration_minutes || 0), 0);
            const habitCompletions = {};
            const allUniqueHabits = new Set();
            trackingRows.forEach((row) => {
                const completions = (row.completions || {});
                Object.entries(completions).forEach(([habitId, done]) => {
                    allUniqueHabits.add(habitId);
                    if (done) {
                        habitCompletions[habitId] = (habitCompletions[habitId] || 0) + 1;
                    }
                });
            });
            const activeDays = trackingRows.length;
            const totalDays = days.length;
            const totalHabitsCompleted = Object.values(habitCompletions).reduce((a, b) => a + b, 0);
            const totalHabits = allUniqueHabits.size * activeDays;
            let totalWorkoutMinutes = 0;
            trackingRows.forEach((row) => {
                totalWorkoutMinutes += row.workout_duration || 0;
            });
            const timeData = {};
            trackingRows.forEach((row) => {
                const td = (row.time_data || {});
                Object.entries(td).forEach(([key, val]) => {
                    timeData[key] = (timeData[key] || 0) + val;
                });
            });
            const totalBlockCompletions = blockComps.length;
            const totalBlocks = days.length * 8;
            let waterCompletions = 0;
            let waterTotal = 0;
            const WATER_IDS = ["pre-entreno", "desayuno", "merienda-1", "almuerzo", "merienda-2", "comida", "antes-dormir"];
            trackingRows.forEach((row) => {
                const completions = (row.completions || {});
                WATER_IDS.forEach(hid => {
                    waterTotal++;
                    if (completions[hid])
                        waterCompletions++;
                });
            });
            const ratings = reviews.map((r) => r.overall_rating || 0).filter(Boolean);
            const avgOverallRating = ratings.length > 0
                ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
                : 0;
            const dayDetails = days.map(d => {
                const dayStr = format(d, "yyyy-MM-dd");
                const review = reviews.find((r) => r.review_date === dayStr);
                const tracking = trackingRows.find((r) => r.tracking_date === dayStr);
                const completions = (tracking?.completions || {});
                const dayHabits = Object.values(completions).filter(Boolean).length;
                const dayTasks = allTasks.filter((t) => {
                    const dateStr = t.due_date?.split("T")[0] || t.due_date;
                    return dateStr === dayStr && t.completed;
                }).length;
                const dayFocus = focusSessions
                    .filter((f) => f.start_time?.startsWith(dayStr))
                    .reduce((s, f) => s + (f.duration_minutes || 0), 0);
                return {
                    date: dayStr,
                    overallRating: review?.overall_rating || 0,
                    habitsCompleted: dayHabits,
                    tasksCompleted: dayTasks,
                    focusMinutes: dayFocus,
                };
            });
            if (!cancelled) {
                setData({
                    monthStart: monthStartStr,
                    monthEnd: monthEndStr,
                    activeDays,
                    totalDays,
                    avgOverallRating,
                    totalTasksCompleted,
                    totalTasks,
                    totalHabitsCompleted,
                    totalHabits,
                    totalFocusMinutes,
                    totalWorkoutMinutes,
                    totalBlockCompletions,
                    totalBlocks,
                    waterCompletions,
                    waterTotal,
                    timeData,
                    habitCompletions,
                    dayDetails,
                });
                setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [monthStartStr]);
    return { data, loading, monthStart, monthEnd };
}
