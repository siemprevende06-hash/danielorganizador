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
  /** Minutos introducidos en el formulario (para sesiones sin páginas). */
  minutes?: number;
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
export function useReadingPagesDraft({ sessions, bookId, pagesRead, todayStr, minutes }: Params) {
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

  /** Último tramo ya registrado hoy (para el botón "Guardado"). */
  const [saved, setSaved] = useState<{ start: number; end: number; minutes: number; bookId: string | null } | null>(null);

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

  // Lo ya registrado hoy: al abrir la tarjeta el botón muestra "Guardado".
  useEffect(() => {
    if (!lastToday) {
      setSaved(null);
      return;
    }
    setSaved({
      start: lastToday.page_start ?? 0,
      end: lastToday.page_end ?? 0,
      minutes: lastToday.minutes ?? 0,
      bookId: bookId ?? null,
    });
    // Solo interesa la última sesión guardada, no la identidad del objeto.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastToday?.id, lastToday?.page_start, lastToday?.page_end, lastToday?.minutes, bookId]);

  const currentStart = Number(pageStart) || 0;
  const currentEnd = Number(pageEnd) || 0;
  const pages = Math.max(0, currentEnd - currentStart);
  const isSaved = !!saved
    && saved.bookId === (bookId ?? null)
    && saved.start === currentStart
    && saved.end === currentEnd
    && (pages > 0 || saved.minutes === (Number(minutes) || 0));

  /** Marca el tramo recién guardado (el botón pasa a "Guardado"). */
  const markSaved = (range: { start: number; end: number; minutes: number }) => {
    setSaved({ ...range, bookId: bookId ?? null });
  };

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
    pages,
    isSaved,
    markSaved,
    changeStart,
    changeEnd,
  };
}
