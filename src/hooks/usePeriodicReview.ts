import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getCubaDate } from '@/lib/cubaTime';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, format, parseISO,
  startOfDay, differenceInCalendarDays,
} from 'date-fns';

export type ReviewType = 'weekly' | 'monthly' | 'quarterly';

export interface ReviewObjective {
  id: string;
  area: string;
  title: string;
  target: string;
  actual: string;
  score: number; // 0-100
  notes?: string;
}

export interface PeriodicReview {
  id: string;
  review_type: ReviewType;
  period_start: string;
  period_end: string;
  effort_objectives: ReviewObjective[];
  result_objectives: ReviewObjective[];
  overall_effort_score: number | null;
  overall_result_score: number | null;
  overall_rating: number | null;
  wins: string;
  struggles: string;
  lessons_learned: string;
  next_period_focus: string;
  consistency_data: Record<string, any>;
}

export interface ConsistencySnapshot {
  area: string;
  label: string;
  daysActive: number;
  totalDays: number;
  percentage: number;
  totalMinutes?: number;
}

/** Áreas que se muestran en la tarjeta de consistencia del período. */
const CONSISTENCY_AREAS: { id: string; label: string }[] = [
  { id: 'universidad', label: 'Universidad' },
  { id: 'emprendimiento', label: 'Emprendimiento' },
  { id: 'proyectos', label: 'Proyectos' },
  { id: 'lectura', label: 'Lectura' },
  { id: 'musica', label: 'Música' },
  { id: 'ajedrez', label: 'Ajedrez' },
  { id: 'game', label: 'Game' },
  { id: 'idiomas', label: 'Idiomas' },
  { id: 'gym', label: 'Gimnasio' },
];

function normalizeConsistencyArea(area?: string | null): string {
  const key = (area || '').toLowerCase();
  if (key === 'italiano' || key === 'ingles' || key === 'idiomas') return 'idiomas';
  if (key === 'university' || key === 'universidad') return 'universidad';
  if (key === 'entrepreneurship' || key === 'entrepreneur' || key === 'emprendimiento') return 'emprendimiento';
  if (key === 'project' || key === 'proyectos') return 'proyectos';
  if (key === 'music' || key === 'musica') return 'musica';
  if (key === 'fitness' || key === 'gym') return 'gym';
  return key;
}

const createEmptyReview = (type: ReviewType, startKey: string, endKey: string): PeriodicReview => ({
  id: '',
  review_type: type,
  period_start: startKey,
  period_end: endKey,
  effort_objectives: [],
  result_objectives: [],
  overall_effort_score: null,
  overall_result_score: null,
  overall_rating: null,
  wins: '',
  struggles: '',
  lessons_learned: '',
  next_period_focus: '',
  consistency_data: {},
});

export function getPeriodRange(type: ReviewType, referenceDate: Date) {
  switch (type) {
    case 'weekly':
      return { start: startOfWeek(referenceDate, { weekStartsOn: 1 }), end: endOfWeek(referenceDate, { weekStartsOn: 1 }) };
    case 'monthly':
      return { start: startOfMonth(referenceDate), end: endOfMonth(referenceDate) };
    case 'quarterly':
      return { start: startOfQuarter(referenceDate), end: endOfQuarter(referenceDate) };
  }
}

interface UsePeriodicReviewOptions {
  /** Permite calcular consistencia sin cargar/guardar una reseña. */
  enabled?: boolean;
  /** Rango explícito para consistencia (por ejemplo, un año completo). */
  range?: { start: Date; end: Date };
  /** Evita consultar consistencia en vistas que no la muestran (por ejemplo, el día). */
  includeConsistency?: boolean;
}

