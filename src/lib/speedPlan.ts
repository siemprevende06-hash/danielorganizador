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
  /** Enfoque detallado del tramo (Universidad). */
  study?: BlockStudyPlan;
  /** Enfoque detallado del tramo (Emprendimiento o Proyectos). */
  work?: BlockWorkPlan;
}

/** Asignatura y tema que se estudiarán en un bloque (Universidad). */
export interface BlockStudyPlan {
  subjectId: string;
  subjectName: string;
  topicId: string | null;
  topicTitle: string | null;
}

export type BlockWorkKind = "emprendimiento" | "proyectos";

/** Emprendimiento o proyecto (y su tarea) en el que se trabajará en un bloque. */
export interface BlockWorkPlan {
  kind: BlockWorkKind;
  ownerId: string;
  ownerName: string;
  itemId: string | null;
  itemTitle: string | null;
}

export type SpeedBlockPlan =
  | { kind: "whole"; systemId: string; study?: BlockStudyPlan; work?: BlockWorkPlan }
  | { kind: "fragments"; fragments: SpeedPlanFragment[]; study?: BlockStudyPlan; work?: BlockWorkPlan };

export interface SpeedPlan {
  version: 1;
  blocks: Record<string, SpeedBlockPlan>;
}

/** Enfoque detallado de un bloque o tramo. Estudio y trabajo son excluyentes. */
export interface BlockFocus {
  study?: BlockStudyPlan;
  work?: BlockWorkPlan;
}

export type BlockFocusKind = "universidad" | BlockWorkKind;

/** Sistemas que admiten enfoque detallado (asignatura/tema o tarea). */
export const PROFESSIONAL_FOCUS_SYSTEM_IDS = ["universidad", "emprendimiento", "proyectos"] as const;

export type ProfessionalFocusSystemId = (typeof PROFESSIONAL_FOCUS_SYSTEM_IDS)[number];

export function isProfessionalFocusSystem(systemId: string): systemId is ProfessionalFocusSystemId {
  return (PROFESSIONAL_FOCUS_SYSTEM_IDS as readonly string[]).includes(systemId);
}

/** Tipo de enfoque que corresponde a un sistema, o null si no admite enfoque. */
export function focusKindForSystem(systemId: string): BlockFocusKind | null {
  if (systemId === "universidad") return "universidad";
  if (systemId === "emprendimiento" || systemId === "proyectos") return systemId;
  return null;
}

/** Sistema que corresponde a un tipo de enfoque. */
export function systemForFocusKind(kind: BlockFocusKind): ProfessionalFocusSystemId {
  return kind;
}

export function hasFocus(focus: BlockFocus | null | undefined): boolean {
  return Boolean(focus?.study || focus?.work);
}

/** Enfoque de un bloque entero. */
export function blockFocusOf(entry: SpeedBlockPlan | undefined): BlockFocus {
  return {
    ...(entry?.study ? { study: entry.study } : {}),
    ...(entry?.work ? { work: entry.work } : {}),
  };
}

/** Enfoque de un tramo. */
export function fragmentFocusOf(fragment: SpeedPlanFragment | undefined): BlockFocus {
  return {
    ...(fragment?.study ? { study: fragment.study } : {}),
    ...(fragment?.work ? { work: fragment.work } : {}),
  };
}

/** Conserva solo el enfoque compatible con un sistema (estudio→Universidad, trabajo→su tipo). */
export function focusForSystem(focus: BlockFocus, systemId: string): BlockFocus {
  if (focus.study && systemId === "universidad") return { study: focus.study };
  if (focus.work && focus.work.kind === systemId) return { work: focus.work };
  return {};
}

export interface BlockFocusSummary {
  kind: BlockFocusKind;
  primary: string;
  secondary: string | null;
}

