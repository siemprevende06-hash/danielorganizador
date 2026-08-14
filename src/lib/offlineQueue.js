import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";
import { isOnline } from "./isOnline";
const QUEUE_KEY = "lovable_offline_mutation_queue_v1";
const readQueue = async () => {
    return (await get(QUEUE_KEY)) || [];
};
const writeQueue = async (q) => {
    if (q.length === 0)
        await del(QUEUE_KEY);
    else
        await set(QUEUE_KEY, q);
};
export const enqueueMutation = async (m) => {
    const q = await readQueue();
    q.push({ ...m, id: crypto.randomUUID(), ts: Date.now() });
    await writeQueue(q);
};
const runMutation = async (m) => {
    try {
        // Cast to any: m.table is dynamic and not statically known to the typed client
        const builder = supabase.from(m.table);
        if (m.op === "insert") {
            const { error } = await builder.insert(m.payload);
            return !error;
        }
        if (m.op === "upsert") {
            const { error } = await builder.upsert(m.payload, m.onConflict ? { onConflict: m.onConflict } : undefined);
            return !error;
        }
        if (m.op === "update") {
            let q = builder.update(m.payload);
            Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
            const { error } = await q;
            return !error;
        }
        if (m.op === "delete") {
            let q = builder.delete();
            Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
            const { error } = await q;
            return !error;
        }
        return false;
    }
    catch (e) {
        console.warn("[offlineQueue] runMutation error:", e);
        return false;
    }
};
export const flushQueue = async () => {
    if (!isOnline())
        return { ok: 0, failed: 0 };
    const q = await readQueue();
    if (q.length === 0)
        return { ok: 0, failed: 0 };
    const remaining = [];
    const clearedTables = new Set();
    let ok = 0, failed = 0;
    for (const m of q) {
        const success = await runMutation(m);
        if (success) {
            ok++;
            clearedTables.add(m.table);
        }
        else {
            failed++;
            remaining.push(m);
        }
    }
    if (ok > 0) {
        const { clearTableCache } = await import("./offlineCache");
        for (const table of clearedTables) {
            await clearTableCache(table).catch(() => { });
        }
    }
    await writeQueue(remaining);
    return { ok, failed };
};
export const getQueueSize = async () => (await readQueue()).length;
/**
 * Wrapper conveniente: intenta la mutación; si falla por red, la encola.
 * Devuelve `{ queued: boolean }` para que la UI pueda mostrar feedback.
 */
export const safeMutation = async (m) => {
    if (!isOnline()) {
        await enqueueMutation(m);
        return { queued: true, error: null };
    }
    const dummy = { ...m, id: "tmp", ts: Date.now() };
    const ok = await runMutation(dummy);
    if (!ok) {
        await enqueueMutation(m);
        return { queued: true, error: "queued for retry" };
    }
    return { queued: false, error: null };
};
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        flushQueue().then((r) => {
            if (r.ok > 0)
                console.log(`[offlineQueue] Sincronizadas ${r.ok} mutaciones`);
        });
    });
}
