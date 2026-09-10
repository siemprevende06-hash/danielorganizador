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

let pushTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: GymState | null = null;

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
    const rowId = meta?.id || crypto.randomUUID();

    const payload = {
      id: rowId,
      state: state as unknown as Record<string, unknown>,
      version,
      updated_at: updatedAt,
    };

    const { error } = await supabase
      .from(TABLE as any)
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.warn("[gym20sync] push error:", error.message);
      return false;
    }

    saveMeta({ id: rowId, version, updatedAt });
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
export async function pullState(): Promise<{ state: GymState; version: number } | null> {
  if (!isOnline()) return null;
  try {
    const meta = loadMeta();
    let query = supabase.from(TABLE as any).select("id, state, version, updated_at").order("version", { ascending: false }).limit(1);

    const { data, error } = await query;
    if (error || !data || data.length === 0) return null;

    const row = data[0];
    if (!row || !row.state) return null;

    // If we have a local version and it's >= remote, skip
    if (meta && meta.version >= (row.version || 0)) return null;

    // Update local meta
    saveMeta({ id: row.id, version: row.version || 0, updatedAt: row.updated_at || Date.now() });

    return { state: row.state as unknown as GymState, version: row.version || 0 };
  } catch (e) {
    console.warn("[gym20sync] pull exception:", e);
    return null;
  }
}

/**
 * Debounced push: buffers rapid state changes and pushes once after 2s of quiet.
 */
export function schedulePush(state: GymState) {
  pendingState = state;
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = setTimeout(async () => {
    if (pendingState && isOnline()) {
      const ok = await pushState(pendingState);
      pendingState = null;
      if (!ok) {
        // Will retry on next state change or when coming online
      }
    }
  }, 2000);
}

/**
 * Force push immediately (for use when coming online).
 */
export async function forcePush(state: GymState): Promise<boolean> {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = null;
  pendingState = null;
  return pushState(state);
}
