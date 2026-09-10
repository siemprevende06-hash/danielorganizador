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

// Algunos esquemas pueden estar desincronizados (p. ej. una migración que
// agregó una columna a la app pero aún no se aplicó en la base). Si PostgREST
// reporta que una columna no existe, la reintentamos sin esa columna para no
// bloquear la operación; apenas la columna exista en la base se volverá a usar.
function missingColumnFromError(error: any, payload?: Record<string, any>): string | null {
  if (!error || !payload) return null;
  const msg = typeof error.message === "string" ? error.message : "";
  if (!/does not exist|schema cache/i.test(msg)) return null;
  const m1 = msg.match(/column\s+([a-zA-Z0-9_."]+)\s+does not exist/i);
  const m2 = msg.match(/could not find the\s+['"]([a-zA-Z0-9_]+)['"]\s+column/i);
  const raw = m1?.[1] || m2?.[1] || null;
  if (!raw) return null;
  const col = raw.replace(/"/g, "").split(".").pop()!;
  return col in payload ? col : null;
}

async function runMutationRequest(
  table: string,
  op: "insert" | "update" | "upsert" | "delete",
  payload?: Record<string, any>,
  match?: Record<string, any>,
  onConflict?: string
): Promise<any> {
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

  return result;
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
    const result = await runMutationRequest(table, op, payload, match, onConflict);

    if (result?.error) {
      // La columna podría no existir aún en la base (migración pendiente).
      // Reintentamos una vez sin esa columna y no lo encolamos como red.
      const stripCol = missingColumnFromError(result.error, payload);
      if (stripCol) {
        const { [stripCol]: _dropped, ...strippedPayload } = payload!;
        const retry = await runMutationRequest(table, op, strippedPayload, match, onConflict);
        if (!retry?.error) {
          const { clearTableCache } = await import("./offlineCache");
          await clearTableCache(table);
          return { queued: false, error: null };
        }
      }
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
