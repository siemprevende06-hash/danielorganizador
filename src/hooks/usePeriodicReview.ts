import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  startOfQuarter, endOfQuarter, format
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

const createEmptyReview = (type: ReviewType, start: Date, end: Date): PeriodicReview => ({
  id: '',
  review_type: type,
  period_start: format(start, 'yyyy-MM-dd'),
  period_end: format(end, 'yyyy-MM-dd'),
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

export function usePeriodicReview(type: ReviewType, referenceDate: Date) {
  const [review, setReview] = useState<PeriodicReview | null>(null);
  const [consistency, setConsistency] = useState<ConsistencySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const { start, end } = useMemo(() => getPeriodRange(type, referenceDate), [type, referenceDate]);
  const periodStart = format(start, 'yyyy-MM-dd');
  const periodEnd = format(end, 'yyyy-MM-dd');

  const loadReview = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await (supabase as any)
        .from('periodic_reviews')
        .select('*')
        .eq('review_type', type)
        .eq('period_start', periodStart)
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
        setReview(createEmptyReview(type, start, end));
      }
    } catch (error) {
      console.error('Error loading periodic review:', error);
      setReview(createEmptyReview(type, start, end));
    } finally {
      setLoading(false);
    }
  }, [type, periodStart, periodEnd, start, end]);

  // Load consistency data from focus_sessions and daily_area_stats
  const loadConsistency = useCallback(async () => {
    try {
      const areas = [
        { id: 'universidad', label: 'Universidad' },
        { id: 'gym', label: 'Gimnasio' },
        { id: 'idiomas', label: 'Idiomas' },
        { id: 'musica', label: 'Música' },
        { id: 'lectura', label: 'Lectura' },
        { id: 'emprendimiento', label: 'Emprendimiento' },
      ];

      const [focusRes, statsRes] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('task_area, duration_minutes, start_time')
          .gte('start_time', `${periodStart}T00:00:00`)
          .lte('start_time', `${periodEnd}T23:59:59`)
          .eq('completed', true),
        supabase
          .from('daily_area_stats')
          .select('area_id, stat_date, completed, time_spent_minutes')
          .gte('stat_date', periodStart)
          .lte('stat_date', periodEnd),
      ]);

      const focusSessions = focusRes.data || [];
      const areaStats = statsRes.data || [];

      const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const snapshots: ConsistencySnapshot[] = areas.map(area => {
        // Count unique days with activity from focus_sessions
        const areaSessions = focusSessions.filter(s => s.task_area === area.id);
        const uniqueDaysFromFocus = new Set(
          areaSessions.map(s => s.start_time?.split('T')[0])
        );

        // Count unique days from daily_area_stats
        const areaStatEntries = areaStats.filter(s => s.area_id === area.id && s.completed);
        const uniqueDaysFromStats = new Set(
          areaStatEntries.map(s => s.stat_date)
        );

        // Merge unique days
        const allDays = new Set([...uniqueDaysFromFocus, ...uniqueDaysFromStats]);
        const daysActive = allDays.size;

        const totalMinutes = areaSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
          + areaStatEntries.reduce((sum, s) => sum + (s.time_spent_minutes || 0), 0);

        return {
          area: area.id,
          label: area.label,
          daysActive,
          totalDays: Math.min(totalDays, Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1),
          percentage: totalDays > 0 ? Math.round((daysActive / Math.min(totalDays, Math.ceil((new Date().getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)) * 100) : 0,
          totalMinutes,
        };
      });

      setConsistency(snapshots);
    } catch (error) {
      console.error('Error loading consistency data:', error);
    }
  }, [periodStart, periodEnd, start, end]);

  useEffect(() => {
    loadReview();
    loadConsistency();
  }, [loadReview, loadConsistency]);

  const saveReview = async (updates: Partial<PeriodicReview>) => {
    if (!review) return false;
    setSaving(true);

    try {
      const merged = { ...review, ...updates };

      // Calculate scores
      const effortScore = merged.effort_objectives.length > 0
        ? merged.effort_objectives.reduce((sum, o) => sum + o.score, 0) / merged.effort_objectives.length
        : null;
      const resultScore = merged.result_objectives.length > 0
        ? merged.result_objectives.reduce((sum, o) => sum + o.score, 0) / merged.result_objectives.length
        : null;

      const payload = {
        review_type: type,
        period_start: periodStart,
        period_end: periodEnd,
        effort_objectives: merged.effort_objectives,
        result_objectives: merged.result_objectives,
        overall_effort_score: effortScore,
        overall_result_score: resultScore,
        overall_rating: merged.overall_rating,
        wins: merged.wins || null,
        struggles: merged.struggles || null,
        lessons_learned: merged.lessons_learned || null,
        next_period_focus: merged.next_period_focus || null,
        consistency_data: Object.fromEntries(consistency.map(c => [c.area, { days: c.daysActive, total: c.totalDays, pct: c.percentage, minutes: c.totalMinutes }])),
        updated_at: new Date().toISOString(),
      };

      let result;
      if (review.id) {
        result = await (supabase as any)
          .from('periodic_reviews')
          .update(payload)
          .eq('id', review.id)
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
      [key]: prev[key].map(o => o.id === id ? { ...o, ...updates } : o)
    } : prev);
  };

  const removeObjective = (objectiveType: 'effort' | 'result', id: string) => {
    if (!review) return;
    const key = objectiveType === 'effort' ? 'effort_objectives' : 'result_objectives';
    setReview(prev => prev ? {
      ...prev,
      [key]: prev[key].filter(o => o.id !== id)
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
