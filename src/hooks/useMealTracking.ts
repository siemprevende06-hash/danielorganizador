import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface Meal {
  id: string;
  type: string;
  label: string;
  scheduledTime: string;
  completed: boolean;
  completedAt?: string;
}

export interface MealGoals {
  currentWeight: number;
  targetWeight: number;
  monthlyGain: number;
}

const MEAL_SCHEDULE = [
  { type: 'pre_entreno', label: 'Merienda pre-entreno', scheduledTime: '05:30' },
  { type: 'desayuno', label: 'Desayuno fuerte post-entreno', scheduledTime: '08:00' },
  { type: 'merienda_1', label: 'Merienda', scheduledTime: '10:30' },
  { type: 'almuerzo', label: 'Almuerzo', scheduledTime: '13:20' },
  { type: 'merienda_2', label: 'Merienda', scheduledTime: '16:00' },
  { type: 'comida', label: 'Comida', scheduledTime: '19:00' },
  { type: 'merienda_nocturna', label: 'Merienda antes de dormir', scheduledTime: '20:40' },
];

const MEAL_GOALS: MealGoals = {
  currentWeight: 50,
  targetWeight: 70,
  monthlyGain: 2.2,
};

export const useMealTracking = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const today = format(new Date(), 'yyyy-MM-dd');

  const loadMeals = async () => {
    try {
      const { data, error } = await supabase
        .from('meal_tracking')
        .select('*')
        .eq('meal_date', today);

      if (error) throw error;

      // Map database records to meal schedule
      const mealsWithStatus = MEAL_SCHEDULE.map((scheduled) => {
        const dbMeal = data?.find((m) => m.meal_type === scheduled.type);
        return {
          id: dbMeal?.id || `temp-${scheduled.type}`,
          type: scheduled.type,
          label: scheduled.label,
          scheduledTime: scheduled.scheduledTime,
          completed: dbMeal?.completed || false,
          completedAt: dbMeal?.completed_at || undefined,
        };
      });

      setMeals(mealsWithStatus);
    } catch (error) {
      console.error('Error loading meals:', error);
      // Initialize with default schedule if error
      setMeals(MEAL_SCHEDULE.map((s) => ({
        id: `temp-${s.type}`,
        type: s.type,
        label: s.label,
        scheduledTime: s.scheduledTime,
        completed: false,
      })));
    } finally {
      setLoading(false);
    }
  };

  const toggleMealCompletion = async (mealType: string) => {
    const meal = meals.find((m) => m.type === mealType);
    if (!meal) return;

    const newCompleted = !meal.completed;
    const mealSchedule = MEAL_SCHEDULE.find((s) => s.type === mealType);

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('meal_tracking')
        .select('id')
        .eq('meal_date', today)
        .eq('meal_type', mealType)
        .maybeSingle();

      if (existing) {
        // Update existing record
        await supabase
          .from('meal_tracking')
          .update({
            completed: newCompleted,
            completed_at: newCompleted ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);
      } else {
        // Create new record
        await supabase.from('meal_tracking').insert({
          meal_date: today,
          meal_type: mealType,
          scheduled_time: mealSchedule?.scheduledTime || '12:00',
          completed: newCompleted,
          completed_at: newCompleted ? new Date().toISOString() : null,
        });
      }

      // Update local state
      setMeals((prev) =>
        prev.map((m) =>
          m.type === mealType
            ? { ...m, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : undefined }
            : m
        )
      );
    } catch (error) {
      console.error('Error toggling meal:', error);
    }
  };

  const getNextMeal = (): Meal | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (const meal of meals) {
      const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
      const mealMinutes = hours * 60 + minutes;

      if (!meal.completed && mealMinutes > currentMinutes) {
        return meal;
      }
    }
    return null;
  };

  const getCurrentMeal = (): Meal | null => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    for (let i = 0; i < meals.length; i++) {
      const meal = meals[i];
      const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
      const mealMinutes = hours * 60 + minutes;
      
      // Check if current time is within 30 minutes of meal time
      if (Math.abs(currentMinutes - mealMinutes) <= 30) {
        return meal;
      }
    }
    return null;
  };

  const getTimeUntilNextMeal = (meal: Meal): number => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
    const mealMinutes = hours * 60 + minutes;
    return mealMinutes - currentMinutes;
  };

  const completedCount = meals.filter((m) => m.completed).length;
  const totalCount = meals.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  useEffect(() => {
    loadMeals();
  }, []);

  return {
    meals,
    loading,
    toggleMealCompletion,
    getNextMeal,
    getCurrentMeal,
    getTimeUntilNextMeal,
    completedCount,
    totalCount,
    progressPercentage,
    goals: MEAL_GOALS,
    refresh: loadMeals,
  };
};
