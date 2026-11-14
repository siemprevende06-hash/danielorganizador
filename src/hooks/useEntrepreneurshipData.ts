import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  entDb,
  isMissingColumnError,
  isMissingTableError,
  withoutKeys,
  DEFAULT_RATE,
  INCOME_OPTIONAL_COLUMNS,
  VENTURE_OPTIONAL_COLUMNS,
} from '@/lib/entrepreneurship/db';
import type {
  Customer,
  EntrepreneurshipTask,
  Expense,
  Experiment,
  FocusEntry,
  Goal,
  Income,
  Metric,
  Milestone,
  Review,
  Stage,
  Subtask,
  Venture,
  VentureData,
} from '@/lib/entrepreneurship/types';
import { getStageMeta } from '@/lib/entrepreneurship/stages';
import { todayISO, weekStartISO } from '@/lib/entrepreneurship/formatters';

interface RawState {
  ventures: Venture[];
  tasks: EntrepreneurshipTask[];
  subtasks: Subtask[];
  goals: Goal[];
  income: Income[];
  expenses: Expense[];
  customers: Customer[];
  metrics: Metric[];
  experiments: Experiment[];
  milestones: Milestone[];
  reviews: Review[];
  focus: Array<{ taskId: string | null; taskIds: string[] | null; minutes: number; date: string }>;
  generalTasks: Array<{ id: string; source_id: string | null }>;
}

const EMPTY: RawState = {
  ventures: [],
  tasks: [],
  subtasks: [],
  goals: [],
  income: [],
  expenses: [],
  customers: [],
  metrics: [],
  experiments: [],
  milestones: [],
  reviews: [],
  focus: [],
  generalTasks: [],
};

function readDefaultRate(): number {
  try {
    const raw = localStorage.getItem('finance_exchange_rate');
    const parsed = raw ? Number(JSON.parse(raw)) : NaN;
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  } catch {
    // ignore
  }
  return DEFAULT_RATE;
}

function normalizeIds(row: { task_id?: string | null; task_ids?: unknown }): string[] {
  if (Array.isArray(row.task_ids)) {
    return row.task_ids.filter((x): x is string => typeof x === 'string');
  }
  return row.task_id ? [row.task_id] : [];
}

interface WriteResult {
  skipped: string[];
}

async function insertWithFallback(
  table: string,
  payload: Record<string, unknown>,
  optionalKeys: string[],
): Promise<WriteResult> {
  const { error } = await entDb.from(table).insert(payload);
  if (!error) return { skipped: [] };
  if (!isMissingColumnError(error)) throw new Error(error.message);

  const skipped = optionalKeys.filter((key) => key in payload);
  const retry = await entDb.from(table).insert(withoutKeys(payload, optionalKeys));
  if (retry.error) throw new Error(retry.error.message);
  console.warn(
    `[entrepreneurship] ${table}: columnas no disponibles (${skipped.join(', ')}). Aplica la migración para guardar estos campos.`,
  );
  return { skipped };
}

async function updateWithFallback(
  table: string,
  id: string,
  patch: Record<string, unknown>,
  optionalKeys: string[],
): Promise<WriteResult> {
  const { error } = await entDb.from(table).update(patch).eq('id', id);
  if (!error) return { skipped: [] };
  if (!isMissingColumnError(error)) throw new Error(error.message);

  const skipped = optionalKeys.filter((key) => key in patch);
  const legacy = withoutKeys(patch, optionalKeys);
  if (Object.keys(legacy).length === 0) {
    console.warn(`[entrepreneurship] ${table}: no se pudo guardar ${skipped.join(', ')}. Aplica la migración.`);
    return { skipped };
  }

  const retry = await entDb.from(table).update(legacy).eq('id', id);
  if (retry.error) throw new Error(retry.error.message);
  console.warn(
    `[entrepreneurship] ${table}: se guardó parcialmente, sin ${skipped.join(', ')}. Aplica la migración.`,
  );
  return { skipped };
}

