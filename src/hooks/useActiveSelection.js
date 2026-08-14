import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
const EVT = "active-selection-changed";
const settingKey = (k) => `active_selection:${k}`;
// Simple in-memory cache to avoid re-fetching per hook mount
const cache = {};
export function useActiveSelection(key) {
    const [value, setValue] = useState(cache[key] ?? null);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const { data } = await supabase
                    .from("app_settings")
                    .select("setting_value")
                    .eq("setting_key", settingKey(key))
                    .maybeSingle();
                const v = data?.setting_value?.value ?? null;
                cache[key] = v;
                if (!cancelled)
                    setValue(v);
            }
            catch {
                // ignore, leave null
            }
        })();
        const handler = (e) => {
            const detail = e.detail;
            if (detail?.key === key)
                setValue(detail.value);
        };
        window.addEventListener(EVT, handler);
        return () => {
            cancelled = true;
            window.removeEventListener(EVT, handler);
        };
    }, [key]);
    const set = useCallback(async (next) => {
        cache[key] = next;
        setValue(next);
        window.dispatchEvent(new CustomEvent(EVT, { detail: { key, value: next } }));
        try {
            await supabase
                .from("app_settings")
                .upsert({ setting_key: settingKey(key), setting_value: { value: next } }, { onConflict: "user_id,setting_key" });
        }
        catch (e) {
            console.warn("Error persisting active selection", e);
        }
    }, [key]);
    const toggle = useCallback((id) => set(value === id ? null : id), [value, set]);
    return { value, set, toggle };
}
