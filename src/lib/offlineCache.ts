import { get, set, del, keys } from "idb-keyval";

const CACHE_PREFIX = "offline_cache_v1_";
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  ttl: number;
}

const makeKey = (table: string, queryKey: string) =>
  `${CACHE_PREFIX}${table}::${queryKey}`;

export const getCached = async <T>(table: string, queryKey: string): Promise<T | null> => {
  try {
    const raw = await get<CacheEntry<T>>(makeKey(table, queryKey));
    if (!raw) return null;
    const effectiveTtl = raw.ttl ?? DEFAULT_TTL_MS;
    if (Date.now() - raw.cachedAt > effectiveTtl) {
      await del(makeKey(table, queryKey));
      return null;
    }
    return raw.data;
  } catch {
    return null;
  }
};

export const setCache = async <T>(
  table: string,
  queryKey: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<void> => {
  try {
    const entry: CacheEntry<T> = { data, cachedAt: Date.now(), ttl: ttlMs };
    await set(makeKey(table, queryKey), entry);
  } catch {}
};

export const clearTableCache = async (table: string): Promise<void> => {
  try {
    const allKeys = await keys();
    const prefix = `${CACHE_PREFIX}${table}::`;
    for (const k of allKeys) {
      if (typeof k === "string" && k.startsWith(prefix)) {
        await del(k);
      }
    }
  } catch {}
};

export const clearAllCache = async (): Promise<void> => {
  try {
    const allKeys = await keys();
    for (const k of allKeys) {
      if (typeof k === "string" && k.startsWith(CACHE_PREFIX)) {
        await del(k);
      }
    }
  } catch {}
};

export const getCacheAge = async <T>(table: string, queryKey: string): Promise<number | null> => {
  try {
    const raw = await get<CacheEntry<T>>(makeKey(table, queryKey));
    if (!raw) return null;
    return Date.now() - raw.cachedAt;
  } catch {
    return null;
  }
};

export const isCacheExpired = async (table: string, queryKey: string, ttlMs?: number): Promise<boolean> => {
  try {
    const raw = await get<CacheEntry<unknown>>(makeKey(table, queryKey));
    if (!raw) return true;
    const effectiveTtl = ttlMs ?? raw.ttl ?? DEFAULT_TTL_MS;
    return Date.now() - raw.cachedAt > effectiveTtl;
  } catch {
    return true;
  }
};
