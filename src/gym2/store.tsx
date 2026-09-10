import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { registerCustom } from "./lib/exercises";
import type { GymState } from "./lib/types";

const KEY = "gym20_state_v1";

export const DEF: GymState = {
  unit: "kg",
  restSec: 90,
  sound: true,
  targetW: null,
  bodyweight: [],
  routines: [],
  week: {},
  dayPlan: {},
  exWeights: {},
  workouts: [],
  active: null,
  customEx: [],
  effort: "none",
};

const clone = <T,>(o: T): T => JSON.parse(JSON.stringify(o));

function loadState(): GymState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return Object.assign(clone(DEF), JSON.parse(raw));
  } catch {
    /* fall through to empty state */
  }
  return clone(DEF);
}

export interface GymStore {
  S: GymState;
  update: (mut: (s: GymState) => void) => void;
  replaceState: (s: GymState) => void;
  resetDemo: () => void;
  wipeAll: () => void;
}

const GymCtx = createContext<GymStore>(null as unknown as GymStore);

export const useGym = () => useContext(GymCtx);

let gymApi: GymStore | null = null;
export const getGym = (): GymStore => gymApi!;

export function GymProvider({ children }: { children: ReactNode }) {
  const [S, setS] = useState<GymState>(() => {
    const s = loadState();
    registerCustom(s.customEx);
    return s;
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch {
      /* storage full / unavailable — keep in memory */
    }
    registerCustom(S.customEx);
  }, [S]);

  const api = useMemo<GymStore>(
    () => ({
      S,
      update(mut) {
        setS((prev) => {
          const s = clone(prev);
          mut(s);
          s._ts = Date.now();
          return s;
        });
      },
      replaceState(s) {
        setS(() => {
          const n = clone(s);
          n._ts = Date.now();
          return n;
        });
      },
      resetDemo() {
        setS(() => {
          const n = clone(DEF);
          n._ts = Date.now();
          return n;
        });
      },
      wipeAll() {
        setS(() => {
          const n = clone(DEF);
          n._ts = Date.now();
          return n;
        });
      },
    }),
    [S]
  );

  gymApi = api;

  return <GymCtx.Provider value={api}>{children}</GymCtx.Provider>;
}