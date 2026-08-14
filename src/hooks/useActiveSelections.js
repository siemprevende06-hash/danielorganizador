import { useEffect, useState, useCallback } from "react";
import { getSetting, setSetting } from "@/lib/settings";
const EVT = "active-selections-changed";
const settingKey = (k) => `active_selection:${k}`;
const LEGACY_KEYS = {
    activeSubjects: "active_selection:activeSubjectId",
    activeEntrepreneurships: "active_selection:activeEntrepreneurshipId",
    activeProjects: "active_selection:selectedProjectId",
};
// Simple in-memory cache to avoid re-fetching per hook mount
const cache = {};
export async function readActiveSelections(key) {
    const k = settingKey(key);
    let v = await getSetting(k);
    if (!Array.isArray(v)) {
        const lv = await getSetting(LEGACY_KEYS[key]);
        v = lv ? [lv] : [];
        if (lv) {
            await setSetting(k, v);
        }
    }
    return v.filter(Boolean);
}
export async function writeActiveSelections(key, values) {
    await setSetting(settingKey(key), values);
}
export function useActiveSelections(key) {
    const [values, setValues] = useState(cache[key] ?? []);
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const v = await readActiveSelections(key);
                cache[key] = v;
                if (!cancelled)
                    setValues(v);
            }
            catch {
                // ignore, leave empty
            }
        })();
        const handler = (e) => {
            const detail = e.detail;
            if (detail?.key === key)
                setValues(detail.value || []);
        };
        window.addEventListener(EVT, handler);
        return () => {
            cancelled = true;
            window.removeEventListener(EVT, handler);
        };
    }, [key]);
    const set = useCallback((next) => {
        cache[key] = next;
        setValues(next);
        window.dispatchEvent(new CustomEvent(EVT, { detail: { key, value: next } }));
        writeActiveSelections(key, next).catch((e) => {
            console.warn("Error persisting active selections", e);
        });
    }, [key]);
    const toggle = useCallback((id) => {
        const next = values.includes(id)
            ? values.filter((x) => x !== id)
            : [...values, id];
        set(next);
    }, [values, set]);
    return { values, set, toggle };
}
