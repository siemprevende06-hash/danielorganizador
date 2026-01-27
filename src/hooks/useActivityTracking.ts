import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

export interface Activity {
  id: string;
  activity_type: string;
  duration_minutes: number;
  completed: boolean;
  bonus_minutes: number;
  activity_date: string;
}

const DEFAULT_DURATIONS: Record<string, number> = {
  gym: 60,
  idiomas: 30,
  piano: 30,
  guitarra: 30,
  ajedrez: 15,
  lectura: 30,
  got: 45,
};

export const useActivityTracking = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('activity_tracking')
        .select('*')
        .eq('activity_date', today);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [today]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const getActivity = useCallback((activityType: string): Activity | undefined => {
    return activities.find(a => a.activity_type === activityType);
  }, [activities]);

  const markComplete = useCallback(async (activityType: string, customDuration?: number) => {
    const existingActivity = getActivity(activityType);
    const duration = customDuration || DEFAULT_DURATIONS[activityType] || 30;

    try {
      if (existingActivity) {
        const { error } = await supabase
          .from('activity_tracking')
          .update({
            completed: true,
            duration_minutes: duration,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingActivity.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('activity_tracking')
          .insert({
            activity_type: activityType,
            activity_date: today,
            duration_minutes: duration,
            completed: true,
          });

        if (error) throw error;
      }

      await loadActivities();
      toast.success(`${activityType} completado`);
    } catch (error) {
      console.error('Error marking activity complete:', error);
      toast.error('Error al marcar actividad');
    }
  }, [getActivity, today, loadActivities]);

  const addBonusTime = useCallback(async (activityType: string, bonusMinutes: number) => {
    const existingActivity = getActivity(activityType);
    if (!existingActivity) {
      toast.error('Primero completa la actividad');
      return;
    }

    try {
      const { error } = await supabase
        .from('activity_tracking')
        .update({
          bonus_minutes: (existingActivity.bonus_minutes || 0) + bonusMinutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingActivity.id);

      if (error) throw error;

      await loadActivities();
      toast.success(`+${bonusMinutes} min bonus añadido`);
    } catch (error) {
      console.error('Error adding bonus time:', error);
      toast.error('Error al añadir tiempo');
    }
  }, [getActivity, loadActivities]);

  const unmarkActivity = useCallback(async (activityType: string) => {
    const existingActivity = getActivity(activityType);
    if (!existingActivity) return;

    try {
      const { error } = await supabase
        .from('activity_tracking')
        .update({
          completed: false,
          duration_minutes: 0,
          bonus_minutes: 0,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingActivity.id);

      if (error) throw error;

      await loadActivities();
      toast.success('Actividad desmarcada');
    } catch (error) {
      console.error('Error unmarking activity:', error);
      toast.error('Error al desmarcar');
    }
  }, [getActivity, loadActivities]);

  const getActivityStatus = useCallback((activityType: string): 'incomplete' | 'partial' | 'complete' | 'bonus' => {
    const activity = getActivity(activityType);
    if (!activity || !activity.completed) return 'incomplete';
    
    const target = DEFAULT_DURATIONS[activityType] || 30;
    const total = activity.duration_minutes + (activity.bonus_minutes || 0);

    if (activity.bonus_minutes > 0) return 'bonus';
    if (total >= target) return 'complete';
    if (total >= target * 0.5) return 'partial';
    return 'incomplete';
  }, [getActivity]);

  const getTotalMinutes = useCallback((activityType: string): number => {
    const activity = getActivity(activityType);
    if (!activity) return 0;
    return activity.duration_minutes + (activity.bonus_minutes || 0);
  }, [getActivity]);

  return {
    activities,
    isLoading,
    getActivity,
    markComplete,
    addBonusTime,
    unmarkActivity,
    getActivityStatus,
    getTotalMinutes,
    refreshActivities: loadActivities,
  };
};
