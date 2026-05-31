import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';

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
        supabase
          .from('daily_area_stats')
          .select('*')
          .eq('stat_date', today),
        supabase
          .from('area_goals_config')
          .select('*'),
        supabase
          .from('area_streaks')
          .select('*'),
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
      console.error('Error creating stat:', error);
      return null;
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

    try {
      const { error } = await supabase
        .from('daily_area_stats')
        .update({
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        })
        .eq('id', stat.id);

      if (error) throw error;

      // Refresh to get updated streak
      await loadAllData();
      
      toast.success(newCompleted ? `${areaId} completado ✓` : `${areaId} desmarcado`);
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast.error('Error al actualizar');
    }
  }, [stats, getOrCreateStat, loadAllData]);

  // Update time spent
  const updateTimeSpent = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    try {
      const { error } = await supabase
        .from('daily_area_stats')
        .update({
          time_spent_minutes: minutes,
        })
        .eq('id', stat.id);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, time_spent_minutes: minutes }
      }));
    } catch (error) {
      console.error('Error updating time:', error);
    }
  }, [stats, getOrCreateStat]);

  // Update time goal
  const updateTimeGoal = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    try {
      // Update today's stat
      await supabase
        .from('daily_area_stats')
        .update({ time_goal_minutes: minutes })
        .eq('id', stat.id);

      // Also update config for future days
      await supabase
        .from('area_goals_config')
        .upsert({
          area_id: areaId,
          default_time_goal_minutes: minutes,
        }, { onConflict: 'area_id' });

      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, time_goal_minutes: minutes }
      }));

      toast.success(`Objetivo de ${areaId} actualizado a ${minutes} min`);
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error('Error al actualizar objetivo');
    }
  }, [stats, getOrCreateStat]);

  // Update pages done
  const updatePagesDone = useCallback(async (areaId: AreaId, pages: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    try {
      const { error } = await supabase
        .from('daily_area_stats')
        .update({ pages_done: pages })
        .eq('id', stat.id);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, pages_done: pages }
      }));
    } catch (error) {
      console.error('Error updating pages:', error);
    }
  }, [stats, getOrCreateStat]);

  // Update pages goal
  const updatePagesGoal = useCallback(async (areaId: AreaId, pages: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    try {
      await supabase
        .from('daily_area_stats')
        .update({ pages_goal: pages })
        .eq('id', stat.id);

      await supabase
        .from('area_goals_config')
        .upsert({
          area_id: areaId,
          default_pages_goal: pages,
        }, { onConflict: 'area_id' });

      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, pages_goal: pages }
      }));

      toast.success(`Objetivo de páginas actualizado a ${pages}`);
    } catch (error) {
      console.error('Error updating pages goal:', error);
    }
  }, [stats, getOrCreateStat]);

  // Add time to an area (from focus sessions, etc.)
  const addTime = useCallback(async (areaId: AreaId, minutes: number) => {
    let stat = stats[areaId];
    
    if (!stat) {
      stat = await getOrCreateStat(areaId);
      if (!stat) return;
    }

    const newTime = (stat.time_spent_minutes || 0) + minutes;

    try {
      const { error } = await supabase
        .from('daily_area_stats')
        .update({ time_spent_minutes: newTime })
        .eq('id', stat.id);

      if (error) throw error;

      setStats(prev => ({
        ...prev,
        [areaId]: { ...prev[areaId]!, time_spent_minutes: newTime }
      }));
    } catch (error) {
      console.error('Error adding time:', error);
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
