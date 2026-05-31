import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PillarProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  percentage: number;
  tasksCompleted: number;
  tasksTotal: number;
  hoursToday: number;
  streak: number;
  status: 'completed' | 'in-progress' | 'pending';
  goalProgress: number;
}

export interface SecondaryGoalProgress {
  id: string;
  name: string;
  icon: string;
  completed: boolean;
  duration: number;
  notes?: string;
}

const PILLAR_CONFIG = [
  { id: 'universidad', name: 'Universidad', icon: '🎓', color: 'hsl(var(--chart-1))', areaId: 'universidad' },
  { id: 'emprendimiento', name: 'Emprendimiento', icon: '💼', color: 'hsl(var(--chart-2))', areaId: 'emprendimiento' },
  { id: 'proyectos', name: 'Proyectos', icon: '🚀', color: 'hsl(var(--chart-3))', areaId: 'proyectos-personales' },
  { id: 'gym', name: 'Gym', icon: '💪', color: 'hsl(var(--chart-4))', areaId: 'gym' },
  { id: 'idiomas', name: 'Idiomas', icon: '🌍', color: 'hsl(var(--chart-5))', areaId: 'idiomas' },
];

const SECONDARY_GOALS_CONFIG = [
  { id: 'piano', name: 'Piano', icon: '🎹' },
  { id: 'guitarra', name: 'Guitarra', icon: '🎸' },
  { id: 'lectura', name: 'Lectura', icon: '📖' },
  { id: 'ajedrez', name: 'Ajedrez', icon: '♟️' },
];

