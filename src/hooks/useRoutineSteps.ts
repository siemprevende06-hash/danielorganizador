import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCubaDate } from "@/lib/cubaTime";
import { useMidnightReset } from "@/hooks/useMidnightReset";
import { getSetting, setSetting } from "@/lib/settings";
import { toast } from "sonner";

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

/** Tarjeta (grupo de tareas) de una rutina. */
export interface RoutineCard {
  id: string;
  title: string;
  cover_url: string | null;
}

/** Id de la tarjeta que agrupa las tareas que todavía no tienen tarjeta. */
export const UNGROUPED_CARD_ID = "__sin_tarjeta";
const UNGROUPED_CARD_TITLE = "Sin tarjeta";

/** Las tarjetas se guardan como JSON en app_settings (misma base de datos). */
const CARDS_SETTING_KEY = "routine_cards_v1";

type CardsByType = Partial<Record<RoutineType, RoutineCard[]>>;

/** Tarjeta a la que pertenece una tarea. */
export const stepCardId = (step: Pick<RoutineStep, "group_id">) =>
  step.group_id && step.group_id.trim() ? step.group_id : UNGROUPED_CARD_ID;

/**
 * Une las tarjetas guardadas con los grupos que ya existen en las tareas.
 * Así las rutinas que ya tenían tareas siguen funcionando sin migrar nada.
 */
const buildCards = (steps: RoutineStep[], saved: RoutineCard[] | undefined): RoutineCard[] => {
  const cards: RoutineCard[] = (saved ?? []).map((c) => ({
    id: c.id,
    title: c.title,
    cover_url: c.cover_url ?? null,
  }));
  const known = new Set(cards.map((c) => c.id));

  for (const step of steps) {
    const id = stepCardId(step);
    if (known.has(id)) continue;
    known.add(id);
    cards.push({
      id,
      title: step.group_title?.trim() || (id === UNGROUPED_CARD_ID ? UNGROUPED_CARD_TITLE : "Tarjeta"),
      cover_url: null,
    });
  }

  return cards;
};

export function useRoutineSteps(type: RoutineType) {
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [cards, setCards] = useState<RoutineCard[]>([]);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState(getCubaDate());

  const stepsRef = useRef<RoutineStep[]>([]);
  const cardsRef = useRef<RoutineCard[]>([]);
  const settingsRef = useRef<CardsByType>({});

  const applySteps = useCallback((next: RoutineStep[]) => {
    stepsRef.current = next;
    setSteps(next);
  }, []);

  const applyCards = useCallback((next: RoutineCard[]) => {
    cardsRef.current = next;
    setCards(next);
  }, []);

  /** Guarda el orden/portadas de las tarjetas en app_settings. */
  const commitCards = useCallback(
    async (next: RoutineCard[]) => {
      applyCards(next);
      const merged: CardsByType = { ...settingsRef.current, [type]: next };
      settingsRef.current = merged;
      const ok = await setSetting(CARDS_SETTING_KEY, merged);
      if (!ok) toast.error("No se pudieron guardar las tarjetas");
    },
    [applyCards, type]
  );

  const load = useCallback(async () => {
    setLoading(true);
    const [stepsRes, dailyRes, saved] = await Promise.all([
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
      getSetting<CardsByType>(CARDS_SETTING_KEY),
    ]);

    if (stepsRes.error) toast.error(stepsRes.error.message);

    const rows = (stepsRes.data ?? []) as RoutineStep[];
    applySteps(rows);
    settingsRef.current = (saved ?? {}) as CardsByType;
    applyCards(buildCards(rows, settingsRef.current[type]));
    setCompleted(new Set((dailyRes.data ?? []).map((r: { step_id: string }) => r.step_id)));
    setLoading(false);
  }, [applyCards, applySteps, type, today]);

  useEffect(() => {
    load();
  }, [load]);

  useMidnightReset(() => {
    setToday(getCubaDate());
    setCompleted(new Set());
  });

  // ── Tareas ────────────────────────────────────────────────────────────────

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

  const addStep = async (title: string, cardId: string) => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const card = cardsRef.current.find((c) => c.id === cardId);
    const groupId = cardId === UNGROUPED_CARD_ID ? null : cardId;
    const sort = stepsRef.current.reduce((max, s) => Math.max(max, s.sort_order ?? 0), -1) + 1;

    const { data, error } = await supabase
      .from("routine_steps")
      .insert({
        routine_type: type,
        title: trimmed,
        group_id: groupId,
        group_title: card?.title ?? null,
        sort_order: sort,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      return null;
    }
    const row = data as RoutineStep;
    applySteps([...stepsRef.current, row]);
    return row;
  };

  const removeStep = async (id: string) => {
    const { error } = await supabase.from("routine_steps").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    applySteps(stepsRef.current.filter((s) => s.id !== id));
  };

  const updateStep = async (id: string, updates: Partial<RoutineStep>) => {
    const { error } = await supabase.from("routine_steps").update(updates).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    applySteps(stepsRef.current.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  /** Mueve una tarea de una tarjeta a otra (arrastrar y soltar). */
  const moveStep = async (taskId: string, cardId: string) => {
    const task = stepsRef.current.find((s) => s.id === taskId);
    if (!task || stepCardId(task) === cardId) return;
    const card = cardsRef.current.find((c) => c.id === cardId);
    const groupId = cardId === UNGROUPED_CARD_ID ? null : cardId;
    const groupTitle = card?.title ?? null;

    const { error } = await supabase
      .from("routine_steps")
      .update({ group_id: groupId, group_title: groupTitle })
      .eq("id", taskId);

    if (error) {
      toast.error(error.message);
      return;
    }
    applySteps(
      stepsRef.current.map((s) =>
        s.id === taskId ? { ...s, group_id: groupId, group_title: groupTitle } : s
      )
    );
  };

  // ── Tarjetas ──────────────────────────────────────────────────────────────

  const createCard = async (title: string, coverUrl?: string | null) => {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const card: RoutineCard = {
      id: `card_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: trimmed,
      cover_url: coverUrl ?? null,
    };
    await commitCards([...cardsRef.current, card]);
    return card;
  };

  const renameCard = async (cardId: string, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    await commitCards(
      cardsRef.current.map((c) => (c.id === cardId ? { ...c, title: trimmed } : c))
    );
    if (cardId !== UNGROUPED_CARD_ID) {
      await supabase
        .from("routine_steps")
        .update({ group_title: trimmed })
        .eq("routine_type", type)
        .eq("group_id", cardId);
      applySteps(
        stepsRef.current.map((s) =>
          stepCardId(s) === cardId ? { ...s, group_title: trimmed } : s
        )
      );
    }
  };

  const setCardCover = async (cardId: string, coverUrl: string | null) => {
    await commitCards(
      cardsRef.current.map((c) => (c.id === cardId ? { ...c, cover_url: coverUrl } : c))
    );
  };

  const removeCardCover = async (cardId: string) => {
    await setCardCover(cardId, null);
  };

  const deleteCard = async (cardId: string) => {
    let query = supabase.from("routine_steps").delete().eq("routine_type", type);
    query = cardId === UNGROUPED_CARD_ID ? query.is("group_id", null) : query.eq("group_id", cardId);
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    applySteps(stepsRef.current.filter((s) => stepCardId(s) !== cardId));
    await commitCards(cardsRef.current.filter((c) => c.id !== cardId));
  };

  return {
    steps,
    cards,
    completed,
    loading,
    toggle,
    addStep,
    removeStep,
    updateStep,
    moveStep,
    createCard,
    renameCard,
    setCardCover,
    removeCardCover,
    deleteCard,
    reload: load,
  };
}
