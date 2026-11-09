/**
 * Ejecutor de acciones del Coach IA sobre Gym 2.0.
 *
 * El modelo NO escribe en Supabase ni en el estado directamente: devuelve una
 * lista de acciones normalizadas. Este archivo las valida y las aplica al
 * estado local del gimnasio, que luego se sincroniza como cualquier otro
 * cambio. Así el Coach tiene control total sin romper el modo offline.
 */
import { getGym } from "../store";
import { findExerciseId, findRoutine, inferMode, normText, bpForGroup } from "./coachContext";
import { esName } from "./exercises";
import { defaultConfig, workoutVolume, bestWeightFor } from "./history";
import { uid, isoOf, todayISO, DAYN } from "./format";
import type { ExConfig, GymState, Routine, SetRec, Workout } from "./types";

export interface CoachAction {
  tipo?: string;
  type?: string;
  [key: string]: unknown;
}

export interface CoachActionResult {
  tipo: string;
  ok: boolean;
  mensaje: string;
  /** Pantalla que debe abrirse después de aplicar las acciones. */
  nav?: string;
}

interface ApplyResult extends CoachActionResult {
  nav?: string;
}

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const TODAY_WORDS = /^(hoy|today)$/i;
const TOMORROW_WORDS = /^(manana|mañana|tomorrow)$/i;
const YESTERDAY_WORDS = /^(ayer|yesterday)$/i;

const resolveDate = (raw: unknown): string => {
  const value = String(raw ?? "").trim();
  if (!value || TODAY_WORDS.test(value)) return todayISO();
  if (TOMORROW_WORDS.test(value)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return isoOf(d);
  }
  if (YESTERDAY_WORDS.test(value)) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return isoOf(d);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const n = normText(value);
  const weekday = DAYN.findIndex((d) => normText(d) === n);
  if (weekday >= 0) {
    const d = new Date();
    const diff = (weekday - d.getDay() + 7) % 7;
    d.setDate(d.getDate() + diff);
    return isoOf(d);
  }
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return isoOf(parsed);
  }
  return todayISO();
};

const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

const routineLabel = (routine: Routine) => `«${routine.name}»`;

const exerciseLabel = (S: GymState, id: string) => {
  const custom = (S.customEx || []).find((e) => e.id === id);
  if (custom?.n) return custom.n;
  return esName(id) || id;
};

const ensureExercise = (
  S: GymState,
  name: unknown,
  hints: { grupo?: unknown; equipo?: unknown; descripcion?: unknown } = {},
): string => {
  const raw = String(name ?? "").trim();
  if (!raw) throw new Error("Falta el nombre del ejercicio");
  const found = findExerciseId(S, raw);
  if (found) return found;

  const id = "c" + uid();
  const bp = bpForGroup(String(hints.grupo ?? "")) || "full body";
  (S.customEx ||= []).push({
    id,
    n: raw.slice(0, 80),
    bp,
    tg: "",
    eq: hints.equipo ? String(hints.equipo).slice(0, 60) : "custom",
    desc: hints.descripcion ? String(hints.descripcion).slice(0, 1000) : "",
    custom: true,
  });
  return id;
};

const toPolicy = (value: unknown): string | null => {
  const p = String(value ?? "").toLowerCase();
  return ["off", "linear", "greyskull", "double", "time"].includes(p) ? p : null;
};

