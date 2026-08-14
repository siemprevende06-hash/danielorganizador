import { getCached, setCache } from "./offlineCache";
import { isOnline } from "./isOnline";
export async function cachedQuery(table, queryKey, fetcher, ttlMs = 5 * 60 * 1000) {
    const cacheKey = queryKey;
    let cached = null;
    try {
        cached = await getCached(table, cacheKey);
    }
    catch { }
    if (isOnline()) {
        try {
            const fresh = await fetcher();
            await setCache(table, cacheKey, fresh, ttlMs);
            return { data: fresh, fromCache: false, error: null };
        }
        catch (err) {
            if (cached !== null) {
                return { data: cached, fromCache: true, error: null };
            }
            return { data: null, fromCache: false, error: err?.message || "Error al cargar datos" };
        }
    }
    if (cached !== null) {
        return { data: cached, fromCache: true, error: null };
    }
    return { data: null, fromCache: false, error: "Sin conexión y sin datos guardados" };
}
export async function cachedMutation(table, op, payload, match, onConflict) {
    if (!isOnline()) {
        const { enqueueMutation } = await import("./offlineQueue");
        await enqueueMutation({ table, op, payload, match, onConflict });
        return { queued: true, error: null };
    }
    try {
        const supabase = (await import("@/integrations/supabase/client")).supabase;
        const builder = supabase.from(table);
        let result;
        if (op === "insert") {
            result = await builder.insert(payload);
        }
        else if (op === "upsert") {
            result = await builder.upsert(payload, onConflict ? { onConflict } : undefined);
        }
        else if (op === "update") {
            let q = builder.update(payload);
            Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
            result = await q;
        }
        else if (op === "delete") {
            let q = builder.delete();
            Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
            result = await q;
        }
        if (result?.error) {
            const { enqueueMutation } = await import("./offlineQueue");
            await enqueueMutation({ table, op, payload, match, onConflict });
            return { queued: true, error: result.error };
        }
        const { clearTableCache } = await import("./offlineCache");
        await clearTableCache(table);
        return { queued: false, error: null };
    }
    catch (err) {
        const { enqueueMutation } = await import("./offlineQueue");
        await enqueueMutation({ table, op, payload, match, onConflict });
        return { queued: true, error: err?.message || "Sin conexión" };
    }
}
export async function clearCacheForTable(table) {
    const { clearTableCache } = await import("./offlineCache");
    await clearTableCache(table);
}
