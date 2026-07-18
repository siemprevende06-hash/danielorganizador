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
  const latestKey = useRef(sectionKey);
  latestData.current = data;
  latestKey.current = sectionKey;

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

  const doSave = useCallback(async (value: T) => {
    try {
      await supabase
        .from("text_sections")
        .upsert(
          { section_key: latestKey.current, content: value as any },
          { onConflict: "user_id,section_key" }
        );
    } catch (e) {
      console.warn("text_sections upsert failed", e);
    }
  }, []);

  const flush = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
      const currentData = latestData.current;
      if (currentData !== defaultValue) {
        doSave(currentData);
      }
    }
  }, [doSave, defaultValue]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flush();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      flush();
    };
  }, [flush]);

  const persist = useCallback(
    (next: T) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveTimer.current = null;
        doSave(next);
      }, 200);
    },
    [doSave]
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
