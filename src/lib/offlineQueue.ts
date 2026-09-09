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

const runMutation = async (m: QueuedMutation): Promise<MutationResult> => {
  try {
    // Cast to any: m.table is dynamic and not statically known to the typed client
    const builder: any = (supabase as any).from(m.table);
    if (m.op === "insert") {
      const { error } = await builder.insert(m.payload!);
      return error ? { ok: false, error } : { ok: true };
    }
    if (m.op === "upsert") {
      const { error } = await builder.upsert(m.payload!, m.onConflict ? { onConflict: m.onConflict } : undefined);
      return error ? { ok: false, error } : { ok: true };
    }
    if (m.op === "update") {
      let q: any = builder.update(m.payload!);
      Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      return error ? { ok: false, error } : { ok: true };
    }
    if (m.op === "delete") {
      let q: any = builder.delete();
      Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      return error ? { ok: false, error } : { ok: true };
    }
    return { ok: false, error: { message: "Operación no soportada" } };
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
