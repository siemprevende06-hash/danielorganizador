import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Goal {
  id: string;
  title: string;
  description: string | null;
  daily_system: string | null;
  area_id: string | null;
  target_date: string | null;
  progress_percentage: number;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoalTask {
  id: string;
  goal_id: string;
  title: string;
  completed: boolean;
  linked_to_block_id: string | null;
  due_date: string | null;
  created_at: string;
}

export interface GoalBlockConnection {
  id: string;
  goal_id: string;
  block_id: string;
  block_name: string;
  contribution_percentage: number;
  created_at: string;
}

export function useGoalProgress() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoalTasks = async (goalId: string): Promise<GoalTask[]> => {
    try {
      const { data, error } = await supabase
        .from('goal_tasks')
        .select('*')
        .eq('goal_id', goalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching goal tasks:', error);
      return [];
    }
  };

  const fetchGoalBlocks = async (goalId: string): Promise<GoalBlockConnection[]> => {
    try {
      const { data, error } = await supabase
        .from('goal_block_connections')
        .select('*')
        .eq('goal_id', goalId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching goal blocks:', error);
      return [];
    }
  };

  const updateGoalProgress = async (goalId: string) => {
    try {
      const tasks = await fetchGoalTasks(goalId);
      const completedTasks = tasks.filter(t => t.completed).length;
      const totalTasks = tasks.length;
      
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      const { error } = await supabase
        .from('goals')
        .update({ progress_percentage: progress })
        .eq('id', goalId);

      if (error) throw error;
      await fetchGoals();
    } catch (error) {
      console.error('Error updating goal progress:', error);
    }
  };

  const createGoal = async (data: {
    title: string;
    description?: string;
    daily_system?: string;
    area_id?: string | null;
    target_date?: string | null;
  }): Promise<string> => {
    const { data: created, error } = await supabase
      .from('goals')
      .insert({
        title: data.title,
        description: data.description || null,
        daily_system: data.daily_system || null,
        area_id: data.area_id || null,
        target_date: data.target_date || null,
        status: 'active',
        progress_percentage: 0,
      })
      .select('id')
      .single();
    if (error) throw error;
    await fetchGoals();
    return created.id;
  };

  const updateDailySystem = async (goalId: string, dailySystem: string) => {
    const { error } = await supabase
      .from('goals')
      .update({ daily_system: dailySystem || null })
      .eq('id', goalId);
    if (error) throw error;
    await fetchGoals();
  };

  const addGoalTask = async (goalId: string, title: string, dueDate?: string | null) => {
    const { error } = await supabase.from('goal_tasks').insert({
      goal_id: goalId,
      title,
      completed: false,
      due_date: dueDate || null,
    });
    if (error) throw error;
    await updateGoalProgress(goalId);
  };

  const toggleGoalTask = async (task: GoalTask) => {
    const { error } = await supabase
      .from('goal_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);
    if (error) throw error;
    await updateGoalProgress(task.goal_id);
  };

  const deleteGoal = async (goalId: string) => {
    const { error } = await supabase.from('goals').delete().eq('id', goalId);
    if (error) throw error;
    await fetchGoals();
  };

  const deleteGoalTask = async (task: GoalTask) => {
    const { error } = await supabase.from('goal_tasks').delete().eq('id', task.id);
    if (error) throw error;
    await updateGoalProgress(task.goal_id);
  };

  const getActiveGoalsForToday = () => {
    return goals.filter(goal => goal.status === 'active');
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  return {
    goals,
    loading,
    fetchGoals,
    fetchGoalTasks,
    fetchGoalBlocks,
    updateGoalProgress,
    createGoal,
    updateDailySystem,
    addGoalTask,
    toggleGoalTask,
    deleteGoal,
    deleteGoalTask,
    getActiveGoalsForToday,
  };
}
