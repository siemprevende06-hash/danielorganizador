import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
export function usePuntoPartida() {
    const [entries, setEntries] = useState({});
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("punto_partida")
                .select("*");
            if (error) {
                console.warn("[usePuntoPartida] error:", error.message);
                setEntries({});
                return;
            }
            const map = {};
            for (const row of data || []) {
                map[row.area_id] = {
                    area_id: row.area_id,
                    area_type: row.area_type,
                    nota: row.nota,
                    sub_scores: (row.sub_scores || {}),
                    respuestas: (row.respuestas || {}),
                    hechos: (row.hechos || {}),
                };
            }
            setEntries(map);
        }
        catch (err) {
            console.warn("[usePuntoPartida] exception:", err);
            setEntries({});
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        load();
    }, [load]);
    const saveEntry = useCallback(async (entry) => {
        const { error } = await supabase.from("punto_partida").upsert({
            area_id: entry.area_id,
            area_type: entry.area_type,
            nota: entry.nota,
            sub_scores: entry.sub_scores,
            respuestas: entry.respuestas,
            hechos: entry.hechos,
        }, { onConflict: "user_id, area_id" });
        if (error) {
            console.error("[usePuntoPartida] save error:", error);
            return false;
        }
        setEntries((prev) => ({ ...prev, [entry.area_id]: entry }));
        return true;
    }, []);
    const saveAll = useCallback(async (allEntries) => {
        for (const entry of allEntries) {
            const ok = await saveEntry(entry);
            if (!ok)
                return false;
        }
        return true;
    }, [saveEntry]);
    const getNota = useCallback((areaId) => {
        return entries[areaId]?.nota ?? null;
    }, [entries]);
    const updateSubScore = useCallback(async (areaId, subId, value) => {
        const existing = entries[areaId];
        const updated = {
            area_id: areaId,
            area_type: (existing?.area_type ?? "wheel"),
            nota: existing?.nota ?? 5,
            sub_scores: { ...(existing?.sub_scores ?? {}), [subId]: value },
            respuestas: existing?.respuestas ?? {},
            hechos: existing?.hechos ?? {},
        };
        const ok = await saveEntry(updated);
        return ok;
    }, [entries, saveEntry]);
    return {
        entries,
        loading,
        load,
        saveEntry,
        saveAll,
        getNota,
        updateSubScore,
    };
}
