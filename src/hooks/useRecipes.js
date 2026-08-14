import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export function useRecipes() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        const [rRes, iRes] = await Promise.all([
            supabase.from("recipes").select("*").order("name"),
            supabase.from("recipe_ingredients").select("*").order("sort_order"),
        ]);
        const ingredientsByRecipe = {};
        (iRes.data || []).forEach((ing) => {
            var _a;
            (ingredientsByRecipe[_a = ing.recipe_id] || (ingredientsByRecipe[_a] = [])).push(ing);
        });
        setRecipes((rRes.data || []).map((r) => ({ ...r, ingredients: ingredientsByRecipe[r.id] || [] })));
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    const createRecipe = async (data) => {
        const { ingredients = [], ...rest } = data;
        const { data: rec, error } = await supabase.from("recipes").insert(rest).select().single();
        if (error || !rec)
            return null;
        if (ingredients.length) {
            await supabase.from("recipe_ingredients").insert(ingredients.map((ing, i) => ({
                recipe_id: rec.id,
                name: ing.name,
                quantity: ing.quantity,
                unit: ing.unit,
                sort_order: i,
                product_id: ing.product_id || null,
                quantity_for_recipe: ing.quantity_for_recipe || ing.quantity || null,
            })));
        }
        await load();
        return rec.id;
    };
    const updateRecipe = async (id, data) => {
        const { ingredients, ...rest } = data;
        await supabase.from("recipes").update(rest).eq("id", id);
        if (ingredients) {
            await supabase.from("recipe_ingredients").delete().eq("recipe_id", id);
            if (ingredients.length) {
                await supabase.from("recipe_ingredients").insert(ingredients.map((ing, i) => ({
                    recipe_id: id,
                    name: ing.name,
                    quantity: ing.quantity,
                    unit: ing.unit,
                    sort_order: i,
                    product_id: ing.product_id || null,
                    quantity_for_recipe: ing.quantity_for_recipe || ing.quantity || null,
                })));
            }
        }
        await load();
    };
    const deleteRecipe = async (id) => {
        await supabase.from("recipes").delete().eq("id", id);
        await load();
    };
    return { recipes, loading, createRecipe, updateRecipe, deleteRecipe, reload: load };
}
export function useMealPlan(startDate, endDate) {
    const [plan, setPlan] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        const { data } = await supabase
            .from("meal_plan")
            .select("*, recipe:recipes(*, ingredients:recipe_ingredients(*))")
            .gte("plan_date", startDate)
            .lte("plan_date", endDate);
        setPlan(data || []);
        setLoading(false);
    }, [startDate, endDate]);
    useEffect(() => { load(); }, [load]);
    const assign = async (plan_date, meal_slot, recipe_id) => {
        if (recipe_id === null) {
            await supabase.from("meal_plan").delete().eq("plan_date", plan_date).eq("meal_slot", meal_slot);
        }
        else {
            await supabase
                .from("meal_plan")
                .upsert({ plan_date, meal_slot, recipe_id }, { onConflict: "plan_date,meal_slot" });
        }
        await load();
    };
    return { plan, loading, assign, reload: load };
}
