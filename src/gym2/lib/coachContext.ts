/**
 * Contexto que el Coach IA de Gym 2.0 envía al modelo.
 *
 * La idea es que el modelo vea exactamente lo mismo que el usuario en la app,
 * pero en un formato compacto: rutinas con nombres reales, plan semanal,
 * historial reciente, progresión calculada y estadísticas. Nada de datos de
 * otras secciones de la app (finanzas, tareas, diario…): este coach es solo
 * de gimnasio.
 */
import { EXDB, EXIDX, esName, isBodyweightEq } from "./exercises";
import { ES_NAMES } from "./esNames";
import {
  bestWeightFor,
  effectiveRoutineId,
  lastBW,
  lastBodyM,
  lastEntryFor,
  modeOf,
  streakDays,
} from "./history";
import { nextPrescription, policyFor } from "./progression";
import { DAYN, fmtNum, isoOf, todayISO, weekKey } from "./format";
import type { ExConfig, GymState, Routine, SetRec } from "./types";

export const GROUP_LABEL: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  "upper arms": "Brazos",
  "lower arms": "Antebrazos",
  "upper legs": "Piernas",
  "lower legs": "Pantorrillas",
  waist: "Abdomen",
  cardio: "Cardio",
  neck: "Cuello",
};

export const SPANISH_TO_BP: Record<string, string> = {
  pecho: "chest",
  pectoral: "chest",
  pectorales: "chest",
  espalda: "back",
  dorsales: "back",
  hombro: "shoulders",
  hombros: "shoulders",
  deltoides: "shoulders",
  brazo: "upper arms",
  brazos: "upper arms",
  biceps: "upper arms",
  triceps: "upper arms",
  antebrazo: "lower arms",
  antebrazos: "lower arms",
  pierna: "upper legs",
  piernas: "upper legs",
  cuadriceps: "upper legs",
  femorales: "upper legs",
  isquios: "upper legs",
  gluteos: "upper legs",
  pantorrilla: "lower legs",
  pantorrillas: "lower legs",
  gemelos: "lower legs",
  abdomen: "waist",
  abdominales: "waist",
  core: "waist",
  oblicuos: "waist",
  cardio: "cardio",
  cuello: "neck",
};

export const bpForGroup = (group?: string): string => {
  if (!group) return "full body";
  const raw = String(group).trim().toLowerCase();
  if (GROUP_LABEL[raw]) return raw;
  return SPANISH_TO_BP[raw] || raw;
};

export const normText = (value: unknown): string =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const round1 = (n: number) => Math.round((Number(n) || 0) * 10) / 10;

const dateMinus = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoOf(d);
};

const durationMin = (w: { start?: number; end?: number }) =>
  w.end && w.start ? Math.max(0, Math.round((w.end - w.start) / 60000)) : 0;

const setText = (set: SetRec, cfg: ExConfig | null | undefined) => {
  const mode = modeOf(cfg);
  if (mode === "cardio") return `${round1(set.min || 0)} min @ ${fmtNum(set.speed || 0)} km/h`;
  if (mode === "time") return `${Math.round(set.sec || 0)} s${set.w ? ` · ${fmtNum(set.w)} kg` : ""}`;
  const weight = set.w && set.w > 0 ? `${fmtNum(set.w)}×` : "";
  return `${weight}${Math.round(set.r || 0)}`;
};

export interface CoachRoutineExercise {
  ejercicio_id: string;
  ejercicio: string;
  grupo: string;
  equipo: string;
  series: number;
  reps: number | null;
  reps_min: number | null;
  segundos: number | null;
  peso_objetivo: number | null;
  descanso_seg: number | null;
  modo: string;
  progresion: string;
  ultima_sesion: {
    fecha: string;
    series: string[];
    completo: boolean | null;
  } | null;
  sugerido: {
    tipo: string;
    peso: number | null;
    reps: number | null;
    series: number | null;
    segundos: number | null;
    motivo: string;
  } | null;
}

export interface CoachRoutine {
  id: string;
  nombre: string;
  emoji: string;
  progresion: string | null;
  ejercicios: CoachRoutineExercise[];
}

export interface CoachWorkout {
  fecha: string;
  nombre: string;
  rutina_id: string | null;
  duracion_min: number;
  volumen: number;
  series: number;
  ejercicios: {
    ejercicio: string;
    series: string[];
    peso_max: number;
  }[];
}

