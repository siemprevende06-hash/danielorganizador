/**
 * Cadenas de resultados: cómo los minutos diarios de cada sistema se acumulan
 * en resultados (diario → semana → mes → trimestre → Comodidad → Visión).
 */
export type ChainWindow = "hoy" | "semana" | "mes" | "trimestre";

export interface ChainLevelCfg {
  window: ChainWindow;
  label: string;
  unit: string;
  /** Meta de la ventana (en unidades o en minutos según `kind`). */
  goal: number;
  kind: "minutes" | "count";
  /** Minutos acumulados necesarios por unidad (solo kind: count). */
  minutesPerUnit?: number;
}

export interface ResultChainCfg {
  systemId: string;
  name: string;
  emoji: string;
  area: string;
  vision: string;
  levels: ChainLevelCfg[];
  /** Hoja del Punto B usada como fallback de Comodidad si no hay listas vinculadas. */
  leafId: string;
}

export interface ChainLevelData {
  label: string;
  unit: string;
  value: number;
  goal: number;
  pct: number;
}

export const WINDOW_META: Record<ChainWindow, { label: string; accent: string }> = {
  hoy: { label: "Hoy", accent: "bg-sky-500/10 text-sky-500" },
  semana: { label: "Semana", accent: "bg-indigo-500/10 text-indigo-500" },
  mes: { label: "Mes", accent: "bg-purple-500/10 text-purple-500" },
  trimestre: { label: "Trimestre", accent: "bg-rose-500/10 text-rose-500" },
};

/**
 * El sistema produce el resultado del día; ese resultado se acumula en la
 * semana, el mes y el trimestre; llegar al trimestre acerca tu Comodidad
 * (metas de Mi Lista Personal) y mantenerla viva la Visión.
 */