const buildExConfig = (
  S: GymState,
  spec: Record<string, unknown>,
  fallbackProg?: string | null,
): ExConfig => {
  const id = ensureExercise(S, spec.ejercicio ?? spec.nombre ?? spec.name, {
    grupo: spec.grupo ?? spec.grupo_muscular,
    equipo: spec.equipo,
    descripcion: spec.descripcion,
  });
  const mode = (String(spec.modo ?? "").toLowerCase() as ExConfig["mode"]) || inferMode(String(spec.ejercicio ?? spec.nombre ?? ""));
  const validMode = mode === "time" || mode === "cardio" || mode === "reps" ? mode : "reps";
  const cfg: ExConfig = { id, mode: validMode };

  const sets = num(spec.series ?? spec.sets);
  const reps = num(spec.reps ?? spec.repeticiones);
  const repsMin = num(spec.reps_min ?? spec.repsMin);
  const weight = num(spec.peso ?? spec.weight);
  const rest = num(spec.descanso ?? spec.descanso_seg ?? spec.rest);
  const sec = num(spec.segundos ?? spec.sec ?? spec.seg);
  const mins = num(spec.minutos ?? spec.min);
  const speed = num(spec.velocidad ?? spec.speed);

  cfg.sets = sets != null ? clamp(Math.round(sets), 1, 20) : validMode === "cardio" ? 1 : 3;
  if (validMode === "reps") {
    cfg.reps = reps != null ? clamp(Math.round(reps), 1, 100) : 10;
    if (repsMin != null) cfg.repsMin = clamp(Math.round(repsMin), 1, cfg.reps);
  } else if (validMode === "time") {
    cfg.sec = sec != null ? clamp(Math.round(sec), 5, 3600) : 45;
  } else {
    cfg.min = mins != null ? clamp(Math.round(mins), 1, 600) : 20;
    cfg.speed = speed != null ? clamp(Math.round(speed * 10) / 10, 1, 40) : 8;
  }
  if (weight != null && weight >= 0) cfg.weight = clamp(Math.round(weight * 10) / 10, 0, 1000);
  if (rest != null) cfg.rest = clamp(Math.round(rest), 0, 900);
  if (spec.por_lado === true || spec.side === true) cfg.side = true;
  if (spec.peso_corporal === true || spec.bodyweight === true) cfg.bodyweight = true;

  const prog = toPolicy(spec.progresion ?? spec.prog) || toPolicy(fallbackProg);
  if (prog) cfg.prog = prog;
  if (validMode === "time" && !prog) cfg.prog = "time";
  return cfg;
};

