import type { RoutineBlock } from "@/hooks/useRoutineBlocks";

export interface ChronoRange {
  title: string;
  start: string;
  end: string;
  minutes: number;
}

export interface AreaChrono {
  fixed: ChronoRange[];
  extra: ChronoRange[];
}

/** Áreas que además pueden reconocerse por el nombre del bloque. */
const TITLE_KEYWORDS: Record<string, string[]> = {
  lectura: ["lectura", "podcast"],
  ajedrez: ["ajedrez"],
  game: ["game", "seducci"],
  idiomas: ["idioma", "inglés", "ingles", "italiano"],
  musica: ["música", "musica", "piano", "guitarra"],
};

/** Áreas que muestran los recuadros de bloque fijo / avance extra. */
export const CHRONO_AREAS = new Set([
  "lectura",
  "ajedrez",
  "game",
  "idiomas",
  "musica",
  "universidad",
  "emprendimiento",
  "proyectos",
]);

/** Áreas donde arriba se muestra el total de bloques fijos. */
export const COUNT_AREAS = new Set(["universidad", "emprendimiento", "proyectos"]);

const normalize = (value: string) => value.toLowerCase();

export function isFocusRoutineBlock(block: RoutineBlock): boolean {
  return block.isFocusBlock === true;
}

function matchesArea(block: RoutineBlock, areaId: string, titleFallback: boolean): boolean {
  const focus = block.currentFocus || block.defaultFocus;
  if (focus && focus !== "none") return focus === areaId;
  if (!titleFallback) return false;
  const keywords = TITLE_KEYWORDS[areaId];
  if (!keywords) return false;
  const title = normalize(block.title || "");
  return keywords.some((keyword) => title.includes(keyword));
}

export function getBlockMinutes(block: RoutineBlock): number {
  const [startHour, startMinute] = (block.startTime || "0:00").split(":").map(Number);
  const [endHour, endMinute] = (block.endTime || "0:00").split(":").map(Number);
  const start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end <= start) end += 24 * 60;
  return Math.max(0, end - start);
}

function toRange(block: RoutineBlock): ChronoRange {
  return {
    title: block.title,
    start: block.startTime,
    end: block.endTime,
    minutes: getBlockMinutes(block),
  };
}

export function getAreaChrono(blocks: RoutineBlock[] | undefined, areaId: string): AreaChrono {
  if (!Array.isArray(blocks) || blocks.length === 0) return { fixed: [], extra: [] };

  const usable = blocks.filter((block) => block && block.blockType !== "evitar");
  const titleFallback = areaId in TITLE_KEYWORDS;

  return {
    fixed: usable
      .filter((block) => !isFocusRoutineBlock(block) && matchesArea(block, areaId, titleFallback))
      .map(toRange),
    extra: usable
      .filter((block) => isFocusRoutineBlock(block) && matchesArea(block, areaId, false))
      .map(toRange),
  };
}

export function formatClock(time: string): string {
  const [hour, minute] = time.split(":").map(Number);
  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function formatRange(range: Pick<ChronoRange, "start" | "end">): string {
  return `${formatClock(range.start)}–${formatClock(range.end)}`;
}