export const RESULT_CHAINS: Record<string, ResultChainCfg> = {
  lectura: {
    systemId: "lectura",
    name: "Lectura 30min",
    emoji: "📖",
    area: "desarrollo",
    vision: "Leer y absorber conocimiento",
    leafId: "lectura",
    levels: [
      { window: "hoy", label: "Páginas leídas", unit: "pág", goal: 25, kind: "count", minutesPerUnit: 1 },
      { window: "semana", label: "Avance del libro", unit: "cap", goal: 3, kind: "count", minutesPerUnit: 60 },
      { window: "mes", label: "Libros del mes", unit: "libros", goal: 2, kind: "count", minutesPerUnit: 300 },
      { window: "trimestre", label: "Libros del trimestre", unit: "libros", goal: 6, kind: "count", minutesPerUnit: 300 },
    ],
  },
  musica: {
    systemId: "musica",
    name: "Música",
    emoji: "🎸",
    area: "desarrollo",
    vision: "Saber tocar instrumentos muy bien",
    leafId: "musica",
    levels: [
      { window: "hoy", label: "Minutos de práctica", unit: "min", goal: 30, kind: "minutes" },
      { window: "semana", label: "Avance de la canción", unit: "min", goal: 180, kind: "minutes" },
      { window: "mes", label: "Canciones aprendidas", unit: "canciones", goal: 4, kind: "count", minutesPerUnit: 45 },
      { window: "trimestre", label: "Canciones completadas", unit: "canciones", goal: 20, kind: "count", minutesPerUnit: 45 },
    ],
  },
  idiomas: {
    systemId: "idiomas",
    name: "Idiomas",
    emoji: "🌍",
    area: "desarrollo",
    vision: "Ser políglota (inglés C1, italiano B2)",
    leafId: "idiomas",
    levels: [
      { window: "hoy", label: "Minutos de práctica", unit: "min", goal: 45, kind: "minutes" },
      { window: "semana", label: "Lecciones del libro", unit: "lecciones", goal: 2, kind: "count", minutesPerUnit: 45 },
      { window: "mes", label: "Curso particular", unit: "clases", goal: 9, kind: "count", minutesPerUnit: 45 },
      { window: "trimestre", label: "Hito: examen", unit: "min", goal: 600, kind: "minutes" },
    ],
  },
  ajedrez: {
    systemId: "ajedrez",
    name: "Ajedrez",
    emoji: "♟️",
    area: "desarrollo",
    vision: "Saber jugar bien al ajedrez",
    leafId: "ajedrez",
    levels: [
      { window: "hoy", label: "Partidas jugadas", unit: "partidas", goal: 3, kind: "count", minutesPerUnit: 10 },
      { window: "semana", label: "Partidas de la semana", unit: "partidas", goal: 15, kind: "count", minutesPerUnit: 10 },
      { window: "mes", label: "Partidas del mes", unit: "partidas", goal: 30, kind: "count", minutesPerUnit: 10 },
      { window: "trimestre", label: "Partidas del trimestre", unit: "partidas", goal: 90, kind: "count", minutesPerUnit: 10 },
    ],
  },
  game: {
    systemId: "game",
    name: "Game (Seducción)",
    emoji: "🎮",
    area: "desarrollo",
    vision: "Área romántica en control",
    leafId: "game",
    levels: [
      { window: "hoy", label: "Conocimiento pasivo", unit: "min", goal: 30, kind: "minutes" },
      { window: "semana", label: "Acciones semanales", unit: "acciones", goal: 2, kind: "count", minutesPerUnit: 90 },
      { window: "mes", label: "Citas del mes", unit: "citas", goal: 2, kind: "count", minutesPerUnit: 600 },
      { window: "trimestre", label: "Citas del trimestre", unit: "citas", goal: 6, kind: "count", minutesPerUnit: 600 },
    ],
  },
  universidad: {
    systemId: "universidad",
    name: "Universidad",
    emoji: "🎓",
    area: "profesional",
    vision: "Ser un buen ingeniero",
    leafId: "universidad",
    levels: [
      { window: "hoy", label: "Avance de temas", unit: "min", goal: 120, kind: "minutes" },
      { window: "semana", label: "Temas dominados / tareas", unit: "temas", goal: 3, kind: "count", minutesPerUnit: 180 },
      { window: "mes", label: "Exámenes aprobados", unit: "exámenes", goal: 2, kind: "count", minutesPerUnit: 900 },
      { window: "trimestre", label: "Calificaciones trimestrales", unit: "min", goal: 5400, kind: "minutes" },
    ],
  },
  emprendimiento: {
    systemId: "emprendimiento",
    name: "Emprendimiento (AUTEC)",
    emoji: "🚀",
    area: "profesional",
    vision: "Ser un emprendedor exitoso",
    leafId: "emprendimiento",
    levels: [
      { window: "hoy", label: "Avance del proyecto", unit: "min", goal: 60, kind: "minutes" },
      { window: "semana", label: "Avance semanal", unit: "min", goal: 420, kind: "minutes" },
      { window: "mes", label: "Avance mensual", unit: "min", goal: 1800, kind: "minutes" },
      { window: "trimestre", label: "Avance trimestral", unit: "min", goal: 5400, kind: "minutes" },
    ],
  },
  proyectos: {
    systemId: "proyectos",
    name: "Proyectos",
    emoji: "📁",
    area: "profesional",
    vision: "Completar mis proyectos personales",
    leafId: "proyectos",
    levels: [
      { window: "hoy", label: "Avance (sáb/dom)", unit: "min", goal: 120, kind: "minutes" },
      { window: "semana", label: "Avance semanal", unit: "min", goal: 240, kind: "minutes" },
      { window: "mes", label: "Proyectos completados", unit: "proyectos", goal: 1, kind: "count", minutesPerUnit: 600 },
      { window: "trimestre", label: "Proyectos del trimestre", unit: "proyectos", goal: 3, kind: "count", minutesPerUnit: 600 },
    ],
  },
};

export function chainLevelData(level: ChainLevelCfg, minutes: number): ChainLevelData {
  const value =
    level.kind === "count"
      ? Math.round(minutes / Math.max(1, level.minutesPerUnit ?? 1))
      : Math.round(minutes);
  const pct = level.goal > 0 ? Math.min(100, Math.round((value / level.goal) * 100)) : 0;
  return { label: level.label, unit: level.unit, value, goal: level.goal, pct };
}

export function chainForArea(areaId: string): ResultChainCfg[] {
  return Object.values(RESULT_CHAINS).filter(c => c.area === areaId);
}