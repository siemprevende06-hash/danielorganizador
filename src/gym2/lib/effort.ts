import { EFFORT } from "./history";
import { weekKey } from "./format";
import type { GymState, SetRec, Workout } from "./types";

export const HARD_RIR = 3;
export const MIN_RATED = 5;

export const rirOf = (s: SetRec | null | undefined): number | null =>
  !s ? null : s.rir != null ? s.rir : s.rpe != null ? 10 - s.rpe : null;

export const toScale = (kind: string, rir: number | null) =>
  rir == null
    ? null
    : Math.round((kind === "rpe" ? 10 - rir : rir) * 10) / 10;

function eachDoneSet(
  S: GymState,
  fn: (s: SetRec, w: Workout) => void
) {
  (S.workouts || []).forEach((w) =>
    (w.entries || []).forEach((e) =>
      (e.sets || []).forEach((s) => {
        if (s.done) fn(s, w);
      })
    )
  );
}

export function displayScale(S: GymState) {
  const k = S.effort || "";
  if (EFFORT[k]) return k;
  let rir = 0;
  let rpe = 0;
  eachDoneSet(S, (s) => {
    if (s.rir != null) rir++;
    else if (s.rpe != null) rpe++;
  });
  return rpe > rir ? "rpe" : "rir";
}

export const scaleName = (kind: string) => EFFORT[kind]?.hd || kind;

const inWindow = (w: Workout, days: number) =>
  !days || (w.start || new Date(w.d).getTime()) > Date.now() - days * 86400000;

export const avgRir = (sets: SetRec[] | null | undefined) => {
  const vs = (sets || []).map(rirOf).filter((v) => v != null) as number[];
  return vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null;
};

export function effortSummary(S: GymState, days: number) {
  let done = 0,
    rated = 0,
    sum = 0,
    hard = 0;
  eachDoneSet(S, (s, w) => {
    if (!inWindow(w, days)) return;
    done++;
    const r = rirOf(s);
    if (r == null) return;
    rated++;
    sum += r;
    if (r <= HARD_RIR) hard++;
  });
  return {
    done,
    rated,
    hard,
    avg: rated >= MIN_RATED ? sum / rated : null,
    hardPct: rated >= MIN_RATED ? hard / rated : null,
  };
}

export function hasEffort(S: GymState) {
  let any = false;
  eachDoneSet(S, (s) => {
    if (!any && rirOf(s) != null) any = true;
  });
  return any;
}

function mondayOf(iso: string) {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(12, 0, 0, 0);
  return +d;
}

export function effortWeeks(S: GymState, days: number) {
  const wk = new Map<
    string,
    { k: string; t: number; sum: number; n: number; sets: number }
  >();
  eachDoneSet(S, (s, w) => {
    if (!inWindow(w, days)) return;
    const k = weekKey(w.d);
    let e = wk.get(k);
    if (!e) wk.set(k, (e = { k, t: mondayOf(w.d), sum: 0, n: 0, sets: 0 }));
    e.sets++;
    const r = rirOf(s);
    if (r != null) {
      e.sum += r;
      e.n++;
    }
  });
  return [...wk.values()]
    .filter((e) => e.n >= 2)
    .sort((a, b) => a.t - b.t)
    .map((e) => ({ t: e.t, rir: e.sum / e.n, n: e.n, sets: e.sets }));
}

export const BUCKETS = 4;
export function effortHistogram(S: GymState, days: number) {
  const bins = new Array(BUCKETS + 1).fill(0) as number[];
  let rated = 0;
  eachDoneSet(S, (s, w) => {
    if (!inWindow(w, days)) return;
    const r = rirOf(s);
    if (r == null) return;
    rated++;
    bins[Math.min(BUCKETS, Math.max(0, Math.floor(r)))]++;
  });
  return bins.map((n, i) => ({
    rir: i,
    tail: i === BUCKETS,
    n,
    pct: rated ? n / rated : 0,
  }));
}

export const isHardSet = (s: SetRec) => {
  const r = rirOf(s);
  return r != null && r <= HARD_RIR;
};