/** Resumen legible del enfoque para listas, tarjetas y modo tablet. */
export function describeBlockFocus(focus: BlockFocus): BlockFocusSummary | null {
  if (focus.study) {
    return {
      kind: "universidad",
      primary: focus.study.subjectName.trim() || "Universidad",
      secondary: focus.study.topicTitle?.trim() || null,
    };
  }
  if (focus.work) {
    return {
      kind: focus.work.kind,
      primary: focus.work.ownerName.trim()
        || (focus.work.kind === "emprendimiento" ? "Emprendimiento" : "Proyectos"),
      secondary: focus.work.itemTitle?.trim() || null,
    };
  }
  return null;
}

/** Enfoque visible de cada tramo de un bloque (o del bloque entero). */
export interface BlockFocusSlot {
  fragmentId: string | null;
  start: string;
  end: string;
  systemId: string;
  focus: BlockFocus;
}

export function blockFocusSlots(
  block: SpeedBlockLike,
  entry: SpeedBlockPlan | undefined,
): BlockFocusSlot[] {
  if (entry?.kind === "fragments") {
    return entry.fragments.map(fragment => ({
      fragmentId: fragment.id,
      start: fragment.start,
      end: fragment.end,
      systemId: fragment.systemId,
      focus: fragmentFocusOf(fragment),
    }));
  }
  return [{
    fragmentId: null,
    start: block.startTime,
    end: block.endTime,
    systemId: entry?.kind === "whole" ? entry.systemId : "",
    focus: blockFocusOf(entry),
  }];
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
  // El Bloque Extra puede reutilizar `isFocusBlock` en algunos modos de rutina,
  // así que se excluye antes de tratar Focus como Deep Work.
  if (isExtraBlock(block)) return false;
  const title = block.title.toLowerCase().trim();
  return (
    block.isFocusBlock === true ||
    title.includes("deep work") ||
    (block.id.includes("deep") && title.includes("bloque")) ||
    title === "focus" ||
    title.startsWith("focus ")
  );
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
    case "gym":
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
  if (title.includes("gym") || title.includes("entreno") || title.includes("gimnasio")) return "gym";
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

/**
 * Solo Deep Work, Focus y Bloque Extra muestran control de planificación.
 * Los bloques acumulativos (Gym, Lectura, Idiomas, Música, Almuerzo, Ocio...)
 * se rigen por su título y no se asignan a mano.
 */
export function showSpeedPlanControl(block: SpeedBlockLike): boolean {
  return isDeepWorkBlock(block) || isExtraBlock(block);
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
      const study = normalizeBlockStudy(candidate.study);
      const work = normalizeBlockWork(candidate.work);

      if (candidate.kind === "whole" && typeof candidate.systemId === "string" && candidate.systemId.trim()) {
        blocks[blockId] = {
          kind: "whole",
          systemId: candidate.systemId,
          ...(study ? { study } : {}),
          ...(work ? { work } : {}),
        };
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
          const fragmentStudy = normalizeBlockStudy(f.study);
          const fragmentWork = normalizeBlockWork(f.work);
          fragments.push({
            id: typeof f.id === "string" && f.id ? f.id : `${blockId}-f${index}`,
            start: f.start,
            end: f.end,
            systemId,
            ...(fragmentStudy ? { study: fragmentStudy } : {}),
            ...(fragmentWork ? { work: fragmentWork } : {}),
          });
        });
        if (fragments.length > 0) {
          // Compatibilidad: antes el enfoque vivía en el bloque completo aunque
          // estuviera fragmentado. Ahora se guarda en cada tramo.
          blocks[blockId] = {
            kind: "fragments",
            fragments: fragments.map(fragment => {
              if (study && !fragment.study && fragment.systemId === "universidad") {
                return { ...fragment, study };
              }
              if (work && !fragment.work && fragment.systemId === work.kind) {
                return { ...fragment, work };
              }
              return fragment;
            }),
          };
        }
      }
    }
  }

  return { version: 1, blocks };
}

