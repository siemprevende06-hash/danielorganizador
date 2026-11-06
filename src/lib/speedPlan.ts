import {
  DAY_SYSTEMS,
  findDaySystemMeta,
  systemSpeedOptions,
  type DaySystem,
  type SystemSpeed,
} from "@/lib/daySystems";

/** Campos mínimos de un bloque de rutina que necesita el plan de velocidad. */
export interface SpeedBlockLike {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  isFocusBlock?: boolean;
  currentFocus?: string;
  defaultFocus?: string;
}

export interface SpeedPlanFragment {
  id: string;
  start: string;
  end: string;
  /** Vacío = tramo sin asignar. "none" no se usa en fragmentos. */
  systemId: string;
}

export type SpeedBlockPlan =
  | { kind: "whole"; systemId: string }
  | { kind: "fragments"; fragments: SpeedPlanFragment[] };

export interface SpeedPlan {
  version: 1;
  blocks: Record<string, SpeedBlockPlan>;
}

export type SpeedState = "sin-plan" | "sin-dosis" | "racha" | "minimo" | "maximo" | "extra";

export interface SystemDose {
  systemId: string;
  name: string;
  areaId: string;
  areaName: string;
  plannedMinutes: number;
  fragmentMinutes: number;
  wholeMinutes: number;
  state: SpeedState;
  minMinutes: number;
  maxMinutes: number;
  streakMinutes: number;
  extraMinutes: number;
  order: number;
}

export interface SpeedPlanSummary {
  doses: SystemDose[];
  bySystem: Record<string, SystemDose>;
  totalMinutes: number;
}

export interface FragmentSlot {
  start: string;
  end: string;
  minutes: number;
}

export function emptySpeedPlan(): SpeedPlan {
  return { version: 1, blocks: {} };
}

