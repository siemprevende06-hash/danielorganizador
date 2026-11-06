import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import {
  deriveSystemIntensity,
  emptySpeedPlan,
  normalizeSpeedPlan,
  summarizeSpeedPlan,
  type SpeedBlockLike,
  type SpeedPlan,
  type SpeedPlanSummary,
} from "@/lib/speedPlan";

interface UseDaySpeedPlanOptions {
  /** Guarda automáticamente al cambiar el plan (Daily > Plan). */
  autoSave?: boolean;
  /** Rutina activa, para crear la fila si aún no existe. */
  routineType?: string;
  /** Bloques del día, para resolver bloques naturales y guardar systemIntensity. */
  blocks?: SpeedBlockLike[];
}

function parseNotes(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  return typeof raw === "object" ? (raw as Record<string, unknown>) : {};
}

export function useDaySpeedPlan(date: Date | undefined, options: UseDaySpeedPlanOptions = {}) {
  const { autoSave = false, routineType, blocks } = options;
  const dateStr = format(date ?? new Date(), "yyyy-MM-dd");

  const [plan, setPlanState] = useState<SpeedPlan>(() => emptySpeedPlan());
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const planRef = useRef(plan);
  planRef.current = plan;
  const blocksRef = useRef<SpeedBlockLike[]>(blocks ?? []);
  blocksRef.current = blocks ?? [];
  const dirtyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    dirtyRef.current = false;
    setIsLoaded(false);
    setPlanState(emptySpeedPlan());

    (async () => {
      try {
        const { data } = await supabase
          .from("daily_plans")
          .select("notes")
          .eq("plan_date", dateStr)
          .maybeSingle();
        if (cancelled) return;
        const notes = parseNotes(data?.notes);
        setPlanState(normalizeSpeedPlan(notes.speedPlan));
      } catch {
        if (!cancelled) setPlanState(emptySpeedPlan());
      } finally {
        if (!cancelled) setIsLoaded(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dateStr]);

  const setPlan = useCallback((next: SpeedPlan | ((previous: SpeedPlan) => SpeedPlan)) => {
    setPlanState(previous => {
      const value = typeof next === "function" ? next(previous) : next;
      planRef.current = value;
      dirtyRef.current = true;
      return value;
    });
  }, []);

  const save = useCallback(
    async (override?: SpeedPlan): Promise<boolean> => {
      const value = override ?? planRef.current;
      setIsSaving(true);
      try {
        const { data } = await supabase
          .from("daily_plans")
          .select("id, notes")
          .eq("plan_date", dateStr)
          .maybeSingle();

        const notes = parseNotes(data?.notes);
        const intensity = deriveSystemIntensity(value, blocksRef.current);
        const nextNotes = {
          ...notes,
          speedPlan: value,
          systemIntensity: intensity,
          planIntensity: intensity,
        };

        if (data?.id) {
          const { error } = await supabase
            .from("daily_plans")
            .update({ notes: JSON.stringify(nextNotes) })
            .eq("id", data.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("daily_plans").insert({
            plan_date: dateStr,
            mode: routineType || "disciplina",
            routine_type: routineType || null,
            notes: JSON.stringify(nextNotes),
          });
          if (error) throw error;
        }

        dirtyRef.current = planRef.current === value ? false : dirtyRef.current;
        return true;
      } catch (error) {
        console.error("Error saving speed plan:", error);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [dateStr, routineType],
  );

  useEffect(() => {
    if (!autoSave || !isLoaded || !dirtyRef.current) return;
    const timer = setTimeout(() => {
      void save();
    }, 800);
    return () => clearTimeout(timer);
  }, [plan, autoSave, isLoaded, save]);

  const summary: SpeedPlanSummary = useMemo(
    () => summarizeSpeedPlan(plan, blocks ?? []),
    [plan, blocks],
  );

  return { plan, setPlan, save, isLoaded, isSaving, summary };
}