export interface GymSnapshot {
  fecha_hoy: string;
  dia_semana: string;
  hora_local: string;
  unidad: string;
  peso_objetivo: number | null;
  descanso_por_defecto_seg: number;
  rutinas: CoachRoutine[];
  semana: Record<string, string>;
  plan_puntual: { fecha: string; rutina: string }[];
  peso_corporal: { fecha: string; peso: number; unidad: string }[];
  medidas: Record<string, unknown>[];
  /** Línea temporal compacta de todas las sesiones (para contar/fechas). */
  sesiones: { fecha: string; nombre: string; duracion_min: number; series: number }[];
  historial: CoachWorkout[];
  estadisticas: {
    entrenamientos_totales: number;
    ultimos_7_dias: number;
    ultimos_30_dias: number;
    volumen_7_dias: number;
    volumen_30_dias: number;
    duracion_promedio_min: number;
    racha_dias: number;
    dias_sin_entrenar: number | null;
    cumplimiento_plan_28_dias_pct: number | null;
    plan_28_dias: { planificados: number; hechos: number };
    mejores_pesos: { ejercicio: string; peso: number; grupo: string }[];
    grupos_mas_entrenados_30_dias: { grupo: string; ejercicios: number }[];
  };
  catalogo?: Record<string, string[]>;
}

let catalogCache: Record<string, string[]> | null = null;

/** Catálogo compacto (nombres en español agrupados por músculo) para que el
 *  modelo elija ejercicios que existen de verdad en la app. */
export function getExerciseCatalog(): Record<string, string[]> {
  if (catalogCache) return catalogCache;
  const byGroup: Record<string, Set<string>> = {};
  for (const ex of EXDB) {
    const label = GROUP_LABEL[ex.bp] || ex.bp || "Otros";
    const name = (ES_NAMES[ex.id] || ex.n || "").trim();
    if (!name) continue;
    (byGroup[label] ||= new Set()).add(name);
  }
  catalogCache = Object.fromEntries(
    Object.entries(byGroup).map(([group, names]) => [
      group,
      [...names].sort((a, b) => a.localeCompare(b, "es")),
    ]),
  );
  return catalogCache;
}

/** Fecha de hoy en hora local del dispositivo (la app ya usa fechas ISO). */
const localTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const effectivePlanDay = (S: GymState, iso: string) => {
  const rid = effectiveRoutineId(S, iso);
  return rid ? S.routines.find((r) => r.id === rid) || null : null;
};

const exerciseName = (id: string): string => {
  const custom = esName(id);
  if (custom && custom !== "Ejercicio desconocido" && custom !== "Unknown exercise") return custom;
  const ex = EXIDX[id];
  return ex ? ES_NAMES[id] || ex.n || id : id;
};

function summarizeRoutine(S: GymState, routine: Routine): CoachRoutine {
  return {
    id: routine.id,
    nombre: routine.name,
    emoji: routine.emoji,
    progresion: routine.prog || null,
    ejercicios: (routine.ex || []).map((cfg) => {
      const id = String(cfg.id || "");
      const ex = EXIDX[id];
      const mode = modeOf(cfg);
      const last = lastEntryFor(S, id);
      const lastCfg = last?.target || cfg;
      const policy = policyFor(cfg, routine, mode);
      let sugerido: CoachRoutineExercise["sugerido"] = null;
      if (policy !== "off" && id) {
        const prescription = nextPrescription(S, cfg, routine);
        sugerido = {
          tipo: prescription.kind,
          peso: prescription.weight ?? null,
          reps: prescription.reps ?? null,
          series: prescription.sets ?? null,
          segundos: prescription.sec ?? null,
          motivo: (prescription.why || []).join(" "),
        };
      }
      return {
        ejercicio_id: id,
        ejercicio: exerciseName(id),
        grupo: GROUP_LABEL[ex?.bp || ""] || ex?.bp || "Otros",
        equipo: ex?.eq || "custom",
        series: cfg.sets || cfg.sets === 0 ? cfg.sets : 3,
        reps: cfg.reps ?? null,
        reps_min: cfg.repsMin ?? null,
        segundos: mode === "time" ? cfg.sec ?? null : null,
        peso_objetivo: cfg.weight ?? null,
        descanso_seg: cfg.rest ?? null,
        modo: mode,
        progresion: policy,
        ultima_sesion: last
          ? {
              fecha: last.d,
              series: last.sets.map((s) => setText(s, lastCfg)),
              completo: last.sets.length > 0 ? last.sets.every((s) => s.done !== false) : null,
            }
          : null,
        sugerido,
      };
    }),
  };
}

