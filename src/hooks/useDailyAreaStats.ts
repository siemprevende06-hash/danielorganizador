import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import { cachedQuery, cachedMutation } from '@/lib/supabaseCache';

export interface DailyAreaStat {
  id: string;
  area_id: string;
  stat_date: string;
  time_goal_minutes: number;
  time_spent_minutes: number;
  completed: boolean;
  completed_at: string | null;
  pages_goal: number;
  pages_done: number;
  exercises_goal: number;
  exercises_done: number;
  notes: string | null;
}

export interface AreaGoalsConfig {
  id: string;
  area_id: string;
  default_time_goal_minutes: number;
  default_pages_goal: number;
  default_exercises_goal: number;
  show_time_tracking: boolean;
  show_pages_tracking: boolean;
  show_exercises_tracking: boolean;
}

export interface AreaStreak {
  id: string;
  area_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
}

export const AREA_IDS = {
  // Professional/Academic
  universidad: 'universidad',
  emprendimiento: 'emprendimiento',
  proyectos: 'proyectos',
  // Intellectual Hobbies
  lectura: 'lectura',
  ajedrez: 'ajedrez',
  idiomas: 'idiomas',
  // Artistic Hobbies
  piano: 'piano',
  guitarra: 'guitarra',
  dibujo: 'dibujo',
  // Physical Hobbies
  gym: 'gym',
  calistenia: 'calistenia',
  boxeo: 'boxeo',
  // Appearance
  skincare_am: 'skincare_am',
  skincare_pm: 'skincare_pm',
  // Finances (special - tracked via transactions)
  finanzas: 'finanzas',
} as const;

export type AreaId = typeof AREA_IDS[keyof typeof AREA_IDS];

const DEFAULT_GOALS: Partial<Record<AreaId, { time: number; pages?: number; exercises?: number }>> = {
  universidad: { time: 120 },
  emprendimiento: { time: 60 },
  proyectos: { time: 60 },
  lectura: { time: 30, pages: 20 },
  ajedrez: { time: 15 },
  idiomas: { time: 60 },
  piano: { time: 30 },
  guitarra: { time: 30 },
  dibujo: { time: 60 },
  gym: { time: 60 },
  calistenia: { time: 30 },
  boxeo: { time: 60 },
  skincare_am: { time: 10 },
  skincare_pm: { time: 10 },
};

