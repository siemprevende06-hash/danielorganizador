import { useState, useEffect, useRef, useCallback } from "react";
import { getCached, setCache } from "@/lib/offlineCache";

interface UseOfflineQueryOptions<T> {
  table: string;
  queryKey: string;
  fetcher: () => Promise<T>;
  ttlMs?: number;
  enabled?: boolean;
  onData?: (data: T) => void;
}

interface UseOfflineQueryResult<T> {
  data: T | null;
  loading: boolean;
  isStale: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useOfflineQuery<T>({
  table,
  queryKey,
  fetcher,
  ttlMs,
  enabled = true,
}: UseOfflineQueryOptions<T>): UseOfflineQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const fetchAndCache = useCallback(async (): Promise<T | null> => {
    try {
      const fresh = await fetcherRef.current();
      if (mountedRef.current) {
        setIsStale(false);
        setError(null);
      }
      await setCache(table, queryKey, fresh, ttlMs);
      return fresh;
    } catch (err: any) {
      if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError") || !navigator.onLine) {
        return null;
      }
      throw err;
    }
  }, [table, queryKey, ttlMs]);

  const load = useCallback(async () => {
    setLoading(true);

    const cached = await getCached<T>(table, queryKey);
    if (cached !== null && mountedRef.current) {
      setData(cached);
      setLoading(false);
      setIsStale(true);
    }

    const fresh = await fetchAndCache();
    if (mountedRef.current) {
      if (fresh !== null) {
        setData(fresh);
        setIsStale(false);
      } else if (cached === null) {
        setError("Sin conexión y sin datos guardados");
      }
      setLoading(false);
    }
  }, [table, queryKey, fetchAndCache]);

  useEffect(() => {
    if (!enabled) return;
    mountedRef.current = true;
    load();
    return () => {
      mountedRef.current = false;
    };
  }, [enabled, load]);

  const refetch = useCallback(async () => {
    setLoading(true);
    const fresh = await fetchAndCache();
    if (mountedRef.current) {
      if (fresh !== null) setData(fresh);
      setLoading(false);
    }
  }, [fetchAndCache]);

  return { data, loading, isStale, error, refetch };
}