function normalizeBlockStudy(raw: unknown): BlockStudyPlan | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (typeof value.subjectId !== "string" || !value.subjectId.trim()) return undefined;
  return {
    subjectId: value.subjectId,
    subjectName: typeof value.subjectName === "string" ? value.subjectName : "",
    topicId: typeof value.topicId === "string" && value.topicId.trim() ? value.topicId : null,
    topicTitle: typeof value.topicTitle === "string" && value.topicTitle.trim() ? value.topicTitle : null,
  };
}

function normalizeBlockWork(raw: unknown): BlockWorkPlan | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  if (value.kind !== "emprendimiento" && value.kind !== "proyectos") return undefined;
  if (typeof value.ownerId !== "string" || !value.ownerId.trim()) return undefined;
  return {
    kind: value.kind,
    ownerId: value.ownerId,
    ownerName: typeof value.ownerName === "string" ? value.ownerName : "",
    itemId: typeof value.itemId === "string" && value.itemId.trim() ? value.itemId : null,
    itemTitle: typeof value.itemTitle === "string" && value.itemTitle.trim() ? value.itemTitle : null,
  };
}

export function getBlockStudy(plan: SpeedPlan | null | undefined, blockId: string): BlockStudyPlan | null {
  return plan?.blocks?.[blockId]?.study ?? null;
}

export function getBlockWork(plan: SpeedPlan | null | undefined, blockId: string): BlockWorkPlan | null {
  return plan?.blocks?.[blockId]?.work ?? null;
}

export function getFragmentStudy(
  plan: SpeedPlan | null | undefined,
  blockId: string,
  fragmentId: string,
): BlockStudyPlan | null {
  const entry = plan?.blocks?.[blockId];
  if (entry?.kind !== "fragments") return null;
  return entry.fragments.find(fragment => fragment.id === fragmentId)?.study ?? null;
}

export function getFragmentWork(
  plan: SpeedPlan | null | undefined,
  blockId: string,
  fragmentId: string,
): BlockWorkPlan | null {
  const entry = plan?.blocks?.[blockId];
  if (entry?.kind !== "fragments") return null;
  return entry.fragments.find(fragment => fragment.id === fragmentId)?.work ?? null;
}

/** Reemplaza un tramo conservando el resto del plan del bloque. */
function updateFragment(
  plan: SpeedPlan,
  blockId: string,
  fragmentId: string,
  update: (fragment: SpeedPlanFragment) => SpeedPlanFragment,
): SpeedPlan {
  const entry = plan.blocks[blockId];
  if (entry?.kind !== "fragments") return plan;

  let changed = false;
  const fragments = entry.fragments.map(fragment => {
    if (fragment.id !== fragmentId) return fragment;
    const next = update(fragment);
    if (next !== fragment) changed = true;
    return next;
  });

  if (!changed) return plan;
  return { ...plan, blocks: { ...plan.blocks, [blockId]: { ...entry, fragments } } };
}

/**
 * Cambia el sistema de un tramo. Si el nuevo sistema no admite el enfoque
 * actual (asignatura, emprendimiento o proyecto), se descarta.
 */
export function setFragmentSystem(
  plan: SpeedPlan,
  blockId: string,
  fragmentId: string,
  systemId: string,
): SpeedPlan {
  return updateFragment(plan, blockId, fragmentId, fragment => {
    if (fragment.systemId === systemId) return fragment;
    const next: SpeedPlanFragment = { ...fragment, systemId };
    if (systemId !== "universidad") delete next.study;
    if (next.work && next.work.kind !== systemId) delete next.work;
    return next;
  });
}

/** Guarda la asignatura/tema de un tramo; el tramo pasa a Universidad. */
export function setFragmentStudy(
  plan: SpeedPlan,
  blockId: string,
  fragmentId: string,
  study: BlockStudyPlan | null,
): SpeedPlan {
  return updateFragment(plan, blockId, fragmentId, fragment => {
    if (!study) {
      if (!fragment.study) return fragment;
      const next: SpeedPlanFragment = { ...fragment };
      delete next.study;
      return next;
    }
    const next: SpeedPlanFragment = { ...fragment, systemId: systemForFocusKind("universidad"), study };
    delete next.work;
    return next;
  });
}

