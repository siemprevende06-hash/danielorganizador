import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { DAY_SYSTEMS, systemSpeedOptions, type SystemSpeed } from "@/lib/daySystems";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "daniel_system_speed_v1";
const LEGACY_INTENSITY_KEY = "planIntensity";

type SpeedMap = Record<string, SystemSpeed>;

export const DEFAULT_SPEED: SystemSpeed = "maximo";

function readLegacyIntensity(): Record<string, string> {
  try {
    const raw = localStorage.getItem(LEGACY_INTENSITY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function migrateLegacyIfNeeded(map: SpeedMap): SpeedMap {
  const legacy = readLegacyIntensity();
  if (!legacy || Object.keys(legacy).length === 0) return map;
  let changed = false;
  const next = { ...map };
  for (const [k, v] of Object.entries(legacy)) {
    if ((v === "minimo" || v === "maximo" || v === "extra") && !next[k]) {
      next[k] = v as SystemSpeed;
      changed = true;
    }
  }
  if (changed) {
    try { saveSystemSpeed(next); } catch {}
  }
  return next;
}

export function loadSystemSpeed(): SpeedMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as SpeedMap;
      return migrateLegacyIfNeeded(parsed);
    }
  } catch {
    // ignore
  }
  return migrateLegacyIfNeeded({});
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
 * Velocidad (mín / máx / extra) persistida por sistema. Unificada con PlanManana.
 */
export function useSystemSpeed(date?: Date) {
  const [map, setMap] = useState<SpeedMap>(() => loadSystemSpeed());
  const [loadedFromPlan, setLoadedFromPlan] = useState(false);

  const targetDate = date || new Date();
  const dateStr = format(targetDate, "yyyy-MM-dd");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: plan } = await supabase
          .from("daily_plans")
          .select("notes")
          .eq("plan_date", dateStr)
          .maybeSingle();
        if (cancelled) return;
        if (plan?.notes) {
          try {
            const parsed = typeof plan.notes === "string" ? JSON.parse(plan.notes) : plan.notes;
            const si = parsed?.systemIntensity || parsed?.planIntensity;
            if (si && typeof si === "object") {
              const current = loadSystemSpeed();
              const next: SpeedMap = { ...current };
              let changed = false;
              for (const [k, v] of Object.entries(si)) {
                if (v === "minimo" || v === "maximo" || v === "extra") {
                  if (next[k] !== v) {
                    next[k] = v as SystemSpeed;
                    changed = true;
                  }
                }
              }
              if (changed) {
                saveSystemSpeed(next);
                setMap(next);
              }
            }
          } catch {}
        }
        setLoadedFromPlan(true);
      } catch {
        setLoadedFromPlan(true);
      }
    })();
    return () => { cancelled = true; };
  }, [dateStr]);

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
          const opt = systemSpeedOptions(sys).find(o => o.id === speed);
          return opt?.minutes ?? 0;
        }
      }
      return 0;
    },
    [map]
  );

  return { map, getSpeed, setSpeed, getMinutes, loadedFromPlan };
}

// Utilidades para uso fuera de React
export const systemSpeedStore = {
  load: loadSystemSpeed,
  save: saveSystemSpeed,
};
