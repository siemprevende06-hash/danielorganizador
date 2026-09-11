import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";
import { isOnline } from "./isOnline";

const QUEUE_KEY = "lovable_offline_mutation_queue_v1";

export type QueuedMutation = {
  id: string;
  ts: number;
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  payload?: Record<string, any>;
  match?: Record<string, any>;
  onConflict?: string;
};

const readQueue = async (): Promise<QueuedMutation[]> => {
  return (await get<QueuedMutation[]>(QUEUE_KEY)) || [];
};

const writeQueue = async (q: QueuedMutation[]) => {
  if (q.length === 0) await del(QUEUE_KEY);
  else await set(QUEUE_KEY, q);
};

export const enqueueMutation = async (m: Omit<QueuedMutation, "id" | "ts">) => {
  const q = await readQueue();
  q.push({ ...m, id: crypto.randomUUID(), ts: Date.now() });
  await writeQueue(q);
};

export type MutationResult = { ok: boolean; error?: any };

// Misma protección que en supabaseCache: si PostgREST reporta una columna
// inexistente (migración pendiente en la base), reintentamos sin esa columna.
const missingColumnFromError = (error: any, payload?: Record<string, any>): string | null => {
  if (!error || !payload) return null;
  const msg = typeof error.message === "string" ? error.message : "";
  if (!/does not exist|schema cache/i.test(msg)) return null;
  const m1 = msg.match(/column\s+([a-zA-Z0-9_."]+)\s+does not exist/i);
  const m2 = msg.match(/could not find the\s+['"]([a-zA-Z0-9_]+)['"]\s+column/i);
  const raw = m1?.[1] || m2?.[1] || null;
  if (!raw) return null;
  const col = raw.replace(/"/g, "").split(".").pop()!;
  return col in payload ? col : null;
};

const buildQuery = (
  builder: any,
  op: QueuedMutation["op"],
  payload: Record<string, any>,
  match?: Record<string, any>,
  onConflict?: string
): any => {
  if (op === "insert") return builder.insert(payload);
  if (op === "upsert") return builder.upsert(payload, onConflict ? { onConflict } : undefined);
  let q: any = op === "delete" ? builder.delete() : builder.update(payload);
  Object.entries(match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
  return q;
};

const withTimeout = (p: Promise<any>, ms: number): Promise<any> => {
  return Promise.race([
    p,
    new Promise((_, reject) => setTimeout(() => reject(new Error("NetworkError: timeout abort")), ms)),
  ]);
};

const runMutation = async (m: QueuedMutation): Promise<MutationResult> => {
  try {
    // Cast to any: m.table is dynamic and not statically known to the typed client
    const builder: any = (supabase as any).from(m.table);
    const payload = m.payload || {};

    if (m.op === "delete") {
      const { error } = await withTimeout(buildQuery(builder, m.op, payload, m.match), 15000);
      return error ? { ok: false, error } : { ok: true };
    }

    let result = await withTimeout(buildQuery(builder, m.op, payload, m.match, m.onConflict), 15000);
    const stripCol = result?.error ? missingColumnFromError(result.error, payload) : null;
    if (stripCol) {
      const { [stripCol]: _dropped, ...strippedPayload } = payload;
      result = await withTimeout(buildQuery(builder, m.op, strippedPayload, m.match, m.onConflict), 15000);
    }
    return result?.error ? { ok: false, error: result.error } : { ok: true };
  } catch (e) {
    return { ok: false, error: e };
  }
};

const isNetworkError = (e: any): boolean => {
  // Los errores de Supabase (RLS, validación, etc.) llegan como { message, code, details }
  // y NO deben contarse como "sin conexión". Solo se encolan los fallos de red reales.
  if (e && typeof e === "object" && "code" in e && !("message" in e && typeof e.message === "string" && /Failed to fetch|NetworkError|Load failed|fetch failed/i.test(e.message))) {
    return false;
  }
  const msg = e?.message || (typeof e === "string" ? e : "");
  return /Failed to fetch|NetworkError|Load failed|fetch failed|TypeError|abort/i.test(msg);
};

export const flushQueue = async (): Promise<{ ok: number; failed: number }> => {
  if (!isOnline()) return { ok: 0, failed: 0 };
  const q = await readQueue();
  if (q.length === 0) return { ok: 0, failed: 0 };

  const remaining: QueuedMutation[] = [];
  const clearedTables = new Set<string>();
  let ok = 0, failed = 0;

  for (const m of q) {
    const r = await runMutation(m);
    if (r.ok) {
      ok++;
      clearedTables.add(m.table);
    } else if (isNetworkError(r.error)) {
      failed++;
      // Solo los fallos de red se reintentan; los errores de aplicación son
      // permanentes y se descartan para no bloquear la cola para siempre.
      remaining.push(m);
    } else {
      failed++;
      console.warn("[offlineQueue] Descartando mutación con error de aplicación:", r.error);
    }
  }

  if (ok > 0) {
    const { clearTableCache } = await import("./offlineCache");
    for (const table of clearedTables) {
      await clearTableCache(table).catch(() => {});
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
export const safeMutation = async (
  m: Omit<QueuedMutation, "id" | "ts">
): Promise<{ queued: boolean; error: any }> => {
  if (!isOnline()) {
    await enqueueMutation(m);
    return { queued: true, error: null };
  }
  const dummy: QueuedMutation = { ...m, id: "tmp", ts: Date.now() };
  const r = await runMutation(dummy);
  if (!r.ok) {
    // Solo se encolan los fallos de red; los errores de aplicación son
    // permanentes y no se resolverán "al reconectar".
    if (isNetworkError(r.error)) {
      await enqueueMutation(m);
      return { queued: true, error: "Sin conexión" };
    }
    return { queued: false, error: r.error?.message || "Error al guardar" };
  }
  return { queued: false, error: null };
};

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushQueue().then((r) => {
      if (r.ok > 0) console.log(`[offlineQueue] Sincronizadas ${r.ok} mutaciones`);
    });
  });
}
