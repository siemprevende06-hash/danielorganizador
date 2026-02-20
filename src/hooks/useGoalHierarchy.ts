import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface GoalHierarchy {
  id: string;
  title: string;
  area: string;
  quarter: number;
  year: number;
  progress: number;
  monthlyGoals: MonthlyGoalHierarchy[];
}

export interface MonthlyGoalHierarchy {
  id: string;
  title: string;
  monthIndex: number;
  year: number;
  completed: boolean;
  progress: number;
  weeklyObjectives: WeeklyObjectiveHierarchy[];
}

export interface WeeklyObjectiveHierarchy {
  id: string;
  title: string;
  weekNumber: number;
  completed: boolean;
}

export const useGoalHierarchy = () => {
  const [data, setData] = useState<GoalHierarchy[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHierarchy = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch 12-week goals
      const { data: qGoals, error: qError } = await supabase
        .from('twelve_week_goals')
        .select('*');

      if (qError) throw qError;

      // Fetch monthly goals
      const { data: mGoals, error: mError } = await supabase
        .from('monthly_goals')
        .select('*');

      if (mError) throw mError;

      // Fetch weekly objectives
      const { data: wObjectives, error: wError } = await supabase
        .from('weekly_objectives')
        .select('*');

      if (wError) throw wError;

      // Map them together
      const hierarchy: GoalHierarchy[] = (qGoals || []).map(q => {
        const months = (mGoals || [])
          .filter(m => m.twelve_week_goal_id === q.id)
          .map(m => {
            const weeks = (wObjectives || [])
              .filter(w => w.monthly_goal_id === m.id)
              .map(w => ({
                id: w.id,
                title: w.title,
                weekNumber: w.week_number || 0,
                completed: !!w.completed
              }));

            return {
              id: m.id,
              title: m.title,
              monthIndex: m.month_index,
              year: m.year,
              completed: !!m.completed,
              progress: m.progress_percentage || 0,
              weeklyObjectives: weeks
            };
          });

        return {
          id: q.id,
          title: q.title,
          area: q.category,
          quarter: q.quarter,
          year: q.year,
          progress: q.progress_percentage || 0,
          monthlyGoals: months
        };
      });

      setData(hierarchy);
    } catch (err) {
      console.error('Error fetching goal hierarchy:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  return { data, loading, refresh: fetchHierarchy };
};
