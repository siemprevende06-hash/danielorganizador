import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface PillarProgress {
  id: string;
  name: string;
  icon: string;
  color: string;
  route: string;
  percentage: number;       // overall = (effort + results) / 2
  effort: number;           // 0..100 from systems / habits / time
  results: number;          // 0..100 from tasks completed
  tasksCompleted: number;
  tasksTotal: number;
  hoursToday: number;
  streak: number;
  status: 'completed' | 'in-progress' | 'pending';
  goalProgress: number;
  coverUrl?: string | null;
}

export interface SecondaryGoalProgress {
  id: string;
  name: string;
  icon: string;        // emoji or special key
  iconKey?: 'heart';   // lucide icon override
  completed: boolean;
  duration: number;
  notes?: string;
}

const PILLAR_CONFIG = [
  { id: 'universidad', name: 'Universidad', icon: '🎓', color: 'hsl(var(--chart-1))', route: '/university' },
  { id: 'emprendimiento', name: 'Emprendimiento', icon: '💼', color: 'hsl(var(--chart-2))', route: '/entrepreneurship' },
  { id: 'proyectos', name: 'Proyectos', icon: '🚀', color: 'hsl(var(--chart-3))', route: '/projects' },
  { id: 'gym', name: 'Gym', icon: '💪', color: 'hsl(var(--chart-4))', route: '/gym' },
  { id: 'idiomas', name: 'Idiomas', icon: '🌍', color: 'hsl(var(--chart-5))', route: '/languages-dashboard' },
];

