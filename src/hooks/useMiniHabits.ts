import { useEffect, useState } from "react";
import { getSetting } from "@/lib/settings";

export const MINI_HABITS_SETTING = "mini_habits_defs";

export interface MiniHabitDef {
  id: string;
  label: string;
  emoji: string;
}

/** Mismos defaults que la página Hábitos → sección "Mini Hábitos". */
export const DEFAULT_MINI_HABITS: MiniHabitDef[] = [
  { id: "mini-nofap", label: "No FAP", emoji: "🚫" },
  { id: "mini-nosocial", label: "No Redes Sociales +30min", emoji: "📵" },
];

function normalize(raw: unknown): MiniHabitDef[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (d): d is Record<string, unknown> =>
        !!d && typeof d === "object" && typeof (d as Record<string, unknown>).id === "string"
    )
    .map(d => ({
      id: String(d.id),
      label: typeof d.label === "string" ? d.label : String(d.id),
      emoji: typeof d.emoji === "string" ? d.emoji : "•",
    }));
}

/**
 * Mini hábitos reales de la página Hábitos (persisten en app_settings).
 * Si aún no hay ninguno guardado, devuelve los defaults sin escribir en la BD.
 */
export function useMiniHabits() {
  const [defs, setDefs] = useState<MiniHabitDef[]>(DEFAULT_MINI_HABITS);

  useEffect(() => {
    let alive = true;
    getSetting<MiniHabitDef[]>(MINI_HABITS_SETTING)
      .then(arr => {
        if (!alive) return;
        const list = normalize(arr);
        if (list.length > 0) setDefs(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  return { defs, ids: defs.map(d => d.id) };
}
