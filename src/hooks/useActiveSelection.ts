import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const EVT = "active-selection-changed";

export type ActiveKey =
  | "activeSubjectId"
  | "activeEntrepreneurshipId"
  | "selectedProjectId";

const settingKey = (k: ActiveKey) => `active_selection:${k}`;

// Simple in-memory cache to avoid re-fetching per hook mount
const cache: Partial<Record<ActiveKey, string | null>> = {};

export function useActiveSelection(key: ActiveKey) {
  const [value, setValue] = useState<string | null>(cache[key] ?? null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase
          .from("app_settings")
          .select("setting_value")
          .eq("setting_key", settingKey(key))
          .maybeSingle();
        const v = (data?.setting_value as any)?.value ?? null;
        cache[key] = v;
        if (!cancelled) setValue(v);
      } catch {
        // ignore, leave null
      }
    })();

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string; value: string | null }>).detail;
      if (detail?.key === key) setValue(detail.value);
    };
    window.addEventListener(EVT, handler as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(EVT, handler as EventListener);
    };
  }, [key]);

  const set = useCallback(
    async (next: string | null) => {
      cache[key] = next;
      setValue(next);
      window.dispatchEvent(new CustomEvent(EVT, { detail: { key, value: next } }));
      try {
        await supabase
          .from("app_settings")
          .upsert(
            { setting_key: settingKey(key), setting_value: { value: next } as any },
            { onConflict: "user_id,setting_key" }
          );
      } catch (e) {
        console.warn("Error persisting active selection", e);
      }
    },
    [key]
  );

  const toggle = useCallback(
    (id: string) => set(value === id ? null : id),
    [value, set]
  );

  return { value, set, toggle };
}
