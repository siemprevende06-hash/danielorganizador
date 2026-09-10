import { todayISO, isoOf, weekKey, fmtNum } from "./format";
import { isCardio, isBodyweightEq } from "./exercises";
import type {
  ActiveWorkout,
  Entry,
  ExConfig,
  GymState,
  Routine,
  SetRec,
  Workout,
} from "./types";

export function modeOf(cfg: ExConfig | null | undefined): "reps" | "time" | "cardio" {
  const m = cfg?.mode;
  if (m === "reps" || m === "time" || m === "cardio") return m;
  return isCardio(cfg && cfg.id) ? "cardio" : "reps";
}
export const isTimed = (cfg: ExConfig | null | undefined) =>
  modeOf(cfg) === "time";

export const isBw = (cfg: ExConfig | null | undefined) =>
  cfg && cfg.bodyweight != null
    ? !!cfg.bodyweight
    : isBodyweightEq(cfg && cfg.id);
export const isPerSide = (cfg: ExConfig | null | undefined) => !!(cfg && cfg.side);
export const sideReps = (reps: number | undefined) => (reps || 0) / 2;
export const repStep = (cfg: ExConfig | null | undefined) =>
  isPerSide(cfg) ? 2 : 1;

export function fmtSec(sec: number | undefined) {
  const n = Math.max(0, Math.round(Number(sec) || 0));
  return Math.floor(n / 60) + ":" + String(n % 60).padStart(2, "0");
}

export const EFFORT: Record<
  string,
  { f: string; hd: string; step: number; min: number; max: number }
> = {
  rir: { f: "rir", hd: "RIR", step: 0.5, min: 0, max: 10 },
  rpe: { f: "rpe", hd: "RPE", step: 0.5, min: 6, max: 10 },
};

export function stepEffort(
  kind: string,
  cur: number | null | undefined,
  dir: number
): number | null {
  const e = EFFORT[kind];
  if (!e) return cur ?? null;
  if (cur == null) return dir < 0 ? null : e.min;
  const n = Math.round((cur + dir * e.step) * 100) / 100;
  if (dir < 0 && n < e.min) return null;
  return dir > 0 ? Math.min(e.max, n) : Math.max(e.min, n);
}

export const capEffort = (kind: string, v: number | null | undefined) =>
  v == null || !EFFORT[kind] ? v : Math.min(EFFORT[kind].max, v);

export const effortOf = (S: GymState | null | undefined): string => {
  const e = S?.effort;
  return e === "none" || EFFORT[e] ? e || "none" : S.showRir ? "rir" : "none";
};

const effortTail = (s: SetRec) => {
  const k = s.rir != null ? "rir" : s.rpe != null ? "rpe" : null;
  return k ? ` (${EFFORT[k].hd} ${fmtNum(s[k])})` : "";
};

export function setLabel(
  id: string,
  s: SetRec,
  cfg: ExConfig | null | undefined
) {
  const c = cfg || { id };
  const mode = modeOf(c);
  if (mode === "cardio")
    return `${s.min || 0} min @ ${fmtNum(s.speed || 0)} km/h`;
  if (mode === "time") return fmtSec(s.sec) + (s.w ? ` · ${fmtNum(s.w)}` : "");
  const reps = s.r || 0;
  if (isBw({ ...c, id: c.id ?? id })) {
    const load = s.w && s.w > 0 ? `+${fmtNum(s.w)} × ` : "";
    return `${load}${reps}` + effortTail(s);
  }
  return `${fmtNum(s.w || 0)}×${reps}` + effortTail(s);
}

export function defaultConfig(id: string, mode?: string): ExConfig {
  const m = (mode as "reps" | "time" | "cardio") || modeOf({ id });
  if (m === "cardio") return { sets: 1, min: 20, speed: 8 };
  const bw = isBodyweightEq(id)
    ? { bodyweight: true }
    : {};
  if (m === "time") return { sets: 3, sec: 45, weight: 0, mode: "time", ...bw };
  return { sets: 3, reps: 10, weight: 0, mode: "reps", ...bw };
}

export function exLine(cfg: ExConfig, unit: string) {
  const mode = modeOf(cfg);
  const n = cfg.sets || 1;
  const load = cfg.weight
    ? " · " + (isBw(cfg) ? "+" : "") + fmtNum(cfg.weight) + " " + unit
    : "";
  if (mode === "cardio")
    return `${n} × ${cfg.min || 20} min @ ${fmtNum(cfg.speed || 8)} km/h`;
  if (mode === "time") return `${n} × ${fmtSec(cfg.sec || 45)}${load}`;
  const split = isPerSide(cfg)
    ? " · " + fmtNum(sideReps(cfg.reps)) + "/lado"
    : "";
  return `${n} × ${cfg.reps}${load}${split}`;
}

