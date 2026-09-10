import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import { registerCustom } from "./lib/exercises";
import { schedulePush, pullState, forcePush } from "./lib/sync";
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

export interface SyncStatus {
  syncing: boolean;
  lastSyncAt: number | null;
}

export interface GymStore {
  S: GymState;
  sync: SyncStatus;
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

  const [sync, setSync] = useState<SyncStatus>({
    syncing: false,
    lastSyncAt: null,
  });

  const didPull = useRef(false);

  // On mount: pull from Supabase if we have internet. Merge: remote wins if newer.
  useEffect(() => {
    if (didPull.current) return;
    didPull.current = true;

    (async () => {
      try {
        setSync((p) => ({ ...p, syncing: true }));
        const remote = await pullState();
        if (remote && remote.state) {
          // Merge strategy: remote wins, but keep local active workouts and unsent data
          setS((local) => {
            const merged = clone(remote.state);
            // Preserve local active workout (user might be mid-workout offline)
            if (local.active && !merged.active) {
              merged.active = local.active;
            }
            // Keep local bodyweight entries not in remote
            const remoteBW = new Set((merged.bodyweight || []).map((b: { d: string }) => b.d));
            for (const bw of local.bodyweight || []) {
              if (!remoteBW.has(bw.d)) merged.bodyweight.push(bw);
            }
            // Keep local workouts not in remote
            const remoteIDs = new Set((merged.workouts || []).map((w: { id: string }) => w.id));
            for (const w of local.workouts || []) {
              if (!remoteIDs.has(w.id)) merged.workouts.push(w);
            }
            merged.workouts.sort((a: { d: string }, b: { d: string }) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
            merged._ts = Date.now();
            return merged;
          });
          setSync((p) => ({ ...p, syncing: false, lastSyncAt: Date.now() }));
        } else {
          setSync((p) => ({ ...p, syncing: false }));
        }
      } catch {
        setSync((p) => ({ ...p, syncing: false }));
      }
    })();
  }, []);

  // Persist to localStorage and schedule Supabase push on every change
  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(S));
    } catch {
      /* storage full / unavailable — keep in memory */
    }
    registerCustom(S.customEx);
    schedulePush(S);
  }, [S]);

  // When coming online: force push local state
  useEffect(() => {
    const onOnline = () => {
      forcePush(S).then((ok) => {
        if (ok) setSync((p) => ({ ...p, lastSyncAt: Date.now() }));
      });
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [S]);

  const api = useMemo<GymStore>(
    () => ({
      S,
      sync,
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
    [S, sync]
  );

  gymApi = api;

  return <GymCtx.Provider value={api}>{children}</GymCtx.Provider>;
}
