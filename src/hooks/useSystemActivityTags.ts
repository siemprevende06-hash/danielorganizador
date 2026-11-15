import { useCallback, useSyncExternalStore } from "react";
import { getSetting, setSetting } from "@/lib/settings";

/**
 * Etiqueta de energía de un sistema del día:
 *  - activo: exige esfuerzo y atención (trabajo, estudio, entrenamiento...).
 *  - pasivo: consumo tranquilo, sin esfuerzo (lectura, música, series...).
 *
 * Se guarda por sistema (no por fecha) porque describe la naturaleza de la
 * actividad. Se persiste en localStorage y se sincroniza con `app_settings`.
 *
 * El estado vive en un store de módulo: así todas las tarjetas de la app
 * (Hoy, Sistemas, Semanal, Panel, Objetivo, Visión...) muestran la misma
 * etiqueta al instante, sin importar cuántas tarjetas haya montadas.
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

let snapshot: TagMap = typeof window === "undefined" ? {} : loadSystemActivityTags();
const listeners = new Set<() => void>();
let cloudRequested = false;
let writeQueue: Promise<unknown> = Promise.resolve();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): TagMap {
  return snapshot;
}

/**
 * Recupera la copia de la nube una sola vez. Lo que haya en localStorage gana,
 * porque es lo último que se tocó en este dispositivo.
 */
function hydrateFromCloud() {
  if (cloudRequested) return;
  cloudRequested = true;
  (async () => {
    const stored = sanitize(await getSetting<unknown>(SETTING_KEY));
    if (Object.keys(stored).length === 0) return;
    const merged = { ...stored, ...loadSystemActivityTags() };
    if (JSON.stringify(merged) === JSON.stringify(snapshot)) return;
    snapshot = merged;
    persistLocal(snapshot);
    emit();
  })().catch(() => {});
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  hydrateFromCloud();
  return () => {
    listeners.delete(listener);
  };
}

// Mantiene sincronizadas las pestañas abiertas.
if (typeof window !== "undefined") {
  window.addEventListener("storage", event => {
    if (event.key !== STORAGE_KEY) return;
    const next = loadSystemActivityTags();
    if (JSON.stringify(next) === JSON.stringify(snapshot)) return;
    snapshot = next;
    emit();
  });
}

export function useSystemActivityTags() {
  const map = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const getTag = useCallback(
    (systemId: string): ActivityTag | null => map[systemId] ?? null,
    [map],
  );

  const setTag = useCallback((systemId: string, tag: ActivityTag | null) => {
    if ((snapshot[systemId] ?? null) === tag) return;
    const next = { ...snapshot };
    if (tag) next[systemId] = tag;
    else delete next[systemId];
    snapshot = next;
    persistLocal(next);
    emit();
    // Serializa las escrituras para que dos clics seguidos no se pisen.
    writeQueue = writeQueue
      .then(() => setSetting(SETTING_KEY, next))
      .catch(() => false);
  }, []);

  return { map, getTag, setTag };
}
