import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  DAY_SYSTEMS,
  findDaySystemMeta,
  systemSpeedOptions,
  systemTargetMinutes,
  type SystemSpeed,
} from "@/lib/daySystems";
import { loadDailyPlan } from "@/lib/dailyPlanStorage";

/**
 * Niveles de velocidad por fecha. Cada día planificado tiene su propio mapa:
 * bajar Lectura a Mínimo mañana no cambia hoy ni el resto de días.
 */
const STORAGE_KEY = "daniel_system_speed_v2";
const LEGACY_KEY = "daniel_system_speed_v1";
const LEGACY_INTENSITY_KEY = "planIntensity";

type SpeedMap = Record<string, SystemSpeed>;
type SpeedStore = Record<string, SpeedMap>;

export const DEFAULT_SPEED: SystemSpeed = "maximo";

function todayKey(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function sanitizeMap(value: unknown): SpeedMap {
  if (!value || typeof value !== "object") return {};
  const result: SpeedMap = {};
  for (const [key, speed] of Object.entries(value as Record<string, unknown>)) {
    if (speed === "racha" || speed === "minimo" || speed === "maximo" || speed === "extra") {
      result[key] = speed;
    }
  }
  return result;
}

function readStore(): SpeedStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    const store: SpeedStore = {};
    for (const [date, map] of Object.entries(parsed as Record<string, unknown>)) {
      store[date] = sanitizeMap(map);
    }
    return store;
  } catch {
    return {};
  }
}

function writeStore(store: SpeedStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

function readLegacyIntensity(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LEGACY_INTENSITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // JSON inválido: se ignora el valor legado.
  }
  return {};
}

/** Migra el mapa global antiguo solo al día de hoy. */
function migrateLegacyStore(store: SpeedStore): SpeedStore {
  if (Object.keys(store).length > 0) return store;
  const today = todayKey();
  const legacy: SpeedMap = {};

  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) Object.assign(legacy, sanitizeMap(JSON.parse(raw)));
  } catch {
    // JSON inválido: se ignora el valor legado.
  }

  for (const [key, speed] of Object.entries(readLegacyIntensity())) {
    if ((speed === "minimo" || speed === "maximo" || speed === "extra") && !legacy[key]) {
      legacy[key] = speed as SystemSpeed;
    }
  }

  if (Object.keys(legacy).length === 0) return store;
  const next = { ...store, [today]: legacy };
  writeStore(next);
  return next;
}

export function loadSystemSpeed(date?: string): SpeedMap {
  const store = migrateLegacyStore(readStore());
  const key = date || todayKey();
  return { ...(store[key] ?? {}) };
}

export function saveSystemSpeed(map: SpeedMap, date?: string) {
  const store = readStore();
  const key = date || todayKey();
  writeStore({ ...store, [key]: sanitizeMap(map) });
}

export function getAllSystemIds(): string[] {
  const ids: string[] = [];
  for (const area of DAY_SYSTEMS) {
    for (const sys of area.systems) ids.push(sys.id);
  }
  return ids;
}

/**
 * Velocidad (racha / mín / máx / extra) persistida por sistema y por fecha.
 */
export function useSystemSpeed(date?: Date) {
  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  const [map, setMap] = useState<SpeedMap>(() => loadSystemSpeed(dateStr));
  const [loadedFromPlan, setLoadedFromPlan] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadedFromPlan(false);

    // El mapa local de esta fecha es la base; el plan guardado puede completarlo.
    const local = loadSystemSpeed(dateStr);
    setMap(local);

    (async () => {
      try {
        const plan = await loadDailyPlan(dateStr);
        if (cancelled) return;

        if (plan?.notes) {
          try {
            const parsed = typeof plan.notes === "string" ? JSON.parse(plan.notes) : plan.notes;
            // Se relee el almacenamiento para no pisar un cambio hecho mientras
            // se cargaba el plan.
            const current = loadSystemSpeed(dateStr);
            const next: SpeedMap = { ...current };
            let changed = false;

            // La selección explícita por sistema tiene prioridad sobre el espejo
            // de intensidad calculado desde los bloques.
            const explicit = parsed?.systemSpeed;
            const explicitKeys = new Set<string>();
            if (explicit && typeof explicit === "object") {
              for (const [key, speed] of Object.entries(explicit)) {
                if (speed === "minimo" || speed === "maximo" || speed === "extra" || speed === "racha") {
                  explicitKeys.add(key);
                  if (next[key] !== speed) {
                    next[key] = speed as SystemSpeed;
                    changed = true;
                  }
                }
              }
            }

            const si = parsed?.systemIntensity || parsed?.planIntensity;
            if (si && typeof si === "object") {
              for (const [key, speed] of Object.entries(si)) {
                if (explicitKeys.has(key)) continue;
                if (speed === "minimo" || speed === "maximo" || speed === "extra") {
                  if (next[key] !== speed) {
                    next[key] = speed as SystemSpeed;
                    changed = true;
                  }
                }
              }
            }

            if (changed) {
              saveSystemSpeed(next, dateStr);
              setMap(next);
            }
          } catch {
            // Notas del plan con formato inesperado: se conserva el mapa local.
          }
        }
        setLoadedFromPlan(true);
      } catch {
        setLoadedFromPlan(true);
      }
    })();

    return () => { cancelled = true; };
  }, [dateStr]);

  const getSpeed = useCallback(
    (systemId: string): SystemSpeed => {
      const stored = map[systemId] ?? DEFAULT_SPEED;
      const meta = findDaySystemMeta(systemId);
      if (!meta) return stored;
      // Un nivel guardado por una versión anterior puede no existir ya
      // (p. ej. "Extra" en Gym). En ese caso se usa el máximo.
      return systemSpeedOptions(meta.system).some(option => option.id === stored)
        ? stored
        : DEFAULT_SPEED;
    },
    [map],
  );

  const setSpeed = useCallback((systemId: string, speed: SystemSpeed) => {
    setMap(prev => {
      const next = { ...prev, [systemId]: speed };
      saveSystemSpeed(next, dateStr);
      return next;
    });
  }, [dateStr]);

  const getMinutes = useCallback(
    (systemId: string): number => {
      for (const area of DAY_SYSTEMS) {
        const sys = area.systems.find(s => s.id === systemId);
        if (sys) {
          const speed = map[systemId] ?? DEFAULT_SPEED;
          return systemTargetMinutes(sys, speed);
        }
      }
      return 0;
    },
    [map],
  );

  return { map, getSpeed, setSpeed, getMinutes, loadedFromPlan };
}

// Utilidades para uso fuera de React
export const systemSpeedStore = {
  load: loadSystemSpeed,
  save: saveSystemSpeed,
};
