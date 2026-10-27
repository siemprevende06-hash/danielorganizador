import type { MonthlyPlanData, SongPlanType } from "@/hooks/useMonthlyPlan";

export type PlanObjectiveKind = "libro" | "cancion" | "materia" | "proyecto";

export interface PlanObjective {
  kind: PlanObjectiveKind;
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  status?: string;
  /** Portada pequeña (libros y canciones cuando tienen). */
  cover?: string | null;
  /** Libro que se está leyendo actualmente: se enmarca con borde azul. */
  isCurrent?: boolean;
  /** Fecha en que se empezó a leer (yyyy-MM-dd), solo libros. */
  startDate?: string | null;
  /** Fecha en que se terminó de leer (yyyy-MM-dd), solo libros. */
  finishDate?: string | null;
}

export interface ResolvedPlanItems {
  books: { id: string; title: string; author?: string | null; status?: string; cover_image_url?: string | null; start_date?: string | null; finish_date?: string | null }[];
  songs: { id: string; title: string; artist?: string | null; instrument?: string; cover_image_url?: string | null }[];
  projects: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

const SONG_PLAN_LABEL: Record<SongPlanType, string> = {
  learned: "Aprender",
  mastered: "Dominar",
  recorded: "Grabación",
};

/** Cada objetivo va dentro de la tarjeta de su hábito. */
export const OBJECTIVE_HABIT: Record<PlanObjectiveKind, string> = {
  libro: "lectura",
  cancion: "musica",
  materia: "universidad",
  proyecto: "proyectos",
};

/**
 * Objetivos planificados (libros, canciones, asignaturas y proyectos) del plan
 * mensual agrupados por tarjeta de hábito: `lectura`, `musica`, `universidad`
 * y `proyectos`.
 *
 * Si se pasa `weekKey`, los libros/canciones se toman del reparto semanal
 * (`week_distribution`); si esa semana no tiene reparto, cae a los del mes.
 */
export function buildHabitPlanObjectives(
  planData: MonthlyPlanData,
  resolved: ResolvedPlanItems,
  opts?: { weekKey?: string }
): Record<string, PlanObjective[]> {
  const out: Record<string, PlanObjective[]> = { lectura: [], musica: [], universidad: [], proyectos: [] };

  const weekSlot = opts?.weekKey ? planData.week_distribution?.[opts.weekKey] : undefined;
  const bookIds = weekSlot?.books?.length ? weekSlot.books : planData.books.selected;
  const songIds = weekSlot?.songs?.length ? weekSlot.songs : planData.songs.selected;

  const bookMap = new Map(resolved.books.map(b => [b.id, b]));
  const songMap = new Map(resolved.songs.map(s => [s.id, s]));

  for (const id of bookIds) {
    const b = bookMap.get(id);
    if (!b) continue;
    out.lectura.push({
      kind: "libro",
      id,
      title: b.title,
      subtitle: b.author ?? undefined,
      status: b.status,
      cover: b.cover_image_url ?? null,
      isCurrent: b.status === "reading",
      startDate: b.start_date ?? null,
      finishDate: b.finish_date ?? null,
    });
  }

  for (const id of songIds) {
    const s = songMap.get(id);
    if (!s) continue;
    const plan = planData.songs_plan?.[id];
    out.musica.push({
      kind: "cancion",
      id,
      title: s.title,
      subtitle: s.instrument || s.artist || undefined,
      tag: plan ? SONG_PLAN_LABEL[plan] : undefined,
      cover: s.cover_image_url ?? null,
    });
  }

  const subjectMap = new Map(resolved.subjects.map(s => [s.id, s]));
  for (const s of planData.subjects) {
    const info = subjectMap.get(s.subject_id);
    if (!info) continue;
    out.universidad.push({ kind: "materia", id: s.subject_id, title: info.name });
  }

  const projectMap = new Map(resolved.projects.map(p => [p.id, p]));
  for (const id of planData.projects) {
    const p = projectMap.get(id);
    if (!p) continue;
    out.proyectos.push({ kind: "proyecto", id, title: p.name });
  }

  return out;
}
