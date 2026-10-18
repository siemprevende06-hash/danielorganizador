import type { MonthlyPlanData, SongPlanType } from "@/hooks/useMonthlyPlan";

export type PlanObjectiveKind = "libro" | "cancion" | "materia" | "proyecto";

export interface PlanObjective {
  kind: PlanObjectiveKind;
  id: string;
  title: string;
  subtitle?: string;
  tag?: string;
  status?: string;
}

export interface ResolvedPlanItems {
  books: { id: string; title: string; author?: string | null; status?: string }[];
  songs: { id: string; title: string; artist?: string | null; instrument?: string }[];
  projects: { id: string; name: string }[];
  subjects: { id: string; name: string }[];
}

const SONG_PLAN_LABEL: Record<SongPlanType, string> = {
  learned: "Aprender",
  mastered: "Dominar",
  recorded: "Grabación",
};

/**
 * Objetivos planificados (libros, canciones, asignaturas y proyectos) del plan
 * mensual agrupados por área del Punto B. Solo produce entradas para las áreas
 * que tienen objetivos: `desarrollo` (libros + canciones) y `profesional`
 * (asignaturas + proyectos).
 *
 * Si se pasa `weekKey`, los libros/canciones se toman del reparto semanal
 * (`week_distribution`); si esa semana no tiene reparto, cae a los del mes.
 */
export function buildAreaPlanObjectives(
  planData: MonthlyPlanData,
  resolved: ResolvedPlanItems,
  opts?: { weekKey?: string }
): Record<string, PlanObjective[]> {
  const out: Record<string, PlanObjective[]> = {};

  const weekSlot = opts?.weekKey ? planData.week_distribution?.[opts.weekKey] : undefined;
  const bookIds = weekSlot?.books?.length ? weekSlot.books : planData.books.selected;
  const songIds = weekSlot?.songs?.length ? weekSlot.songs : planData.songs.selected;

  const bookMap = new Map(resolved.books.map(b => [b.id, b]));
  const songMap = new Map(resolved.songs.map(s => [s.id, s]));

  const desarrollo: PlanObjective[] = [];
  for (const id of bookIds) {
    const b = bookMap.get(id);
    if (!b) continue;
    desarrollo.push({
      kind: "libro",
      id,
      title: b.title,
      subtitle: b.author ?? undefined,
      status: b.status,
    });
  }
  for (const id of songIds) {
    const s = songMap.get(id);
    if (!s) continue;
    const plan = planData.songs_plan?.[id];
    desarrollo.push({
      kind: "cancion",
      id,
      title: s.title,
      subtitle: s.artist ?? undefined,
      tag: plan ? SONG_PLAN_LABEL[plan] : undefined,
    });
  }
  if (desarrollo.length > 0) out.desarrollo = desarrollo;

  const subjectMap = new Map(resolved.subjects.map(s => [s.id, s]));
  const projectMap = new Map(resolved.projects.map(p => [p.id, p]));
  const profesional: PlanObjective[] = [];
  for (const s of planData.subjects) {
    const info = subjectMap.get(s.subject_id);
    if (!info) continue;
    profesional.push({ kind: "materia", id: s.subject_id, title: info.name });
  }
  for (const id of planData.projects) {
    const p = projectMap.get(id);
    if (!p) continue;
    profesional.push({ kind: "proyecto", id, title: p.name });
  }
  if (profesional.length > 0) out.profesional = profesional;

  return out;
}
