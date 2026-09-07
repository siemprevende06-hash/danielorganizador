import { useCallback, useState } from "react";
import { DAY_SYSTEMS, type SystemSpeed } from "@/lib/daySystems";

const STORAGE_KEY = "daniel_system_speed_v1";

type SpeedMap = Record<string, SystemSpeed>;

export const DEFAULT_SPEED: SystemSpeed = "maximo";

export function loadSystemSpeed(): SpeedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as SpeedMap;
  } catch {
    // ignore
  }
  return {};
}

export function saveSystemSpeed(map: SpeedMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}

export function getAllSystemIds(): string[] {
  const ids: string[] = [];
  for (const area of DAY_SYSTEMS) {
    for (const sys of area.systems) ids.push(sys.id);
  }
  return ids;
}

/**
 * Velocidad (mín / máx / extra) persistida por sistema en localStorage.
 * La meta en minutos de cada sistema del día deriva de esta velocidad.
 */
export function useSystemSpeed() {
  const [map, setMap] = useState<SpeedMap>(() => loadSystemSpeed());

  const getSpeed = useCallback(
    (systemId: string): SystemSpeed => map[systemId] ?? DEFAULT_SPEED,
    [map]
  );

  const setSpeed = useCallback((systemId: string, speed: SystemSpeed) => {
    setMap((prev) => {
      const next = { ...prev, [systemId]: speed };
      saveSystemSpeed(next);
      return next;
    });
  }, []);

  const getMinutes = useCallback(
    (systemId: string): number => {
      for (const area of DAY_SYSTEMS) {
        const sys = area.systems.find(s => s.id === systemId);
        if (sys) {
          const speed = map[systemId] ?? DEFAULT_SPEED;
          const opt = sys.speedOptions.find(o => o.id === speed);
          return opt?.minutes ?? 0;
        }
      }
      return 0;
    },
    [map]
  );

  return { map, getSpeed, setSpeed, getMinutes };
}

// Utilidades para uso fuera de React
export const systemSpeedStore = {
  load: loadSystemSpeed,
  save: saveSystemSpeed,
};
