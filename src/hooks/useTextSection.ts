import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook genérico para persistir contenido JSON libre en `text_sections`.
 * Reemplaza usos previos de localStorage para secciones editables tipo
 * Motivos, Realidad, HabilidadesValiosas, Tools (ideal partner), etc.
 */
export function useTextSection<T>(sectionKey: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: row } = await supabase
          .from("text_sections")
          .select("content")
          .eq("section_key", sectionKey)
          .maybeSingle();
        if (!cancelled) {
          if (row?.content !== undefined && row?.content !== null) {
            setData(row.content as T);
          }
          loadedRef.current = true;
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          loadedRef.current = true;
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sectionKey]);

  const persist = useCallback(
    (next: T) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try {
          await supabase
            .from("text_sections")
            .upsert(
              { section_key: sectionKey, content: next as any },
              { onConflict: "user_id,section_key" }
            );
        } catch (e) {
          console.warn("text_sections upsert failed", e);
        }
      }, 400);
    },
    [sectionKey]
  );

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setData((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        if (loadedRef.current) persist(next);
        return next;
      });
    },
    [persist]
  );

  return { data, setData: update, loading };
}
