import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";
import { effectiveRoutineId } from "./history";
import type { GymState } from "./types";

const STREAK_MAX_MINUTES = 30;
const GYM_HABIT = "entrenamiento-fisico";
const DEFAULT_AREA_GOALS: Record<string, number> = { gym: 60 };

/** Fecha de hoy en zona Cuba */
function cubaToday(): string {
  return getCubaDate();
}

async function readBase(today: string) {
  const { data: existing } = await supabase
    .from("daily_systems_tracking")
    .select("*")
    .eq("tracking_date", today)
    .maybeSingle();
  return (existing || {
    tracking_date: today,
    completions: {},
    time_data: {},
    count_data: {},
    water_data: {},
    block_completions: {},
    skipped: {},
    active_focus_areas: ["universidad", "emprendimiento", "proyectos"],
  }) as any;
}

/**
 * Marca el día de hoy en la página Esfuerzo (daily_systems_tracking) como
 * día de entrenamiento, replicando el patrón de `useWorkoutTracking.syncWorkoutDuration`
 * + `withStreakMirror` + `syncToAreaStats`.
 */
export async function markGymDayInDaily(minutes: number) {
  const today = cubaToday();
  try {
    const base = await readBase(today);

    const completions: Record<string, any> = { ...(base.completions || {}) };
    completions[GYM_HABIT] = true;
    completions[`streak:${GYM_HABIT}`] =
      minutes >= STREAK_MAX_MINUTES ? "max" : "min";

    const timeData: Record<string, number> = { ...(base.time_data || {}) };
    timeData[GYM_HABIT] = minutes;

    const skipped: Record<string, boolean> = { ...(base.skipped || {}) };
    delete skipped[GYM_HABIT];

    await supabase.from("daily_systems_tracking").upsert(
      {
        ...base,
        workout_duration: minutes,
        workout_intensity: base.workout_intensity || "moderate",
        completions,
        time_data: timeData,
        skipped,
      },
      { onConflict: "tracking_date" }
    );

    await supabase
      .from("daily_area_stats")
      .upsert(
        {
          area_id: "gym",
          stat_date: today,
          time_spent_minutes: minutes,
          time_goal_minutes: DEFAULT_AREA_GOALS["gym"] ?? 30,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "area_id,stat_date" }
      );
  } catch (err) {
    console.warn("[gym2] No se pudo sincronizar el día de gym:", err);
  }
}

/**
 * Marca un día como descanso (skipped) en la página Esfuerzo. Si ya se
 * completó entrenamiento ese día, se respeta el entrenamiento (no se marca
 * descanso). Devuelve true si quedó marcado como descanso.
 */
export async function markRestDayInDaily(day: string): Promise<boolean> {
  try {
    const base = await readBase(day);

    const completions: Record<string, any> = { ...(base.completions || {}) };
    const isDone = !!(completions[GYM_HABIT] || completions[`streak:${GYM_HABIT}`]);
    if (isDone) return false;

    const skipped: Record<string, boolean> = { ...(base.skipped || {}) };
    skipped[GYM_HABIT] = true;

    await supabase
      .from("daily_systems_tracking")
      .upsert(
        {
          ...base,
          completions,
          time_data: { ...(base.time_data || {}) },
          skipped,
        },
        { onConflict: "tracking_date" }
      );
    return true;
  } catch (err) {
    console.warn("[gym2] No se pudo marcar el descanso:", err);
    return false;
  }
}

/**
 * Sincroniza los descansos semanales de una semana (n días hacia el futuro)
 * en la página Esfuerzo. Un día sin rutina asignada se marca como descanso.
 */
export async function syncRestDays(S: GymState, days = 9) {
  const routines = new Set(S.routines.map((r) => r.id));
  for (let i = 0; i < days; i++) {
    const target = new Date();
    target.setDate(target.getDate() + i);
    const id = effectiveRoutineId(S, getCubaDate(target));
    const isReal = !!id && routines.has(id);
    if (!isReal) {
      await markRestDayInDaily(getCubaDate(target));
    }
  }
}