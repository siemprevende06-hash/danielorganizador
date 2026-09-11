import { supabase } from "@/integrations/supabase/client";
import { isOnline } from "@/lib/isOnline";
import type { GymState } from "./types";

const TABLE = "gym20_data";
const SYNC_KEY = "gym20_sync_meta";

export interface SyncMeta {
  id: string;
  version: number;
  updatedAt: number;
}

function loadMeta(): SyncMeta | null {
  try {
    const raw = localStorage.getItem(SYNC_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function saveMeta(m: SyncMeta | null) {
  if (m) localStorage.setItem(SYNC_KEY, JSON.stringify(m));
  else localStorage.removeItem(SYNC_KEY);
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: GymState | null = null;
let dirty = false;
let retryTimer: ReturnType<typeof setInterval> | null = null;

function markedClean() {
  dirty = false;
  pendingState = null;
  if (retryTimer) {
    clearInterval(retryTimer);
    retryTimer = null;
  }
}

/**
 * Mientras haya cambios locales sin subir (dirty), reintenta cada 10s
 * hasta conseguir subirlos a Supabase. Así ningún dato se pierde aunque
 * la conexión falle en el primer intento.
 */
function ensureRetry() {
  if (retryTimer) return;
  retryTimer = setInterval(async () => {
    if (!dirty || !pendingState || !isOnline()) return;
    const ok = await pushState(pendingState);
    if (ok) markedClean();
  }, 10000);
}

/**
 * Push the full Gym 2.0 state to Supabase.
 * Uses upsert keyed on a fixed `id` per device so there's exactly one row.
 * Increments the version number on each successful push.
 */
export async function pushState(state: GymState): Promise<boolean> {
  if (!isOnline()) return false;
  try {
    const meta = loadMeta();
    const version = (meta?.version || 0) + 1;
    const updatedAt = Date.now();
    const rowId = meta?.id || makeId();

    const payload: Record<string, unknown> = {
      id: rowId,
      state: state as unknown as Record<string, unknown>,
      version,
      updated_at: updatedAt,
    };

    // Si hay sesión de Supabase, ata el documento al usuario correspondiente.
    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.id) payload.user_id = data.user.id;
    } catch {
      /* anónimo — sin usuario */
    }

    const { error } = await supabase
      .from(TABLE as never)
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("[gym20sync] push error:", error.message);
      return false;
    }

    saveMeta({ id: rowId, version, updatedAt });
    dirty = false;
    return true;
  } catch (e) {
    console.warn("[gym20sync] push exception:", e);
    return false;
  }
}

/**
 * Pull the latest state from Supabase.
 * Returns the remote state if it's newer than our local version, or null.
 */
export async function pullState(): Promise<{ state: GymState; version: number; updatedAt: number } | null> {
  if (!isOnline()) return null;
  try {
    const meta = loadMeta();
    let params = supabase
      .from(TABLE as never)
      .select("id, state, version, updated_at");

    // Si hay sesión, solo trae los datos de ese usuario (evita mezclar los
    // de otros dispositivos/cuentas en la web móvil).
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (auth?.user?.id) params = params.eq("user_id", auth.user.id);
    } catch {
      /* anónimo — sin filtro por usuario */
    }

    const query = params.order("updated_at", { ascending: false }).limit(1);

    const { data, error } = (await query) as {
      data: Array<{
        id: string;
        state: unknown;
        version: number;
        updated_at: number;
      }> | null;
      error: unknown;
    };
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    if (!row || !row.state) return null;

    // Si ya tenemos localmente un estado tan o más reciente, no sobreescribir.
    if (meta && meta.updatedAt >= (row.updated_at || 0)) return null;

    // Update local meta
    saveMeta({ id: row.id, version: row.version || 0, updatedAt: row.updated_at || Date.now() });

    return {
      state: row.state as unknown as GymState,
      version: row.version || 0,
      updatedAt: row.updated_at || 0,
    };
  } catch (e) {
    console.warn("[gym20sync] pull exception:", e);
    return null;
  }
}

/**
 * Debounced push: buffers rapid state changes and pushes once after 2s of quiet.
 * If the push fails, keeps retrying every 10s until it succeeds.
 */
export function schedulePush(state: GymState) {
  pendingState = state;
  dirty = true;
  ensureRetry();
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    pushTimer = null;
    if (pendingState && isOnline()) {
      const ok = await pushState(pendingState);
      if (!ok) {
        // PendingState stays dirty; ensureRetry() keeps trying.
        dirty = true;
      }
    }
  }, 2000);
}

/**
 * Force push immediately (for use when coming online or leaving the page).
 */
export async function forcePush(state: GymState): Promise<boolean> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  pendingState = state;
  dirty = true;
  const ok = await pushState(state);
  if (ok) markedClean();
  else dirty = true;
  return ok;
}

/**
 * Push whatever is still pending right now (before the debounce fires), e.g.
 * when the tab is hidden or the page is about to be closed.
 */
export async function flushPending() {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  if (!dirty || !pendingState || !isOnline()) return;
  const s = pendingState;
  const ok = await pushState(s);
  if (ok && pendingState === s) markedClean();
}