function summarizeWorkout(S: GymState, w: GymState["workouts"][number]): CoachWorkout {
  let series = 0;
  const exercises = (w.entries || []).map((entry) => {
    const done = (entry.sets || []).filter((s) => s.done !== false && (s.r || s.sec || s.min));
    series += done.length;
    const top = Math.max(0, ...done.map((s) => Number(s.w) || 0));
    return {
      ejercicio: exerciseName(entry.id),
      series: done.map((s) => setText(s, entry.target || null)),
      peso_max: round1(top),
    };
  });
  return {
    fecha: w.d,
    nombre: w.name || "Entrenamiento",
    rutina_id: w.routineId || null,
    duracion_min: durationMin(w),
    volumen: round1(w.vol || 0),
    series,
    ejercicios: exercises,
  };
}

export function buildGymSnapshot(S: GymState): GymSnapshot {
  const today = todayISO();
  const done = new Set((S.workouts || []).map((w) => w.d));

  const week: Record<string, string> = {};
  for (let d = 0; d < 7; d++) {
    const rid = S.week?.[d];
    const routine = rid ? S.routines.find((r) => r.id === rid) : null;
    week[DAYN[d]] = routine?.name || "Descanso";
  }

  const planPuntual: { fecha: string; rutina: string }[] = [];
  for (let i = -7; i <= 21; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const iso = isoOf(d);
    if (S.dayPlan[iso] === undefined) continue;
    const value = S.dayPlan[iso];
    const routine = value === "rest" ? null : S.routines.find((r) => r.id === value);
    planPuntual.push({ fecha: iso, rutina: routine?.name || "Descanso" });
  }

  const workouts = [...(S.workouts || [])].sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  const last30 = workouts.filter((w) => w.d >= dateMinus(30));
  const last7 = workouts.filter((w) => w.d >= dateMinus(7));

  let planned28 = 0;
  let donePlanned28 = 0;
  for (let i = 27; i >= 0; i--) {
    const iso = dateMinus(i);
    if (!effectiveRoutineId(S, iso)) continue;
    planned28++;
    if (done.has(iso)) donePlanned28++;
  }

  const bestWeights: { ejercicio: string; peso: number; grupo: string }[] = [];
  const seen = new Set<string>();
  const collectIds = new Set<string>();
  S.routines.forEach((r) => (r.ex || []).forEach((cfg) => cfg.id && collectIds.add(cfg.id)));
  workouts.slice(-90).forEach((w) => w.entries.forEach((e) => collectIds.add(e.id)));
  collectIds.forEach((id) => {
    const best = bestWeightFor(S, id);
    if (best > 0 && !seen.has(id)) {
      seen.add(id);
      const ex = EXIDX[id];
      bestWeights.push({
        ejercicio: exerciseName(id),
        peso: round1(best),
        grupo: GROUP_LABEL[ex?.bp || ""] || ex?.bp || "Otros",
      });
    }
  });
  bestWeights.sort((a, b) => b.peso - a.peso);

  const groupCount: Record<string, number> = {};
  last30.forEach((w) =>
    w.entries.forEach((e) => {
      if (!(e.sets || []).some((s) => s.done !== false)) return;
      const ex = EXIDX[e.id];
      const group = GROUP_LABEL[ex?.bp || ""] || ex?.bp || "Otros";
      groupCount[group] = (groupCount[group] || 0) + 1;
    }),
  );

  const lastDate = workouts.length ? workouts[workouts.length - 1].d : null;
  const daysSince = lastDate
    ? Math.max(0, Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${lastDate}T12:00:00`).getTime()) / 86400000))
    : null;

  const totalVolume7 = last7.reduce((sum, w) => sum + (Number(w.vol) || 0), 0);
  const totalVolume30 = last30.reduce((sum, w) => sum + (Number(w.vol) || 0), 0);
  const durations = last30.map(durationMin).filter((n) => n > 0);

  const bw = lastBW(S);
  const bodyM = lastBodyM(S);

  return {
    fecha_hoy: today,
    dia_semana: DAYN[new Date().getDay()],
    hora_local: localTime(),
    unidad: S.unit || "kg",
    peso_objetivo: S.targetW ?? null,
    descanso_por_defecto_seg: S.restSec ?? 90,
    rutinas: (S.routines || []).map((r) => summarizeRoutine(S, r)),
    semana: week,
    plan_puntual: planPuntual,
    peso_corporal: (S.bodyweight || []).slice(-15).map((b) => ({
      fecha: b.d,
      peso: b.w,
      unidad: S.bwUnit || S.unit || "kg",
    })),
    medidas: bodyM ? [{ fecha: bodyM.d, ...bodyM }] : [],
    sesiones: workouts.slice(-120).map((w) => ({
      fecha: w.d,
      nombre: w.name || "Entrenamiento",
      duracion_min: durationMin(w),
      series: (w.entries || []).reduce(
        (sum, e) =>
          sum +
          (e.sets || []).filter((s) => s.done !== false && (s.r || s.sec || s.min)).length,
        0,
      ),
    })),
    historial: workouts.slice(-15).reverse().map((w) => summarizeWorkout(S, w)),
    estadisticas: {
      entrenamientos_totales: workouts.length,
      ultimos_7_dias: last7.length,
      ultimos_30_dias: last30.length,
      volumen_7_dias: round1(totalVolume7),
      volumen_30_dias: round1(totalVolume30),
      duracion_promedio_min: durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0,
      racha_dias: streakDays(S),
      dias_sin_entrenar: daysSince,
      cumplimiento_plan_28_dias_pct: planned28 ? Math.round((donePlanned28 / planned28) * 100) : null,
      plan_28_dias: { planificados: planned28, hechos: donePlanned28 },
      mejores_pesos: bestWeights.slice(0, 12),
      grupos_mas_entrenados_30_dias: Object.entries(groupCount)
        .sort((a, b) => b[1] - a[1])
        .map(([grupo, ejercicios]) => ({ grupo, ejercicios })),
    },
    catalogo: getExerciseCatalog(),
  };
}

/** Resuelve un id de ejercicio por id, nombre español o nombre inglés. */
export function findExerciseId(S: GymState, ref: unknown): string | null {
  const raw = String(ref ?? "").trim();
  if (!raw) return null;
  if (EXIDX[raw]) return raw;
  if ((S.customEx || []).some((e) => e.id === raw)) return raw;

  const q = normText(raw);
  if (!q) return null;
  const candidates: { id: string; name: string }[] = [];
  EXDB.forEach((e) => {
    candidates.push({ id: e.id, name: ES_NAMES[e.id] || e.n || "" });
    // También aceptamos el nombre original en inglés (el modelo a veces lo usa).
    if (e.n && e.n !== ES_NAMES[e.id]) candidates.push({ id: e.id, name: e.n });
  });
  (S.customEx || []).forEach((e) => candidates.push({ id: e.id, name: e.n || "" }));

  let best: { id: string; score: number } | null = null;
  const qTokens = q.split(" ").filter(Boolean);
  for (const c of candidates) {
    const name = normText(c.name);
    if (!name) continue;
    let score = 0;
    if (name === q) score = 1000;
    else if (name.startsWith(q + " ") || name === q) score = 850 - Math.abs(name.length - q.length);
    else if (name.includes(" " + q + " ") || name.endsWith(" " + q)) score = 720;
    else if (q.includes(name) && name.length >= 4) score = 650;
    else {
      const nTokens = name.split(" ").filter(Boolean);
      const hit = qTokens.filter((t) => nTokens.some((n) => n === t || n.startsWith(t))).length;
      if (hit === qTokens.length && qTokens.length > 0) score = 500 + hit * 10 - Math.abs(nTokens.length - qTokens.length);
    }
    if (score > (best?.score || 0)) best = { id: c.id, score };
  }
  return best && best.score >= 500 ? best.id : null;
}

/** Resuelve una rutina por id o nombre (exacto/parcial). */
export function findRoutine(S: GymState, ref: unknown): Routine | null {
  const raw = String(ref ?? "").trim();
  if (!raw) return null;
  const byId = S.routines.find((r) => r.id === raw);
  if (byId) return byId;
  const q = normText(raw);
  if (!q) return null;
  return (
    S.routines.find((r) => normText(r.name) === q) ||
    S.routines.find((r) => normText(r.name).includes(q)) ||
    S.routines.find((r) => q.includes(normText(r.name))) ||
    null
  );
}

/** Modo/peso corporal coherente para un ejercicio nuevo. */
export function inferMode(name: string): "reps" | "time" | "cardio" {
  const n = normText(name);
  if (/(correr|caminar|bici|bicicleta|elip|remo erg|cardio|trotar|sprint|nadar)/.test(n)) return "cardio";
  if (/(plancha|isometric|aguantar|colgar|wall sit|hollow)/.test(n)) return "time";
  return "reps";
}

export const isBodyweightId = (id: string) => isBodyweightEq(id);

export const datesForWeek = (S: GymState, week: string) => {
  const dates: string[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - now.getDay() + i);
    const iso = isoOf(d);
    if (weekKey(iso) === week) dates.push(iso);
  }
  return dates;
};

export const effectiveRoutineName = (S: GymState, iso: string) => effectivePlanDay(S, iso)?.name || "Descanso";
