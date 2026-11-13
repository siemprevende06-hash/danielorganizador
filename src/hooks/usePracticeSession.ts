import { useCallback, useEffect, useRef, useState } from 'react';

export interface PracticeSession {
  /** Hay una sesión contando ahora mismo. */
  running: boolean;
  /** Tiempo total acumulado (incluye pausas anteriores). */
  elapsedMs: number;
  start: () => void;
  pause: () => void;
  /** Cierra la sesión, devuelve los minutos redondeados y reinicia el contador. */
  finish: () => number;
  /** Reinicia sin devolver minutos (cambio de idioma, descarte...). */
  reset: () => void;
}

/**
 * Cronómetro de práctica con pausa. Guarda el tiempo en refs para que
 * `finish()` devuelva el total exacto aunque se llame desde un efecto.
 */
export function usePracticeSession(onFinish?: (minutes: number) => void): PracticeSession {
  const [running, setRunning] = useState(false);
  const [, forceTick] = useState(0);
  const startRef = useRef<number | null>(null);
  const accumRef = useRef(0);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => forceTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedMs = accumRef.current + (running && startRef.current ? Date.now() - startRef.current : 0);

  const start = useCallback(() => {
    if (startRef.current !== null) return;
    startRef.current = Date.now();
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (startRef.current !== null) {
      accumRef.current += Date.now() - startRef.current;
      startRef.current = null;
    }
    setRunning(false);
    forceTick(t => t + 1);
  }, []);

  const finish = useCallback(() => {
    if (startRef.current !== null) {
      accumRef.current += Date.now() - startRef.current;
      startRef.current = null;
    }
    const minutes = Math.round(accumRef.current / 60000);
    accumRef.current = 0;
    setRunning(false);
    forceTick(t => t + 1);
    onFinishRef.current?.(minutes);
    return minutes;
  }, []);

  const reset = useCallback(() => {
    startRef.current = null;
    accumRef.current = 0;
    setRunning(false);
    forceTick(t => t + 1);
  }, []);

  return { running, elapsedMs, start, pause, finish, reset };
}
