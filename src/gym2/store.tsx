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
  bwUnit: "kg",
  restSec: 90,
  sound: true,
  targetW: null,
  bodyweight: [],
  bodyM: [],
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
    if (raw) {
      const parsed = Object.assign(clone(DEF), JSON.parse(raw));
      if (!parsed.bwUnit) parsed.bwUnit = parsed.unit;
      return parsed;
    }
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

  // On mount: pull from Supabase if we have internet. Merge: the newest snapshot
  // (by timestamp) sets the base, and todo aquello que el otro lado tenga y el
  // base no (colecciones por id/fecha y claves de plan) se conserva para no
  // perder nada creado mientras estabas offline.
  useEffect(() => {
    if (didPull.current) return;
    didPull.current = true;

    (async () => {
      try {
        setSync((p) => ({ ...p, syncing: true }));
        const remote = await pullState();
        if (remote && remote.state) {
          setS((local) => {
            const remoteState = remote.state;
            const localTs = local._ts || 0;
            const remoteTs = remote.updatedAt || 0;
            const useRemote = remoteTs >= localTs;
            const merged = useRemote ? clone(remoteState) : clone(local);
            const other = useRemote ? local : remoteState;

            // Estados guardados antes de separar las unidades: mantenemos la
            // unidad de ejercicios y para el peso corporal tomamos la misma.
            if (!merged.bwUnit) merged.bwUnit = merged.unit || "kg";

            // Colecciones por id: une lo que falte del otro lado, sin duplicar.
            function unionById<T extends { id: string }>(
              dest: T[] | undefined,
              src: T[] | undefined
            ): T[] {
              dest = dest || [];
              const seen = new Set(dest.map((x) => x.id));
              for (const x of src || []) {
                if (!seen.has(x.id)) {
                  dest.push(x);
                  seen.add(x.id);
                }
              }
              return dest;
            }
            merged.routines = unionById(merged.routines, other.routines);
            merged.customEx = unionById(merged.customEx, other.customEx);

            // Colecciones por fecha: peso, medidas y entrenamientos.
            function unionByDate<T extends { d: string }>(
              dest: T[] | undefined,
              src: T[] | undefined
            ): T[] {
              dest = dest || [];
              const seen = new Set(dest.map((x) => x.d));
              for (const x of src || []) {
                if (!seen.has(x.d)) {
                  dest.push(x);
                  seen.add(x.d);
                }
              }
              return dest;
            }
            merged.bodyweight = unionByDate(merged.bodyweight, other.bodyweight);
            merged.bodyM = unionByDate(merged.bodyM, other.bodyM);
            // Mantener cronológico para que "último peso/medida" sea el real.
            merged.bodyweight.sort((a, b) =>
              a.d === b.d ? a.t - b.t : a.d < b.d ? -1 : 1
            );
            merged.bodyM.sort((a, b) =>
              a.d === b.d ? a.t - b.t : a.d < b.d ? -1 : 1
            );
            merged.workouts = unionById(merged.workouts, other.workouts) as GymState["workouts"];
            merged.workouts.sort(
              (a: { d: string }, b: { d: string }) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0)
            );

            // Maps de plan: la base manda en conflictos, pero no se descartan
            // claves que solo existan en el otro lado.
            merged.week = {
              ...(other.week || {}),
              ...(merged.week || {}),
            } as unknown as Record<number, string>;
            merged.dayPlan = { ...(other.dayPlan || {}), ...(merged.dayPlan || {}) };
            merged.exWeights = { ...(other.exWeights || {}), ...(merged.exWeights || {}) };

            // No descartar un entrenamiento activo local.
            if (local.active && !merged.active) {
              merged.active = local.active as GymState["active"];
            }
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

  // Al cerrar/ocultar la página, empuja inmediatamente los cambios pendientes
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") {
        forcePush(S);
      }
    };
    const onPageHide = () => {
      forcePush(S);
    };
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
    };
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
