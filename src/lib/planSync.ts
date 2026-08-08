import { supabase } from '@/integrations/supabase/client';

const SYNC_TABLE = 'sync_state';
const META_KEY = 'plan_sync_meta';

const PLAN_PREFIXES = ['trimestral_plan_', 'monthly_plan_', 'weekly_plan_', 'trimestral_progress_'];
const PLAN_EXACT_KEYS = ['hierarchy_week_overrides', 'hierarchy_day_overrides'];

function loadMeta(): Record<string, string> {
  try {
    const raw = localStorage.getItem(META_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveMeta(meta: Record<string, string>) {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
}

function isPlanKey(key: string): boolean {
  return PLAN_EXACT_KEYS.includes(key) || PLAN_PREFIXES.some(p => key.startsWith(p));
}

function updateMetaFromRow(row: { key: string; updated_at: string | null }) {
  if (!isPlanKey(row.key)) return;
  const meta = loadMeta();
  const current = meta[row.key];
  if (!current || (row.updated_at && row.updated_at > current)) {
    meta[row.key] = row.updated_at || new Date().toISOString();
    saveMeta(meta);
  }
}

/**
 * Sube una clave del localStorage a Supabase (fire-and-forget con catch silencioso).
 * Solo sincroniza claves de planes/overrides/progreso.
 */
export function pushSyncKey(key: string) {
  if (!isPlanKey(key)) return;
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {}
  if (!raw) return;
  let value: unknown = null;
  try {
    value = JSON.parse(raw);
  } catch {
    return;
  }
  const updated_at = new Date().toISOString();
  void (async () => {
    try {
      await (supabase.from(SYNC_TABLE) as any).upsert({ key, value, updated_at }, { onConflict: 'key' });
      const meta = loadMeta();
      meta[key] = updated_at;
      saveMeta(meta);
    } catch {}
  })();
}

/**
 * Baja todas las claves sincronizables desde Supabase hacia localStorage,
 * respetando la última modificación: si el servidor es más reciente que lo local,
 * se usa el servidor; si lo local es más reciente, se re-sube al servidor.
 */
let pullPromise: Promise<void> | null = null;
export function pullPlansIntoLocal(): Promise<void> {
  if (pullPromise) return pullPromise;
  pullPromise = doPull().finally(() => { pullPromise = null; });
  return pullPromise;
}

async function doPull(): Promise<void> {
  try {
    const { data } = await (supabase.from(SYNC_TABLE) as any).select('key, value, updated_at') as { data: { key: string; value: unknown; updated_at: string | null }[] | null };
    const rows = data || [];
    const meta = loadMeta();

    for (const row of rows) {
      if (!isPlanKey(row.key)) continue;
      const serverTs = row.updated_at || '';
      const localRaw = localStorage.getItem(row.key);
      const localTs = meta[row.key] || '';

      if (!localRaw) {
        if (row.value != null) {
          localStorage.setItem(row.key, JSON.stringify(row.value));
          meta[row.key] = serverTs || new Date().toISOString();
        }
      } else if (!localTs || serverTs > localTs) {
        if (row.value != null) {
          localStorage.setItem(row.key, JSON.stringify(row.value));
          meta[row.key] = serverTs || new Date().toISOString();
        }
      } else if (localTs > serverTs || !serverTs) {
        pushSyncKey(row.key);
      }
    }
    saveMeta(meta);
  } catch {}
}