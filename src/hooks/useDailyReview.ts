import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";
import { toast } from "sonner";

interface BlockRating {
  blockId: string;
  blockTitle: string;
  rating: number;
  notes?: string;
  status: 'completed' | 'partial' | 'skipped';
}

export interface DailyReview {
  id?: string;
  reviewDate: string;
  blocksCompleted: number;
  blocksTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
  focusMinutes: number;
  blockRatings: BlockRating[];
  whatWentWell: string;
  whatCouldBeBetter: string;
  tomorrowPlan: string;
  overallRating: number;
  energyRating: number;
  sleepRating: number;
  sleepHours: number;
}

export interface SystemsTrackingData {
  completions: Record<string, boolean>;
  timeData: Record<string, number>;
  countData: Record<string, number>;
  waterData: Record<string, boolean>;
  workAssignments: Record<string, string>;
  blockCompletions: Record<string, boolean>;
  wakeTime: string;
  sleepTime: string;
  workoutDuration: number;
  workoutIntensity: string;
}

/** Espera antes de persistir mientras el usuario escribe. */
const AUTOSAVE_DELAY_MS = 800;

export function useDailyReview(date?: string, options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const reviewDate = date || getCubaDate();

  const [review, setReview] = useState<DailyReview | null>(null);
  const [systemsTracking, setSystemsTracking] = useState<SystemsTrackingData | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);

  // El estado de React puede quedar desfasado entre pulsaciones; las guardas
  // y el autoguardado leen siempre la última versión desde el ref.
  const reviewRef = useRef<DailyReview | null>(null);
  const reviewIdRef = useRef<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Serializa las escrituras para que dos peticiones no inserten a la vez.
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const loadSeqRef = useRef(0);

  const applyReview = useCallback((next: DailyReview | null) => {
    reviewRef.current = next;
    reviewIdRef.current = next?.id ?? null;
    setReview(next);
  }, []);

  const loadSystemsTracking = useCallback(async () => {
    const { data } = await supabase
      .from('daily_systems_tracking')
      .select('*')
      .eq('tracking_date', reviewDate)
      .maybeSingle();

    if (data) {
      setSystemsTracking({
        completions: (data.completions as Record<string, boolean>) || {},
        timeData: (data.time_data as Record<string, number>) || {},
        countData: (data.count_data as Record<string, number>) || {},
        waterData: (data.water_data as Record<string, boolean>) || {},
        workAssignments: (data.work_assignments as Record<string, string>) || {},
        blockCompletions: (data.block_completions as Record<string, boolean>) || {},
        wakeTime: data.wake_time || '',
        sleepTime: data.sleep_time || '',
        workoutDuration: data.workout_duration || 0,
        workoutIntensity: data.workout_intensity || 'moderate',
      });
    } else {
      setSystemsTracking(null);
    }
  }, [reviewDate]);

  const calculateDayStats = useCallback(async () => {
    const { data: blocks } = await supabase
      .from('routine_blocks')
      .select('id, title, start_time, end_time');

    const blocksTotal = blocks?.length || 0;
    const isToday = reviewDate === getCubaDate();
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    // En días pasados no se puede inferir qué bloques se completaron por la
    // hora actual: se dejan en 0 hasta que el usuario los registre.
    let blocksCompleted = 0;
    if (isToday) {
      blocks?.forEach(block => {
        const [endH, endM] = block.end_time.split(':').map(Number);
        if (currentMinutes >= endH * 60 + endM) blocksCompleted++;
      });
    }

    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, completed')
      .gte('due_date', `${reviewDate}T00:00:00`)
      .lte('due_date', `${reviewDate}T23:59:59`);

    const { data: entrepreneurshipTasks } = await supabase
      .from('entrepreneurship_tasks')
      .select('id, completed')
      .eq('due_date', reviewDate);

    const allTasks = [...(tasks || []), ...(entrepreneurshipTasks || [])];
    const tasksCompleted = allTasks.filter(t => t.completed).length;
    const tasksTotal = allTasks.length;

    const { data: habitHistory } = await supabase
      .from('habit_history')
      .select('completed_dates');

    let habitsCompleted = 0;
    const habitsTotal = habitHistory?.length || 6;

    habitHistory?.forEach(h => {
      const dates = h.completed_dates as any[];
      if (dates?.some((d: any) => d.date === reviewDate && d.status === 'completed')) {
        habitsCompleted++;
      }
    });

    const focusMinutes = blocksCompleted * 90;

    return {
      blocksCompleted,
      blocksTotal,
      tasksCompleted,
      tasksTotal,
      habitsCompleted,
      habitsTotal,
      focusMinutes,
    };
  }, [reviewDate]);

  const loadReview = useCallback(async () => {
    const seq = ++loadSeqRef.current;

    if (!enabled) {
      applyReview(null);
      setSystemsTracking(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // Evita mostrar la autocrítica del período anterior mientras carga.
    applyReview(null);

    const [reviewRes] = await Promise.all([
      supabase
        .from('daily_reviews')
        .select('*')
        .eq('review_date', reviewDate)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      loadSystemsTracking(),
    ]);

    if (seq !== loadSeqRef.current) return;

    const existingReview = reviewRes.data;

    if (existingReview) {
      applyReview({
        id: existingReview.id,
        reviewDate: existingReview.review_date,
        blocksCompleted: existingReview.blocks_completed || 0,
        blocksTotal: existingReview.blocks_total || 0,
        tasksCompleted: existingReview.tasks_completed || 0,
        tasksTotal: existingReview.tasks_total || 0,
        habitsCompleted: existingReview.habits_completed || 0,
        habitsTotal: existingReview.habits_total || 0,
        focusMinutes: existingReview.focus_minutes || 0,
        blockRatings: (existingReview.block_ratings as unknown as BlockRating[]) || [],
        whatWentWell: existingReview.what_went_well || '',
        whatCouldBeBetter: existingReview.what_could_be_better || '',
        tomorrowPlan: existingReview.tomorrow_plan || '',
        overallRating: existingReview.overall_rating || 0,
        energyRating: (existingReview as any).energy_rating || 0,
        sleepRating: (existingReview as any).sleep_rating || 0,
        sleepHours: (existingReview as any).sleep_hours || 0,
      });
    } else {
      const stats = await calculateDayStats();
      if (seq !== loadSeqRef.current) return;
      applyReview({
        reviewDate,
        ...stats,
        blockRatings: [],
        whatWentWell: '',
        whatCouldBeBetter: '',
        tomorrowPlan: '',
        overallRating: 0,
        energyRating: 0,
        sleepRating: 0,
        sleepHours: 0,
      });
    }

    setLoading(false);
  }, [enabled, reviewDate, applyReview, loadSystemsTracking, calculateDayStats]);

  const persistSnapshot = useCallback(async (current: DailyReview | null, snapshotDate: string) => {
    // `enabled` solo controla la carga de la vista actual. Un snapshot de una
    // fecha anterior debe guardarse igualmente al cambiar de pestaña.
    if (!current) return;

    setSaving(true);

    const payload = {
      review_date: snapshotDate,
      blocks_completed: current.blocksCompleted,
      blocks_total: current.blocksTotal,
      tasks_completed: current.tasksCompleted,
      tasks_total: current.tasksTotal,
      habits_completed: current.habitsCompleted,
      habits_total: current.habitsTotal,
      focus_minutes: current.focusMinutes,
      block_ratings: current.blockRatings as unknown as any,
      what_went_well: current.whatWentWell,
      what_could_be_better: current.whatCouldBeBetter,
      tomorrow_plan: current.tomorrowPlan,
      overall_rating: current.overallRating,
      energy_rating: current.energyRating,
      sleep_rating: current.sleepRating,
      sleep_hours: current.sleepHours,
    };

    try {
      let id = current.id || (snapshotDate === reviewDate ? reviewIdRef.current : null);

      // Puede existir una fila de una sesión anterior (o un duplicado): se
      // reutiliza antes de insertar para no crear otra.
      if (!id) {
        const { data: existing } = await supabase
          .from('daily_reviews')
          .select('id')
          .eq('review_date', snapshotDate)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existing?.id) id = existing.id;
      }

      if (id) {
        const { error } = await supabase
          .from('daily_reviews')
          .update(payload)
          .eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('daily_reviews')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw error;
        id = data.id;
      }

      // Solo se actualiza el estado si seguimos en la misma fecha.
      if (snapshotDate === reviewDate) {
        reviewIdRef.current = id;
        if (reviewRef.current) reviewRef.current = { ...reviewRef.current, id };
        setReview(prev => (prev ? { ...prev, id } : prev));
      }
    } catch (error) {
      console.error('Error guardando autocrítica:', error);
      toast.error('No se pudo guardar la autocrítica');
    } finally {
      setSaving(false);
    }
  }, [reviewDate]);

  const persistSnapshotRef = useRef(persistSnapshot);
  useEffect(() => {
    persistSnapshotRef.current = persistSnapshot;
  }, [persistSnapshot]);

  const enqueuePersist = useCallback((snapshot: DailyReview | null, snapshotDate: string) => {
    const run = queueRef.current.then(
      () => persistSnapshotRef.current(snapshot, snapshotDate),
      () => persistSnapshotRef.current(snapshot, snapshotDate),
    );
    queueRef.current = run.catch(() => {});
  }, []);

  const saveReview = useCallback((updatedReview: Partial<DailyReview>) => {
    if (!enabled) return;
    const current = reviewRef.current;
    if (!current) return;

    // Actualiza la UI al instante; la escritura se agrupa tras la pausa.
    const next = { ...current, ...updatedReview };
    applyReview(next);

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
      enqueuePersist(next, reviewDate);
    }, AUTOSAVE_DELAY_MS);
  }, [enabled, applyReview, enqueuePersist, reviewDate]);

  // Carga inicial y al cambiar de fecha. Si queda un autoguardado pendiente,
  // se envía con la fecha a la que pertenece antes de reiniciar el estado.
  useEffect(() => {
    loadReview();
    return () => {
      loadSeqRef.current++;
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
        const snapshot = reviewRef.current;
        if (snapshot) enqueuePersist(snapshot, snapshot.reviewDate || reviewDate);
      }
    };
  }, [loadReview, enqueuePersist, reviewDate]);

  const updateBlockRating = (blockId: string, rating: number, notes?: string, status?: 'completed' | 'partial' | 'skipped') => {
    const current = reviewRef.current;
    if (!current) return;

    const existingIndex = current.blockRatings.findIndex(br => br.blockId === blockId);
    const updatedRatings = [...current.blockRatings];

    if (existingIndex >= 0) {
      updatedRatings[existingIndex] = {
        ...updatedRatings[existingIndex],
        rating,
        notes: notes ?? updatedRatings[existingIndex].notes,
        status: status ?? updatedRatings[existingIndex].status,
      };
    } else {
      updatedRatings.push({
        blockId,
        blockTitle: '',
        rating,
        notes,
        status: status || 'completed',
      });
    }

    saveReview({ blockRatings: updatedRatings });
  };

  return {
    review,
    systemsTracking,
    loading,
    saving,
    saveReview,
    updateBlockRating,
    refreshStats: loadReview,
  };
}
