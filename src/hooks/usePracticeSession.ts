import { useCallback, useEffect, useRef, useState } from 'react';

/** Por debajo de este tiempo la sesión se descarta con aviso (B4). */
const MIN_PRACTICE_MS = 20_000;

export interface PracticeFinish {
  /** Minutos redondeados; 0 si la sesión se descartó. */
  minutes: number;
  elapsedMs: number;
  /** true cuando no llegó al mínimo y no debe registrarse. */
  discarded: boolean;
}

export interface PracticeSession {
  /** Hay una sesión contando ahora mismo. */
  running: boolean;
  /** Tiempo total acumulado (incluye pausas anteriores). */
  elapsedMs: number;
  /** Se pausó sola porque la pestaña quedó en segundo plano (B5). */
  autoPaused: boolean;
  start: () => void;
  pause: () => void;
  /** Cierra la sesión, devuelve minutos y tiempo exacto, y reinicia el contador. */
  finish: () => PracticeFinish;
  /** Reinicia sin devolver minutos (cambio de idioma, descarte...). */
  reset: () => void;
}

const EMPTY_FINISH: PracticeFinish = { minutes: 0, elapsedMs: 0, discarded: true };

/**
 * Cronómetro de práctica con pausa.
 *
 * - Redondeo honesto: una sesión de 40 s cuenta 1 min; una de 5 s se descarta
 *   y se avisa (B4).
 * - `visibilitychange`: el tiempo con la pestaña oculta no suma (B5). Al volver
 *   se reanuda solo si la pausa la provocó el navegador.
 * - Guarda el tiempo en refs para que `finish()` devuelva el total exacto aunque
 *   se llame desde un efecto.
 */
export function usePracticeSession(
  onFinish?: (result: PracticeFinish) => void
): PracticeSession {
  const [running, setRunning] = useState(false);
  const [autoPaused, setAutoPaused] = useState(false);
  const [, forceTick] = useState(0);
  const startRef = useRef<number | null>(null);
  const accumRef = useRef(0);
  const runningRef = useRef(false);
  const autoPausedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  onFinishRef.current = onFinish;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => forceTick(t => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [running]);

  const elapsedMs = accumRef.current + (running && startRef.current ? Date.now() - startRef.current : 0);

  const startRefFn = useRef(() => undefined as void);
  const pauseRefFn = useRef(() => undefined as void);

  const start = useCallback(() => {
    if (startRef.current !== null) return;
    startRef.current = Date.now();
    runningRef.current = true;
    setRunning(true);
  }, []);

  const pause = useCallback(() => {
    if (startRef.current !== null) {
      accumRef.current += Date.now() - startRef.current;
      startRef.current = null;
    }
    runningRef.current = false;
    setRunning(false);
    forceTick(t => t + 1);
  }, []);

  startRefFn.current = start;
  pauseRefFn.current = pause;

  // B5: fuera de la pestaña no se cuenta el tiempo. Al volver se reanuda solo
  // si la pausa fue automática; una pausa manual se respeta.
  useEffect(() => {
    const onVisibility = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState === 'hidden') {
        if (runningRef.current) {
          pauseRefFn.current();
          autoPausedRef.current = true;
          setAutoPaused(true);
        }
        return;
      }
      if (autoPausedRef.current) {
        autoPausedRef.current = false;
        setAutoPaused(false);
        startRefFn.current();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const finish = useCallback((): PracticeFinish => {
    if (startRef.current !== null) {
      accumRef.current += Date.now() - startRef.current;
      startRef.current = null;
    }
    const elapsed = accumRef.current;
    const discarded = elapsed < MIN_PRACTICE_MS;
    const minutes = discarded ? 0 : Math.max(1, Math.round(elapsed / 60000));
    accumRef.current = 0;
    runningRef.current = false;
    autoPausedRef.current = false;
    setAutoPaused(false);
    setRunning(false);
    forceTick(t => t + 1);
    const result: PracticeFinish = { minutes, elapsedMs: elapsed, discarded };
    onFinishRef.current?.(result);
    return result;
  }, []);

  const reset = useCallback(() => {
    startRef.current = null;
    accumRef.current = 0;
    runningRef.current = false;
    autoPausedRef.current = false;
    setAutoPaused(false);
    setRunning(false);
    forceTick(t => t + 1);
  }, []);

  return { running, elapsedMs, autoPaused, start, pause, finish, reset };
}

export { EMPTY_FINISH, MIN_PRACTICE_MS };
