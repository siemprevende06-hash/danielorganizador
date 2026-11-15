import { useCallback, useEffect, useState } from "react";
import { getSetting, setSetting } from "@/lib/settings";

/**
 * Etiqueta de energía de un sistema del día:
 *  - activo: exige esfuerzo y atención (trabajo, estudio, entrenamiento...).
 *  - pasivo: consumo tranquilo, sin esfuerzo (lectura, música, series...).
 *
 * Se guarda por sistema (no por fecha) porque describe la naturaleza de la
 * actividad. Se persiste en localStorage y se sincroniza con `app_settings`.
 */
export type ActivityTag = "activo" | "pasivo";

export const ACTIVITY_TAG_OPTIONS = [
  { id: "activo", label: "Activo", icon: "⚡", hint: "Requiere esfuerzo y atención" },
  { id: "pasivo", label: "Pasivo", icon: "🌙", hint: "Consumo tranquilo, sin esfuerzo" },
] as const;

export const ACTIVITY_TAG_STYLES: Record<ActivityTag, { chip: string; cover: string }> = {
  activo: {
    chip: "border-amber-500 bg-amber-500 text-white shadow-sm",
    cover: "bg-amber-500/90",
  },
  pasivo: {
    chip: "border-blue-500 bg-blue-500 text-white shadow-sm",
    cover: "bg-blue-500/90",
  },
};

export function activityTagMeta(tag: ActivityTag) {
  return ACTIVITY_TAG_OPTIONS.find(option => option.id === tag) ?? ACTIVITY_TAG_OPTIONS[0];
}

const STORAGE_KEY = "daniel_system_activity_tags_v1";
const SETTING_KEY = "system_activity_tags";

type TagMap = Record<string, ActivityTag>;

function isActivityTag(value: unknown): value is ActivityTag {
  return value === "activo" || value === "pasivo";
}

function sanitize(raw: unknown): TagMap {
  const result: TagMap = {};
  if (!raw || typeof raw !== "object") return result;
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (isActivityTag(value)) result[key] = value;
  }
  return result;
}

export function loadSystemActivityTags(): TagMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return sanitize(JSON.parse(raw));
  } catch {
    return {};
  }
}

function persistLocal(map: TagMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // almacenamiento no disponible: se mantiene solo en memoria
  }
}

export function useSystemActivityTags() {
  const [map, setMap] = useState<TagMap>(() => loadSystemActivityTags());

  // Recupera la copia de la nube sin pisar lo que ya existe en este dispositivo.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = sanitize(await getSetting<unknown>(SETTING_KEY));
      if (cancelled || Object.keys(stored).length === 0) return;
      setMap(prev => {
        const next = { ...stored, ...prev };
        if (JSON.stringify(next) === JSON.stringify(prev)) return prev;
        persistLocal(next);
        return next;
      });
    })().catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const getTag = useCallback(
    (systemId: string): ActivityTag | null => map[systemId] ?? null,
    [map],
  );

  const setTag = useCallback((systemId: string, tag: ActivityTag | null) => {
    if ((map[systemId] ?? null) === tag) return;
    const next = { ...map };
    if (tag) next[systemId] = tag;
    else delete next[systemId];
    setMap(next);
    persistLocal(next);
    void setSetting(SETTING_KEY, next);
  }, [map]);

  return { map, getTag, setTag };
}
