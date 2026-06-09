import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMidnightReset } from '@/hooks/useMidnightReset';
import type { IdentitySystem, IdentitySystemTask } from '@/lib/definitions';

export function useIdentitySystems() {
  const [systems, setSystems] = useState<IdentitySystem[]>([]);
  const [dailyStates, setDailyStates] = useState<Record<string, Record<string, boolean>>>({});
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  const loadData = useCallback(async () => {
    const [sysRes, dailyRes] = await Promise.all([
      supabase.from('identity_systems').select('*').order('sort_order'),
      supabase.from('identity_systems_daily').select('*').eq('tracking_date', today),
    ]);

    if (sysRes.data) {
      setSystems(sysRes.data as IdentitySystem[]);
    }

    if (dailyRes.data) {
      const mapped: Record<string, Record<string, boolean>> = {};
      for (const row of dailyRes.data) {
        mapped[row.system_id] = row.task_states as Record<string, boolean>;
      }
      setDailyStates(mapped);
    }

    setLoading(false);
  }, [today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useMidnightReset(() => {
    setDailyStates({});
    loadData();
  });

  const createSystem = async (area_id: string, name: string) => {
    const tasks: IdentitySystemTask[] = [];
    const maxSort = systems
      .filter(s => s.area_id === area_id)
      .reduce((max, s) => Math.max(max, s.sort_order), -1);

    const { data, error } = await supabase
      .from('identity_systems')
      .insert({
        area_id,
        name,
        tasks: JSON.stringify(tasks),
        sort_order: maxSort + 1,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating system:', error);
      return false;
    }

    setSystems(prev => [...prev, data as IdentitySystem]);
    return true;
  };

  const updateSystem = async (id: string, updates: Partial<IdentitySystem>) => {
    const dbUpdates: Record<string, any> = { ...updates };
    if (updates.tasks) {
      dbUpdates.tasks = JSON.stringify(updates.tasks);
    }

    const { error } = await supabase
      .from('identity_systems')
      .update(dbUpdates)
      .eq('id', id);

    if (error) {
      console.error('Error updating system:', error);
      return false;
    }

    setSystems(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    return true;
  };

  const deleteSystem = async (id: string) => {
    const { error } = await supabase
      .from('identity_systems')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting system:', error);
      return false;
    }

    setSystems(prev => prev.filter(s => s.id !== id));
    return true;
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await updateSystem(id, { is_active } as Partial<IdentitySystem>);
  };

  const toggleTaskState = async (systemId: string, taskId: string) => {
    const current = dailyStates[systemId]?.[taskId] ?? false;
    const newStates = {
      ...dailyStates[systemId],
      [taskId]: !current,
    };

    setDailyStates(prev => ({
      ...prev,
      [systemId]: newStates,
    }));

    await supabase
      .from('identity_systems_daily')
      .upsert({
        system_id: systemId,
        tracking_date: today,
        task_states: JSON.stringify(newStates),
      }, { onConflict: 'system_id,tracking_date' });
  };

  const getSystemsByArea = (areaId: string) =>
    systems.filter(s => s.area_id === areaId).sort((a, b) => a.sort_order - b.sort_order);

  return {
    systems,
    dailyStates,
    loading,
    createSystem,
    updateSystem,
    deleteSystem,
    toggleActive,
    toggleTaskState,
    getSystemsByArea,
    refetch: loadData,
  };
}