export function cleanupSg(ex: ExConfig[]) {
  ex.forEach((e, i) => {
    if (e.sg && !(ex[i - 1]?.sg === e.sg || ex[i + 1]?.sg === e.sg))
      delete e.sg;
  });
}

export function lastEntryFor(
  S: GymState,
  exId: string
): { d: string; sets: SetRec[]; target: ExConfig | null } | null {
  for (let i = S.workouts.length - 1; i >= 0; i--) {
    const en = S.workouts[i].entries.find((e) => e.id === exId);
    if (en && en.sets.some((s) => s.done))
      return {
        d: S.workouts[i].d,
        sets: en.sets.filter((s) => s.done),
        target: en.target || null,
      };
  }
  return null;
}

export function bestWeightFor(S: GymState, exId: string) {
  let best = 0;
  S.workouts.forEach((w) =>
    w.entries.forEach((e) => {
      if (e.id === exId) {
        e.sets.forEach((s) => {
          if (s.done && s.w && s.w > best) best = s.w;
        });
        if (e.topW && e.topW > best) best = e.topW;
      }
    })
  );
  return best;
}

export function effectiveRoutineId(S: GymState, iso: string): string | null {
  const ov = S.dayPlan[iso];
  if (ov === "rest") return null;
  if (ov && S.routines.some((r) => r.id === ov)) return ov;
  const wd = new Date(iso + "T12:00:00").getDay();
  return S.week[wd] || null;
}

export function effectiveRoutine(S: GymState, iso: string): Routine | null {
  const id = effectiveRoutineId(S, iso);
  return id ? S.routines.find((r) => r.id === id) || null : null;
}

export function buildSets(S: GymState, cfg: ExConfig): SetRec[] {
  const last = lastEntryFor(S, cfg.id!);
  const n = Math.max(1, cfg.sets || 1);
  const mode = modeOf(cfg);
  const sets: SetRec[] = [];
  const prevAt = (i: number) =>
    last ? last.sets[i] || last.sets[last.sets.length - 1] : null;

  if (mode === "cardio") {
    for (let i = 0; i < n; i++) {
      const prev = prevAt(i);
      sets.push({
        min: prev ? prev.min : (cfg.min || 20),
        speed: prev ? prev.speed : (cfg.speed || 8),
        done: false,
      });
    }
    return sets;
  }
  if (mode === "time") {
    for (let i = 0; i < n; i++) {
      const prev = prevAt(i);
      const carried = prev && prev.sec && prev.sec > 0 ? prev : null;
      sets.push({
        sec: carried ? carried.sec : (cfg.sec || 45),
        w: carried ? carried.w || 0 : (cfg.weight || 0),
        done: false,
      });
    }
    return sets;
  }
  const conf = S.exWeights[cfg.id!];
  for (let i = 0; i < n; i++) {
    const prev = prevAt(i);
    const usable = prev && prev.r && prev.r > 0 ? prev : null;
    const w = conf && conf.w > 0 ? conf.w : usable ? usable.w : cfg.weight;
    sets.push({ w, r: usable ? usable.r : cfg.reps, done: false });
  }
  return sets;
}

export function workoutVolume(w: Pick<Workout, "entries">) {
  let v = 0;
  w.entries.forEach((e) =>
    e.sets.forEach((s) => {
      if (s.done) v += (s.w || 0) * (s.r || 0);
    })
  );
  return v;
}

export function setsDone(w: Pick<Workout, "entries">) {
  let n = 0;
  w.entries.forEach((e) =>
    e.sets.forEach((s) => {
      if (s.done) n++;
    })
  );
  return n;
}

export function setsDoneActive(A: ActiveWorkout | null) {
  let n = 0;
  if (A)
    A.entries.forEach((e) =>
      e.sets.forEach((s) => {
        if (s.done) n++;
      })
    );
  return n;
}

export const lastBW = (S: GymState) =>
  S.bodyweight.length ? S.bodyweight[S.bodyweight.length - 1] : null;

export function supersetUnits<T extends { sg?: string }>(items: T[]) {
  const units: number[][] = [];
  items.forEach((e, i) => {
    const prev = items[i - 1];
    if (i > 0 && e.sg && prev && prev.sg && e.sg === prev.sg)
      units[units.length - 1].push(i);
    else units.push([i]);
  });
  return units;
}

export function unitOf(units: number[][], idx: number) {
  return units.find((u) => u.includes(idx)) || [idx];
}

export function streakWeeks(S: GymState) {
  if (!S.workouts.length) return 0;
  const weeks = new Set(S.workouts.map((w) => weekKey(w.d)));
  let streak = 0;
  const cur = new Date();
  for (let i = 0; i < 520; i++) {
    const wk = weekKey(isoOf(cur));
    if (weeks.has(wk)) streak++;
    else if (i > 0) break;
    cur.setDate(cur.getDate() - 7);
  }
  return streak;
}