export function parseTimeToMinutes(time: string): number {
  const [h, m] = String(time || "0:00").split(":").map(Number);
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

function timeFromMinutes(total: number): string {
  const normalized = ((total % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string): number {
  const a = parseTimeToMinutes(start);
  let b = parseTimeToMinutes(end);
  if (b < a) b += 24 * 60;
  return Math.max(0, b - a);
}

export function blockDurationMinutes(block: SpeedBlockLike): number {
  return minutesBetween(block.startTime, block.endTime);
}

export function isDeepWorkBlock(block: SpeedBlockLike): boolean {
  const title = block.title.toLowerCase();
  return title.includes("deep work") || (block.id.includes("deep") && title.includes("bloque"));
}

export function isExtraBlock(block: SpeedBlockLike): boolean {
  return block.title.toLowerCase().includes("bloque extra") || block.id.includes("bloque-extra");
}

/** Solo Deep Work y Bloque Extra se fragmentan. */
export function isFragmentableBlock(block: SpeedBlockLike): boolean {
  return isDeepWorkBlock(block) || isExtraBlock(block);
}

function focusToSystem(focus?: string): string | null {
  switch (focus) {
    case "universidad":
    case "emprendimiento":
    case "proyectos":
    case "idiomas":
    case "musica":
    case "lectura":
    case "ajedrez":
    case "game":
      return focus;
    case "general":
    case "tareas":
      return "tareas";
    default:
      return null;
  }
}

/**
 * Sistema natural de un bloque completo.
 * Los bloques ambiguos (almuerzo, ocio, comida) no se asignan solos.
 */
export function naturalSystemForBlock(block: SpeedBlockLike): string | null {
  const title = block.title.toLowerCase();
  if (
    title.includes("almuerzo") ||
    title.includes("comida") ||
    title.includes("desayuno") ||
    title.includes("merienda") ||
    title.includes("ocio")
  ) {
    return null;
  }
  if (title.includes("lectura") || title.includes("podcast")) return "lectura";
  if (title.includes("idiomas")) return "idiomas";
  if (title.includes("música") || title.includes("musica") || title.includes("piano") || title.includes("guitarra")) {
    return "musica";
  }
  if (title.startsWith("ajedrez")) return "ajedrez";
  if (title.includes("game") || title.includes("seducci")) return "game";
  return null;
}

/** Sistema automático de un bloque entero, si se puede inferir. */
export function autoSystemForBlock(block: SpeedBlockLike): string | null {
  const natural = naturalSystemForBlock(block);
  if (natural) return natural;
  if (block.isFocusBlock || block.title.toLowerCase().includes("focus")) {
    return focusToSystem(block.currentFocus) || focusToSystem(block.defaultFocus);
  }
  return null;
}

/** Bloques donde tiene sentido mostrar el control de velocidad. */
export function showSpeedPlanControl(block: SpeedBlockLike): boolean {
  if (isFragmentableBlock(block)) return true;
  if (block.isFocusBlock) return true;
  if (naturalSystemForBlock(block)) return true;
  const title = block.title.toLowerCase();
  return (
    title.includes("ocio") ||
    title.includes("entretenimiento") ||
    title.includes("almuerzo") ||
    title.includes("video")
  );
}

/**
 * Tramos disponibles para un bloque fragmentable.
 * Deep Work absorbe hasta 10 min del descanso siguiente; el 3er Deep Work,
 * que no tiene descanso antes del almuerzo, queda en 30/30/20.
 */
export function fragmentSlots(block: SpeedBlockLike, nextBlock?: SpeedBlockLike): FragmentSlot[] {
  let available = blockDurationMinutes(block);

  if (isDeepWorkBlock(block) && nextBlock) {
    const gap = parseTimeToMinutes(nextBlock.startTime) - parseTimeToMinutes(block.endTime);
    if (gap > 0) available += Math.min(gap, 10);
  }

  const chunks: number[] = [];
  let remaining = available;
  while (remaining > 0) {
    const chunk = Math.min(30, remaining);
    chunks.push(chunk);
    remaining -= chunk;
  }

  // Evita un tramo final residual de menos de 10 min.
  if (chunks.length > 1 && chunks[chunks.length - 1] < 10) {
    const last = chunks.pop() as number;
    chunks[chunks.length - 1] += last;
  }

  let cursor = parseTimeToMinutes(block.startTime);
  return chunks.map(minutes => {
    const start = timeFromMinutes(cursor);
    cursor += minutes;
    return { start, end: timeFromMinutes(cursor), minutes };
  });
}

/**
 * Fin visible del bloque padre. Si los fragmentos absorben el descanso,
 * el padre se extiende hasta el último tramo; si no, conserva su fin real.
 */
export function blockEffectiveEnd(
  block: SpeedBlockLike,
  entry?: SpeedBlockPlan,
  _nextBlock?: SpeedBlockLike,
): string {
  if (entry?.kind !== "fragments" || entry.fragments.length === 0) return block.endTime;
  const last = entry.fragments.reduce(
    (latest, fragment) =>
      parseTimeToMinutes(fragment.end) > parseTimeToMinutes(latest) ? fragment.end : latest,
    block.endTime,
  );
  return parseTimeToMinutes(last) > parseTimeToMinutes(block.endTime) ? last : block.endTime;
}

export function normalizeSpeedPlan(raw: unknown): SpeedPlan {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      value = null;
    }
  }

  const blocks: Record<string, SpeedBlockPlan> = {};
  const rawBlocks = value && typeof value === "object" ? (value as { blocks?: unknown }).blocks : null;

  if (rawBlocks && typeof rawBlocks === "object") {
    for (const [blockId, entry] of Object.entries(rawBlocks as Record<string, unknown>)) {
      if (!entry || typeof entry !== "object") continue;
      const candidate = entry as Record<string, unknown>;

      if (candidate.kind === "whole" && typeof candidate.systemId === "string" && candidate.systemId.trim()) {
        blocks[blockId] = { kind: "whole", systemId: candidate.systemId };
        continue;
      }

      if (candidate.kind === "fragments" && Array.isArray(candidate.fragments)) {
        const fragments: SpeedPlanFragment[] = [];
        candidate.fragments.forEach((fragment, index) => {
          if (!fragment || typeof fragment !== "object") return;
          const f = fragment as Record<string, unknown>;
          if (typeof f.start !== "string" || typeof f.end !== "string") return;
          if (!/^\d{1,2}:\d{2}$/.test(f.start) || !/^\d{1,2}:\d{2}$/.test(f.end)) return;
          const systemId = typeof f.systemId === "string" ? f.systemId : "";
          fragments.push({
            id: typeof f.id === "string" && f.id ? f.id : `${blockId}-f${index}`,
            start: f.start,
            end: f.end,
            systemId,
          });
        });
        if (fragments.length > 0) {
          blocks[blockId] = { kind: "fragments", fragments };
        }
      }
    }
  }

  return { version: 1, blocks };
}

export function setWholeBlock(plan: SpeedPlan, blockId: string, systemId: string): SpeedPlan {
  return {
    ...plan,
    blocks: {
      ...plan.blocks,
      [blockId]: { kind: "whole", systemId },
    },
  };
}

export function setFragmentBlock(
  plan: SpeedPlan,
  blockId: string,
  fragments: SpeedPlanFragment[],
): SpeedPlan {
  return {
    ...plan,
    blocks: {
      ...plan.blocks,
      [blockId]: { kind: "fragments", fragments },
    },
  };
}

export function clearBlockPlan(plan: SpeedPlan, blockId: string): SpeedPlan {
  const blocks = { ...plan.blocks };
  delete blocks[blockId];
  return { ...plan, blocks };
}

export function systemMinMax(system: DaySystem): { min: number; max: number } {
  const options = systemSpeedOptions(system);
  return {
    min: options.find(option => option.id === "minimo")?.minutes ?? 0,
    max: options.find(option => option.id === "maximo")?.minutes ?? 0,
  };
}

export function speedStateForMinutes(
  minutes: number,
  minMinutes: number,
  maxMinutes: number,
  streakMinutes: number,
): SpeedState {
  if (minutes <= 0) return "sin-plan";
  if (streakMinutes > 0 && minutes >= streakMinutes && minutes < minMinutes) return "racha";
  if (minutes < minMinutes) return "sin-dosis";
  if (maxMinutes > 0 && minutes > maxMinutes) return "extra";
  if (maxMinutes > 0 && minutes >= maxMinutes) return "maximo";
  return "minimo";
}

export function speedStateLabel(state: SpeedState, extraMinutes = 0): string {
  switch (state) {
    case "racha":
      return "Racha";
    case "minimo":
      return "Mínimo";
    case "maximo":
      return "Máximo";
    case "extra":
      return `Máximo + ${Math.max(0, extraMinutes)} extra`;
    case "sin-dosis":
      return "Sin dosis";
    default:
      return "Sin planificar";
  }
}

/** Etiqueta corta de una dosis ya calculada. */
export function doseLabel(dose: Pick<SystemDose, "state" | "extraMinutes">): string {
  return speedStateLabel(dose.state, dose.extraMinutes);
}

export function describeSystemMinutes(
  systemId: string,
  minutes: number,
): { name: string; state: SpeedState; label: string; minutes: number } | null {
  const meta = findDaySystemMeta(systemId);
  if (!meta) return null;
  const { min, max } = systemMinMax(meta.system);
  const state = speedStateForMinutes(minutes, min, max, meta.system.streakMinutes);
  return {
    name: meta.system.name,
    state,
    label: speedStateLabel(state, Math.max(0, minutes - max)),
    minutes,
  };
}

export function summarizeSpeedPlan(
  plan: SpeedPlan | null | undefined,
  blocks: SpeedBlockLike[] | null | undefined,
): SpeedPlanSummary {
  const bySystem: Record<string, SystemDose> = {};
  let order = 0;

  for (const area of DAY_SYSTEMS) {
    for (const system of area.systems) {
      const { min, max } = systemMinMax(system);
      bySystem[system.id] = {
        systemId: system.id,
        name: system.name,
        areaId: area.id,
        areaName: area.name,
        plannedMinutes: 0,
        fragmentMinutes: 0,
        wholeMinutes: 0,
        state: "sin-plan",
        minMinutes: min,
        maxMinutes: max,
        streakMinutes: system.streakMinutes,
        extraMinutes: 0,
        order: order++,
      };
    }
  }

  const add = (systemId: string, minutes: number, kind: "whole" | "fragment") => {
    if (!systemId || systemId === "none" || minutes <= 0) return;
    const dose = bySystem[systemId];
    if (!dose) return;
    dose.plannedMinutes += minutes;
    if (kind === "fragment") dose.fragmentMinutes += minutes;
    else dose.wholeMinutes += minutes;
  };

  for (const block of blocks ?? []) {
    const entry = plan?.blocks?.[block.id];

    if (entry?.kind === "fragments") {
      for (const fragment of entry.fragments) {
        add(fragment.systemId, minutesBetween(fragment.start, fragment.end), "fragment");
      }
      continue;
    }

    if (entry?.kind === "whole") {
      add(entry.systemId, blockDurationMinutes(block), "whole");
      continue;
    }

    const auto = autoSystemForBlock(block);
    if (auto) add(auto, blockDurationMinutes(block), "whole");
  }

  const doses = Object.values(bySystem).sort((a, b) => a.order - b.order);
  for (const dose of doses) {
    dose.state = speedStateForMinutes(
      dose.plannedMinutes,
      dose.minMinutes,
      dose.maxMinutes,
      dose.streakMinutes,
    );
    dose.extraMinutes = Math.max(0, dose.plannedMinutes - dose.maxMinutes);
  }

  return {
    doses,
    bySystem,
    totalMinutes: doses.reduce((total, dose) => total + dose.plannedMinutes, 0),
  };
}

export function plannedMinutesForSystem(
  plan: SpeedPlan | null | undefined,
  blocks: SpeedBlockLike[] | null | undefined,
  systemId: string,
): number {
  return summarizeSpeedPlan(plan, blocks).bySystem[systemId]?.plannedMinutes ?? 0;
}

/** Espejo para consumidores antiguos que solo entienden minimo/maximo/extra. */
export function deriveSystemIntensity(
  plan: SpeedPlan | null | undefined,
  blocks: SpeedBlockLike[] | null | undefined,
): Record<string, SystemSpeed> {
  const summary = summarizeSpeedPlan(plan, blocks);
  const result: Record<string, SystemSpeed> = {};
  for (const dose of summary.doses) {
    if (dose.plannedMinutes <= 0) continue;
    if (dose.state === "extra") result[dose.systemId] = "extra";
    else if (dose.state === "maximo") result[dose.systemId] = "maximo";
    else if (dose.state === "minimo") result[dose.systemId] = "minimo";
  }
  return result;
}