export function usePillarProgress(date?: Date) {
  const [pillars, setPillars] = useState<PillarProgress[]>([]);
  const [secondaryGoals, setSecondaryGoals] = useState<SecondaryGoalProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);

  const targetDate = date || new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');

  const calculate = useCallback(async () => {
    setLoading(true);
    try {
      const [
        tasksR, entTasksR, habitsR, langR, exerciseR, goalsR,
        examsR, projectsR, systemsR, streaksR, coversR
      ] = await Promise.all([
        supabase.from('tasks').select('*').eq('due_date', dateStr),
        supabase.from('entrepreneurship_tasks').select('*'),
        supabase.from('habit_history').select('*'),
        supabase.from('language_sessions').select('*').eq('session_date', dateStr),
        supabase.from('exercise_logs').select('*').eq('log_date', dateStr),
        supabase.from('twelve_week_goals').select('*').eq('status', 'active'),
        supabase.from('exams').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('daily_systems_tracking').select('*').eq('tracking_date', dateStr).maybeSingle(),
        supabase.from('area_streaks').select('*'),
        supabase.from('pillar_covers').select('*'),
      ]);

      const tasks = tasksR.data || [];
      const entTasks = entTasksR.data || [];
      const habits = habitsR.data || [];
      const langSessions = langR.data || [];
      const exercises = exerciseR.data || [];
      const goals = goalsR.data || [];
      const exams = examsR.data || [];
      const projects = projectsR.data || [];
      const systems: any = systemsR.data || null;
      const areaStreaks = streaksR.data || [];
      const covers = coversR.data || [];

      const completions: Record<string, any> = systems?.completions || {};
      const timeData: Record<string, number> = systems?.time_data || {};

      const pillarProgress: PillarProgress[] = PILLAR_CONFIG.map(cfg => {
        let tasksTotal = 0, tasksCompleted = 0, hoursToday = 0, effort = 0, streak = 0;
        const goal = goals.find(g => g.category?.toLowerCase() === cfg.id);
        const goalProgress = goal?.progress_percentage || 0;
        const cover = covers.find((c: any) => c.pillar_id === cfg.id)?.cover_url || null;

        // Results = task completion in this area
        if (cfg.id === 'emprendimiento') {
          const today = entTasks.filter(t => t.due_date === dateStr || (t.created_at && t.created_at.startsWith(dateStr)));
          tasksTotal = today.length;
          tasksCompleted = today.filter(t => t.completed).length;
        } else {
          const areaId = cfg.id === 'proyectos' ? 'proyectos' : cfg.id;
          const areaTasks = tasks.filter(t => t.area_id === areaId || (cfg.id === 'proyectos' && t.area_id === 'proyectos-personales'));
          tasksTotal = areaTasks.length;
          tasksCompleted = areaTasks.filter(t => t.completed).length;
        }
        const results = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

        // Effort = systems / hours / habits
        switch (cfg.id) {
          case 'universidad': {
            const studyMin = (timeData['study'] || 0) + (timeData['universidad'] || 0);
            hoursToday = studyMin / 60;
            effort = Math.min(100, Math.round((studyMin / 120) * 100));
            const upcomingExams = exams.filter(e => !e.completed).length;
            if (upcomingExams === 0 && effort === 0) effort = 0;
            break;
          }
          case 'emprendimiento': {
            const entMin = timeData['emprendimiento'] || 0;
            hoursToday = entMin / 60;
            effort = Math.min(100, Math.round((entMin / 90) * 100));
            break;
          }
          case 'proyectos': {
            const projMin = timeData['proyectos'] || 0;
            hoursToday = projMin / 60;
            effort = Math.min(100, Math.round((projMin / 60) * 100));
            break;
          }
          case 'gym': {
            const gymStreak = areaStreaks.find(s => s.area_id === 'gym');
            streak = gymStreak?.current_streak || 0;
            const didGym = exercises.length > 0 || completions['streak:entrenamiento'];
            hoursToday = exercises.length > 0 ? 1 : 0;
            effort = didGym ? 100 : 0;
            if (tasksTotal === 0) { tasksTotal = 1; tasksCompleted = didGym ? 1 : 0; }
            break;
          }
          case 'idiomas': {
            const session = langSessions[0];
            if (session) {
              const subs = [
                session.vocabulary_completed, session.grammar_completed,
                session.speaking_completed, session.reading_completed, session.listening_completed
              ];
              const done = subs.filter(Boolean).length;
              effort = Math.round((done / 5) * 100);
              hoursToday = (session.total_duration || 0) / 60;
            }
            break;
          }
        }

        const percentage = Math.round((effort + results) / 2);
        const status: PillarProgress['status'] =
          percentage >= 100 ? 'completed' : percentage > 0 ? 'in-progress' : 'pending';

        return {
          ...cfg,
          percentage, effort, results,
          tasksCompleted, tasksTotal, hoursToday, streak, status, goalProgress,
          coverUrl: cover,
        };
      });

      // Secondary goals: Música (piano+guitarra), Lectura, Ajedrez, Gaming
      const pianoHabit = habits.find(h => h.habit_id === 'habit-piano');
      const guitarHabit = habits.find(h => h.habit_id === 'habit-guitarra');
      const pianoEntry = ((pianoHabit?.completed_dates as any[]) || []).find((e: any) => e.date === dateStr);
      const guitarEntry = ((guitarHabit?.completed_dates as any[]) || []).find((e: any) => e.date === dateStr);
      const musicMin = (timeData['piano'] || 0) + (timeData['guitarra'] || 0) + (timeData['musica'] || 0);
      const musicDone =
        pianoEntry?.status === 'completed' || guitarEntry?.status === 'completed' ||
        !!completions['streak:musica'] || !!completions['streak:piano'] || !!completions['streak:guitarra'] ||
        musicMin > 0;

      const langSession = langSessions[0];
      const readingMin = (langSession?.reading_duration || 0) + (timeData['lectura'] || 0);
      const readingDone = !!langSession?.reading_completed || !!completions['streak:lectura'] || readingMin > 0;

      const chessHabit = habits.find(h => h.habit_id === 'habit-ajedrez');
      const chessEntry = ((chessHabit?.completed_dates as any[]) || []).find((e: any) => e.date === dateStr);
      const chessDone = chessEntry?.status === 'completed' || !!completions['streak:ajedrez'];

      const gamingDone = !!completions['streak:gaming'] || (timeData['gaming'] || 0) > 0;
      const gamingMin = timeData['gaming'] || 0;

      const secondary: SecondaryGoalProgress[] = [
        { id: 'musica', name: 'Música', icon: '🎵', completed: musicDone, duration: musicMin },
        { id: 'lectura', name: 'Lectura', icon: '📖', completed: readingDone, duration: readingMin },
        { id: 'ajedrez', name: 'Ajedrez', icon: '♟️', completed: chessDone, duration: 0 },
        { id: 'gaming', name: 'Gaming', icon: '❤️', iconKey: 'heart', completed: gamingDone, duration: gamingMin },
      ];

      setPillars(pillarProgress);
      setSecondaryGoals(secondary);

      const avg = pillarProgress.reduce((a, p) => a + p.percentage, 0) / pillarProgress.length;
      const bonus = (secondary.filter(g => g.completed).length / secondary.length) * 10;
      setOverallScore(Math.round(avg + bonus));
    } catch (e) {
      console.error('Error calculating pillar progress:', e);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => { calculate(); }, [calculate]);

  return { pillars, secondaryGoals, overallScore, loading, refreshProgress: calculate };
}