export const useDailyAreaStats = () => {
  const [stats, setStats] = useState<Record<AreaId, DailyAreaStat | null>>({} as any);
  const [configs, setConfigs] = useState<Record<AreaId, AreaGoalsConfig | null>>({} as any);
  const [streaks, setStreaks] = useState<Record<AreaId, AreaStreak | null>>({} as any);
  const [isLoading, setIsLoading] = useState(true);
  
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [statsRes, configsRes, streaksRes] = await Promise.all([
        cachedQuery<DailyAreaStat[]>(
          'daily_area_stats',
          `today_${today}`,
          () => supabase.from('daily_area_stats').select('*').eq('stat_date', today).then(r => r.data as DailyAreaStat[] || []),
          7 * 24 * 60 * 60 * 1000
        ),
        cachedQuery<AreaGoalsConfig[]>(
          'area_goals_config',
          'all',
          () => supabase.from('area_goals_config').select('*').then(r => r.data as AreaGoalsConfig[] || []),
          7 * 24 * 60 * 60 * 1000
        ),
        cachedQuery<AreaStreak[]>(
          'area_streaks',
          'all',
          () => supabase.from('area_streaks').select('*').then(r => r.data as AreaStreak[] || []),
          7 * 24 * 60 * 60 * 1000
        ),
      ]);

      // Map stats by area_id
      const statsMap: Record<string, DailyAreaStat> = {};
      (statsRes.data || []).forEach((s: any) => {
        statsMap[s.area_id] = s;
      });
      setStats(statsMap as any);

      // Map configs by area_id
      const configsMap: Record<string, AreaGoalsConfig> = {};
      (configsRes.data || []).forEach((c: any) => {
        configsMap[c.area_id] = c;
      });
      setConfigs(configsMap as any);

      // Map streaks by area_id
      const streaksMap: Record<string, AreaStreak> = {};
      (streaksRes.data || []).forEach((s: any) => {
        streaksMap[s.area_id] = s;
      });
      setStreaks(streaksMap as any);

    } catch (error) {
      console.error('Error loading daily area stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Get or create today's stat for an area
  const getOrCreateStat = useCallback(async (areaId: AreaId): Promise<DailyAreaStat | null> => {
    const existing = stats[areaId];
    if (existing) return existing;

    // Get config for default goals
    const config = configs[areaId];
    const defaults = DEFAULT_GOALS[areaId] || { time: 30 };

    try {
      const { data, error } = await supabase
        .from('daily_area_stats')
        .insert({
          area_id: areaId,
          stat_date: today,
          time_goal_minutes: config?.default_time_goal_minutes || defaults.time,
          pages_goal: config?.default_pages_goal || defaults.pages || 0,
          exercises_goal: config?.default_exercises_goal || defaults.exercises || 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      setStats(prev => ({ ...prev, [areaId]: data }));
      return data;
    } catch (error) {
      // If offline, return a local placeholder so mutations queue
      const placeholder: DailyAreaStat = {
        id: `offline_${areaId}`,
        area_id: areaId,
        stat_date: today,
        time_goal_minutes: config?.default_time_goal_minutes || defaults.time,
        time_spent_minutes: 0,
        completed: false,
        completed_at: null,
        pages_goal: config?.default_pages_goal || defaults.pages || 0,
        pages_done: 0,
        exercises_goal: config?.default_exercises_goal || defaults.exercises || 0,
        exercises_done: 0,
        notes: null,
      };
      setStats(prev => ({ ...prev, [areaId]: placeholder }));
      return placeholder;
    }
  }, [stats, configs, today]);

  // Toggle completion status
  const toggleCompletion = useCallback(async (areaId: AreaId) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const newCompleted = !stat.completed;

    const { error } = await cachedMutation('daily_area_stats', 'update', {
      completed: newCompleted,
      completed_at: newCompleted ? new Date().toISOString() : null,
    }, { id: stat.id });

    if (error) {
      console.error('Error toggling completion:', error);
      toast.error('Error al actualizar');
      return;
    }

    setStats(prev => ({
      ...prev,
      [areaId]: { ...prev[areaId]!, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
    }));

    // Refresh to get updated streak
    await loadAllData();

    toast.success(newCompleted ? `${areaId} completado ✓` : `${areaId} desmarcado`);
  }, [stats, getOrCreateStat, loadAllData]);

  // Update time spent
  const updateTimeSpent = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const { error } = await cachedMutation('daily_area_stats', 'update', {
      time_spent_minutes: minutes,
    }, { id: stat.id });

    if (!error) {
      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, time_spent_minutes: minutes }
      }));
    }
  }, [stats, getOrCreateStat]);

  // Update time goal
  const updateTimeGoal = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const [r1, r2] = await Promise.all([
      cachedMutation('daily_area_stats', 'update', { time_goal_minutes: minutes }, { id: stat.id }),
      cachedMutation('area_goals_config', 'upsert', {
        area_id: areaId,
        default_time_goal_minutes: minutes,
      }, undefined, 'area_id'),
    ]);

    if (r1.error || r2.error) {
      console.error('Error updating goal:', r1.error || r2.error);
      toast.error('Error al actualizar objetivo');
      return;
    }

    setStats(prev => ({
      ...prev,
      [areaId]: { ...prev[areaId]!, time_goal_minutes: minutes }
    }));

    toast.success(`Objetivo de ${areaId} actualizado a ${minutes} min`);
  }, [stats, getOrCreateStat]);

  // Update pages done
  const updatePagesDone = useCallback(async (areaId: AreaId, pages: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const { error } = await cachedMutation('daily_area_stats', 'update', { pages_done: pages }, { id: stat.id });

    if (!error) {
      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, pages_done: pages }
      }));
    }
  }, [stats, getOrCreateStat]);

  // Update pages goal
  const updatePagesGoal = useCallback(async (areaId: AreaId, pages: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const [r1, r2] = await Promise.all([
      cachedMutation('daily_area_stats', 'update', { pages_goal: pages }, { id: stat.id }),
      cachedMutation('area_goals_config', 'upsert', {
        area_id: areaId,
        default_pages_goal: pages,
      }, undefined, 'area_id'),
    ]);

    if (r1.error || r2.error) {
      console.error('Error updating pages goal:', r1.error || r2.error);
      return;
    }

    setStats(prev => ({
      ...prev,
      [areaId]: { ...prev[areaId]!, pages_goal: pages }
    }));

    toast.success(`Objetivo de páginas actualizado a ${pages}`);
  }, [stats, getOrCreateStat]);

  // Add time to an area (from focus sessions, etc.)
  const addTime = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const newTime = (stat.time_spent_minutes || 0) + minutes;

    const { error } = await cachedMutation('daily_area_stats', 'update', { time_spent_minutes: newTime }, { id: stat.id });

    if (!error) {
      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, time_spent_minutes: newTime }
      }));
    }
  }, [stats, getOrCreateStat]);

  // Get progress percentage for an area
  const getProgress = useCallback((areaId: AreaId): number => {
    const stat = stats[areaId];
    if (!stat || !stat.time_goal_minutes) return 0;
    return Math.min(100, Math.round((stat.time_spent_minutes / stat.time_goal_minutes) * 100));
  }, [stats]);

  // Get streak for an area
  const getStreak = useCallback((areaId: AreaId): number => {
    return streaks[areaId]?.current_streak || 0;
  }, [streaks]);

  // Check if area is completed today
  const isCompleted = useCallback((areaId: AreaId): boolean => {
    return stats[areaId]?.completed || false;
  }, [stats]);

  return {
    stats,
    configs,
    streaks,
    isLoading,
    // Actions
    toggleCompletion,
    updateTimeSpent,
    updateTimeGoal,
    updatePagesDone,
    updatePagesGoal,
    addTime,
    getOrCreateStat,
    // Helpers
    getProgress,
    getStreak,
    isCompleted,
    // Refresh
    refresh: loadAllData,
  };
};
