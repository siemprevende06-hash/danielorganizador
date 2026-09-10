import { modeOf, repStep } from "./history";
import { EXIDX } from "./exercises";
import type {
  Entry,
  ExConfig,
  GymState,
  Prescription,
  Routine,
  SetRec,
} from "./types";

export const POLICIES = ["off", "linear", "greyskull", "double", "time"];

export const POLICIES_FOR: Record<string, string[]> = {
  reps: ["off", "linear", "greyskull", "double"],
  time: ["off", "time"],
  cardio: ["off"],
};

export const POLICY_NAME: Record<string, string> = {
  off: "Sin progresión automática",
  linear: "Progresión lineal",
  greyskull: "Greyskull LP",
  double: "Progresión doble",
  time: "Añadir tiempo",
};
export const POLICY_DESC: Record<string, string> = {
  off: "Los objetivos se quedan donde los pongas.",
  linear:
    "Acierta todas las repeticiones de todas las series y el peso sube. Fallos repetidos provocan una descarga.",
  greyskull:
    "Dos series rectas más una final al fallo. Supera el objetivo en esa serie y el peso sube — el doble si doblas las repeticiones. Un fallo reinicia un 10%.",
  double:
    "Sube por un rango de repeticiones al mismo peso. Llega al tope del rango en cada serie y el peso sube, las repeticiones vuelven al fondo.",
  time: "Aguanta cada serie el tiempo completo y el objetivo sube.",
};

export const DELOAD_AFTER: Record<string, number> = {
  linear: 3,
  greyskull: 1,
  double: 3,
  time: 3,
};
const DELOAD_FACTOR = 0.9;

const HEAVY_BP = ["upper legs", "lower legs", "back", "hips", "glutes"];

export function defaultIncrement(exId: string, unit: string) {
  const ex = EXIDX[exId];
  const heavy = ex && HEAVY_BP.includes(ex.bp);
  if (unit === "lb") return heavy ? 10 : 5;
  return heavy ? 5 : 2.5;
}
export const DEFAULT_SEC_INCREMENT = 5;
export const MAX_BW_SETS = 6;

export function policyFor(
  cfg: ExConfig | null | undefined,
  routine: Routine | null | undefined,
  mode?: string
) {
  const m = mode || modeOf(cfg || {});
  const allowed = POLICIES_FOR[m] || ["off"];
  const pick =
    (cfg && cfg.prog) ||
    (routine && routine.prog) ||
    (m === "reps" ? "linear" : "off");
  return allowed.includes(pick) ? pick : "off";
}

const round1 = (v: number) => Math.round(v * 10) / 10;
function snap(v: number, step: number) {
  if (!(step > 0)) return round1(v);
  return round1(Math.round(v / step) * step);
}
function deloadTo(cur: number, step: number) {
  let next = snap(cur * DELOAD_FACTOR, step);
  if (next >= cur) next = snap(cur - step, step);
  return Math.max(step, next);
}

export interface SessionRead {
  d?: string;
  mode: string;
  goal: number;
  reps?: number[];
  held?: number[];
  weight: number;
  best?: number;
  count?: number;
  low?: number;
  amrap?: number;
  ok: boolean;
}

export function readSession(
  entry: Entry | null | undefined,
  fallback?: ExConfig | null
): SessionRead {
  const target = (entry && entry.target) || fallback || {};
  const mode = modeOf({ ...target, id: entry && entry.id });
  const sets: SetRec[] = (entry && entry.sets) || [];
  const planned = target.sets || sets.length;
  const enough = sets.length >= planned;

  if (mode === "time") {
    const goal = target.sec || 0;
    const held = sets.map((s) => (s.done ? s.sec || 0 : 0));
    return {
      mode,
      goal,
      held,
      weight: Math.max(0, ...sets.filter((s) => s.done).map((s) => s.w || 0)),
      best: Math.max(0, ...held),
      ok: goal > 0 && enough && held.length > 0 && held.every((h) => h >= goal),
    };
  }
  const goal = target.reps || 0;
  const reps = sets.map((s) => (s.done ? s.r || 0 : 0));
  return {
    mode,
    goal,
    reps,
    weight: Math.max(0, ...sets.filter((s) => s.done).map((s) => s.w || 0)),
    count: reps.length,
    low: reps.length ? Math.min(...reps) : 0,
    amrap: reps.length ? reps[reps.length - 1] : 0,
    ok: goal > 0 && enough && reps.length > 0 && reps.every((r) => r >= goal),
  };
}

export function sessionsFor(
  S: GymState,
  exId: string,
  fallback?: ExConfig | null
): SessionRead[] {
  const out: SessionRead[] = [];
  (S.workouts || []).forEach((w) => {
    const entry = w.entries.find((e) => e.id === exId);
    if (entry && entry.sets.some((s) => s.done))
      out.push({ d: w.d, ...readSession(entry, fallback) });
  });
  return out;
}

export function stallCount(sessions: SessionRead[]) {
  let n = 0;
  for (let i = sessions.length - 1; i >= 0; i--) {
    if (sessions[i].ok) break;
    n++;
  }
  return n;
}

