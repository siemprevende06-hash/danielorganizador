import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { toast } from "sonner";
export function useRoutineSteps(type) {
    const [steps, setSteps] = useState([]);
    const [completed, setCompleted] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [today, setToday] = useState(getCubaDate());
    const load = useCallback(async () => {
        setLoading(true);
        const [stepsRes, dailyRes] = await Promise.all([
            supabase
                .from("routine_steps")
                .select("*")
                .eq("routine_type", type)
                .order("sort_order"),
            supabase
                .from("routine_steps_daily")
                .select("step_id, completed")
                .eq("tracking_date", today)
                .eq("completed", true),
        ]);
        setSteps((stepsRes.data || []));
        setCompleted(new Set((dailyRes.data || []).map((r) => r.step_id)));
        setLoading(false);
    }, [type, today]);
    useEffect(() => {
        load();
    }, [load]);
    useMidnightReset(() => {
        setToday(getCubaDate());
        setCompleted(new Set());
    });
    const toggle = async (stepId) => {
        const isDone = completed.has(stepId);
        const next = new Set(completed);
        if (isDone)
            next.delete(stepId);
        else
            next.add(stepId);
        setCompleted(next);
        await supabase.from("routine_steps_daily").upsert({ step_id: stepId, tracking_date: today, completed: !isDone }, { onConflict: "step_id,tracking_date" });
    };
    const addStep = async (title, group_title) => {
        const sort = (steps[steps.length - 1]?.sort_order ?? -1) + 1;
        const group_id = group_title?.toLowerCase().replace(/\s+/g, "-") || null;
        const { data, error } = await supabase
            .from("routine_steps")
            .insert({ routine_type: type, title, group_title: group_title || null, group_id, sort_order: sort })
            .select()
            .single();
        if (error) {
            toast.error(error.message);
        }
        else if (data) {
            setSteps([...steps, data]);
        }
    };
    const removeStep = async (id) => {
        await supabase.from("routine_steps").delete().eq("id", id);
        setSteps(steps.filter((s) => s.id !== id));
    };
    const updateStep = async (id, updates) => {
        await supabase.from("routine_steps").update(updates).eq("id", id);
        setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    };
    return { steps, completed, loading, toggle, addStep, removeStep, updateStep, reload: load };
}
