import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { toast } from "sonner";

const LS_PREFIX = "text_sections_";

function getLocalData<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(data));
  } catch {}
}

interface TextSectionRow {
  id: string;
  content: unknown;
}

function contentSize(content: unknown): number {
  if (content === null || content === undefined) return 0;
  if (typeof content === "object" && Object.keys(content as object).length === 0) return 0;
  try {
    return JSON.stringify(content)?.length ?? 0;
  } catch {
    return 0;
  }
}

// La tabla arrastra filas duplicadas de la misma llave: el UNIQUE (user_id, section_key)
// nunca las frenó porque user_id es NULL, y un INSERT por autoguardado las multiplicaba.
// maybeSingle() devuelve PGRST116 con esas filas, la app se comía el error y la página
// quedaba vacía en cualquier dispositivo sin localStorage. Con varias filas se gana la
// de mayor contenido (empate: la más reciente), así una fila vacía no tapa la buena.
function pickBestRow<T>(rows: TextSectionRow[]): T | null {
  let best: TextSectionRow | null = null;
  let bestSize = -1;

  for (const row of rows) {
    const size = contentSize(row.content);
    if (size > bestSize) {
      best = row;
      bestSize = size;
    }
  }

  return best ? ((best.content ?? null) as T | null) : null;
}

export async function readTextSection<T>(sectionKey: string): Promise<T | null> {
  const { data, error } = await supabase
    .from("text_sections")
    .select("*")
    .eq("section_key", sectionKey)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  if (!data?.length) return null;
  return pickBestRow<T>(data as TextSectionRow[]);
}

// Nunca insertar si la llave ya existe: el INSERT duplicaba la fila en cada autoguardado.
// Actualizar todas las filas de la llave las deja convergentes sin borrar ninguna.
async function writeTextSection<T>(sectionKey: string, content: T): Promise<void> {
  const json = content as unknown as Json;
  const payload = { content: json, updated_at: new Date().toISOString() };

  const { data: existing, error: readError } = await supabase
    .from("text_sections")
    .select("id")
    .eq("section_key", sectionKey)
    .limit(1);

  if (readError) throw readError;

  if (existing && existing.length > 0) {
    const { error } = await supabase
      .from("text_sections")
      .update(payload)
      .eq("section_key", sectionKey);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("text_sections")
    .insert({ section_key: sectionKey, content: json });
  if (error) throw error;
}

export function useTextSection<T>(sectionKey: string, defaultValue: T) {
  const [data, setData] = useState<T>(() => {
    const local = getLocalData<T>(sectionKey);
    return local ?? defaultValue;
  });
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
        const rowContent = await readTextSection<T>(sectionKey);

        if (cancelled) return;

        if (!userChangedRef.current && rowContent !== null) {
          setData(rowContent);
          setLocalData(sectionKey, rowContent);
        }
        setLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.warn("text_sections read failed", e);
        if (!userChangedRef.current) {
          toast.error("No se pudo leer de la nube: se muestra la copia local");
        }
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [sectionKey]);

  const doSave = useCallback(async (value: T) => {
    try {
      setLocalData(latestKey.current, value);
      await writeTextSection(latestKey.current, value);
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
      const currentData = latestData.current;

      setLocalData(sectionKey, currentData);

      let error;
      try {
        await writeTextSection(sectionKey, currentData);
      } catch (e: any) {
        error = { message: e?.message || "desconocido" };
      }

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
