import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { effectiveRoutineId } from "@/gym2/lib/history";
import { MUSCLE_NAME, loadOfRoutine, rankOf } from "@/gym2/lib/muscles";
import { GYM_STATE_KEY, type GymState } from "@/gym2/lib/types";
import type { GymDayPlanSummary } from "@/lib/systemRules";

function normalizeState(raw: unknown): GymState | null {
  if (!raw || typeof raw !== "object") return null;
  const state = raw as GymState;
  return {
    ...state,
    routines: Array.isArray(state.routines) ? state.routines : [],
    week:
      state.week && typeof state.week === "object" ? state.week : {},
    dayPlan:
      state.dayPlan && typeof state.dayPlan === "object" ? state.dayPlan : {},
  };
}

function readLocalState(): GymState | null {
  try {
    const raw = localStorage.getItem(GYM_STATE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function hasWeeklyPlan(state: GymState | null): boolean {
  if (!state) return false;
  const week = state.week || {};
  const hasWeek = Object.values(week).some(Boolean);
  return hasWeek || Object.keys(state.dayPlan || {}).length > 0;
}

/**
 * Plan de Gym 2.0 para un día concreto: rutina asignada en la semana
 * (o el override del día) y grupos musculares que toca trabajar.
 * Lee el mismo estado que la página Gym 2.0: localStorage al instante y,
 * si hay una versión más nueva en Supabase, la usa.
 */
export function useGymDayPlan(dateISO: string): GymDayPlanSummary | null {
  const [state, setState] = useState<GymState | null>(() => readLocalState());

  useEffect(() => {
    let alive = true;

    const loadRemote = async () => {
      try {
        let query = (supabase as any)
          .from("gym20_data")
          .select("state, updated_at");

        // Igual que el sync de Gym 2.0: si hay sesión, solo su fila.
        try {
          const { data: auth } = await supabase.auth.getUser();
          if (auth?.user?.id) query = query.eq("user_id", auth.user.id);
        } catch {
          /* anónimo: sin filtro por usuario */
        }

        const { data } = await query
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!alive || !data?.state) return;

        const remote = normalizeState(data.state);
        if (!remote) return;
        const local = readLocalState();
        const remoteTs = Number(remote?._ts ?? data.updated_at) || 0;
        const localTs = Number(local?._ts) || 0;

        if (!local || remoteTs > localTs) setState(remote);
      } catch {
        // Sin conexión: se mantiene el estado local de Gym 2.0.
      }
    };

    loadRemote();

    const onStorage = (event: StorageEvent) => {
      if (event.key === GYM_STATE_KEY) setState(readLocalState());
    };
    window.addEventListener("storage", onStorage);

    return () => {
      alive = false;
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return useMemo(() => {
    // Sin estado local todavía: no hay plan cargado (se muestra "sin plan").
    if (!state) {
      return { status: "sin-plan" } as GymDayPlanSummary;
    }

    const override = state.dayPlan?.[dateISO];
    if (override === "rest") {
      return { status: "descanso" } as GymDayPlanSummary;
    }

    if (!hasWeeklyPlan(state)) {
      return { status: "sin-plan" } as GymDayPlanSummary;
    }

    const routineId = effectiveRoutineId(state, dateISO);
    if (!routineId) {
      // Hay plan semanal, pero hoy no toca entrenar: descanso programado.
      return { status: "descanso" } as GymDayPlanSummary;
    }

    const routine = state.routines?.find(r => r.id === routineId) ?? null;
    if (!routine) {
      return { status: "sin-plan" } as GymDayPlanSummary;
    }

    const { worked } = rankOf(loadOfRoutine(routine));
    const muscles = worked.slice(0, 6).map(m => MUSCLE_NAME[m] ?? m);

    return {
      status: "rutina",
      routineName: routine.name,
      muscles,
      muscleCount: worked.length,
    } as GymDayPlanSummary;
  }, [state, dateISO]);
}