/** Guarda el emprendimiento/proyecto (y su tarea) de un tramo. */
export function setFragmentWork(
  plan: SpeedPlan,
  blockId: string,
  fragmentId: string,
  work: BlockWorkPlan | null,
): SpeedPlan {
  return updateFragment(plan, blockId, fragmentId, fragment => {
    if (!work) {
      if (!fragment.work) return fragment;
      const next: SpeedPlanFragment = { ...fragment };
      delete next.work;
      return next;
    }
    const next: SpeedPlanFragment = { ...fragment, systemId: systemForFocusKind(work.kind), work };
    delete next.study;
    return next;
  });
}

/** Quita asignatura y emprendimiento/proyecto de un tramo. */
export function clearFragmentFocus(
  plan: SpeedPlan,
  blockId: string,
  fragmentId: string,
): SpeedPlan {
  return updateFragment(plan, blockId, fragmentId, fragment => {
    if (!fragment.study && !fragment.work) return fragment;
    const next: SpeedPlanFragment = { ...fragment };
    delete next.study;
    delete next.work;
    return next;
  });
}

/**
 * Guarda la asignatura/tema de un bloque. Si el bloque no tenía plan, se crea
 * como Universidad completa; si ya tenía sistema (entero o por tramos), se
 * conserva y solo se añade el estudio. Estudio y trabajo son excluyentes.
 */
export function setBlockStudy(
  plan: SpeedPlan,
  blockId: string,
  study: BlockStudyPlan | null,
): SpeedPlan {
  const current = plan.blocks[blockId];

  if (!study) {
    if (!current?.study) return plan;
    if (current.kind === "fragments") {
      return {
        ...plan,
        blocks: {
          ...plan.blocks,
          [blockId]: current.work
            ? { kind: "fragments", fragments: current.fragments, work: current.work }
            : { kind: "fragments", fragments: current.fragments },
        },
      };
    }
    return {
      ...plan,
      blocks: {
        ...plan.blocks,
        [blockId]: current.work
          ? { kind: "whole", systemId: current.systemId, work: current.work }
          : { kind: "whole", systemId: current.systemId },
      },
    };
  }

  if (current?.kind === "fragments") {
    return { ...plan, blocks: { ...plan.blocks, [blockId]: { kind: "fragments", fragments: current.fragments, study } } };
  }

  // Elegir asignatura convierte el bloque entero en Universidad.
  return {
    ...plan,
    blocks: { ...plan.blocks, [blockId]: { kind: "whole", systemId: "universidad", study } },
  };
}

/**
 * Guarda el emprendimiento/proyecto (y su tarea) de un bloque. El bloque pasa
 * a ese sistema y se descarta cualquier asignatura previa.
 */
export function setBlockWork(
  plan: SpeedPlan,
  blockId: string,
  work: BlockWorkPlan | null,
): SpeedPlan {
  const current = plan.blocks[blockId];

  if (!work) {
    if (!current?.work) return plan;
    if (current.kind === "fragments") {
      return {
        ...plan,
        blocks: {
          ...plan.blocks,
          [blockId]: current.study
            ? { kind: "fragments", fragments: current.fragments, study: current.study }
            : { kind: "fragments", fragments: current.fragments },
        },
      };
    }
    return {
      ...plan,
      blocks: {
        ...plan.blocks,
        [blockId]: current.study
          ? { kind: "whole", systemId: current.systemId, study: current.study }
          : { kind: "whole", systemId: current.systemId },
      },
    };
  }

  if (current?.kind === "fragments") {
    return { ...plan, blocks: { ...plan.blocks, [blockId]: { kind: "fragments", fragments: current.fragments, work } } };
  }

  return {
    ...plan,
    blocks: { ...plan.blocks, [blockId]: { kind: "whole", systemId: work.kind, work } },
  };
}

