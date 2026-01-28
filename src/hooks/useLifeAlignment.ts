import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, format, differenceInDays, startOfYear } from 'date-fns';

interface PillarProgress {
  id: string;
  name: string;
  progress: number;
  icon: string;
}

interface MetricComparison {
  label: string;
  current: number;
  previous: number;
  unit?: string;
}

interface LifeAlignmentData {
  // Purpose & Visions
  purpose: string;
  visions: {
    id: string;
    title: string;
    description: string;
    pillars: string[];
    progress: number;
  }[];
  
  // Pillar progress
  pillars: PillarProgress[];
  
  // Time-based progress
  progress: {
    daily: { score: number; completed: number; total: number };
    weekly: { score: number; daysProductive: number; totalDays: number };
    monthly: { score: number; daysProductive: number; totalDays: number };
    quarterly: { weekNumber: number; totalWeeks: number; goalsProgress: number };
    annual: { dayNumber: number; totalDays: number; percentComplete: number };
  };
  
  // Comparisons
  comparisons: {
    weekVsWeek: MetricComparison[];
    monthVsMonth: MetricComparison[];
  };
  
  loading: boolean;
}

export function useLifeAlignment(): LifeAlignmentData {
  const [data, setData] = useState<LifeAlignmentData>({
    purpose: "Convertirme en mi mejor versión",
    visions: [
      {
        id: "empire",
        title: "Imperio & Libertad Financiera",
        description: "Construir un negocio que genere ingresos pasivos",
        pillars: ["universidad", "emprendimiento", "proyectos"],
        progress: 0
      },
      {
        id: "family",
        title: "Familia con una Mujer Hermosa",
        description: "Prepararme física, mental y económicamente",
        pillars: ["gym", "idiomas", "musica"],
        progress: 0
      }
    ],
    pillars: [],
    progress: {
      daily: { score: 0, completed: 0, total: 0 },
      weekly: { score: 0, daysProductive: 0, totalDays: 7 },
      monthly: { score: 0, daysProductive: 0, totalDays: 31 },
      quarterly: { weekNumber: 0, totalWeeks: 12, goalsProgress: 0 },
      annual: { dayNumber: 0, totalDays: 365, percentComplete: 0 }
    },
    comparisons: {
      weekVsWeek: [],
      monthVsMonth: []
    },
    loading: true
  });

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      const todayStr = format(today, 'yyyy-MM-dd');
      
      // Calculate time periods
      const thisWeekStart = startOfWeek(today, { weekStartsOn: 1 });
      const thisWeekEnd = endOfWeek(today, { weekStartsOn: 1 });
      const lastWeekStart = subWeeks(thisWeekStart, 1);
      const lastWeekEnd = subWeeks(thisWeekEnd, 1);
      
      const thisMonthStart = startOfMonth(today);
      const thisMonthEnd = endOfMonth(today);
      const lastMonthStart = startOfMonth(subMonths(today, 1));
      const lastMonthEnd = endOfMonth(subMonths(today, 1));
      
      const yearStart = startOfYear(today);
      const dayOfYear = differenceInDays(today, yearStart) + 1;
      
      // Calculate quarter info (12-week year system)
      const quarterStart = new Date(2026, 0, 1); // Jan 1, 2026
      const weeksSinceQuarterStart = Math.floor(differenceInDays(today, quarterStart) / 7) + 1;
      const currentQuarterWeek = ((weeksSinceQuarterStart - 1) % 12) + 1;

      // Load today's tasks
      const { data: todayTasks } = await supabase
        .from('tasks')
        .select('id, completed')
        .gte('due_date', `${todayStr}T00:00:00`)
        .lte('due_date', `${todayStr}T23:59:59`);

      const { data: todayEntrepreneurshipTasks } = await supabase
        .from('entrepreneurship_tasks')
        .select('id, completed')
        .eq('due_date', todayStr);

      const allTodayTasks = [...(todayTasks || []), ...(todayEntrepreneurshipTasks || [])];
      const todayCompleted = allTodayTasks.filter(t => t.completed).length;
      const todayTotal = allTodayTasks.length;
      const todayScore = todayTotal > 0 ? Math.round((todayCompleted / todayTotal) * 100) : 0;

      // Load this week's data
      const { count: thisWeekCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('updated_at', format(thisWeekStart, 'yyyy-MM-dd'))
        .lt('updated_at', format(thisWeekEnd, 'yyyy-MM-dd'));

      // Load last week's data
      const { count: lastWeekCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('updated_at', format(lastWeekStart, 'yyyy-MM-dd'))
        .lt('updated_at', format(lastWeekEnd, 'yyyy-MM-dd'));

      // Load gym sessions
      const { data: thisWeekGym } = await supabase
        .from('exercise_logs')
        .select('id')
        .gte('log_date', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('log_date', format(thisWeekEnd, 'yyyy-MM-dd'));

      const { data: lastWeekGym } = await supabase
        .from('exercise_logs')
        .select('id')
        .gte('log_date', format(lastWeekStart, 'yyyy-MM-dd'))
        .lte('log_date', format(lastWeekEnd, 'yyyy-MM-dd'));

      // Load language sessions
      const { data: thisWeekLanguage } = await supabase
        .from('language_sessions')
        .select('total_duration')
        .gte('session_date', format(thisWeekStart, 'yyyy-MM-dd'))
        .lte('session_date', format(thisWeekEnd, 'yyyy-MM-dd'));

      const { data: lastWeekLanguage } = await supabase
        .from('language_sessions')
        .select('total_duration')
        .gte('session_date', format(lastWeekStart, 'yyyy-MM-dd'))
        .lte('session_date', format(lastWeekEnd, 'yyyy-MM-dd'));

      const thisWeekLanguageMinutes = (thisWeekLanguage || []).reduce((sum, s) => sum + (s.total_duration || 0), 0);
      const lastWeekLanguageMinutes = (lastWeekLanguage || []).reduce((sum, s) => sum + (s.total_duration || 0), 0);

      // Load 12-week goals
      const { data: goals } = await supabase
        .from('twelve_week_goals')
        .select('*')
        .eq('quarter', 1)
        .eq('year', 2026)
        .eq('status', 'active');

      const avgGoalProgress = goals && goals.length > 0
        ? Math.round(goals.reduce((sum, g) => sum + (g.progress_percentage || 0), 0) / goals.length)
        : 0;

      // Calculate pillar progress
      const pillars: PillarProgress[] = [
        { id: 'universidad', name: 'Universidad', progress: 0, icon: '🎓' },
        { id: 'emprendimiento', name: 'Emprendimiento', progress: 0, icon: '💼' },
        { id: 'proyectos', name: 'Proyectos', progress: 0, icon: '🎯' },
        { id: 'gym', name: 'Gym', progress: 0, icon: '💪' },
        { id: 'idiomas', name: 'Idiomas', progress: 0, icon: '🌍' },
        { id: 'musica', name: 'Música', progress: 0, icon: '🎸' }
      ];

      // Calculate progress based on goals
      (goals || []).forEach(goal => {
        const pillar = pillars.find(p => p.id === goal.category);
        if (pillar) {
          pillar.progress = Math.max(pillar.progress, goal.progress_percentage || 0);
        }
      });

      // Weekly comparisons
      const weekVsWeek: MetricComparison[] = [
        {
          label: 'Tareas completadas',
          current: thisWeekCompleted || 0,
          previous: lastWeekCompleted || 0
        },
        {
          label: 'Días de gym',
          current: new Set((thisWeekGym || []).map(g => g.id)).size,
          previous: new Set((lastWeekGym || []).map(g => g.id)).size
        },
        {
          label: 'Minutos de idiomas',
          current: thisWeekLanguageMinutes,
          previous: lastWeekLanguageMinutes,
          unit: 'min'
        }
      ];

      // Monthly data
      const { count: thisMonthCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('updated_at', format(thisMonthStart, 'yyyy-MM-dd'))
        .lt('updated_at', format(thisMonthEnd, 'yyyy-MM-dd'));

      const { count: lastMonthCompleted } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('updated_at', format(lastMonthStart, 'yyyy-MM-dd'))
        .lt('updated_at', format(lastMonthEnd, 'yyyy-MM-dd'));

      const monthVsMonth: MetricComparison[] = [
        {
          label: 'Tareas completadas',
          current: thisMonthCompleted || 0,
          previous: lastMonthCompleted || 0
        },
        {
          label: 'Metas del trimestre',
          current: avgGoalProgress,
          previous: 0,
          unit: '%'
        }
      ];

      // Vision progress (based on related pillars)
      const visions = [
        {
          id: "empire",
          title: "Imperio & Libertad Financiera",
          description: "Construir un negocio que genere ingresos pasivos",
          pillars: ["universidad", "emprendimiento", "proyectos"],
          progress: Math.round(
            (pillars.find(p => p.id === 'universidad')?.progress || 0) * 0.3 +
            (pillars.find(p => p.id === 'emprendimiento')?.progress || 0) * 0.5 +
            (pillars.find(p => p.id === 'proyectos')?.progress || 0) * 0.2
          )
        },
        {
          id: "family",
          title: "Familia con una Mujer Hermosa",
          description: "Prepararme física, mental y económicamente",
          pillars: ["gym", "idiomas", "musica"],
          progress: Math.round(
            (pillars.find(p => p.id === 'gym')?.progress || 0) * 0.5 +
            (pillars.find(p => p.id === 'idiomas')?.progress || 0) * 0.3 +
            (pillars.find(p => p.id === 'musica')?.progress || 0) * 0.2
          )
        }
      ];

      setData({
        purpose: "Convertirme en mi mejor versión",
        visions,
        pillars,
        progress: {
          daily: { score: todayScore, completed: todayCompleted, total: todayTotal },
          weekly: { score: Math.round((thisWeekCompleted || 0) / 20 * 100), daysProductive: Math.min(7, Math.ceil((thisWeekCompleted || 0) / 3)), totalDays: 7 },
          monthly: { score: Math.round((thisMonthCompleted || 0) / 80 * 100), daysProductive: Math.min(30, Math.ceil((thisMonthCompleted || 0) / 3)), totalDays: new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() },
          quarterly: { weekNumber: currentQuarterWeek, totalWeeks: 12, goalsProgress: avgGoalProgress },
          annual: { dayNumber: dayOfYear, totalDays: 365, percentComplete: Math.round((dayOfYear / 365) * 100) }
        },
        comparisons: {
          weekVsWeek,
          monthVsMonth
        },
        loading: false
      });
    } catch (error) {
      console.error('Error loading life alignment data:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return data;
}