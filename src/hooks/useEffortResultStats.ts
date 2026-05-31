import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

export interface AreaEffortResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  // Effort metrics
  minutesToday: number;
  minutesGoal: number;
  currentStreak: number;
  longestStreak: number;
  daysActiveThisWeek: number;
  // Result metrics
  tasksCompleted: number;
  tasksTotal: number;
  subtasksCompleted: number;
  subtasksTotal: number;
  // Area-specific KPIs
  kpis: { label: string; value: string; target?: string }[];
}

export interface EffortResultSummary {
  areas: AreaEffortResult[];
  // Global effort
  totalMinutesToday: number;
  totalMinutesGoal: number;
  effortScore: number; // 0-100
  // Global results
  totalTasksCompleted: number;
  totalTasksTotal: number;
  resultScore: number; // 0-100
  // Combined
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

export function useEffortResultStats(dateStr?: string): EffortResultSummary {
  const [summary, setSummary] = useState<EffortResultSummary>({
    areas: [], totalMinutesToday: 0, totalMinutesGoal: 0, effortScore: 0,
    totalTasksCompleted: 0, totalTasksTotal: 0, resultScore: 0, overallScore: 0, loading: true,
  });

  const load = useCallback(async () => {
    try {
      const today = dateStr || format(new Date(), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(new Date(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(new Date(today), { weekStartsOn: 1 }), 'yyyy-MM-dd');

      // Parallel fetches
      const [
        { data: areaStats },
        { data: areaStreaks },
        { data: areaGoalsConfig },
        { data: tasks },
        { data: entTasks },
        { data: subtasks },
        { data: focusSessions },
        { data: weekAreaStats },
        // Area-specific KPIs
        { data: exerciseLogs },
        { data: languageSessions },
        { data: musicSessions },
        { data: readingBooks },
        { data: exams },
        { data: entrepreneurshipIncome },
      ] = await Promise.all([
        supabase.from('daily_area_stats').select('*').eq('stat_date', today),
        supabase.from('area_streaks').select('*'),
        supabase.from('area_goals_config').select('*'),
        supabase.from('tasks').select('id, completed, area_id, status')
          .gte('due_date', `${today}T00:00:00`).lte('due_date', `${today}T23:59:59`),
        supabase.from('entrepreneurship_tasks').select('id, completed, due_date')
          .eq('due_date', today),
        supabase.from('subtasks').select('id, completed, task_id'),
        supabase.from('focus_sessions').select('duration_minutes, task_area')
          .gte('start_time', `${today}T00:00:00`).lte('start_time', `${today}T23:59:59`),
        supabase.from('daily_area_stats').select('area_id, stat_date, completed')
          .gte('stat_date', weekStart).lte('stat_date', weekEnd),
        // KPIs
        supabase.from('exercise_logs').select('id, log_date').eq('log_date', today),
        supabase.from('language_sessions').select('total_duration, session_date').eq('session_date', today),
        supabase.from('music_practice_sessions').select('duration_minutes').eq('practice_date', today),
        supabase.from('reading_library').select('id, pages_read, pages_total, status').eq('status', 'reading'),
        supabase.from('exams').select('id, grade, status').eq('status', 'completed'),
        supabase.from('entrepreneurship_income').select('amount'),
      ]);

      // Map area-specific data
      const allTasks = [...(tasks || []), ...(entTasks || []).map(t => ({ ...t, area_id: 'emprendimiento' }))];
      const taskIds = new Set((tasks || []).map(t => t.id));
      const relevantSubtasks = (subtasks || []).filter(s => taskIds.has(s.task_id));

      const areas: AreaEffortResult[] = AREAS.map(area => {
        // Effort: minutes from daily_area_stats + focus_sessions
        const stat = (areaStats || []).find(s => s.area_id === area.id);
        const config = (areaGoalsConfig || []).find(c => c.area_id === area.id);
        const focusMin = (focusSessions || [])
          .filter(f => f.task_area === area.id)
          .reduce((s, f) => s + (f.duration_minutes || 0), 0);
        const minutesToday = (stat?.time_spent_minutes || 0) + focusMin;
        const minutesGoal = config?.default_time_goal_minutes || 30;

        // Streaks
        const streak = (areaStreaks || []).find(s => s.area_id === area.id);

        // Days active this week
        const daysActiveThisWeek = new Set(
          (weekAreaStats || []).filter(s => s.area_id === area.id && s.completed).map(s => s.stat_date)
        ).size;

        // Results: tasks
        const areaTasks = allTasks.filter(t => t.area_id === area.id);
        const areaTasksCompleted = areaTasks.filter(t => t.completed).length;

        // Subtasks for this area
        const areaTaskIds = new Set(areaTasks.map(t => t.id));
        const areaSubs = relevantSubtasks.filter(s => areaTaskIds.has(s.task_id));
        const areaSubsCompleted = areaSubs.filter(s => s.completed).length;

        // Area-specific KPIs
        const kpis: { label: string; value: string; target?: string }[] = [];

        if (area.id === 'gym') {
          const gymDays = (exerciseLogs || []).length;
          kpis.push({ label: 'Ejercicios hoy', value: String(gymDays) });
        }
        if (area.id === 'idiomas') {
          const langMin = (languageSessions || []).reduce((s, l) => s + (l.total_duration || 0), 0);
          kpis.push({ label: 'Minutos idiomas', value: String(langMin), target: '30' });
        }
        if (area.id === 'musica') {
          const musicMin = (musicSessions || []).reduce((s, m) => s + (m.duration_minutes || 0), 0);
          kpis.push({ label: 'Minutos práctica', value: String(musicMin) });
        }
        if (area.id === 'lectura') {
          const reading = (readingBooks || []);
          const totalPages = reading.reduce((s, b) => s + (b.pages_read || 0), 0);
          kpis.push({ label: 'Páginas leídas', value: String(totalPages) });
          kpis.push({ label: 'Libros leyendo', value: String(reading.length) });
        }
        if (area.id === 'universidad') {
          const passed = (exams || []).filter(e => (e.grade || 0) >= 4).length;
          kpis.push({ label: 'Exámenes aprobados', value: String(passed) });
        }
        if (area.id === 'emprendimiento') {
          const totalIncome = (entrepreneurshipIncome || []).reduce((s, i) => s + Number(i.amount), 0);
          kpis.push({ label: 'Ingresos totales', value: `$${totalIncome.toLocaleString()}` });
        }

        return {
          id: area.id, name: area.name, icon: area.icon, color: area.color,
          minutesToday, minutesGoal,
          currentStreak: streak?.current_streak || 0,
          longestStreak: streak?.longest_streak || 0,
          daysActiveThisWeek,
          tasksCompleted: areaTasksCompleted, tasksTotal: areaTasks.length,
          subtasksCompleted: areaSubsCompleted, subtasksTotal: areaSubs.length,
          kpis,
        };
      });

      // Global calculations
      const totalMinutesToday = areas.reduce((s, a) => s + a.minutesToday, 0);
      const totalMinutesGoal = areas.reduce((s, a) => s + a.minutesGoal, 0);
      const effortScore = totalMinutesGoal > 0 ? Math.min(100, Math.round((totalMinutesToday / totalMinutesGoal) * 100)) : 0;

      const totalTasksCompleted = areas.reduce((s, a) => s + a.tasksCompleted + a.subtasksCompleted, 0);
      const totalTasksTotal = areas.reduce((s, a) => s + a.tasksTotal + a.subtasksTotal, 0);
      const resultScore = totalTasksTotal > 0 ? Math.round((totalTasksCompleted / totalTasksTotal) * 100) : 0;

      const overallScore = Math.round((effortScore * 0.5) + (resultScore * 0.5));

      setSummary({
        areas, totalMinutesToday, totalMinutesGoal, effortScore,
        totalTasksCompleted, totalTasksTotal, resultScore, overallScore, loading: false,
      });
    } catch (error) {
      console.error('Error loading effort/result stats:', error);
      setSummary(prev => ({ ...prev, loading: false }));
    }
  }, [dateStr]);

  useEffect(() => { load(); }, [load]);

  return summary;
}
