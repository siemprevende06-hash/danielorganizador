import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAreaScores } from "./useAreaScores";
import { useDailyScore } from "./useDailyScore";
import { useTimeframe } from "@/contexts/TimeframeContext";
import { RECOMPENSAS_DEFAULT } from "@/data/recompensas";
import { getCached, setCache } from "@/lib/offlineCache";
import { cachedMutation } from "@/lib/supabaseCache";
import { setSetting as upsertSetting } from "@/lib/settings";
function todayKey() {
    return new Date().toISOString().split("T")[0];
}
const CATALOGO_KEY = "recompensas_catalogo";
const LAST_EARNED_KEY = "recompensas_last_earned";
const CACHE_PREFIX = "recompensas_";
async function getSetting(key) {
    try {
        const { data } = await supabase
            .from("app_settings")
            .select("setting_value")
            .eq("setting_key", key)
            .maybeSingle();
        if (!data)
            return null;
        const v = data.setting_value;
        return (v?.value ?? v);
    }
    catch {
        const cached = await getCached(CACHE_PREFIX, key);
        return cached ?? null;
    }
}
async function setSetting(key, value) {
    const ok = await upsertSetting(key, value);
    if (!ok) {
        await setCache(CACHE_PREFIX, key, value, 300000);
    }
}
async function loadBalance() {
    try {
        const { data } = await supabase
            .from("user_settings")
            .select("id, rewards_balance")
            .maybeSingle();
        const bal = data?.rewards_balance ?? 0;
        await setCache(CACHE_PREFIX, "balance", bal, 300000);
        return bal;
    }
    catch {
        const cached = await getCached(CACHE_PREFIX, "balance");
        return cached ?? 0;
    }
}
async function saveBalance(balance) {
    const { data } = await supabase.from("user_settings").select("id").maybeSingle();
    if (data?.id) {
        await cachedMutation("user_settings", "update", { rewards_balance: balance }, { id: data.id });
    }
    else {
        await cachedMutation("user_settings", "insert", { user_id: crypto.randomUUID(), rewards_balance: balance });
    }
    await setCache(CACHE_PREFIX, "balance", balance, 300000);
}
async function loadCanjes() {
    try {
        const { data } = await supabase
            .from("rewards_redemptions")
            .select("*")
            .order("fecha", { ascending: false });
        const list = (data?.map((r) => ({
            id: r.id,
            recompensaId: r.recompensa_id,
            nombre: r.nombre,
            icono: r.icono,
            costo: r.costo,
            fecha: r.fecha,
            disfrute: r.disfrute,
            tiempo: r.tiempo,
        })) ?? []);
        await setCache(CACHE_PREFIX, "canjes", list, 300000);
        return list;
    }
    catch {
        const cached = await getCached(CACHE_PREFIX, "canjes");
        return cached ?? [];
    }
}
function generarId() {
    return `r_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
export function useRecompensas() {
    const { timeframe, view } = useTimeframe();
    const { scores, averages, loading: scoresLoading } = useAreaScores(timeframe, view);
    const dailyScore = useDailyScore();
    const [balance, setBalance] = useState(0);
    const [canjes, setCanjes] = useState([]);
    const [lastEarned, setLastEarned] = useState(null);
    const [catalogo, setCatalogo] = useState(RECOMPENSAS_DEFAULT);
    useEffect(() => {
        (async () => {
            const [b, c, le, cat] = await Promise.all([
                loadBalance(),
                loadCanjes(),
                getSetting(LAST_EARNED_KEY),
                getSetting(CATALOGO_KEY),
            ]);
            setBalance(b);
            setCanjes(c);
            setLastEarned(le);
            if (cat && Array.isArray(cat) && cat.length > 0) {
                setCatalogo(cat);
            }
        })();
    }, []);
    const puntosHoy = lastEarned?.date === todayKey() ? lastEarned.points : 0;
    const puntosPosibles = dailyScore.loading ? 0 : dailyScore.total;
    useEffect(() => {
        if (dailyScore.loading)
            return;
        const today = todayKey();
        const earnedToday = lastEarned?.date === today ? lastEarned.points : 0;
        if (puntosPosibles > 0 && puntosPosibles !== earnedToday) {
            const delta = puntosPosibles - earnedToday;
            if (delta > 0) {
                const newEarning = { date: today, points: puntosPosibles };
                setLastEarned(newEarning);
                setSetting(LAST_EARNED_KEY, newEarning);
                const newBalance = balance + delta;
                setBalance(newBalance);
                saveBalance(newBalance);
            }
        }
    }, [dailyScore.loading, puntosPosibles]);
    const canjearRecompensa = useCallback((recompensaId) => {
        const recompensa = catalogo.find((r) => r.id === recompensaId);
        if (!recompensa)
            return null;
        if (balance < recompensa.costo)
            return null;
        const nuevoCanje = {
            id: `${recompensaId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            recompensaId: recompensa.id,
            nombre: recompensa.nombre,
            icono: recompensa.icono,
            costo: recompensa.costo,
            fecha: new Date().toISOString(),
        };
        const nuevosCanjes = [nuevoCanje, ...canjes];
        const nuevoBalance = balance - recompensa.costo;
        setCanjes(nuevosCanjes);
        setBalance(nuevoBalance);
        saveBalance(nuevoBalance);
        cachedMutation("rewards_redemptions", "insert", {
            recompensa_id: recompensa.id,
            nombre: recompensa.nombre,
            icono: recompensa.icono,
            costo: recompensa.costo,
            fecha: nuevoCanje.fecha,
        });
        return nuevoCanje;
    }, [balance, canjes, catalogo]);
    const guardarFeedback = useCallback((canjeId, disfrute, tiempo) => {
        const actualizado = canjes.map(c => c.id === canjeId ? { ...c, disfrute, tiempo } : c);
        setCanjes(actualizado);
        const canje = actualizado.find(c => c.id === canjeId);
        if (canje) {
            cachedMutation("rewards_redemptions", "update", {
                disfrute,
                tiempo,
            }, {
                recompensa_id: canje.recompensaId,
                fecha: canje.fecha,
            });
        }
    }, [canjes]);
    const persistCatalogo = (nuevo) => {
        setCatalogo(nuevo);
        setSetting(CATALOGO_KEY, nuevo);
    };
    const agregarRecompensa = useCallback((data) => {
        const nueva = { id: generarId(), ...data };
        persistCatalogo([...catalogo, nueva]);
        return nueva;
    }, [catalogo]);
    const editarRecompensa = useCallback((id, data) => {
        const idx = catalogo.findIndex((r) => r.id === id);
        if (idx === -1)
            return false;
        const nuevo = [...catalogo];
        nuevo[idx] = { ...nuevo[idx], ...data };
        persistCatalogo(nuevo);
        return true;
    }, [catalogo]);
    const eliminarRecompensa = useCallback((id) => {
        const idx = catalogo.findIndex((r) => r.id === id);
        if (idx === -1)
            return false;
        persistCatalogo(catalogo.filter((r) => r.id !== id));
        return true;
    }, [catalogo]);
    const puntosGanadosHoy = puntosHoy;
    const puntosGastadosHoy = canjes
        .filter((c) => c.fecha.startsWith(todayKey()))
        .reduce((sum, c) => sum + c.costo, 0);
    return {
        balance,
        canjes,
        scores,
        scoresLoading,
        dailyScore,
        catalogo,
        puntosPosibles,
        puntosGanadosHoy,
        puntosGastadosHoy,
        canjearRecompensa,
        guardarFeedback,
        agregarRecompensa,
        editarRecompensa,
        eliminarRecompensa,
    };
}