const applyToRoutine = (
  S: GymState,
  routine: Routine,
  args: Record<string, unknown>,
): string[] => {
  const notes: string[] = [];
  if (args.nombre) routine.name = String(args.nombre).slice(0, 80);
  if (args.emoji) routine.emoji = String(args.emoji).slice(0, 8);
  const prog = toPolicy(args.progresion ?? args.prog);
  if (prog) routine.prog = prog;

  if (Array.isArray(args.quitar_ejercicios)) {
    const remove = new Set(
      args.quitar_ejercicios
        .map((ref) => findExerciseId(S, ref))
        .filter((id): id is string => Boolean(id)),
    );
    const before = routine.ex.length;
    routine.ex = routine.ex.filter((cfg) => !cfg.id || !remove.has(cfg.id));
    const removed = before - routine.ex.length;
    if (removed > 0) notes.push(`${removed} ejercicio(s) quitado(s)`);
  }

  if (Array.isArray(args.agregar_ejercicios)) {
    for (const raw of args.agregar_ejercicios) {
      if (!raw || typeof raw !== "object") continue;
      const spec = raw as Record<string, unknown>;
      const cfg = buildExConfig(S, spec, routine.prog);
      const existing = routine.ex.find((e) => e.id === cfg.id);
      if (existing) {
        Object.assign(existing, cfg);
        notes.push(`${exerciseLabel(S, cfg.id!)} actualizado`);
      } else {
        routine.ex.push(cfg);
        notes.push(`${exerciseLabel(S, cfg.id!)} añadido`);
      }
    }
  }

  if (Array.isArray(args.ajustar_ejercicios)) {
    for (const raw of args.ajustar_ejercicios) {
      if (!raw || typeof raw !== "object") continue;
      const spec = raw as Record<string, unknown>;
      const id = findExerciseId(S, spec.ejercicio ?? spec.nombre);
      if (!id) {
        notes.push(`no encontré «${String(spec.ejercicio ?? "")}»`);
        continue;
      }
      const cfg = routine.ex.find((e) => e.id === id);
      if (!cfg) {
        notes.push(`${exerciseLabel(S, id)} no está en esta rutina`);
        continue;
      }
      const sets = num(spec.series ?? spec.sets);
      const reps = num(spec.reps ?? spec.repeticiones);
      const repsMin = num(spec.reps_min ?? spec.repsMin);
      const weight = num(spec.peso ?? spec.weight);
      const rest = num(spec.descanso ?? spec.descanso_seg ?? spec.rest);
      const sec = num(spec.segundos ?? spec.sec);
      if (sets != null) cfg.sets = clamp(Math.round(sets), 1, 20);
      if (reps != null) cfg.reps = clamp(Math.round(reps), 1, 100);
      if (repsMin != null) cfg.repsMin = clamp(Math.round(repsMin), 1, Math.max(1, cfg.reps || 100));
      if (weight != null && weight >= 0) {
        cfg.weight = clamp(Math.round(weight * 10) / 10, 0, 1000);
        S.exWeights[id] = { w: cfg.weight, d: todayISO() };
      }
      if (rest != null) cfg.rest = clamp(Math.round(rest), 0, 900);
      if (sec != null) {
        cfg.mode = "time";
        cfg.sec = clamp(Math.round(sec), 5, 3600);
      }
      const prog2 = toPolicy(spec.progresion ?? spec.prog);
      if (prog2) cfg.prog = prog2;
      if (spec.por_lado != null) cfg.side = Boolean(spec.por_lado);
      if (spec.peso_corporal != null) cfg.bodyweight = Boolean(spec.peso_corporal);
      notes.push(`${exerciseLabel(S, id)} ajustado`);
    }
  }

  if (Array.isArray(args.reemplazar_ejercicios)) {
    const next: ExConfig[] = [];
    for (const raw of args.reemplazar_ejercicios) {
      if (!raw || typeof raw !== "object") continue;
      next.push(buildExConfig(S, raw as Record<string, unknown>, routine.prog));
    }
    if (next.length) {
      routine.ex = next;
      notes.push(`rutina reemplazada con ${next.length} ejercicios`);
    }
  }

  return notes;
};

const findRoutineForExercise = (S: GymState, exerciseId: string) =>
  S.routines.filter((r) => r.ex.some((e) => e.id === exerciseId));

const sortDates = <T extends { d: string; t?: number }>(items: T[]) =>
  items.sort((a, b) => (a.d === b.d ? (a.t || 0) - (b.t || 0) : a.d < b.d ? -1 : 1));

const setsFromAction = (raw: unknown): SetRec[] => {
  if (!Array.isArray(raw)) return [];
  const out: SetRec[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const s = item as Record<string, unknown>;
    const set: SetRec = { done: s.hechas !== false && s.done !== false };
    const w = num(s.peso ?? s.weight ?? s.w);
    const r = num(s.reps ?? s.repeticiones ?? s.r);
    const sec = num(s.segundos ?? s.sec);
    const min = num(s.minutos ?? s.min);
    const speed = num(s.velocidad ?? s.speed);
    const rest = num(s.descanso ?? s.rest);
    if (w != null) set.w = clamp(Math.round(w * 10) / 10, 0, 1000);
    if (r != null) set.r = clamp(Math.round(r), 0, 200);
    if (sec != null) set.sec = clamp(Math.round(sec), 0, 7200);
    if (min != null) set.min = clamp(Math.round(min), 0, 600);
    if (speed != null) set.speed = clamp(Math.round(speed * 10) / 10, 0, 60);
    if (rest != null) set.rest = clamp(Math.round(rest), 0, 900);
    out.push(set);
  }
  return out;
};

