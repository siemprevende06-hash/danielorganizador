import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RecipeIngredient {
  id?: string;
  recipe_id?: string;
  name: string;
  quantity?: number | null;
  unit?: string | null;
  sort_order?: number;
}

export interface Recipe {
  id: string;
  name: string;
  photo_url?: string | null;
  instructions?: string | null;
  servings?: number | null;
  category?: string | null;
  ingredients?: RecipeIngredient[];
}

export interface MealPlanRow {
  id: string;
  plan_date: string;
  meal_slot: string;
  recipe_id: string | null;
  recipe?: Recipe | null;
}

export function useRecipes() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [rRes, iRes] = await Promise.all([
      supabase.from("recipes").select("*").order("name"),
      supabase.from("recipe_ingredients").select("*").order("sort_order"),
    ]);
    const ingredientsByRecipe: Record<string, RecipeIngredient[]> = {};
    (iRes.data || []).forEach((ing: any) => {
      (ingredientsByRecipe[ing.recipe_id] ||= []).push(ing);
    });
    setRecipes(
      (rRes.data || []).map((r: any) => ({ ...r, ingredients: ingredientsByRecipe[r.id] || [] }))
    );
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createRecipe = async (data: Partial<Recipe> & { name: string; ingredients?: RecipeIngredient[] }) => {
    const { ingredients = [], ...rest } = data;
    const { data: rec, error } = await supabase.from("recipes").insert(rest).select().single();
    if (error || !rec) return null;
    if (ingredients.length) {
      await supabase.from("recipe_ingredients").insert(
        ingredients.map((ing, i) => ({ recipe_id: rec.id, name: ing.name, quantity: ing.quantity, unit: ing.unit, sort_order: i }))
      );
    }
    await load();
    return rec.id;
  };

  const updateRecipe = async (id: string, data: Partial<Recipe> & { ingredients?: RecipeIngredient[] }) => {
    const { ingredients, ...rest } = data;
    await supabase.from("recipes").update(rest).eq("id", id);
    if (ingredients) {
      await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
      if (ingredients.length) {
        await supabase.from("recipe_ingredients").insert(
          ingredients.map((ing, i) => ({ recipe_id: id, name: ing.name, quantity: ing.quantity, unit: ing.unit, sort_order: i }))
        );
      }
    }
    await load();
  };

  const deleteRecipe = async (id: string) => {
    await supabase.from("recipes").delete().eq("id", id);
    await load();
  };

  return { recipes, loading, createRecipe, updateRecipe, deleteRecipe, reload: load };
}

export function useMealPlan(startDate: string, endDate: string) {
  const [plan, setPlan] = useState<MealPlanRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("meal_plan")
      .select("*, recipe:recipes(*, ingredients:recipe_ingredients(*))")
      .gte("plan_date", startDate)
      .lte("plan_date", endDate);
    setPlan((data as any) || []);
    setLoading(false);
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  const assign = async (plan_date: string, meal_slot: string, recipe_id: string | null) => {
    if (recipe_id === null) {
      await supabase.from("meal_plan").delete().eq("plan_date", plan_date).eq("meal_slot", meal_slot);
    } else {
      await supabase
        .from("meal_plan")
        .upsert({ plan_date, meal_slot, recipe_id }, { onConflict: "plan_date,meal_slot" });
    }
    await load();
  };

  return { plan, loading, assign, reload: load };
}
