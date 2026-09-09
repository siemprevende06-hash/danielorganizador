import { getCached, setCache, getCacheAge } from "./offlineCache";
import { isOnline } from "./isOnline";

export async function cachedQuery<T>(
  table: string,
  queryKey: string,
  fetcher: () => Promise<T>,
  ttlMs = 5 * 60 * 1000
): Promise<{ data: T | null; fromCache: boolean; error: string | null }> {
  const cacheKey = queryKey;

  let cached: T | null = null;
  try {
    cached = await getCached<T>(table, cacheKey);
  } catch {}

  if (isOnline()) {
    try {
      const fresh = await fetcher();
      await setCache(table, cacheKey, fresh, ttlMs);
      return { data: fresh, fromCache: false, error: null };
    } catch (err: any) {
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

export async function cachedMutation(
  table: string,
  op: "insert" | "update" | "upsert" | "delete",
  payload?: Record<string, any>,
  match?: Record<string, any>,
  onConflict?: string
): Promise<{ queued: boolean; error: any }> {
  if (!isOnline()) {
    const { enqueueMutation } = await import("./offlineQueue");
    await enqueueMutation({ table, op, payload, match, onConflict });
    return { queued: true, error: null };
  }

  try {
    const supabase = (await import("@/integrations/supabase/client")).supabase;
    const builder: any = supabase.from(table as any);
    let result;

    if (op === "insert") {
      result = await builder.insert(payload!);
    } else if (op === "upsert") {
      result = await builder.upsert(payload!, onConflict ? { onConflict } : undefined);
    } else if (op === "update") {
      let q = builder.update(payload!);
      Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      result = await q;
    } else if (op === "delete") {
      let q = builder.delete();
      Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      result = await q;
    }

    if (result?.error) {
      // Error de aplicación (RLS, validación, etc.): es permanente, NO lo
      // encolamos como si fuera un problema de conexión.
      return { queued: false, error: result.error };
    }

    const { clearTableCache } = await import("./offlineCache");
    await clearTableCache(table);

    return { queued: false, error: null };
  } catch (err: any) {
    // Solo encolamos si es un problema real de red, no un error de la app.
    const msg = err?.message || "";
    const isNetwork = /Failed to fetch|NetworkError|Load failed|fetch failed|TypeError|abort/i.test(msg);
    if (isNetwork) {
      const { enqueueMutation } = await import("./offlineQueue");
      await enqueueMutation({ table, op, payload, match, onConflict });
      return { queued: true, error: "Sin conexión" };
    }
    return { queued: false, error: err?.message || "Error al guardar" };
  }
}

export async function clearCacheForTable(table: string) {
  const { clearTableCache } = await import("./offlineCache");
  await clearTableCache(table);
}
