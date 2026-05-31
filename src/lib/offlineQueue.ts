/**
 * Cola de mutaciones para soporte offline.
 * Cuando una mutación de Supabase falla por estar sin conexión, la encolamos
 * en IndexedDB (vía idb-keyval) y la reintentamos cuando vuelve la red.
 */
import { get, set, del } from "idb-keyval";
import { supabase } from "@/integrations/supabase/client";

const QUEUE_KEY = "lovable_offline_mutation_queue_v1";

export type QueuedMutation = {
  id: string;
  ts: number;
  table: string;
  op: "insert" | "update" | "upsert" | "delete";
  payload?: Record<string, any>;
  match?: Record<string, any>; // for update/delete .eq() filters
  onConflict?: string; // for upsert
};

const isOnline = () => typeof navigator !== "undefined" && navigator.onLine;

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

const runMutation = async (m: QueuedMutation): Promise<boolean> => {
  try {
    // Cast to any: m.table is dynamic and not statically known to the typed client
    const builder: any = (supabase as any).from(m.table);
    if (m.op === "insert") {
      const { error } = await builder.insert(m.payload!);
      return !error;
    }
    if (m.op === "upsert") {
      const { error } = await builder.upsert(m.payload!, m.onConflict ? { onConflict: m.onConflict } : undefined);
      return !error;
    }
    if (m.op === "update") {
      let q: any = builder.update(m.payload!);
      Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      return !error;
    }
    if (m.op === "delete") {
      let q: any = builder.delete();
      Object.entries(m.match || {}).forEach(([k, v]) => { q = q.eq(k, v); });
      const { error } = await q;
      return !error;
    }
    return false;
  } catch {
    return false;
  }
};

export const flushQueue = async (): Promise<{ ok: number; failed: number }> => {
  if (!isOnline()) return { ok: 0, failed: 0 };
  const q = await readQueue();
  if (q.length === 0) return { ok: 0, failed: 0 };

  const remaining: QueuedMutation[] = [];
  let ok = 0, failed = 0;
  for (const m of q) {
    const success = await runMutation(m);
    if (success) ok++;
    else { failed++; remaining.push(m); }
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
  const ok = await runMutation(dummy);
  if (!ok) {
    await enqueueMutation(m);
    return { queued: true, error: "queued for retry" };
  }
  return { queued: false, error: null };
};

// Auto-flush al volver online
if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    flushQueue().then((r) => {
      if (r.ok > 0) console.log(`[offlineQueue] Sincronizadas ${r.ok} mutaciones`);
    });
  });
  // Flush inicial
  setTimeout(() => { flushQueue().catch(() => {}); }, 2000);
}
