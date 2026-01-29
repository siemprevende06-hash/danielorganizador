import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface NutritionEstimate {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  advice: string;
}

export interface MealDetail {
  id: string;
  meal_tracking_id: string | null;
  user_id: string | null;
  description: string;
  estimated_calories: number | null;
  protein_grams: number | null;
  carbs_grams: number | null;
  fat_grams: number | null;
  ai_response: unknown;
  created_at: string;
}

export const DAILY_GOALS = {
  calories: 3200,
  protein: 150,
  carbs: 400,
  fat: 90,
};

export const useNutritionAI = () => {
  const [loading, setLoading] = useState(false);
  const [todayMeals, setTodayMeals] = useState<MealDetail[]>([]);
  const { toast } = useToast();

  const fetchTodayMeals = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('meal_details')
        .select('*')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTodayMeals((data as MealDetail[]) || []);
    } catch (error) {
      console.error('Error fetching meals:', error);
    }
  };

  const analyzeFood = async (description: string, mealTrackingId?: string): Promise<NutritionEstimate | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('nutrition-ai', {
        body: { 
          description,
          currentWeight: 50,
          targetWeight: 70,
          dailyGoals: DAILY_GOALS,
        },
      });

      if (error) throw error;

      const estimate: NutritionEstimate = data;

      // Save to database
      const { error: insertError } = await supabase
        .from('meal_details')
        .insert([{
          meal_tracking_id: mealTrackingId || null,
          description,
          estimated_calories: estimate.calories,
          protein_grams: estimate.protein,
          carbs_grams: estimate.carbs,
          fat_grams: estimate.fat,
          ai_response: JSON.parse(JSON.stringify(estimate)),
        }]);

      if (insertError) throw insertError;

      await fetchTodayMeals();

      toast({
        title: "Comida registrada",
        description: `~${estimate.calories} kcal | ${estimate.protein}g proteína`,
      });

      return estimate;
    } catch (error) {
      console.error('Error analyzing food:', error);
      toast({
        title: "Error",
        description: "No se pudo analizar la comida. Intenta de nuevo.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getTodayTotals = () => {
    return todayMeals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.estimated_calories || 0),
        protein: acc.protein + (meal.protein_grams || 0),
        carbs: acc.carbs + (meal.carbs_grams || 0),
        fat: acc.fat + (meal.fat_grams || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  };

  const getProgressPercentage = () => {
    const totals = getTodayTotals();
    return {
      calories: Math.round((totals.calories / DAILY_GOALS.calories) * 100),
      protein: Math.round((totals.protein / DAILY_GOALS.protein) * 100),
      carbs: Math.round((totals.carbs / DAILY_GOALS.carbs) * 100),
      fat: Math.round((totals.fat / DAILY_GOALS.fat) * 100),
    };
  };

  const getRemainingCalories = () => {
    const totals = getTodayTotals();
    return Math.max(0, DAILY_GOALS.calories - totals.calories);
  };

  const deleteMeal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('meal_details')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTodayMeals(prev => prev.filter(m => m.id !== id));
      toast({ title: "Comida eliminada" });
    } catch (error) {
      console.error('Error deleting meal:', error);
    }
  };

  return {
    loading,
    todayMeals,
    analyzeFood,
    getTodayTotals,
    getProgressPercentage,
    getRemainingCalories,
    deleteMeal,
    fetchTodayMeals,
    DAILY_GOALS,
  };
};