const applyOne = (S: GymState, action: CoachAction): ApplyResult => {
  const tipo = String(action.tipo || action.type || "").trim();
  const result = (ok: boolean, mensaje: string, nav?: string): ApplyResult => ({
    tipo: tipo || "accion",
    ok,
    mensaje,
    ...(nav ? { nav } : {}),
  });

  const requireRoutine = (ref: unknown): Routine => {
    const routine = findRoutine(S, ref);
    if (!routine) throw new Error(`No encontré la rutina «${String(ref ?? "")}».`);
    return routine;
  };

  switch (tipo) {
    case "crear_rutina": {
      const nombre = String(action.nombre ?? action.name ?? "").trim();
      if (!nombre) throw new Error("Falta el nombre de la rutina.");
      if (S.routines.some((r) => normText(r.name) === normText(nombre))) {
        throw new Error(`Ya existe una rutina llamada «${nombre}». Usa actualizar_rutina.`);
      }
      const rawExercises = action.ejercicios ?? action.exercises;
      if (!Array.isArray(rawExercises) || rawExercises.length === 0) {
        throw new Error("Una rutina necesita al menos un ejercicio.");
      }
      const routine: Routine = {
        id: uid(),
        name: nombre.slice(0, 80),
        emoji: String(action.emoji || "dumbbell").slice(0, 8),
        prog: toPolicy(action.progresion ?? action.prog) || undefined,
        ex: rawExercises.map((raw) => buildExConfig(S, raw as Record<string, unknown>, toPolicy(action.progresion ?? action.prog))),
      };
      S.routines.push(routine);
      return result(
        true,
        `Rutina ${routineLabel(routine)} creada con ${routine.ex.length} ejercicio(s).`,
      );
    }

    case "actualizar_rutina": {
      const routine = requireRoutine(action.rutina ?? action.nombre_rutina ?? action.routine);
      const notes = applyToRoutine(S, routine, action);
      return result(
        true,
        notes.length
          ? `Rutina ${routineLabel(routine)} actualizada: ${notes.join(", ")}.`
          : `Rutina ${routineLabel(routine)} actualizada.`,
      );
    }

    case "eliminar_rutina": {
      const routine = requireRoutine(action.rutina ?? action.routine);
      if (action.confirmado !== true) {
        return result(
          false,
          `No eliminé ${routineLabel(routine)}: primero pide confirmación al usuario.`,
        );
      }
      S.routines = S.routines.filter((r) => r.id !== routine.id);
      for (const key of Object.keys(S.week || {})) {
        if (S.week[Number(key)] === routine.id) delete S.week[Number(key)];
      }
      for (const [iso, value] of Object.entries(S.dayPlan || {})) {
        if (value === routine.id) delete S.dayPlan[iso];
      }
      if (S.active?.routineId === routine.id) S.active = null;
      return result(true, `Rutina ${routineLabel(routine)} eliminada y quitada del plan.`);
    }

    case "asignar_semana": {
      const days = (action.dias ?? action.days) as Record<string, unknown> | undefined;
      if (!days || typeof days !== "object") throw new Error("Faltan los días de la semana.");
      const notes: string[] = [];
      for (const [rawDay, rawRoutine] of Object.entries(days)) {
        const day = normText(rawDay);
        const index = WEEKDAY_INDEX[day];
        if (index === undefined) {
          notes.push(`día «${rawDay}» no válido`);
          continue;
        }
        const value = String(rawRoutine ?? "").trim();
        if (!value || /^(descanso|rest|libre|off)$/i.test(value)) {
          delete S.week[index];
          notes.push(`${DAYN[index]}: descanso`);
          continue;
        }
        const routine = findRoutine(S, value);
        if (!routine) {
          notes.push(`${DAYN[index]}: no encontré «${value}»`);
          continue;
        }
        S.week[index] = routine.id;
        notes.push(`${DAYN[index]}: ${routine.name}`);
      }
      if (!notes.length) throw new Error("No pude interpretar ningún día.");
      return result(true, `Semana actualizada — ${notes.join(" · ")}.`);
    }

    case "planificar_dia": {
      const iso = resolveDate(action.fecha);
      const value = String(action.rutina ?? action.routine ?? "").trim();
      if (!value) {
        delete S.dayPlan[iso];
        return result(true, `Día ${iso} vuelve al plan semanal.`);
      }
      if (/^(descanso|rest|libre|off)$/i.test(value)) {
        S.dayPlan[iso] = "rest";
        return result(true, `Día ${iso} marcado como descanso.`);
      }
      const routine = findRoutine(S, value);
      if (!routine) throw new Error(`No encontré la rutina «${value}».`);
      S.dayPlan[iso] = routine.id;
      return result(true, `Día ${iso}: ${routine.name}.`);
    }

    case "registrar_peso": {
      const peso = num(action.peso ?? action.weight);
      if (peso == null || peso <= 0 || peso > 500) throw new Error("El peso debe estar entre 0 y 500.");
      const iso = resolveDate(action.fecha);
      const value = Math.round(peso * 10) / 10;
      const existing = S.bodyweight.find((b) => b.d === iso);
      if (existing) {
        existing.w = value;
        existing.t = Date.now();
      } else {
        S.bodyweight.push({ d: iso, w: value, t: Date.now() });
      }
      sortDates(S.bodyweight);
      return result(true, `Peso corporal registrado: ${value} ${S.bwUnit || S.unit} (${iso}).`);
    }

    case "registrar_medidas": {
      const raw = (action.medidas ?? action.measurements) as Record<string, unknown> | undefined;
      if (!raw || typeof raw !== "object") throw new Error("Faltan las medidas.");
      type BodyMetricField =
        | "chest"
        | "waist"
        | "hip"
        | "armL"
        | "armR"
        | "bicepFlex"
        | "bicepRelax"
        | "thigh";
      const map: Record<string, BodyMetricField> = {
        pecho: "chest",
        chest: "chest",
        cintura: "waist",
        waist: "waist",
        cadera: "hip",
        hip: "hip",
        brazo_izq: "armL",
        brazol: "armL",
        arml: "armL",
        armleft: "armL",
        brazo_der: "armR",
        brazor: "armR",
        armr: "armR",
        armright: "armR",
        biceps_flex: "bicepFlex",
        bicepflex: "bicepFlex",
        biceps_relax: "bicepRelax",
        biceprelax: "bicepRelax",
        muslo: "thigh",
        thigh: "thigh",
      };
      const iso = resolveDate(action.fecha);
      const entry: GymState["bodyM"][number] = { d: iso, t: Date.now() };
      let count = 0;
      for (const [key, value] of Object.entries(raw)) {
        const field = map[normText(key).replace(/\s+/g, "_")];
        const n = num(value);
        if (!field || n == null || n <= 0 || n > 300) continue;
        entry[field] = Math.round(n * 10) / 10;
        count++;
      }
      if (!count) throw new Error("No pude leer ninguna medida válida.");
      const existing = S.bodyM.find((m) => m.d === iso);
      if (existing) Object.assign(existing, entry);
      else S.bodyM.push(entry);
      sortDates(S.bodyM);
      return result(true, `${count} medida(s) registradas (${iso}).`);
    }

    case "objetivo_peso": {
      const peso = num(action.peso ?? action.weight);
      if (peso == null || peso <= 0 || peso > 500) throw new Error("El objetivo debe estar entre 0 y 500.");
      S.targetW = Math.round(peso * 10) / 10;
      return result(true, `Objetivo de peso corporal: ${S.targetW} ${S.bwUnit || S.unit}.`);
    }

    case "ajustar_ejercicio": {
      const ref = action.ejercicio ?? action.nombre ?? action.exercise;
      const id = findExerciseId(S, ref);
      if (!id) throw new Error(`No encontré el ejercicio «${String(ref ?? "")}».`);
      const routineRef = action.rutina ?? action.routine;
      const routines = routineRef ? [requireRoutine(routineRef)] : findRoutineForExercise(S, id);
      let changed = 0;
      for (const routine of routines) {
        const cfg = routine.ex.find((e) => e.id === id);
        if (!cfg) continue;
        const sets = num(action.series ?? action.sets);
        const reps = num(action.reps ?? action.repeticiones);
        const repsMin = num(action.reps_min ?? action.repsMin);
        const weight = num(action.peso ?? action.weight);
        const rest = num(action.descanso ?? action.descanso_seg ?? action.rest);
        const sec = num(action.segundos ?? action.sec);
        if (sets != null) cfg.sets = clamp(Math.round(sets), 1, 20);
        if (reps != null) cfg.reps = clamp(Math.round(reps), 1, 100);
        if (repsMin != null) cfg.repsMin = clamp(Math.round(repsMin), 1, Math.max(1, cfg.reps || 100));
        if (weight != null && weight >= 0) cfg.weight = clamp(Math.round(weight * 10) / 10, 0, 1000);
        if (rest != null) cfg.rest = clamp(Math.round(rest), 0, 900);
        if (sec != null) {
          cfg.mode = "time";
          cfg.sec = clamp(Math.round(sec), 5, 3600);
        }
        const prog = toPolicy(action.progresion ?? action.prog);
        if (prog) cfg.prog = prog;
        if (action.por_lado != null) cfg.side = Boolean(action.por_lado);
        if (action.peso_corporal != null) cfg.bodyweight = Boolean(action.peso_corporal);
        changed++;
      }
      const weight = num(action.peso ?? action.weight);
      if (weight != null && weight >= 0) {
        S.exWeights[id] = { w: clamp(Math.round(weight * 10) / 10, 0, 1000), d: todayISO() };
      }
      return result(
        true,
        changed
          ? `${exerciseLabel(S, id)} ajustado en ${changed} rutina(s).`
          : `${exerciseLabel(S, id)}: peso actualizado; no estaba en ninguna rutina.`,
      );
    }

    case "registrar_entrenamiento": {
      const iso = resolveDate(action.fecha);
      const rawExercises = action.ejercicios ?? action.exercises;
      if (!Array.isArray(rawExercises) || rawExercises.length === 0) {
        throw new Error("Faltan los ejercicios del entrenamiento.");
      }
      const routineRef = action.rutina ?? action.routine;
      const routine = routineRef ? requireRoutine(routineRef) : null;
      const duration = num(action.duracion_min ?? action.duracion ?? action.minutes);
      const now = Date.now();
      const entries: Workout["entries"] = [];
      const prs: string[] = [];

      for (const raw of rawExercises) {
        if (!raw || typeof raw !== "object") continue;
        const spec = raw as Record<string, unknown>;
        const id = ensureExercise(S, spec.ejercicio ?? spec.nombre ?? spec.name, {
          grupo: spec.grupo ?? spec.grupo_muscular,
          equipo: spec.equipo,
        });
        const routineCfg = routine?.ex.find((e) => e.id === id) || null;
        const target = routineCfg
          ? { ...routineCfg }
          : S.routines.flatMap((r) => r.ex).find((e) => e.id === id) || defaultConfig(id);
        const sets = setsFromAction(spec.series ?? spec.sets);
        if (!sets.length) continue;
        const previousBest = bestWeightFor(S, id);
        const top = Math.max(0, ...sets.map((s) => Number(s.w) || 0));
        if (top > previousBest && top > 0) prs.push(exerciseLabel(S, id));
        entries.push({
          id,
          target: target as ExConfig,
          sets,
          topW: Math.round(top * 10) / 10,
        });
      }
      if (!entries.length) throw new Error("No pude leer ninguna serie válida.");
      const end = now;
      const start = duration && duration > 0 ? end - Math.round(duration) * 60000 : now;
      const name = routine?.name || String(action.nombre ?? action.name ?? "Entrenamiento").slice(0, 80);
      const workout: Workout = {
        id: "w" + uid(),
        d: iso,
        start,
        end,
        routineId: routine?.id,
        name,
        entries,
        prs,
      };
      workout.vol = Math.round(workoutVolume(workout) * 10) / 10;
      S.workouts.push(workout);
      sortDates(S.workouts);
      const totalSets = entries.reduce((sum, e) => sum + e.sets.length, 0);
      return result(
        true,
        `Entrenamiento «${name}» registrado (${iso}): ${entries.length} ejercicio(s), ${totalSets} serie(s)${prs.length ? ` · PR: ${prs.join(", ")}` : ""}.`,
      );
    }

    case "crear_ejercicio": {
      const nombre = String(action.nombre ?? action.name ?? "").trim();
      if (!nombre) throw new Error("Falta el nombre del ejercicio.");
      const existing = findExerciseId(S, nombre);
      if (existing) return result(true, `«${nombre}» ya existe en la biblioteca.`);
      const id = ensureExercise(S, nombre, {
        grupo: action.grupo ?? action.grupo_muscular,
        equipo: action.equipo,
        descripcion: action.descripcion,
      });
      return result(true, `Ejercicio «${nombre}» creado en tu biblioteca (${id}).`);
    }

    case "ajustes": {
      const notes: string[] = [];
      if (action.unidad != null) {
        const unit = String(action.unidad).toLowerCase() === "lb" ? "lb" : "kg";
        S.unit = unit;
        S.bwUnit = unit;
        notes.push(`unidad: ${unit}`);
      }
      const rest = num(action.descanso_seg ?? action.descanso ?? action.rest);
      if (rest != null) {
        S.restSec = clamp(Math.round(rest), 15, 600);
        notes.push(`descanso por defecto: ${S.restSec}s`);
      }
      if (action.objetivo_peso !== undefined) {
        const target = action.objetivo_peso == null ? null : num(action.objetivo_peso);
        if (target === null) {
          S.targetW = null;
          notes.push("objetivo de peso eliminado");
        } else if (target > 0 && target <= 500) {
          S.targetW = Math.round(target * 10) / 10;
          notes.push(`objetivo de peso: ${S.targetW} ${S.bwUnit || S.unit}`);
        }
      }
      if (action.sonido != null) {
        S.sound = Boolean(action.sonido);
        notes.push(`sonido: ${S.sound ? "sí" : "no"}`);
      }
      if (!notes.length) throw new Error("No había ajustes válidos.");
      return result(true, `Ajustes actualizados — ${notes.join(" · ")}.`);
    }

    case "abrir_pantalla": {
      const tab = String(action.pantalla ?? action.tab ?? "").toLowerCase();
      const valid = ["home", "workout", "plan", "library", "stats", "history", "coach"];
      if (!valid.includes(tab)) throw new Error(`Pantalla «${tab}» no válida.`);
      return result(true, `Abriendo ${tab}.`, tab);
    }

    default:
      return result(false, `Acción «${tipo || "(sin tipo)"}» no reconocida.`);
  }
};

