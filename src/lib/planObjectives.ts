import type { MonthlyPlanData, SongPlanType } from "@/hooks/useMonthlyPlan";

export type PlanObjectiveKind = "libro" | "cancion" | "materia" | "proyecto" | "elo";

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
  elo: "ajedrez",
};

/**
 * Objetivos planificados (libros, canciones, asignaturas, proyectos y ELO de
 * ajedrez) del plan mensual agrupados por tarjeta de hábito: `lectura`,
 * `musica`, `universidad`, `proyectos` y `ajedrez`.
 *
 * Si se pasa `weekKey`, los libros/canciones/ELO se toman del reparto semanal
 * (`week_distribution`); si esa semana no tiene reparto, cae a los del mes.
 */
export function buildHabitPlanObjectives(
  planData: MonthlyPlanData,
  resolved: ResolvedPlanItems,
  opts?: {
    weekKey?: string;
    /** ELO objetivo del mes resuelto (plan mensual o respaldo de Chess). */
    monthEloGoal?: number;
    /** ELO de la semana resuelto (plan semanal o espejo en el plan mensual). */
    weekElo?: { start?: number; target?: number } | null;
  }
): Record<string, PlanObjective[]> {
  const out: Record<string, PlanObjective[]> = {
    lectura: [],
    musica: [],
    universidad: [],
    proyectos: [],
    ajedrez: [],
  };

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

  // --- Ajedrez: meta del mes o tramo de la semana ---
  const monthEloGoal = Number(opts?.monthEloGoal) || Number(planData.chess?.elo_goal) || 0;
  const monthObjective: PlanObjective = {
    kind: "elo",
    id: "elo-mes",
    title: `${monthEloGoal} ELO`,
    subtitle: "Objetivo del mes",
    tag: "Mes",
  };

  if (opts?.weekKey) {
    const start = Number(opts.weekElo?.start) || Number(weekSlot?.elo_start) || 0;
    const target = Number(opts.weekElo?.target) || Number(weekSlot?.elo_target) || 0;
    if (target > 0) {
      out.ajedrez.push({
        kind: "elo",
        id: `elo-sem-${opts.weekKey}`,
        title: `${target} ELO`,
        subtitle: start > 0 && start !== target ? `${start} → ${target}` : "Objetivo de la semana",
        tag: "Semana",
      });
    } else if (monthEloGoal > 0) {
      // Sin meta semanal, se muestra la del mes (igual que con libros/canciones).
      out.ajedrez.push(monthObjective);
    }
  } else if (monthEloGoal > 0) {
    out.ajedrez.push(monthObjective);
  }

  return out;
}
