import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getSetting, setSetting } from "@/lib/settings";

const EVT = "active-selections-changed";

export type ActiveSelectionsKey =
  | "activeSubjects"
  | "activeEntrepreneurships"
  | "activeProjects";

const settingKey = (k: ActiveSelectionsKey) => `active_selection:${k}`;

const LEGACY_KEYS: Record<ActiveSelectionsKey, string> = {
  activeSubjects: "active_selection:activeSubjectId",
  activeEntrepreneurships: "active_selection:activeEntrepreneurshipId",
  activeProjects: "active_selection:selectedProjectId",
};

// Simple in-memory cache to avoid re-fetching per hook mount
const cache: Partial<Record<ActiveSelectionsKey, string[]>> = {};

export async function readActiveSelections(key: ActiveSelectionsKey): Promise<string[]> {
  const k = settingKey(key);
  let v = await getSetting<string[]>(k);
  if (!Array.isArray(v)) {
    const lv = await getSetting<string>(LEGACY_KEYS[key]);
    v = lv ? [lv] : [];
    if (lv) {
      await setSetting(k, v);
    }
  }
  return v.filter(Boolean);
}

export async function writeActiveSelections(key: ActiveSelectionsKey, values: string[]) {
  await setSetting(settingKey(key), values);
}

export function useActiveSelections(key: ActiveSelectionsKey) {
  const [values, setValues] = useState<string[]>(cache[key] ?? []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const v = await readActiveSelections(key);
        cache[key] = v;
        if (!cancelled) setValues(v);
      } catch {
        // ignore, leave empty
      }
    })();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: string[] }>).detail;
      if (detail?.key === key) setValues(detail.value || []);
    };
    window.addEventListener(EVT, handler as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(EVT, handler as EventListener);
    };
  }, [key]);

  const set = useCallback(
    (next: string[]) => {
      cache[key] = next;
      setValues(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key, value: next } }));
      writeActiveSelections(key, next).catch((e) => {
        console.warn("Error persisting active selections", e);
      });
    },
    [key]
  );

  const toggle = useCallback(
    (id: string) => {
      const next = values.includes(id)
        ? values.filter((x) => x !== id)
        : [...values, id];
      set(next);
    },
    [values, set]
  );

  return { values, set, toggle };
}