/** Quita a la vez asignatura y emprendimiento/proyecto del bloque y de sus tramos. */
export function clearBlockFocus(plan: SpeedPlan, blockId: string): SpeedPlan {
  const current = plan.blocks[blockId];
  if (!current) return plan;

  if (current.kind === "fragments") {
    const hasFragmentFocus = current.fragments.some(fragment => fragment.study || fragment.work);
    if (!current.study && !current.work && !hasFragmentFocus) return plan;
    return {
      ...plan,
      blocks: {
        ...plan.blocks,
        [blockId]: {
          kind: "fragments",
          fragments: current.fragments.map(fragment => {
            if (!fragment.study && !fragment.work) return fragment;
            const next: SpeedPlanFragment = { ...fragment };
            delete next.study;
            delete next.work;
            return next;
          }),
        },
      },
    };
  }

  if (!current.study && !current.work) return plan;
  return {
    ...plan,
    blocks: {
      ...plan.blocks,
      [blockId]: { kind: "whole", systemId: current.systemId },
    },
  };
}

function withBlockExtras(entry: SpeedBlockPlan | undefined) {
  return {
    ...(entry?.study ? { study: entry.study } : {}),
    ...(entry?.work ? { work: entry.work } : {}),
  };
}

/** Primer enfoque de los tramos compatible con el sistema destino. */
function focusFromFragments(
  entry: Extract<SpeedBlockPlan, { kind: "fragments" }>,
  systemId: string,
): BlockFocus {
  for (const fragment of entry.fragments) {
    if (fragment.systemId !== systemId) continue;
    if (fragment.study) return { study: fragment.study };
    if (fragment.work) return { work: fragment.work };
  }
  return {};
}

export function setWholeBlock(plan: SpeedPlan, blockId: string, systemId: string): SpeedPlan {
  const entry = plan.blocks[blockId];
  const carried = entry?.kind === "fragments"
    ? focusFromFragments(entry, systemId)
    : {};
  const focus = hasFocus(carried) ? carried : focusForSystem(blockFocusOf(entry), systemId);
  return {
    ...plan,
    blocks: {
      ...plan.blocks,
      [blockId]: { kind: "whole", systemId, ...focus },
    },
  };
}

export function setFragmentBlock(
  plan: SpeedPlan,
  blockId: string,
  fragments: SpeedPlanFragment[],
): SpeedPlan {
  const entry = plan.blocks[blockId];
  // Al fragmentar un bloque entero, su enfoque se reparte entre los tramos
  // que usan el mismo sistema.
  const isInitial = Boolean(entry && entry.kind !== "fragments");
  const carried = isInitial ? blockFocusOf(entry) : {};
  const nextFragments = hasFocus(carried)
    ? fragments.map(fragment => {
        const focus = focusForSystem(carried, fragment.systemId);
        return hasFocus(focus) ? { ...fragment, ...focus } : fragment;
      })
    : fragments;

  return {
    ...plan,
    blocks: {
      ...plan.blocks,
      [blockId]: {
        kind: "fragments",
        fragments: nextFragments,
        ...(isInitial ? {} : withBlockExtras(entry)),
      },
    },
  };
}

export function clearBlockPlan(plan: SpeedPlan, blockId: string): SpeedPlan {
  const blocks = { ...plan.blocks };
  // Si el bloque tenía asignatura/tema o emprendimiento/proyecto, se conserva
  // aunque se deshaga la velocidad: el usuario puede volver a planificarlo.
  // El sistema se deriva del enfoque para que sus minutos sigan contando.
  const entry = blocks[blockId];
  if (entry && (entry.study || entry.work)) {
    const systemId = entry.study ? "universidad" : entry.work!.kind;
    blocks[blockId] = { kind: "whole", systemId, ...withBlockExtras(entry) };
  } else {
    delete blocks[blockId];
  }
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
