import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, type RoutineBlock } from '@/hooks/useRoutineBlocksDB';
import { useBlockCompletions } from '@/hooks/useBlockCompletions';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

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

export function useDailyPlanData(date?: Date) {
  const queryClient = useQueryClient();
  const { blocks, isLoaded: blocksLoaded } = useRoutineBlocksDB();
  const { completions: blockCompletions, isLoading: completionsLoading, toggleBlockComplete, isBlockCompleted } = useBlockCompletions();

  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [planAssignments, setPlanAssignments] = useState<Record<string, string[]> | null>(null);
  const [planRoutineType, setPlanRoutineType] = useState<string | null>(null);
  const [planLanguage, setPlanLanguage] = useState<'ingles' | 'italiano' | null>(null);
  const [planLoaded, setPlanLoaded] = useState(false);

  const targetDate = date || new Date();
  const dateStr = format(targetDate, 'yyyy-MM-dd');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    loadTasks();
    loadPlanForDate();
  }, [dateStr]);

  const loadPlanForDate = async () => {
    setPlanLoaded(false);
    try {
      const { data: plan } = await supabase.from('daily_plans').select('routine_type, block_assignments, notes').eq('plan_date', dateStr).maybeSingle();

      if (plan && plan.block_assignments) {
        setPlanAssignments(plan.block_assignments as Record<string, string[]>);
        setPlanRoutineType(plan.routine_type);
        if (plan.notes) {
          try {
            const parsed = JSON.parse(plan.notes as string);
            if (parsed.language === 'ingles' || parsed.language === 'italiano') {
              setPlanLanguage(parsed.language);
            }
          } catch {}
        }
      } else {
        setPlanAssignments(null);
        setPlanRoutineType(null);
        setPlanLanguage(null);
      }
    } catch (error) {
      console.error('Error loading plan for date:', error);
      setPlanAssignments(null);
      setPlanRoutineType(null);
    } finally {
      setPlanLoaded(true);
    }
  };

  const loadTasks = async () => {
    setTasksLoading(true);
    try {
      const dayStart = `${dateStr}T00:00:00`;
      const dayEnd = `${dateStr}T23:59:59`;
      const [{ data: regularTasks }, { data: entrepreneurshipTasks }, { data: entrepreneurships }] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, title, description, source, completed, due_date, priority, area_id, routine_block_id')
          .gte('due_date', dayStart)
          .lte('due_date', dayEnd),
        supabase
          .from('entrepreneurship_tasks')
          .select('id, title, completed, due_date, entrepreneurship_id, routine_block_id')
          .eq('due_date', dateStr),
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

  // Derive tasksByBlock: prefer plan assignments, fallback to routine_block_id
  const tasksByBlock = useMemo(() => {
    const grouped: Record<string, TaskItem[]> = {};

    if (planAssignments && dateStr === todayStr) {
      // Use plan assignments when viewing today's plan
      for (const [blockId, taskIds] of Object.entries(planAssignments)) {
        grouped[blockId] = taskIds
          .map(id => tasks.find(t => t.id === id))
          .filter(Boolean) as TaskItem[];
      }
    } else if (planAssignments) {
      // For non-today dates, also use plan assignments
      for (const [blockId, taskIds] of Object.entries(planAssignments)) {
        grouped[blockId] = taskIds
          .map(id => tasks.find(t => t.id === id))
          .filter(Boolean) as TaskItem[];
      }
    } else {
      // Fallback: group by routine_block_id
      tasks.forEach(task => {
        if (task.routine_block_id) {
          if (!grouped[task.routine_block_id]) grouped[task.routine_block_id] = [];
          grouped[task.routine_block_id].push(task);
        }
      });
    }
    return grouped;
  }, [tasks, planAssignments, dateStr, todayStr]);

  const unassignedTasks = useMemo(() => {
    if (planAssignments) {
      // For a planned day, unassigned = tasks not in any plan assignment
      const allPlannedIds = new Set(Object.values(planAssignments).flat());
      return tasks.filter(t => !allPlannedIds.has(t.id) && !t.completed);
    }
    return tasks.filter(t => !t.routine_block_id && !t.completed);
  }, [tasks, planAssignments]);

  const allAssignedIds = useMemo(() => {
    if (planAssignments) {
      return new Set(Object.values(planAssignments).flat());
    }
    return new Set(tasks.filter(t => t.routine_block_id).map(t => t.id));
  }, [tasks, planAssignments]);

  const assignTaskToBlock = useCallback(async (taskId: string, blockId: string) => {
    if (planAssignments) {
      // For planned day, update plan assignments in local state
      setPlanAssignments(prev => {
        const next = { ...prev };
        // Remove from any current block
        for (const bId of Object.keys(next)) {
          next[bId] = next[bId].filter(id => id !== taskId);
        }
        // Add to new block
        if (!next[blockId]) next[blockId] = [];
        next[blockId].push(taskId);
        return next;
      });

      // If today, also update routine_block_id directly
      if (dateStr === todayStr) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        try {
          await supabase.from(table as any).update({ routine_block_id: blockId }).eq('id', taskId);
        } catch (error) {
          console.error('Error assigning task:', error);
        }
      }
      return;
    }

    // Legacy: direct routine_block_id update
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
  }, [tasks, planAssignments, dateStr, todayStr]);

  const removeTaskFromBlock = useCallback(async (taskId: string) => {
    if (planAssignments) {
      setPlanAssignments(prev => {
        const next = { ...prev };
        for (const bId of Object.keys(next)) {
          next[bId] = next[bId].filter(id => id !== taskId);
        }
        return next;
      });

      if (dateStr === todayStr) {
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;
        const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
        try {
          await supabase.from(table as any).update({ routine_block_id: null }).eq('id', taskId);
        } catch (error) {
          console.error('Error removing task:', error);
        }
      }
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    try {
      await supabase.from(table as any).update({ routine_block_id: null }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, routine_block_id: undefined } : t));
    } catch (error) {
      console.error('Error removing task:', error);
    }
  }, [tasks, planAssignments, dateStr, todayStr]);

  const toggleTaskDone = useCallback(async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const table = task.source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    const next = !task.completed;
    try {
      await supabase.from(table as any).update({ completed: next }).eq('id', taskId);
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: next } : t));
      queryClient.invalidateQueries({ queryKey: ['weeklyData'] });
      queryClient.invalidateQueries({ queryKey: ['resultados'] });
      queryClient.invalidateQueries({ queryKey: ['monthlyData'] });
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  }, [tasks, queryClient]);

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
    toggleTaskDone,
    blockCompletions,
    completionsLoading,
    toggleBlockComplete,
    isBlockCompleted,
    completedBlocks,
    completedTasks,
    dayScore,
    planAssignments,
    planRoutineType,
    planLanguage,
    planLoaded,
  };
}