export function usePeriodicReview(
  type: ReviewType,
  referenceDate: Date,
  options?: UsePeriodicReviewOptions,
) {
  const enabled = options?.enabled ?? true;
  const includeConsistency = options?.includeConsistency ?? true;

  const [review, setReview] = useState<PeriodicReview | null>(null);
  const [consistency, setConsistency] = useState<ConsistencySnapshot[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Normalizar a clave evita bucles cuando el padre crea un `Date` nuevo en
  // cada render (por ejemplo, `new Date(year, 0, 1)`).
  const referenceKey = format(referenceDate, 'yyyy-MM-dd');
  const reference = useMemo(() => parseISO(`${referenceKey}T12:00:00`), [referenceKey]);
  const defaultRange = useMemo(() => getPeriodRange(type, reference), [type, reference]);

  const periodStart = format(defaultRange.start, 'yyyy-MM-dd');
  const periodEnd = format(defaultRange.end, 'yyyy-MM-dd');

  const rangeStartKey = options?.range ? format(options.range.start, 'yyyy-MM-dd') : periodStart;
  const rangeEndKey = options?.range ? format(options.range.end, 'yyyy-MM-dd') : periodEnd;

  const loadReview = useCallback(async () => {
    if (!enabled) {
      setReview(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    // No mostrar la reseña del período anterior mientras llega la nueva.
    setReview(null);

    try {
      const { data, error } = await (supabase as any)
        .from('periodic_reviews')
        .select('*')
        .eq('review_type', type)
        .eq('period_start', periodStart)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setReview({
          id: data.id,
          review_type: data.review_type,
          period_start: data.period_start,
          period_end: data.period_end,
          effort_objectives: (data.effort_objectives as ReviewObjective[]) || [],
          result_objectives: (data.result_objectives as ReviewObjective[]) || [],
          overall_effort_score: data.overall_effort_score,
          overall_result_score: data.overall_result_score,
          overall_rating: data.overall_rating,
          wins: data.wins || '',
          struggles: data.struggles || '',
          lessons_learned: data.lessons_learned || '',
          next_period_focus: data.next_period_focus || '',
          consistency_data: (data.consistency_data as Record<string, any>) || {},
        });
      } else {
        setReview(createEmptyReview(type, periodStart, periodEnd));
      }
    } catch (error) {
      console.error('Error loading periodic review:', error);
      setReview(createEmptyReview(type, periodStart, periodEnd));
    } finally {
      setLoading(false);
    }
  }, [enabled, type, periodStart, periodEnd]);

  // Consistencia: días con actividad real en daily_area_stats (fuente de los
  // minutos) más los días con sesiones de foco. El denominador son solo los
  // días transcurridos del período, nunca días futuros.
  const loadConsistency = useCallback(async () => {
    if (!includeConsistency) {
      setConsistency([]);
      return;
    }

    try {
      const rangeStart = parseISO(`${rangeStartKey}T00:00:00`);
      const rangeEnd = parseISO(`${rangeEndKey}T23:59:59`);

      const [focusRes, statsRes] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('task_area, duration_minutes, start_time')
          .gte('start_time', `${rangeStartKey}T00:00:00`)
          .lte('start_time', `${rangeEndKey}T23:59:59`)
          .eq('completed', true),
        supabase
          .from('daily_area_stats')
          .select('area_id, stat_date, completed, time_spent_minutes')
          .gte('stat_date', rangeStartKey)
          .lte('stat_date', rangeEndKey),
      ]);

      const focusSessions = focusRes.data || [];
      const areaStats = statsRes.data || [];

      const today = parseISO(`${getCubaDate()}T00:00:00`);
      const endDay = startOfDay(rangeEnd);
      const effectiveEnd = endDay.getTime() > today.getTime() ? today : endDay;
      const totalDays = effectiveEnd < rangeStart
        ? 0
        : differenceInCalendarDays(effectiveEnd, rangeStart) + 1;

      const activeDays = new Map<string, Set<string>>();
      const minutesByArea = new Map<string, number>();

      const addDay = (area: string, day: string | null | undefined) => {
        if (!day) return;
        if (day < rangeStartKey || day > rangeEndKey) return;
        const set = activeDays.get(area) || new Set<string>();
        set.add(day);
        activeDays.set(area, set);
      };

      areaStats.forEach((s: any) => {
        const area = normalizeConsistencyArea(s.area_id);
        const minutes = Number(s.time_spent_minutes) || 0;
        if (minutes > 0 || s.completed) addDay(area, s.stat_date);
        if (minutes > 0) minutesByArea.set(area, (minutesByArea.get(area) || 0) + minutes);
      });

      focusSessions.forEach((s: any) => {
        const area = normalizeConsistencyArea(s.task_area);
        addDay(area, s.start_time ? String(s.start_time).slice(0, 10) : null);
      });

      const snapshots: ConsistencySnapshot[] = CONSISTENCY_AREAS.map(area => {
        const daysActive = activeDays.get(area.id)?.size || 0;
        return {
          area: area.id,
          label: area.label,
          daysActive,
          totalDays,
          percentage: totalDays > 0 ? Math.min(100, Math.round((daysActive / totalDays) * 100)) : 0,
          totalMinutes: minutesByArea.get(area.id) || 0,
        };
      });

      setConsistency(snapshots);
    } catch (error) {
      console.error('Error loading consistency data:', error);
      setConsistency([]);
    }
  }, [rangeStartKey, rangeEndKey, includeConsistency]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  useEffect(() => {
    loadConsistency();
  }, [loadConsistency]);

  const saveReview = async (updates: Partial<PeriodicReview>) => {
    if (!enabled || !review) return false;
    setSaving(true);

    try {
      const merged = { ...review, ...updates };

      const effortScore = merged.effort_objectives.length > 0
        ? merged.effort_objectives.reduce((sum, o) => sum + o.score, 0) / merged.effort_objectives.length
        : null;
      const resultScore = merged.result_objectives.length > 0
        ? merged.result_objectives.reduce((sum, o) => sum + o.score, 0) / merged.result_objectives.length
        : null;

      const rating = merged.overall_rating != null && merged.overall_rating >= 1
        ? merged.overall_rating
        : null;

      const payload = {
        review_type: type,
        period_start: periodStart,
        period_end: periodEnd,
        effort_objectives: merged.effort_objectives,
        result_objectives: merged.result_objectives,
        overall_effort_score: effortScore,
        overall_result_score: resultScore,
        overall_rating: rating,
        wins: merged.wins || null,
        struggles: merged.struggles || null,
        lessons_learned: merged.lessons_learned || null,
        next_period_focus: merged.next_period_focus || null,
        consistency_data: consistency.length > 0
          ? Object.fromEntries(consistency.map(c => [c.area, { days: c.daysActive, total: c.totalDays, pct: c.percentage, minutes: c.totalMinutes }]))
          : (merged.consistency_data || {}),
        updated_at: new Date().toISOString(),
      };

      // `user_id` es NULL en esta app y Postgres trata los NULL como distintos,
      // así que la restricción única no impide duplicados: se busca primero.
      let targetId = review.id;
      if (!targetId) {
        const { data: existing } = await (supabase as any)
          .from('periodic_reviews')
          .select('id')
          .eq('review_type', type)
          .eq('period_start', periodStart)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        targetId = existing?.id || '';
      }

      let result;
      if (targetId) {
        result = await (supabase as any)
          .from('periodic_reviews')
          .update(payload)
          .eq('id', targetId)
          .select()
          .single();
      } else {
        result = await (supabase as any)
          .from('periodic_reviews')
          .insert({ ...payload, user_id: null })
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setReview(prev => prev ? {
        ...prev,
        ...updates,
        id: result.data.id,
        overall_rating: rating,
        overall_effort_score: effortScore,
        overall_result_score: resultScore,
      } : prev);

      toast({ title: 'Autocrítica guardada' });
      return true;
    } catch (error: any) {
      console.error('Error saving periodic review:', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const addObjective = (objectiveType: 'effort' | 'result', objective: Omit<ReviewObjective, 'id'>) => {
    if (!review) return;
    const newObj: ReviewObjective = { ...objective, id: crypto.randomUUID() };
    const key = objectiveType === 'effort' ? 'effort_objectives' : 'result_objectives';
    setReview(prev => prev ? { ...prev, [key]: [...prev[key], newObj] } : prev);
  };

  const updateObjective = (objectiveType: 'effort' | 'result', id: string, updates: Partial<ReviewObjective>) => {
    if (!review) return;
    const key = objectiveType === 'effort' ? 'effort_objectives' : 'result_objectives';
    setReview(prev => prev ? {
      ...prev,
      [key]: prev[key].map(o => o.id === id ? { ...o, ...updates } : o),
    } : prev);
  };

  const removeObjective = (objectiveType: 'effort' | 'result', id: string) => {
    if (!review) return;
    const key = objectiveType === 'effort' ? 'effort_objectives' : 'result_objectives';
    setReview(prev => prev ? {
      ...prev,
      [key]: prev[key].filter(o => o.id !== id),
    } : prev);
  };

  const updateReflection = (field: 'wins' | 'struggles' | 'lessons_learned' | 'next_period_focus', value: string) => {
    setReview(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const setOverallRating = (rating: number) => {
    setReview(prev => prev ? { ...prev, overall_rating: rating } : prev);
  };

  return {
    review,
    consistency,
    loading,
    saving,
    periodStart,
    periodEnd,
    saveReview,
    addObjective,
    updateObjective,
    removeObjective,
    updateReflection,
    setOverallRating,
  };
}
