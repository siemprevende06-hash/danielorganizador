import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BlockRating {
  blockId: string;
  blockTitle: string;
  rating: number;
  notes?: string;
  status: 'completed' | 'partial' | 'skipped';
}

interface DailyReview {
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
}

export function useDailyReview(date?: string) {
  const [review, setReview] = useState<DailyReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const reviewDate = date || new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadReview();
  }, [reviewDate]);

  const loadReview = async () => {
    setLoading(true);

    // Try to load existing review
    const { data: existingReview } = await supabase
      .from('daily_reviews')
      .select('*')
      .eq('review_date', reviewDate)
      .maybeSingle();

    if (existingReview) {
      setReview({
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
        overallRating: existingReview.overall_rating || 0
      });
    } else {
      // Create new review with calculated stats
      const stats = await calculateDayStats();
      setReview({
        reviewDate,
        ...stats,
        blockRatings: [],
        whatWentWell: '',
        whatCouldBeBetter: '',
        tomorrowPlan: '',
        overallRating: 0
      });
    }

    setLoading(false);
  };

  const calculateDayStats = async () => {
    // Load routine blocks
    const { data: blocks } = await supabase
      .from('routine_blocks')
      .select('id, title, start_time, end_time');

    const blocksTotal = blocks?.length || 0;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let blocksCompleted = 0;
    blocks?.forEach(block => {
      const [endH, endM] = block.end_time.split(':').map(Number);
      const endMinutes = endH * 60 + endM;
      if (currentMinutes >= endMinutes) {
        blocksCompleted++;
      }
    });

    // Load tasks
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

    // Load habits
    const { data: habitHistory } = await supabase
      .from('habit_history')
      .select('completed_dates');

    let habitsCompleted = 0;
    let habitsTotal = habitHistory?.length || 6;
    
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
      focusMinutes
    };
  };

  const saveReview = async (updatedReview: Partial<DailyReview>) => {
    if (!review) return;

    setSaving(true);

    const dataToSave = {
      review_date: reviewDate,
      blocks_completed: updatedReview.blocksCompleted ?? review.blocksCompleted,
      blocks_total: updatedReview.blocksTotal ?? review.blocksTotal,
      tasks_completed: updatedReview.tasksCompleted ?? review.tasksCompleted,
      tasks_total: updatedReview.tasksTotal ?? review.tasksTotal,
      habits_completed: updatedReview.habitsCompleted ?? review.habitsCompleted,
      habits_total: updatedReview.habitsTotal ?? review.habitsTotal,
      focus_minutes: updatedReview.focusMinutes ?? review.focusMinutes,
      block_ratings: (updatedReview.blockRatings ?? review.blockRatings) as unknown as any,
      what_went_well: updatedReview.whatWentWell ?? review.whatWentWell,
      what_could_be_better: updatedReview.whatCouldBeBetter ?? review.whatCouldBeBetter,
      tomorrow_plan: updatedReview.tomorrowPlan ?? review.tomorrowPlan,
      overall_rating: updatedReview.overallRating ?? review.overallRating
    };

    if (review.id) {
      const { error } = await supabase
        .from('daily_reviews')
        .update(dataToSave)
        .eq('id', review.id);

      if (error) {
        toast.error('Error al guardar autocrítica');
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('daily_reviews')
        .insert(dataToSave)
        .select()
        .single();

      if (error) {
        toast.error('Error al crear autocrítica');
        setSaving(false);
        return;
      }

      setReview(prev => prev ? { ...prev, id: data.id } : null);
    }

    setReview(prev => prev ? { ...prev, ...updatedReview } : null);
    toast.success('Autocrítica guardada');
    setSaving(false);
  };

  const updateBlockRating = (blockId: string, rating: number, notes?: string, status?: 'completed' | 'partial' | 'skipped') => {
    if (!review) return;

    const existingIndex = review.blockRatings.findIndex(br => br.blockId === blockId);
    const updatedRatings = [...review.blockRatings];

    if (existingIndex >= 0) {
      updatedRatings[existingIndex] = {
        ...updatedRatings[existingIndex],
        rating,
        notes: notes ?? updatedRatings[existingIndex].notes,
        status: status ?? updatedRatings[existingIndex].status
      };
    } else {
      updatedRatings.push({
        blockId,
        blockTitle: '',
        rating,
        notes,
        status: status || 'completed'
      });
    }

    saveReview({ blockRatings: updatedRatings });
  };

  return {
    review,
    loading,
    saving,
    saveReview,
    updateBlockRating,
    refreshStats: loadReview
  };
}
