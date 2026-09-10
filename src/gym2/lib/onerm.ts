import type { Entry, GymState } from "./types";

export const REP_CAP = 12;

export const FORMULAS: Record<string, (w: number, r: number) => number> = {
  epley: (w, r) => w * (1 + r / 30),
  brzycki: (w, r) => (w * 36) / (37 - r),
  lombardi: (w, r) => w * Math.pow(r, 0.1),
};
export const DEFAULT_FORMULA = "epley";

export function estimate1RM(
  w: number | undefined,
  r: number | undefined,
  formula: string = DEFAULT_FORMULA
): number | null {
  const weight = Number(w);
  const reps = Number(r);
  if (!isFinite(weight) || !isFinite(reps)) return null;
  if (weight <= 0 || reps < 1) return null;
  if (reps > REP_CAP) return null;
  const fn = FORMULAS[formula] || FORMULAS[DEFAULT_FORMULA];
  const est = reps === 1 ? weight : fn(weight, Math.round(reps));
  if (!isFinite(est) || est <= 0) return null;
  return Math.round(est * 10) / 10;
}

export function bestSetOf(
  entry: Entry | null | undefined,
  formula: string = DEFAULT_FORMULA
): { est: number; w: number; r: number } | null {
  let best: { est: number; w: number; r: number } | null = null;
  (entry?.sets || []).forEach((s) => {
    if (!s.done) return;
    const est = estimate1RM(s.w, s.r, formula);
    if (est !== null && (!best || est > best.est))
      best = { est, w: Number(s.w), r: Math.round(Number(s.r)) };
  });
  return best;
}

export function e1rmSeries(
  S: GymState,
  exId: string,
  formula: string = DEFAULT_FORMULA
): { t: number; d: string; y: number; w: number; r: number }[] {
  const pts: { t: number; d: string; y: number; w: number; r: number }[] = [];
  (S.workouts || []).forEach((w) => {
    const entry = w.entries.find((e) => e.id === exId);
    if (!entry) return;
    const best = bestSetOf(entry, formula);
    if (best) pts.push({ t: w.start, d: w.d, y: best.est, w: best.w, r: best.r });
  });
  return pts;
}

export function best1RM(
  S: GymState,
  exId: string,
  formula: string = DEFAULT_FORMULA
):
  | { est: number; w: number; r: number; d: string; t: number }
  | null {
  let best: { est: number; w: number; r: number; d: string; t: number } | null =
    null;
  e1rmSeries(S, exId, formula).forEach((p) => {
    if (!best || p.y > best.est) best = { est: p.y, w: p.w, r: p.r, d: p.d, t: p.t };
  });
  return best;
}

export function is1RMRecord(
  S: GymState,
  exId: string,
  entry: Entry,
  formula: string = DEFAULT_FORMULA
): { est: number; w: number; r: number; prev: number } | null {
  const now = bestSetOf(entry, formula);
  if (!now) return null;
  const prev = best1RM(S, exId, formula);
  return !prev || now.est > prev.est
    ? { ...now, prev: prev ? prev.est : 0 }
    : null;
}