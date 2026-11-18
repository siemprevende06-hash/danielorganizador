import {
  FREE_BLOCK_ID_PREFIX,
  FREE_BLOCK_TITLE,
  isGymBlock,
  type SpeedBlockLike,
} from "@/lib/speedPlan";

/** Ajustes del día que modifican la rutina sin cambiar la rutina base. */
export interface DayBlockOverrides {
  /** Saltar el gym convierte su bloque en un horario libre asignable. */
  skipGym: boolean;
}

const EMPTY_OVERRIDES: DayBlockOverrides = { skipGym: false };

/** Lee los ajustes del día desde las notas JSON del plan diario. */
export function parseDayBlockOverrides(notes: unknown): DayBlockOverrides {
  if (!notes) return EMPTY_OVERRIDES;

  let value: unknown = notes;
  if (typeof notes === "string") {
    try {
      value = JSON.parse(notes);
    } catch {
      return EMPTY_OVERRIDES;
    }
  }
  if (!value || typeof value !== "object") return EMPTY_OVERRIDES;

  return {
    skipGym: (value as { skipGym?: unknown }).skipGym === true,
  };
}

/**
 * Aplica los ajustes del día a los bloques de la rutina.
 * Al saltar el gym se conserva el horario, pero el bloque pasa a llamarse
 * "Horario libre" y su id queda estable (`libre-<id>`) para poder planificarlo.
 */
export function applyDayBlockOverrides<T extends SpeedBlockLike>(
  blocks: T[],
  overrides: DayBlockOverrides,
): T[] {
  if (!overrides.skipGym) return blocks;

  let changed = false;
  const next = blocks.map(block => {
    if (!isGymBlock(block) || block.id.startsWith(FREE_BLOCK_ID_PREFIX)) return block;
    changed = true;
    return {
      ...block,
      id: `${FREE_BLOCK_ID_PREFIX}${block.id}`,
      title: FREE_BLOCK_TITLE,
      isFocusBlock: false,
      currentFocus: undefined,
      defaultFocus: undefined,
    } as T;
  });

  return changed ? next : blocks;
}
