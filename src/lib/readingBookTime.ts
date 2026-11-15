import { getSetting, setSetting } from "@/lib/settings";
import { supabase } from "@/integrations/supabase/client";

/**
 * Tiempo de lectura acumulado por libro.
 *
 * Se guarda en `app_settings` como `{ [bookId]: minutos }` para no depender de
 * una columna nueva en `reading_library` y quedar sincronizado entre equipos.
 */
export const READING_BOOK_MINUTES_KEY = "reading_book_minutes";

export type BookMinutesMap = Record<string, number>;

function sanitize(raw: unknown): BookMinutesMap {
  const map: BookMinutesMap = {};
  if (!raw || typeof raw !== "object") return map;
  for (const [id, value] of Object.entries(raw as Record<string, unknown>)) {
    const minutes = Number(value);
    if (Number.isFinite(minutes) && minutes > 0) map[id] = Math.round(minutes);
  }
  return map;
}

export async function loadBookMinutes(): Promise<BookMinutesMap> {
  try {
    return sanitize(await getSetting<unknown>(READING_BOOK_MINUTES_KEY));
  } catch {
    return {};
  }
}

let queue: Promise<unknown> = Promise.resolve();

/**
 * Suma (o resta, si `delta` es negativo) minutos al libro que está marcado
 * como "Leyendo" en la biblioteca: el libro que se lee en este momento.
 *
 * Las operaciones se encadenan para que dos cambios seguidos no se pisen al
 * leer y escribir el mismo mapa en `app_settings`.
 */
export function addMinutesToCurrentBook(delta: number): Promise<string | null> {
  const rounded = Math.round(delta);
  if (!Number.isFinite(rounded) || rounded === 0) return Promise.resolve(null);

  const task = queue.then(async (): Promise<string | null> => {
    const { data: book, error } = await supabase
      .from("reading_library")
      .select("id")
      .eq("status", "reading")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !book?.id) return null;

    const map = await loadBookMinutes();
    const current = map[book.id] ?? 0;
    const next = Math.max(0, current + rounded);
    if (next === current) return null;

    map[book.id] = next;
    const saved = await setSetting(READING_BOOK_MINUTES_KEY, map);
    if (!saved) return null;

    try {
      window.dispatchEvent(new CustomEvent("reading-book-minutes-updated", {
        detail: { bookId: book.id, minutes: next },
      }));
    } catch {
      // sin window (SSR/tests): no pasa nada
    }

    return book.id;
  });

  queue = task.catch(() => null);

  return task.catch(error => {
    console.warn("[readingBookTime] no se pudo sumar el tiempo al libro", error);
    return null;
  });
}

/** "45 min" · "2 h" · "2 h 15 min" */
export function formatBookMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
