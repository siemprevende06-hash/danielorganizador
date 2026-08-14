import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export const MAIN_LIFTS = [
    { key: "press_banca", name: "Press de Banca" },
    { key: "biceps", name: "Bíceps (curl)" },
    { key: "triceps", name: "Tríceps" },
    { key: "hombro", name: "Press Hombro" },
    { key: "dominadas", name: "Dominadas" },
];
export const useStrengthGoals = () => {
    const [goals, setGoals] = useState([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from("strength_goals").select("*").order("exercise_key");
        setGoals(data || []);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    const upsertGoal = async (g) => {
        const existing = goals.find(x => x.exercise_key === g.exercise_key);
        if (existing) {
            const { error } = await supabase.from("strength_goals").update(g).eq("id", existing.id);
            if (!error)
                setGoals(prev => prev.map(x => x.id === existing.id ? { ...x, ...g } : x));
            return { error };
        }
        else {
            const { data, error } = await supabase.from("strength_goals").insert({
                exercise_key: g.exercise_key,
                exercise_name: g.exercise_name,
                current_weight_kg: g.current_weight_kg || 0,
                current_reps: g.current_reps || 0,
                target_weight_kg: g.target_weight_kg || 0,
                target_reps: g.target_reps || 0,
                notes: g.notes,
            }).select().single();
            if (!error && data)
                setGoals(prev => [...prev, data]);
            return { error };
        }
    };
    return { goals, loading, upsertGoal, refetch: load };
};
