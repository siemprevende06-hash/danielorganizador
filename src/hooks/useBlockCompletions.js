import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
export const useBlockCompletions = () => {
    const [completions, setCompletions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const today = format(new Date(), 'yyyy-MM-dd');
    const loadCompletions = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('block_completions')
                .select('*')
                .eq('completion_date', today);
            if (error)
                throw error;
            setCompletions(data || []);
        }
        catch (error) {
            console.error('Error loading block completions:', error);
        }
        finally {
            setIsLoading(false);
        }
    }, [today]);
    useEffect(() => {
        loadCompletions();
    }, [loadCompletions]);
    const getBlockCompletion = useCallback((blockId) => {
        return completions.find(c => c.block_id === blockId);
    }, [completions]);
    const isBlockCompleted = useCallback((blockId) => {
        const completion = getBlockCompletion(blockId);
        return completion?.completed || false;
    }, [getBlockCompletion]);
    const toggleBlockComplete = useCallback(async (blockId, tasksTotal = 0) => {
        const existing = getBlockCompletion(blockId);
        const newCompleted = !existing?.completed;
        try {
            if (existing) {
                const { error } = await supabase
                    .from('block_completions')
                    .update({
                    completed: newCompleted,
                    completed_at: newCompleted ? new Date().toISOString() : null,
                    tasks_total: tasksTotal,
                })
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('block_completions')
                    .insert({
                    block_id: blockId,
                    completion_date: today,
                    completed: true,
                    completed_at: new Date().toISOString(),
                    tasks_total: tasksTotal,
                });
                if (error)
                    throw error;
            }
            await loadCompletions();
            toast.success(newCompleted ? 'Bloque completado' : 'Bloque desmarcado');
        }
        catch (error) {
            console.error('Error toggling block:', error);
            toast.error('Error al actualizar bloque');
        }
    }, [getBlockCompletion, today, loadCompletions]);
    const updateTasksCount = useCallback(async (blockId, tasksCompleted, tasksTotal) => {
        const existing = getBlockCompletion(blockId);
        try {
            if (existing) {
                const { error } = await supabase
                    .from('block_completions')
                    .update({
                    tasks_completed: tasksCompleted,
                    tasks_total: tasksTotal,
                })
                    .eq('id', existing.id);
                if (error)
                    throw error;
            }
            else {
                const { error } = await supabase
                    .from('block_completions')
                    .insert({
                    block_id: blockId,
                    completion_date: today,
                    tasks_completed: tasksCompleted,
                    tasks_total: tasksTotal,
                });
                if (error)
                    throw error;
            }
            await loadCompletions();
        }
        catch (error) {
            console.error('Error updating tasks count:', error);
        }
    }, [getBlockCompletion, today, loadCompletions]);
    const getCompletedBlocksCount = useCallback(() => {
        return completions.filter(c => c.completed).length;
    }, [completions]);
    return {
        completions,
        isLoading,
        getBlockCompletion,
        isBlockCompleted,
        toggleBlockComplete,
        updateTasksCount,
        getCompletedBlocksCount,
        refreshCompletions: loadCompletions,
    };
};
