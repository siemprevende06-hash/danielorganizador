import { supabase } from "@/integrations/supabase/client";
import { getSetting, setSetting } from "@/lib/settings";
import { legacyModeForRoutine } from "@/hooks/useRoutineBlocks";

/**
 * Plan diario almacenado en `daily_plans`.
 *
 * En algunos entornos la tabla tiene RLS activo pero sin política de INSERT,
 * así que el guardado directo falla con 42501. Para que la planificación no se
 * pierda, esos casos se respaldan en `app_settings` (misma base de datos) y se
 * leen de vuelta de forma transparente. Cuando la política RLS está bien, el
 * plan se guarda en `daily_plans` y se elimina el respaldo antiguo.
 */
export interface StoredDailyPlan {
  plan_date: string;
  mode?: string | null;
  routine_type?: string | null;
  block_assignments?: Record<string, string[]> | null;
  notes?: string | null;
}

const fallbackKey = (dateStr: string) => `daily_plan_${dateStr}`;

type SupabaseLikeError = {
  code?: string | null;
  message?: string | null;
};

function isRlsError(error: SupabaseLikeError | null | undefined): boolean {
  if (!error) return false;
  return (
    error.code === "42501" ||
    /row-level security|permission denied/i.test(error.message ?? "")
  );
}

async function loadFallback(dateStr: string): Promise<StoredDailyPlan | null> {
  const stored = await getSetting<StoredDailyPlan | null>(fallbackKey(dateStr));
  return stored && typeof stored === "object" ? stored : null;
}

export async function loadDailyPlan(dateStr: string): Promise<StoredDailyPlan | null> {
  const { data, error } = await supabase
    .from("daily_plans")
    .select("plan_date, mode, routine_type, block_assignments, notes")
    .eq("plan_date", dateStr)
    .maybeSingle();

  if (!error && data) return data as StoredDailyPlan;

  return loadFallback(dateStr);
}

export async function saveDailyPlan(
  plan: StoredDailyPlan,
): Promise<"daily_plans" | "app_settings"> {
  const { data: existing } = await supabase
    .from("daily_plans")
    .select("id, plan_date, mode, routine_type, block_assignments, notes")
    .eq("plan_date", plan.plan_date)
    .maybeSingle();

  const payload = {
    plan_date: plan.plan_date,
    mode: plan.mode ?? legacyModeForRoutine(plan.routine_type),
    routine_type: plan.routine_type ?? null,
    block_assignments: plan.block_assignments ?? {},
    notes: plan.notes ?? null,
  };

  const result = existing?.id
    ? await supabase
        .from("daily_plans")
        .update({
          routine_type: payload.routine_type,
          block_assignments: payload.block_assignments,
          notes: payload.notes,
        })
        .eq("id", existing.id)
    : await supabase.from("daily_plans").insert(payload);

  if (!result.error) {
    // Limpia un respaldo anterior para no dejar datos obsoletos.
    await supabase.from("app_settings").delete().eq("setting_key", fallbackKey(plan.plan_date));
    return "daily_plans";
  }

  if (!isRlsError(result.error)) throw result.error;

  console.warn(
    "daily_plans bloqueó la escritura por RLS; guardando el plan en app_settings:",
    result.error.message,
  );

  const previous: StoredDailyPlan = existing
    ? {
        plan_date: existing.plan_date,
        mode: existing.mode,
        routine_type: existing.routine_type,
        block_assignments: existing.block_assignments as Record<string, string[]> | null,
        notes: existing.notes,
      }
    : (await loadFallback(plan.plan_date)) ?? { plan_date: plan.plan_date };

  const merged: StoredDailyPlan = { ...previous, ...payload };

  const saved = await setSetting(fallbackKey(plan.plan_date), merged);
  if (!saved) throw result.error;

  return "app_settings";
}
