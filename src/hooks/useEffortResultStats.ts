import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { getLocalTasksForDate } from '@/lib/dataSync';

export interface AreaEffortResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  minutesToday: number;
  minutesGoal: number;
  currentStreak: number;
  longestStreak: number;
  daysActiveThisWeek: number;
  tasksCompleted: number;
  tasksTotal: number;
  subtasksCompleted: number;
  subtasksTotal: number;
  kpis: { label: string; value: string; target?: string }[];
}

export interface EffortResultSummary {
  areas: AreaEffortResult[];
  totalMinutesToday: number;
  totalMinutesGoal: number;
  effortScore: number;
  totalTasksCompleted: number;
  totalTasksTotal: number;
  resultScore: number;
  overallScore: number;
  loading: boolean;
}

const AREAS = [
  { id: 'universidad', name: 'Universidad', icon: '🎓', color: 'hsl(217, 91%, 60%)' },
  { id: 'emprendimiento', name: 'Emprendimiento', icon: '🚀', color: 'hsl(271, 91%, 65%)' },
  { id: 'proyectos-personales', name: 'Proyectos', icon: '🎯', color: 'hsl(142, 71%, 45%)' },
  { id: 'gym', name: 'Gym', icon: '💪', color: 'hsl(0, 84%, 60%)' },
  { id: 'idiomas', name: 'Idiomas', icon: '🌍', color: 'hsl(48, 96%, 53%)' },
  { id: 'musica', name: 'Música', icon: '🎸', color: 'hsl(330, 81%, 60%)' },
  { id: 'lectura', name: 'Lectura', icon: '📚', color: 'hsl(174, 72%, 40%)' },
];

async function safeQuery<T>(query: Promise<{ data: T | null; error: any }>): Promise<T | null> {
  try {
    const { data, error } = await query;
    if (error) {
      console.warn('[safeQuery] Supabase error:', error.message);
      return null;
    }
    return data;
  } catch (err) {
    console.warn('[safeQuery] Exception:', err);
    return null;
  }
}

export function useEffortResultStats(dateStr?: string): EffortResultSummary {
  const [summary, setSummary] = useState<EffortResultSummary>({
    areas: [], totalMinutesToday: 0, totalMinutesGoal: 0, effortScore: 0,
    totalTasksCompleted: 0, totalTasksTotal: 0, resultScore: 0, overallScore: 0, loading: true,
  });

  const load = useCallback(async () => {
    const today = dateStr || format(new Date(), 'yyyy-MM-dd');
    const weekStart = format(startOfWeek(new Date(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const weekEnd = format(endOfWeek(new Date(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');

    try {
      const [areaStats, areaStreaks, areaGoalsConfig, tasks, weekAreaStats] = await Promise.all([
        safeQuery(supabase.from('daily_area_stats').select('*').eq('stat_date', today)),
        safeQuery(supabase.from('area_streaks').select('*')),
        safeQuery(supabase.from('area_goals_config').select('*')),
        safeQuery(
          supabase.from('tasks').select('id, completed, area_id, status')
            .gte('due_date', `${today}T00:00:00`).lte('due_date', `${today}T23:59:59`)
        ),
        safeQuery(
          supabase.from('daily_area_stats').select('area_id, stat_date, completed')
            .gte('stat_date', weekStart).lte('stat_date', weekEnd)
        ),
      ]);

      let allTasks = tasks || [];

      if (allTasks.length === 0) {
        const localData = getLocalTasksForDate(today);
        allTasks = localData.tasks.map((t: any) => ({
          id: t.id,
          completed: t.completed || t.status === 'completada',
          area_id: t.areaId || null,
          status: t.status || 'pendiente',
        }));
      }

      const allAreas = AREAS.map(area => {
        const stat = (areaStats || []).find((s: any) => s.area_id === area.id);
        const config = (areaGoalsConfig || []).find((c: any) => c.area_id === area.id);

        const minutesToday = stat?.time_spent_minutes || 0;
        const minutesGoal = config?.default_time_goal_minutes || 30;
        const streak = (areaStreaks || []).find((s: any) => s.area_id === area.id);

        const daysActiveThisWeek = new Set(
          (weekAreaStats || []).filter((s: any) => s.area_id === area.id && s.completed).map((s: any) => s.stat_date)
        ).size;

        const areaTasks = allTasks.filter((t: any) => t.area_id === area.id);
        const areaTasksCompleted = areaTasks.filter((t: any) => t.completed).length;

        return {
          id: area.id,
          name: area.name,
          icon: area.icon,
          color: area.color,
          minutesToday,
          minutesGoal,
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          daysActiveThisWeek,
          tasksCompleted: areaTasksCompleted,
          tasksTotal: areaTasks.length,
          subtasksCompleted: 0,
          subtasksTotal: 0,
          kpis: [] as { label: string; value: string; target?: string }[],
        };
      });

      const totalMinutesToday = allAreas.reduce((s, a) => s + a.minutesToday, 0);
      const totalMinutesGoal = allAreas.reduce((s, a) => s + a.minutesGoal, 0);
      const effortScore = totalMinutesGoal > 0 ? Math.min(100, Math.round((totalMinutesToday / totalMinutesGoal) * 100)) : 0;

      const totalTasksCompleted = allAreas.reduce((s, a) => s + a.tasksCompleted, 0);
      const totalTasksTotal = allAreas.reduce((s, a) => s + a.tasksTotal, 0);
      const resultScore = totalTasksTotal > 0 ? Math.round((totalTasksCompleted / totalTasksTotal) * 100) : 0;
      const overallScore = Math.round((effortScore * 0.5) + (resultScore * 0.5));

      setSummary({
        areas: allAreas,
        totalMinutesToday,
        totalMinutesGoal,
        effortScore,
        totalTasksCompleted,
        totalTasksTotal,
        resultScore,
        overallScore,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading effort/result stats:', error);
      setSummary(prev => ({ ...prev, loading: false }));
    }
  }, [dateStr]);

  useEffect(() => { load(); }, [load]);

  return summary;
}