export function useEntrepreneurshipData() {
  const [raw, setRaw] = useState<RawState>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missingTables, setMissingTables] = useState<string[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const defaultRate = useMemo(readDefaultRate, []);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      const missing = new Set<string>();

      const safe = async <T,>(table: string, promise: PromiseLike<{ data: T | null; error: unknown }>): Promise<T[]> => {
        try {
          const { data, error: queryError } = await promise;
          if (queryError) {
            if (isMissingTableError(queryError)) missing.add(table);
            else console.warn(`[entrepreneurship] ${table}`, queryError);
            return [];
          }
          return (data as T[]) || [];
        } catch (e) {
          if (isMissingTableError(e)) missing.add(table);
          return [];
        }
      };

      const since = new Date();
      since.setDate(since.getDate() - 180);
      const sinceISO = since.toISOString();

      const [
        ventures,
        tasks,
        subtasks,
        goals,
        income,
        expenses,
        customers,
        metrics,
        experiments,
        milestones,
        reviews,
        focusRows,
        generalTasks,
      ] = await Promise.all([
        safe<Venture>('entrepreneurships', entDb.from('entrepreneurships').select('*').order('created_at', { ascending: true })),
        safe<EntrepreneurshipTask>('entrepreneurship_tasks', entDb.from('entrepreneurship_tasks').select('*').order('created_at', { ascending: false })),
        safe<Subtask>('subtasks', entDb.from('subtasks').select('*').order('created_at', { ascending: true })),
        safe<Goal>('entrepreneurship_goals', entDb.from('entrepreneurship_goals').select('*').order('created_at', { ascending: true })),
        safe<Income>('entrepreneurship_income', entDb.from('entrepreneurship_income').select('*').order('income_date', { ascending: false })),
        safe<Expense>('entrepreneurship_expenses', entDb.from('entrepreneurship_expenses').select('*').order('expense_date', { ascending: false })),
        safe<Customer>('entrepreneurship_customers', entDb.from('entrepreneurship_customers').select('*').order('created_at', { ascending: false })),
        safe<Metric>('entrepreneurship_metrics', entDb.from('entrepreneurship_metrics').select('*').order('period_date', { ascending: false })),
        safe<Experiment>('entrepreneurship_experiments', entDb.from('entrepreneurship_experiments').select('*').order('created_at', { ascending: false })),
        safe<Milestone>('entrepreneurship_milestones', entDb.from('entrepreneurship_milestones').select('*')),
        safe<Review>('entrepreneurship_reviews', entDb.from('entrepreneurship_reviews').select('*').order('week_start', { ascending: false })),
        safe<{ task_id: string | null; task_ids: unknown; duration_minutes: number | null; start_time: string }>(
          'focus_sessions',
          entDb.from('focus_sessions')
            .select('task_id, task_ids, duration_minutes, start_time')
            .eq('task_area', 'emprendimiento')
            .gte('start_time', sinceISO),
        ),
        safe<{ id: string; source_id: string | null }>(
          'tasks',
          entDb.from('tasks').select('id, source_id').eq('source', 'entrepreneurship'),
        ),
      ]);

      if (cancelled) return;

      const focus = focusRows.map((row) => ({
        taskId: row.task_id,
        taskIds: Array.isArray(row.task_ids) ? row.task_ids.filter((x): x is string => typeof x === 'string') : null,
        minutes: Number(row.duration_minutes) || 0,
        date: (row.start_time || '').slice(0, 10),
      }));

      setRaw({
        ventures: ventures.map((v) => ({
          ...v,
          stage: (v.stage as Stage) || 'idea',
          currency: v.currency || 'USD',
          accent_color: v.accent_color || '#3b82f6',
          cash_balance: Number(v.cash_balance) || 0,
          archived: Boolean(v.archived),
          stage_entered_at: v.stage_entered_at || v.created_at,
        })),
        tasks: tasks.map((t) => ({ ...t, subtasks: [] })),
        subtasks,
        goals,
        income: income.map((i) => ({ ...i, currency: i.currency || 'USD', exchange_rate: Number(i.exchange_rate) || 1 })),
        expenses: expenses.map((e) => ({ ...e, currency: e.currency || 'USD', exchange_rate: Number(e.exchange_rate) || 1 })),
        customers: customers.map((c) => ({ ...c, mrr: Number(c.mrr) || 0, currency: c.currency || 'USD' })),
        metrics: metrics.map((m) => ({ ...m, value: Number(m.value) || 0 })),
        experiments: experiments.map((e) => ({ ...e, cost: Number(e.cost) || 0 })),
        milestones,
        reviews,
        focus,
        generalTasks,
      });
      setMissingTables([...missing]);
      setLoading(false);
    };

    load().catch((e) => {
      if (!cancelled) {
        console.error(e);
        setError('No se pudieron cargar los emprendimientos.');
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const byVenture = useMemo(() => {
    const result: Record<string, VentureData> = {};

    const taskToVenture = new Map<string, string>();
    raw.tasks.forEach((task) => taskToVenture.set(task.id, task.entrepreneurship_id));
    raw.generalTasks.forEach((task) => {
      if (task.source_id) taskToVenture.set(task.id, taskToVenture.get(task.source_id) || '');
    });

    const focusByVenture = new Map<string, FocusEntry[]>();
    raw.focus.forEach((entry) => {
      const ids = entry.taskIds && entry.taskIds.length ? entry.taskIds : entry.taskId ? [entry.taskId] : [];
      const ventureIds = new Set(ids.map((id) => taskToVenture.get(id)).filter(Boolean) as string[]);
      ventureIds.forEach((ventureId) => {
        const list = focusByVenture.get(ventureId) || [];
        list.push({ date: entry.date, minutes: entry.minutes });
        focusByVenture.set(ventureId, list);
      });
    });

    const subtasksByTask = new Map<string, Subtask[]>();
    raw.subtasks.forEach((subtask) => {
      const list = subtasksByTask.get(subtask.task_id) || [];
      list.push(subtask);
      subtasksByTask.set(subtask.task_id, list);
    });

    raw.ventures.forEach((venture) => {
      result[venture.id] = {
        venture,
        tasks: raw.tasks
          .filter((task) => task.entrepreneurship_id === venture.id)
          .map((task) => ({ ...task, subtasks: subtasksByTask.get(task.id) || [] })),
        goals: raw.goals.filter((goal) => goal.entrepreneurship_id === venture.id),
        income: raw.income.filter((row) => row.entrepreneurship_id === venture.id),
        expenses: raw.expenses.filter((row) => row.entrepreneurship_id === venture.id),
        customers: raw.customers.filter((row) => row.entrepreneurship_id === venture.id),
        metrics: raw.metrics.filter((row) => row.entrepreneurship_id === venture.id),
        experiments: raw.experiments.filter((row) => row.entrepreneurship_id === venture.id),
        milestones: raw.milestones.filter((row) => row.entrepreneurship_id === venture.id),
        reviews: raw.reviews.filter((row) => row.entrepreneurship_id === venture.id),
        focus: focusByVenture.get(venture.id) || [],
      };
    });

    return result;
  }, [raw]);

  // ---------------- mutaciones ----------------

  const createVenture = useCallback(
    async (payload: Partial<Venture> & { name: string }) => {
      const result = await insertWithFallback(
        'entrepreneurships',
        {
          name: payload.name,
          description: payload.description ?? null,
          cover_image: payload.cover_image ?? null,
          stage: payload.stage || 'idea',
          business_model: payload.business_model ?? null,
          target_market: payload.target_market ?? null,
          currency: payload.currency || 'USD',
          accent_color: payload.accent_color || '#3b82f6',
          cash_balance: payload.cash_balance ?? 0,
          monthly_goal: payload.monthly_goal ?? null,
          north_star_key: payload.north_star_key ?? null,
          north_star_target: payload.north_star_target ?? null,
          started_at: payload.started_at || todayISO(),
          stage_entered_at: todayISO(),
          archived: false,
        },
        VENTURE_OPTIONAL_COLUMNS,
      );
      reload();
      return result;
    },
    [reload],
  );

  const updateVenture = useCallback(
    async (id: string, patch: Record<string, unknown>) => {
      const result = await updateWithFallback('entrepreneurships', id, patch, VENTURE_OPTIONAL_COLUMNS);
      reload();
      return result;
    },
    [reload],
  );

  const deleteVenture = useCallback(
    async (id: string) => {
      const { data: taskRows } = await entDb
        .from('entrepreneurship_tasks')
        .select('id')
        .eq('entrepreneurship_id', id);
      const ids = (taskRows || []).map((t: { id: string }) => t.id);
      if (ids.length > 0) {
        await entDb.from('tasks').delete().eq('source', 'entrepreneurship').in('source_id', ids);
      }
      const { error: deleteError } = await entDb.from('entrepreneurships').delete().eq('id', id);
      if (deleteError) throw new Error(deleteError.message);
      reload();
    },
    [reload],
  );

  const addIncome = useCallback(
    async (payload: Omit<Income, 'id' | 'created_at'>) => {
      const result = await insertWithFallback(
        'entrepreneurship_income',
        payload as unknown as Record<string, unknown>,
        INCOME_OPTIONAL_COLUMNS,
      );
      reload();
      return result;
    },
    [reload],
  );

  const deleteIncome = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('entrepreneurship_income').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  const addExpense = useCallback(
    async (payload: Omit<Expense, 'id' | 'created_at'>) => {
      const { error: insertError } = await entDb.from('entrepreneurship_expenses').insert(payload);
      if (insertError) throw new Error(insertError.message);
      reload();
    },
    [reload],
  );

  const deleteExpense = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('entrepreneurship_expenses').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  const addCustomer = useCallback(
    async (payload: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
      const { error: insertError } = await entDb.from('entrepreneurship_customers').insert(payload);
      if (insertError) throw new Error(insertError.message);
      reload();
    },
    [reload],
  );

  const updateCustomer = useCallback(
    async (id: string, patch: Partial<Customer>) => {
      const { error: updateError } = await entDb.from('entrepreneurship_customers').update(patch).eq('id', id);
      if (updateError) throw new Error(updateError.message);
      reload();
    },
    [reload],
  );

  const deleteCustomer = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('entrepreneurship_customers').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  const addExperiment = useCallback(
    async (payload: Omit<Experiment, 'id' | 'created_at'>) => {
      const { error: insertError } = await entDb.from('entrepreneurship_experiments').insert(payload);
      if (insertError) throw new Error(insertError.message);
      reload();
    },
    [reload],
  );

  const updateExperiment = useCallback(
    async (id: string, patch: Partial<Experiment>) => {
      const { error: updateError } = await entDb.from('entrepreneurship_experiments').update(patch).eq('id', id);
      if (updateError) throw new Error(updateError.message);
      reload();
    },
    [reload],
  );

  const deleteExperiment = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('entrepreneurship_experiments').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  const saveMetric = useCallback(
    async (payload: Omit<Metric, 'id' | 'created_at'>) => {
      const { error: upsertError } = await entDb
        .from('entrepreneurship_metrics')
        .upsert(payload, { onConflict: 'entrepreneurship_id,metric_key,period_date' });
      if (upsertError) throw new Error(upsertError.message);
      reload();
    },
    [reload],
  );

  const toggleMilestone = useCallback(
    async (ventureId: string, stage: Stage, itemKey: string, title: string, done: boolean) => {
      const { data: existing } = await entDb
        .from('entrepreneurship_milestones')
        .select('id, completed_at')
        .eq('entrepreneurship_id', ventureId)
        .eq('template_key', itemKey)
        .maybeSingle();

      if (existing?.id) {
        const { error: updateError } = await entDb
          .from('entrepreneurship_milestones')
          .update({ completed_at: done ? new Date().toISOString() : null })
          .eq('id', existing.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        const { error: insertError } = await entDb.from('entrepreneurship_milestones').insert({
          entrepreneurship_id: ventureId,
          template_key: itemKey,
          title,
          stage,
          kind: 'exit',
          completed_at: done ? new Date().toISOString() : null,
        });
        if (insertError) throw new Error(insertError.message);
      }
      reload();
    },
    [reload],
  );

  const saveReview = useCallback(
    async (payload: Omit<Review, 'id' | 'created_at'>) => {
      const { error: upsertError } = await entDb
        .from('entrepreneurship_reviews')
        .upsert(payload, { onConflict: 'entrepreneurship_id,week_start' });
      if (upsertError) throw new Error(upsertError.message);
      reload();
    },
    [reload],
  );

  const addTask = useCallback(
    async (ventureId: string, payload: { title: string; description?: string; due_date?: string | null; task_type?: 'normal' | 'improvement' }) => {
      const { data, error: insertError } = await entDb
        .from('entrepreneurship_tasks')
        .insert({
          entrepreneurship_id: ventureId,
          title: payload.title,
          description: payload.description || null,
          task_type: payload.task_type || 'normal',
          completed: false,
          due_date: payload.due_date || null,
        })
        .select('id')
        .single();
      if (insertError) throw new Error(insertError.message);

      await entDb.from('tasks').insert({
        title: payload.title,
        description: payload.description || null,
        status: 'pendiente',
        completed: false,
        source: 'entrepreneurship',
        source_id: data?.id,
        area_id: 'emprendimiento',
        due_date: payload.due_date || null,
        priority: 'medium',
      });
      reload();
    },
    [reload],
  );

  const toggleTask = useCallback(
    async (task: EntrepreneurshipTask) => {
      const completed = !task.completed;
      const { error: updateError } = await entDb
        .from('entrepreneurship_tasks')
        .update({ completed })
        .eq('id', task.id);
      if (updateError) throw new Error(updateError.message);
      await entDb
        .from('tasks')
        .update({ completed, status: completed ? 'completada' : 'pendiente' })
        .eq('source_id', task.id)
        .eq('source', 'entrepreneurship');
      reload();
    },
    [reload],
  );

  const updateTask = useCallback(
    async (taskId: string, patch: { title: string; description?: string; due_date?: string | null }) => {
      const { error: updateError } = await entDb
        .from('entrepreneurship_tasks')
        .update({
          title: patch.title,
          description: patch.description || null,
          due_date: patch.due_date || null,
        })
        .eq('id', taskId);
      if (updateError) throw new Error(updateError.message);
      await entDb
        .from('tasks')
        .update({ title: patch.title, description: patch.description || null, due_date: patch.due_date || null })
        .eq('source_id', taskId)
        .eq('source', 'entrepreneurship');
      reload();
    },
    [reload],
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      await entDb.from('tasks').delete().eq('source_id', taskId).eq('source', 'entrepreneurship');
      const { error: deleteError } = await entDb.from('entrepreneurship_tasks').delete().eq('id', taskId);
      if (deleteError) throw new Error(deleteError.message);
      reload();
    },
    [reload],
  );

  const addSubtask = useCallback(
    async (taskId: string, title: string) => {
      const { error: insertError } = await entDb.from('subtasks').insert({ task_id: taskId, title, completed: false });
      if (insertError) throw new Error(insertError.message);
      reload();
    },
    [reload],
  );

  const toggleSubtask = useCallback(
    async (subtask: Subtask) => {
      const { error: updateError } = await entDb
        .from('subtasks')
        .update({ completed: !subtask.completed })
        .eq('id', subtask.id);
      if (updateError) throw new Error(updateError.message);
      reload();
    },
    [reload],
  );

  const deleteSubtask = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('subtasks').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  const addGoal = useCallback(
    async (ventureId: string, title: string) => {
      const { error: insertError } = await entDb
        .from('entrepreneurship_goals')
        .insert({ entrepreneurship_id: ventureId, title, completed: false });
      if (insertError) throw new Error(insertError.message);
      reload();
    },
    [reload],
  );

  const toggleGoal = useCallback(
    async (goal: Goal) => {
      const { error: updateError } = await entDb
        .from('entrepreneurship_goals')
        .update({ completed: !goal.completed })
        .eq('id', goal.id);
      if (updateError) throw new Error(updateError.message);
      reload();
    },
    [reload],
  );

  const deleteGoal = useCallback(async (id: string) => {
    const { error: deleteError } = await entDb.from('entrepreneurship_goals').delete().eq('id', id);
    if (deleteError) throw new Error(deleteError.message);
    reload();
  }, [reload]);

  return {
    ventures: raw.ventures,
    byVenture,
    loading,
    error,
    missingTables,
    defaultRate,
    reload,
    createVenture,
    updateVenture,
    deleteVenture,
    addIncome,
    deleteIncome,
    addExpense,
    deleteExpense,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addExperiment,
    updateExperiment,
    deleteExperiment,
    saveMetric,
    toggleMilestone,
    saveReview,
    addTask,
    toggleTask,
    updateTask,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addGoal,
    toggleGoal,
    deleteGoal,
    getStageMeta,
    weekStartISO,
  };
}