/**
 * Aplica una lista de acciones al estado de Gym 2.0. Devuelve un resumen por
 * acción para mostrarlo en el chat y guardarlo con la conversación.
 */
export function applyCoachActions(
  rawActions: unknown,
  onNavigate?: (tab: string) => void,
): CoachActionResult[] {
  if (!Array.isArray(rawActions) || rawActions.length === 0) return [];
  const gym = getGym();
  if (!gym) {
    return [{ tipo: "sistema", ok: false, mensaje: "Gym 2.0 no está inicializado." }];
  }
  const actions = rawActions.filter((a) => a && typeof a === "object") as CoachAction[];
  if (!actions.length) return [];
  const results: ApplyResult[] = [];
  let nav: string | null = null;

  gym.update((state) => {
    for (const action of actions) {
      try {
        const applied = applyOne(state, action);
        results.push(applied);
        if (applied.nav) nav = applied.nav;
      } catch (e) {
        results.push({
          tipo: String(action.tipo || action.type || "accion"),
          ok: false,
          mensaje: (e as Error).message || "No pude aplicar la acción.",
        });
      }
    }
  });

  if (nav && onNavigate) {
    // Después del render del estado nuevo, para que la pantalla destino ya
    // encuentre los datos aplicados.
    window.setTimeout(() => onNavigate(nav as string), 80);
  }

  return results.map(({ nav: _nav, ...rest }) => rest);
}
