import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReadingSession } from '@/hooks/useReadingSessions';

interface Params {
  /** Sesiones de lectura (de todos los libros). */
  sessions: ReadingSession[];
  /** Libro activo. Sin libro no se filtra por `book_id`. */
  bookId?: string | null;
  /** Marcapáginas de la biblioteca: página en la que vas. */
  pagesRead?: number | null;
  /** Día que se está registrando (yyyy-MM-dd). */
  todayStr: string;
}

const byCreated = (a: ReadingSession, b: ReadingSession) =>
  a.created_at.localeCompare(b.created_at);

/**
 * Borrador de "Inicié en / Terminé en" para la tarjeta de lectura.
 *
 * Regla: "Inicié en" es donde terminó la última sesión registrada (nunca el
 * marcapáginas actual, que puede haber avanzado con el lector). "Terminé en"
 * sigue al marcapáginas mientras no escribas, y al escribir se respeta lo tuyo.
 *
 * Así, si ayer quedaste en la 63 y hoy el lector avanza a la 70, la tarjeta
 * muestra 63 → 70 en vez de 70 → 70.
 */
export function useReadingPagesDraft({ sessions, bookId, pagesRead, todayStr }: Params) {
  const { start, end, bookmark, lastToday, lastTodayEnd } = useMemo(() => {
    const belongs = (s: ReadingSession) => !bookId || s.book_id === bookId;
    const mine = sessions.filter(belongs);
    const today = mine
      .filter((s) => s.session_date === todayStr)
      .sort(byCreated);
    const before = mine
      .filter((s) => s.session_date < todayStr)
      .sort((a, b) =>
        a.session_date === b.session_date
          ? byCreated(a, b)
          : a.session_date.localeCompare(b.session_date)
      );

    const firstToday = today[0];
    const lastToday = today[today.length - 1];
    const lastBefore = before[before.length - 1];
    const read = Number(pagesRead) || 0;
    const currentBookmark = Math.max(lastToday?.page_end ?? 0, read);
    const lastTodayEnd = lastToday?.page_end ?? 0;

    let start: number;
    let end: number;
    if (!lastToday) {
      // Aún no hay sesión hoy: empieza donde terminó la última sesión anterior
      // y termina en el marcapáginas (aunque el lector ya lo haya avanzado).
      start = lastBefore?.page_end ?? currentBookmark;
      end = currentBookmark;
    } else if (read > lastTodayEnd) {
      // El marcapáginas avanzó después de la última sesión: toca otra sesión.
      start = lastTodayEnd;
      end = read;
    } else {
      // Mostrar la sesión de hoy tal como quedó registrada (63 → 70).
      start = firstToday?.page_start ?? lastTodayEnd;
      end = lastTodayEnd || currentBookmark;
    }

    return {
      start,
      end,
      bookmark: currentBookmark,
      lastToday,
      lastTodayEnd,
    };
  }, [sessions, bookId, pagesRead, todayStr]);

  const [pageStart, setPageStart] = useState(start);
  const [pageEnd, setPageEnd] = useState(end);
  const editedRef = useRef(false);

  // Al cambiar de libro o de día se vuelve a los valores calculados.
  useEffect(() => {
    editedRef.current = false;
  }, [bookId, todayStr]);

  // Sin edits del usuario, los campos siguen los datos reales. Esto es lo que
  // evita que "Inicié en" salte a la página nueva cuando avanza el lector.
  useEffect(() => {
    if (editedRef.current) return;
    setPageStart(start);
    setPageEnd(end);
  }, [start, end]);

  const changeStart = (value: number) => {
    editedRef.current = true;
    setPageStart(value);
  };

  const changeEnd = (value: number) => {
    editedRef.current = true;
    setPageEnd(value);
    // Si ya hay una sesión guardada hoy, la siguiente empieza donde terminó.
    if (lastTodayEnd > 0 && value > lastTodayEnd) {
      setPageStart((prev) => (prev < lastTodayEnd ? lastTodayEnd : prev));
    }
  };

  return {
    pageStart,
    pageEnd,
    start,
    end,
    bookmark,
    lastToday,
    lastTodayEnd,
    changeStart,
    changeEnd,
  };
}
