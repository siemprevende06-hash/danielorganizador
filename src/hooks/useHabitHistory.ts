import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { HabitHistory } from '@/lib/definitions';

export const useHabitHistory = () => {
  const [habitHistory, setHabitHistory] = useState<HabitHistory>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load from Supabase
  useEffect(() => {
    const loadHabitHistory = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('habit_history')
          .select('*');

        if (error) throw error;

        const history: HabitHistory = {};
        data?.forEach((row: any) => {
          history[row.habit_id] = {
            completedDates: row.completed_dates || [],
            currentStreak: row.current_streak || 0,
            longestStreak: row.longest_streak || 0,
          };
        });

        // Check for localStorage migration
        const storedHistory = localStorage.getItem('habitHistory');
        if (storedHistory && Object.keys(history).length === 0) {
          try {
            const localData = JSON.parse(storedHistory) as HabitHistory;
            // Migrate to Supabase
            for (const [habitId, habitData] of Object.entries(localData)) {
              await supabase.from('habit_history').upsert({
                habit_id: habitId,
                completed_dates: habitData.completedDates as any,
                current_streak: habitData.currentStreak,
                longest_streak: habitData.longestStreak,
              } as any, { onConflict: 'habit_id' });
            }
            setHabitHistory(localData);
            localStorage.removeItem('habitHistory');
          } catch (e) {
            console.error('Migration error:', e);
          }
        } else {
          setHabitHistory(history);
        }
      } catch (error) {
        console.error('Error loading habit history:', error);
        // Fallback to localStorage
        const stored = localStorage.getItem('habitHistory');
        if (stored) {
          setHabitHistory(JSON.parse(stored));
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadHabitHistory();
  }, []);

  // Save to Supabase
  const updateHabitHistory = useCallback(async (newHistory: HabitHistory) => {
    setHabitHistory(newHistory);
    
    try {
      for (const [habitId, data] of Object.entries(newHistory)) {
        await supabase.from('habit_history').upsert({
          habit_id: habitId,
          completed_dates: data.completedDates as any,
          current_streak: data.currentStreak,
          longest_streak: data.longestStreak,
        } as any, { onConflict: 'habit_id' });
      }
    } catch (error) {
      console.error('Error saving habit history:', error);
    }
  }, []);

  return { habitHistory, setHabitHistory: updateHabitHistory, isLoading };
};
