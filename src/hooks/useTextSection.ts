import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useTextSection<T>(sectionKey: string, defaultValue: T) {
  const [data, setData] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const loadedRef = useRef(false);
  const userChangedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestData = useRef(data);
  latestData.current = data;

  useEffect(() => {
    let cancelled = false;

    loadedRef.current = true;

    (async () => {
      try {
        const { data: row } = await supabase
          .from("text_sections")
          .select("content")
          .eq("section_key", sectionKey)
          .maybeSingle();

        if (!cancelled) {
          if (!userChangedRef.current) {
            if (row?.content !== undefined && row?.content !== null) {
              setData(row.content as T);
            }
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
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
      }, 200);
    },
    [sectionKey]
  );

  const update = useCallback(
    (updater: T | ((prev: T) => T)) => {
      userChangedRef.current = true;
      setData((prev) => {
        const next =
          typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        persist(next);
        return next;
      });
    },
    [persist]
  );

  const saveNow = useCallback(async (): Promise<boolean> => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("text_sections")
        .upsert(
          { section_key: sectionKey, content: latestData.current as any },
          { onConflict: "user_id,section_key" }
        );
      if (error) {
        toast.error(`Error al guardar: ${error.message}`);
        return false;
      }
      toast.success("Guardado correctamente");
      return true;
    } catch (e: any) {
      toast.error(`Error al guardar: ${e?.message || "desconocido"}`);
      return false;
    } finally {
      setSaving(false);
    }
  }, [sectionKey]);

  return { data, setData: update, loading, saving, saveNow };
}