export function usePillarProgress(date?: Date) {
  const [pillars, setPillars] = useState<PillarProgress[]>([]);
  const [secondaryGoals, setSecondaryGoals] = useState<SecondaryGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  const targetDate = date || new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const calculatePillarProgress = useCallback(async () => {
    setLoading(true);
    try {
      const startOfDay = `${dateStr}T00:00:00`;
      const endOfDay = `${dateStr}T23:59:59`;

      // Fetch all data in parallel
      const [
        tasksResult,
        entrepreneurshipTasksResult,
        habitHistoryResult,
        languageSessionsResult,
        exerciseLogsResult,
        goalsResult
      ] = await Promise.all([
        supabase.from('tasks').select('*').gte('created_at', startOfDay).lte('created_at', endOfDay),
        supabase.from('entrepreneurship_tasks').select('*'),
        supabase.from('habit_history').select('*'),
        supabase.from('language_sessions').select('*').eq('session_date', dateStr),
        supabase.from('exercise_logs').select('*').eq('log_date', dateStr),
        supabase.from('twelve_week_goals').select('*').eq('status', 'active')
      ]);

      const tasks = tasksResult.data || [];
      const entrepreneurshipTasks = entrepreneurshipTasksResult.data || [];
      const habitHistory = habitHistoryResult.data || [];
      const languageSessions = languageSessionsResult.data || [];
      const exerciseLogs = exerciseLogsResult.data || [];
      const goals = goalsResult.data || [];

      // Calculate progress for each pillar
      const pillarProgress: PillarProgress[] = PILLAR_CONFIG.map(config => {
        let percentage = 0;
        let tasksCompleted = 0;
        let tasksTotal = 0;
        let hoursToday = 0;
        let streak = 0;
        let goalProgress = 0;

        const relatedGoal = goals.find(g => g.category?.toLowerCase() === config.id);
        goalProgress = relatedGoal?.progress_percentage || 0;

        switch (config.id) {
          case 'universidad': {
            const uniTasks = tasks.filter(t => t.area_id === 'universidad');
            tasksTotal = uniTasks.length;
            tasksCompleted = uniTasks.filter(t => t.completed).length;
            // Estimate hours from completed tasks (assume 1 hour per task)
            hoursToday = tasksCompleted * 1;
            percentage = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
            break;
          }
          case 'emprendimiento': {
            const todayEntTasks = entrepreneurshipTasks.filter(t => {
              const taskDate = t.created_at ? format(new Date(t.created_at), 'yyyy-MM-dd') : '';
              return taskDate === dateStr || (t.due_date && t.due_date === dateStr);
            });
            tasksTotal = todayEntTasks.length || 1;
            tasksCompleted = todayEntTasks.filter(t => t.completed).length;
            hoursToday = tasksCompleted * 0.5;
            percentage = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
            break;
          }
          case 'proyectos': {
            const projectTasks = tasks.filter(t => t.area_id === 'proyectos-personales');
            tasksTotal = projectTasks.length;
            tasksCompleted = projectTasks.filter(t => t.completed).length;
            hoursToday = tasksCompleted * 1;
            percentage = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;
            break;
          }
          case 'gym': {
            const gymHabit = habitHistory.find(h => h.habit_id === 'habit-entrenamiento');
            if (gymHabit) {
              const completedDates = (gymHabit.completed_dates as any[]) || [];
              const todayCompleted = completedDates.some((entry: any) => 
                entry.date === dateStr && entry.status === 'completed'
              );
              percentage = todayCompleted ? 100 : 0;
              tasksCompleted = todayCompleted ? 1 : 0;
              tasksTotal = 1;
              streak = gymHabit.current_streak || 0;
            }
            hoursToday = exerciseLogs.length > 0 ? 1 : 0;
            break;
          }
          case 'idiomas': {
            const session = languageSessions[0];
            if (session) {
              const subTasks = [
                session.vocabulary_completed,
                session.grammar_completed,
                session.speaking_completed,
                session.reading_completed,
                session.listening_completed
              ];
              tasksCompleted = subTasks.filter(Boolean).length;
              tasksTotal = 5;
              percentage = Math.round((tasksCompleted / 5) * 100);
              hoursToday = (session.total_duration || 0) / 60;
            }
            break;
          }
        }

        const status: 'completed' | 'in-progress' | 'pending' = 
          percentage >= 100 ? 'completed' : 
          percentage > 0 ? 'in-progress' : 'pending';

        return {
          ...config,
          percentage,
          tasksCompleted,
          tasksTotal,
          hoursToday,
          streak,
          status,
          goalProgress
        };
      });

      // Calculate secondary goals
      const secondaryProgress: SecondaryGoalProgress[] = SECONDARY_GOALS_CONFIG.map(config => {
        let completed = false;
        let duration = 0;

        switch (config.id) {
          case 'piano':
          case 'guitarra': {
            const habit = habitHistory.find(h => h.habit_id === `habit-${config.id}`);
            if (habit) {
              const completedDates = (habit.completed_dates as any[]) || [];
              const todayEntry = completedDates.find((entry: any) => entry.date === dateStr);
              completed = todayEntry?.status === 'completed';
              duration = todayEntry?.duration || 0;
            }
            break;
          }
          case 'lectura': {
            const session = languageSessions[0];
            completed = session?.reading_completed || false;
            duration = session?.reading_duration || 0;
            break;
          }
          case 'ajedrez': {
            // Check if there's a chess-related habit or task
            const chessHabit = habitHistory.find(h => h.habit_id === 'habit-ajedrez');
            if (chessHabit) {
              const completedDates = (chessHabit.completed_dates as any[]) || [];
              completed = completedDates.some((entry: any) => 
                entry.date === dateStr && entry.status === 'completed'
              );
            }
            break;
          }
        }

        return { ...config, completed, duration };
      });

      setPillars(pillarProgress);
      setSecondaryGoals(secondaryProgress);

      // Calculate overall score
      const avgPillarScore = pillarProgress.reduce((acc, p) => acc + p.percentage, 0) / pillarProgress.length;
      const secondaryBonus = (secondaryProgress.filter(g => g.completed).length / secondaryProgress.length) * 10;
      setOverallScore(Math.round(avgPillarScore + secondaryBonus));

    } catch (error) {
      console.error('Error calculating pillar progress:', error);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    calculatePillarProgress();
  }, [calculatePillarProgress]);

  return {
    pillars,
    secondaryGoals,
    overallScore,
    loading,
    refreshProgress: calculatePillarProgress
  };
}
