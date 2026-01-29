import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { startOfWeek, format } from 'date-fns';

export interface WeeklyObjective {
  id: string;
  user_id: string | null;
  week_start_date: string;
  area: string;
  title: string;
  description: string | null;
  target_value: number | null;
  current_value: number;
  unit: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export const useWeeklyObjectives = () => {
  const [objectives, setObjectives] = useState<WeeklyObjective[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_objectives')
        .select('*')
        .eq('week_start_date', currentWeekStart)
        .order('area', { ascending: true });

      if (error) throw error;
      setObjectives((data as WeeklyObjective[]) || []);
    } catch (error) {
      console.error('Error fetching weekly objectives:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjectives();
  }, []);

  const addObjective = async (objective: Omit<WeeklyObjective, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    try {
      const { data, error } = await supabase
        .from('weekly_objectives')
        .insert({
          ...objective,
          week_start_date: currentWeekStart,
        })
        .select()
        .single();

      if (error) throw error;
      
      setObjectives(prev => [...prev, data as WeeklyObjective]);
      toast({
        title: "Objetivo agregado",
        description: objective.title,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding objective:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el objetivo",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateObjective = async (id: string, updates: Partial<WeeklyObjective>) => {
    try {
      const { error } = await supabase
        .from('weekly_objectives')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setObjectives(prev => prev.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      ));
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el objetivo",
        variant: "destructive",
      });
    }
  };

  const incrementProgress = async (id: string, amount: number = 1) => {
    const objective = objectives.find(o => o.id === id);
    if (!objective) return;

    const newValue = (objective.current_value || 0) + amount;
    const completed = objective.target_value ? newValue >= objective.target_value : false;

    await updateObjective(id, { current_value: newValue, completed });
  };

  const deleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from('weekly_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setObjectives(prev => prev.filter(obj => obj.id !== id));
      toast({
        title: "Objetivo eliminado",
      });
    } catch (error) {
      console.error('Error deleting objective:', error);
    }
  };

  const getObjectivesByArea = (area: string) => {
    return objectives.filter(obj => obj.area === area);
  };

  const getOverallProgress = () => {
    if (objectives.length === 0) return 0;
    
    const totalProgress = objectives.reduce((acc, obj) => {
      if (obj.target_value && obj.target_value > 0) {
        return acc + Math.min((obj.current_value / obj.target_value) * 100, 100);
      }
      return acc + (obj.completed ? 100 : 0);
    }, 0);
    
    return Math.round(totalProgress / objectives.length);
  };

  return {
    objectives,
    loading,
    addObjective,
    updateObjective,
    incrementProgress,
    deleteObjective,
    getObjectivesByArea,
    getOverallProgress,
    refetch: fetchObjectives,
    currentWeekStart,
  };
};
