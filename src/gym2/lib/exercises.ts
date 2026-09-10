import { EXDB, type Ex } from "./exercises-data";
import type { CustomEx, GymState } from "./types";

export { EXDB };
export type { Ex } from "./exercises-data";

export const EXIDX: Record<string, Ex> = {};
EXDB.forEach((e) => {
  EXIDX[e.id] = e;
});

export const BODYPARTS = [...new Set(EXDB.map((e) => e.bp))].sort();

export function equipmentOf(list: Ex[]): string[] {
  const c: Record<string, number> = {};
  list.forEach((e) => {
    if (e.eq) c[e.eq] = (c[e.eq] || 0) + 1;
  });
  return Object.keys(c).sort(
    (a, b) => c[b] - c[a] || (a < b ? -1 : 1)
  );
}

let customIds: string[] = [];
export function registerCustom(list: CustomEx[]) {
  customIds.forEach((id) => {
    delete EXIDX[id];
  });
  customIds = (list || []).map((e) => e.id);
  (list || []).forEach((e) => {
    EXIDX[e.id] = e as unknown as Ex;
  });
}

export type AnyExercise = Ex | CustomEx;
export const allExercises = (st: GymState): AnyExercise[] => [
  ...(st.customEx || []),
  ...EXDB,
];

export const isCardio = (idOrEx: string | AnyExercise | null | undefined) =>
  (typeof idOrEx === "string" ? EXIDX[idOrEx] : idOrEx)?.bp === "cardio";

export const isBodyweightEq = (idOrEx: string | AnyExercise | null | undefined) =>
  (typeof idOrEx === "string" ? EXIDX[idOrEx] : idOrEx)?.eq === "body weight";

export const exOr = (id: string): Ex & { missing?: boolean } =>
  EXIDX[id] || {
    id,
    n: "Ejercicio desconocido",
    bp: "",
    tg: "",
    eq: "",
    sm: [],
    st: [],
    missing: true,
  };