export function nextPrescription(
  S: GymState,
  cfg: ExConfig,
  routine: Routine | null
): Prescription {
  const mode = modeOf(cfg);
  const policy = policyFor(cfg, routine, mode);
  const unit = S.unit || "kg";
  const inc =
    cfg.inc && cfg.inc > 0
      ? cfg.inc
      : mode === "time"
      ? DEFAULT_SEC_INCREMENT
      : defaultIncrement(cfg.id!, unit);
  if (policy === "off") return { policy, kind: "off" };

  const sessions = sessionsFor(S, cfg.id!, cfg).filter((s) => s.mode === mode);
  const last = sessions[sessions.length - 1];
  if (!last)
    return {
      policy,
      kind: "first",
      why: ["Aún no hay nada registrado — esta sesión marca el punto de partida."],
    };

  const stalls = stallCount(sessions);
  const deloadAt = DELOAD_AFTER[policy] || 3;

  if (mode === "time") {
    if (last.ok) {
      const sec = (last.goal || cfg.sec || 0) + inc;
      return {
        policy,
        kind: "up",
        sec,
        why: [`Aguantaste todas las series — objetivo +${inc}s.`],
      };
    }
    if (stalls >= deloadAt) {
      const sec = deloadTo(last.goal || cfg.sec || 0, 5);
      return {
        policy,
        kind: "deload",
        sec,
        why: [
          `${stalls} sesiones fallidas seguidas — bajamos a ${sec}s y subimos otra vez.`,
        ],
      };
    }
    return {
      policy,
      kind: "hold",
      sec: last.goal || cfg.sec,
      why: ["La última vez no llegaste — mismo objetivo."],
    };
  }

  const w = last.weight;
  if (w <= 0) {
    const goal = last.goal || cfg.reps || 0;
    if (!last.ok || goal <= 0)
      return {
        policy,
        kind: "hold",
        weight: 0,
        reps: goal || undefined,
        why: ["Peso corporal — mismo objetivo hasta que cada serie esté limpia."],
      };
    const top = cfg.repsMax && cfg.repsMax > 0 ? cfg.repsMax : 0;
    if (top > 0 && goal >= top) {
      const sets = Math.max(1, cfg.sets || last.count || 1) + 1;
      const bottom = Math.max(1, Math.min(cfg.reps || top, top));
      if (sets <= MAX_BW_SETS)
        return {
          policy,
          kind: "up",
          weight: 0,
          reps: bottom,
          sets,
          why: [`${goal} reps en cada serie — añade una serie y vuelve a ${bottom}.`],
        };
      return {
        policy,
        kind: "hold",
        weight: 0,
        reps: goal,
        why: [
          `${sets - 1} series de ${goal} — es hora de añadir peso o pasar a una variante más dura.`,
        ],
      };
    }
    const next = goal + repStep(cfg);
    return {
      policy,
      kind: "up",
      weight: 0,
      reps: next,
      why: ["Peso corporal — todas las reps la última vez, ve a por " + next + " esta."],
    };
  }

  if (policy === "double") {
    const top = cfg.reps || last.goal || 10;
    const bottom = Math.min(cfg.repsMin || Math.max(1, top - 2), top);
    if (last.ok)
      return {
        policy,
        kind: "up",
        weight: snap(w + inc, inc),
        reps: bottom,
        why: [`Tope del rango en todas las series — ${inc} ${unit} más, vuelve a ${bottom} reps.`],
      };
    if (stalls >= deloadAt) {
      const dw = deloadTo(w, inc);
      return {
        policy,
        kind: "deload",
        weight: dw,
        reps: bottom,
        why: [`Atascado ${stalls} sesiones — descarga a ${dw} ${unit}.`],
      };
    }
    const aim = Math.min(top, Math.max(bottom, (last.low || 0) + repStep(cfg)));
    return {
      policy,
      kind: "hold",
      weight: w,
      reps: aim,
      why: [`Mismo peso — intenta ${aim} reps esta vez.`],
    };
  }

  if (last.ok) {
    const dbl =
      policy === "greyskull" &&
      last.goal > 0 &&
      (last.amrap || 0) >= last.goal * 2;
    const step = dbl ? inc * 2 : inc;
    return {
      policy,
      kind: "up",
      weight: snap(w + step, inc),
      why: dbl
        ? [`La última serie llegó a ${last.amrap} reps — el doble del objetivo, salto doble de ${step} ${unit}.`]
        : [`Todas las reps la última vez — ${step} ${unit} más.`],
    };
  }
  if (stalls >= deloadAt) {
    const dw = deloadTo(w, inc);
    return {
      policy,
      kind: "deload",
      weight: dw,
      why:
        stalls > 1
          ? [`${stalls} sesiones fallando reps — reinicia a ${dw} ${unit} y sube otra vez.`]
          : [`Faltaron reps — reinicia a ${dw} ${unit} y sube otra vez.`],
    };
  }
  return {
    policy,
    kind: "hold",
    weight: w,
    why: [
      `Faltaron reps la última vez — mismo peso (${deloadAt - stalls} de ${deloadAt} para descargar).`,
    ],
  };
}

export function applyPrescription(
  sets: SetRec[],
  p: Prescription | null | undefined
): SetRec[] {
  if (!p || p.kind === "off" || p.kind === "first") return sets;
  const out = sets.map((s) => {
    if (s.done) return s;
    const o = { ...s };
    if (p.weight != null) o.w = p.weight;
    if (p.reps != null) o.r = p.reps;
    if (p.sec != null) o.sec = p.sec;
    return o;
  });
  if (p.sets && p.sets > out.length) {
    const seed = out[out.length - 1] || { done: false };
    while (out.length < p.sets) out.push({ ...seed, done: false });
  }
  return out;
}