import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
export function useGoalProgress() {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const fetchGoals = async () => {
        try {
            const { data, error } = await supabase
                .from('goals')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setGoals((data || []));
        }
        catch (error) {
            console.error('Error fetching goals:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const fetchGoalTasks = async (goalId) => {
        try {
            const { data, error } = await supabase
                .from('goal_tasks')
                .select('*')
                .eq('goal_id', goalId)
                .order('created_at', { ascending: true });
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching goal tasks:', error);
            return [];
        }
    };
    const fetchGoalBlocks = async (goalId) => {
        try {
            const { data, error } = await supabase
                .from('goal_block_connections')
                .select('*')
                .eq('goal_id', goalId);
            if (error)
                throw error;
            return data || [];
        }
        catch (error) {
            console.error('Error fetching goal blocks:', error);
            return [];
        }
    };
    const updateGoalProgress = async (goalId) => {
        try {
            const tasks = await fetchGoalTasks(goalId);
            const completedTasks = tasks.filter(t => t.completed).length;
            const totalTasks = tasks.length;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
            const { error } = await supabase
                .from('goals')
                .update({ progress_percentage: progress })
                .eq('id', goalId);
            if (error)
                throw error;
            await fetchGoals();
        }
        catch (error) {
            console.error('Error updating goal progress:', error);
        }
    };
    const createGoal = async (data) => {
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
        if (error)
            throw error;
        await fetchGoals();
        return created.id;
    };
    const updateDailySystem = async (goalId, dailySystem) => {
        const { error } = await supabase
            .from('goals')
            .update({ daily_system: dailySystem || null })
            .eq('id', goalId);
        if (error)
            throw error;
        await fetchGoals();
    };
    const addGoalTask = async (goalId, title, dueDate) => {
        const { error } = await supabase.from('goal_tasks').insert({
            goal_id: goalId,
            title,
            completed: false,
            due_date: dueDate || null,
        });
        if (error)
            throw error;
        await updateGoalProgress(goalId);
    };
    const toggleGoalTask = async (task) => {
        const { error } = await supabase
            .from('goal_tasks')
            .update({ completed: !task.completed })
            .eq('id', task.id);
        if (error)
            throw error;
        await updateGoalProgress(task.goal_id);
    };
    const deleteGoal = async (goalId) => {
        const { error } = await supabase.from('goals').delete().eq('id', goalId);
        if (error)
            throw error;
        await fetchGoals();
    };
    const deleteGoalTask = async (task) => {
        const { error } = await supabase.from('goal_tasks').delete().eq('id', task.id);
        if (error)
            throw error;
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
