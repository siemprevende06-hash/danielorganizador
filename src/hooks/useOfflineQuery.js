import { useState, useEffect, useRef, useCallback } from "react";
import { getCached, setCache } from "@/lib/offlineCache";
import { isOnline } from "@/lib/isOnline";
export function useOfflineQuery({ table, queryKey, fetcher, ttlMs, enabled = true, }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isStale, setIsStale] = useState(false);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const fetcherRef = useRef(fetcher);
    fetcherRef.current = fetcher;
    const fetchAndCache = useCallback(async () => {
        try {
            const fresh = await fetcherRef.current();
            if (mountedRef.current) {
                setIsStale(false);
                setError(null);
            }
            await setCache(table, queryKey, fresh, ttlMs);
            return fresh;
        }
        catch (err) {
            if (err?.message?.includes("Failed to fetch") || err?.message?.includes("NetworkError") || !navigator.onLine) {
                return null;
            }
            throw err;
        }
    }, [table, queryKey, ttlMs]);
    const load = useCallback(async () => {
        setLoading(true);
        const cached = await getCached(table, queryKey);
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
            }
            else if (cached === null) {
                setError("Sin conexión y sin datos guardados");
            }
            setLoading(false);
        }
    }, [table, queryKey, fetchAndCache]);
    useEffect(() => {
        if (!enabled)
            return;
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
            if (fresh !== null)
                setData(fresh);
            setLoading(false);
        }
    }, [fetchAndCache]);
    useEffect(() => {
        if (!enabled)
            return;
        const onOnline = () => {
            if (!isOnline())
                return;
            refetch();
        };
        window.addEventListener("online", onOnline);
        return () => window.removeEventListener("online", onOnline);
    }, [enabled, refetch]);
    return { data, loading, isStale, error, refetch };
}
