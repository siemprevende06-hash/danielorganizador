import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";
import { useMidnightReset } from "@/hooks/useMidnightReset";

export type RoutineType = "activation" | "deactivation" | "morning_prep" | "weekend";

export interface RoutineStep {
  id: string;
  routine_type: RoutineType;
  group_id: string | null;
  group_title: string | null;
  title: string;
  duration_min: number | null;
  sort_order: number;
}

export function useRoutineSteps(type: RoutineType) {
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
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
    setSteps((stepsRes.data || []) as any);
    setCompleted(new Set((dailyRes.data || []).map((r: any) => r.step_id)));
    setLoading(false);
  }, [type, today]);

  useEffect(() => {
    load();
  }, [load]);

  useMidnightReset(() => {
    setToday(getCubaDate());
    setCompleted(new Set());
  });

  const toggle = async (stepId: string) => {
    const isDone = completed.has(stepId);
    const next = new Set(completed);
    if (isDone) next.delete(stepId);
    else next.add(stepId);
    setCompleted(next);
    await supabase.from("routine_steps_daily").upsert(
      { step_id: stepId, tracking_date: today, completed: !isDone },
      { onConflict: "step_id,tracking_date" }
    );
  };

  const addStep = async (title: string, group_title?: string) => {
    const sort = (steps[steps.length - 1]?.sort_order ?? -1) + 1;
    const group_id = group_title?.toLowerCase().replace(/\s+/g, "-") || null;
    const { data, error } = await supabase
      .from("routine_steps")
      .insert({ routine_type: type, title, group_title: group_title || null, group_id, sort_order: sort })
      .select()
      .single();
    if (!error && data) setSteps([...steps, data as any]);
  };

  const removeStep = async (id: string) => {
    await supabase.from("routine_steps").delete().eq("id", id);
    setSteps(steps.filter((s) => s.id !== id));
  };

  const updateStep = async (id: string, updates: Partial<RoutineStep>) => {
    await supabase.from("routine_steps").update(updates).eq("id", id);
    setSteps(steps.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  return { steps, completed, loading, toggle, addStep, removeStep, updateStep, reload: load };
}
