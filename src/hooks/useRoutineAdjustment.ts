import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RoutineBlock } from '@/components/RoutineBlockCard';
import { calculateMorningSchedule, applyMorningAdjustment, MorningScheduleConfig } from '@/lib/routineScheduler';

export interface UserSettings {
  id: string;
  user_id: string;
  wake_time: string;
  morning_end_time: string;
  auto_adjust_enabled: boolean;
}

export function useRoutineAdjustment(blocks: RoutineBlock[]) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [adjustedBlocks, setAdjustedBlocks] = useState<RoutineBlock[]>(blocks);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      
      setSettings(data);
      
      if (data && data.auto_adjust_enabled) {
        const config = calculateMorningSchedule(
          data.wake_time,
          data.morning_end_time,
          blocks
        );
        setAdjustedBlocks(applyMorningAdjustment(blocks, config));
      } else {
        setAdjustedBlocks(blocks);
      }
    } catch (error) {
      console.error('Error fetching user settings:', error);
      setAdjustedBlocks(blocks);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (settings) {
        const { error } = await supabase
          .from('user_settings')
          .update(newSettings)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            ...newSettings,
          });

        if (error) throw error;
      }

      await fetchSettings();
    } catch (error) {
      console.error('Error updating user settings:', error);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (settings && settings.auto_adjust_enabled) {
      const config = calculateMorningSchedule(
        settings.wake_time,
        settings.morning_end_time,
        blocks
      );
      setAdjustedBlocks(applyMorningAdjustment(blocks, config));
    } else {
      setAdjustedBlocks(blocks);
    }
  }, [blocks, settings]);

  return {
    settings,
    adjustedBlocks,
    loading,
    updateSettings,
    fetchSettings,
  };
}
