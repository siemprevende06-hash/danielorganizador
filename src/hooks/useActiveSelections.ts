import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const { data } = await supabase
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", k)
    .maybeSingle();
  let v: string[] = (data?.setting_value as any)?.value ?? null;
  if (!Array.isArray(v)) {
    const { data: legacy } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", LEGACY_KEYS[key])
      .maybeSingle();
    const lv = (legacy?.setting_value as any)?.value ?? null;
    v = lv ? [lv] : [];
    if (lv) {
      await supabase
        .from("app_settings")
        .upsert(
          { setting_key: k, setting_value: { value: v } as any },
          { onConflict: "user_id,setting_key" }
        );
    }
  }
  return v.filter(Boolean);
}

export function writeActiveSelections(key: ActiveSelectionsKey, values: string[]) {
  return supabase
    .from("app_settings")
    .upsert(
      { setting_key: settingKey(key), setting_value: { value: values } as any },
      { onConflict: "user_id,setting_key" }
    );
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
      setValues((prev) => {
        const next = prev.includes(id)
          ? prev.filter((x) => x !== id)
          : [...prev, id];
        set(next);
        return next;
      });
    },
    [set]
  );

  return { values, set, toggle };
}