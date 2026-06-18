import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, type RoutineBlock } from '@/hooks/useRoutineBlocksDB';
import { useBlockCompletions } from '@/hooks/useBlockCompletions';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  source: string;
  sourceName?: string;
  completed: boolean;
  due_date?: string;
  priority?: string;
  area_id?: string;
  routine_block_id?: string;
}

export function useDailyPlanData() {
  const { blocks, isLoaded: blocksLoaded } = useRoutineBlocksDB();
  const { completions: blockCompletions, isLoading: completionsLoading, toggleBlockComplete, isBlockCompleted } = useBlockCompletions();
  
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const [{ data: regularTasks }, { data: entrepreneurshipTasks }, { data: entrepreneurships }] = await Promise.all([
        supabase.from('tasks').select('id, title, description, source, completed, due_date, priority, area_id, routine_block_id'),
        supabase.from('entrepreneurship_tasks').select('id, title, completed, due_date, entrepreneurship_id, routine_block_id'),
        supabase.from('entrepreneurships').select('id, name'),
      ]);

      const entMap = new Map(entrepreneurships?.map(e => [e.id, e.name]) || []);
      const mapped: TaskItem[] = [
        ...(regularTasks || []).map(t => ({ ...t, completed: t.completed || false, source: t.source || 'general' })),
        ...(entrepreneurshipTasks || []).map(t => ({
          id: t.id, title: t.title, source: 'entrepreneurship', sourceName: entMap.get(t.entrepreneurship_id),
          completed: t.completed, due_date: t.due_date, routine_block_id: t.routine_block_id,
        })),
      ];
      setTasks(mapped);
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  const tasksByBlock = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {};
    tasks.forEach(task => {
      if (task.routine_block_id) {
        if (!grouped[task.routine_block_id]) grouped[task.routine_block_id] = [];
        grouped[task.routine_block_id].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  const unassignedTasks = useMemo(() => {
    return tasks.filter(t => !t.routine_block_id);
  }, [tasks]);

  const allAssignedIds = useMemo(() => new Set(tasks.filter(t => t.routine_block_id).map(t => t.id)), [tasks]);

  const assignTaskToBlock = useCallback(async (taskId: string, blockId: string) => {
    const currentTasks = tasks;
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;

    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    try {
      await supabase.from(table as any).update({ routine_block_id: blockId }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routine_block_id: blockId } : t));
    } catch (error) {
      console.error('Error assigning task:', error);
    }
  }, [tasks]);

  const removeTaskFromBlock = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    try {
      await supabase.from(table as any).update({ routine_block_id: null }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routine_block_id: undefined } : t));
    } catch (error) {
      console.error('Error removing task:', error);
    }
  }, [tasks]);

  const completedBlocks = useMemo(() => {
    return blocks.filter(b => isBlockCompleted(b.id));
  }, [blocks, isBlockCompleted]);

  const completedTasks = useMemo(() => {
    return tasks.filter(t => t.completed);
  }, [tasks]);

  const dayScore = useMemo(() => {
    const blockScore = blocks.length > 0 ? (completedBlocks.length / blocks.length) * 50 : 0;
    const taskScore = tasks.length > 0 ? (completedTasks.length / tasks.length) * 50 : 0;
    return Math.round(blockScore + taskScore);
  }, [blocks, completedBlocks, tasks, completedTasks]);

  return {
    blocks,
    blocksLoaded,
    tasks,
    tasksLoading,
    tasksByBlock,
    unassignedTasks,
    allAssignedIds,
    assignTaskToBlock,
    removeTaskFromBlock,
    refreshTasks: loadTasks,
    blockCompletions,
    completionsLoading,
    toggleBlockComplete,
    isBlockCompleted,
    completedBlocks,
    completedTasks,
    dayScore,
  };
}
