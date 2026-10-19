import { useCallback, useEffect, useRef, useState } from "react";

export interface ChronoSplit {
  fixed: number;
  extra: number;
}

interface UseChronoTimeOptions {
  /** false = no divide el tiempo (tarjetas sin bloque fijo / avance extra). */
  enabled: boolean;
  /** Fecha ISO (yyyy-MM-dd) usada para persistir el reparto por día. */
  date?: string;
  areaId: string;
  /** Minutos totales del área en la fuente principal (DB). */
  total: number;
  onTotalChange: (minutes: number) => void;
}

const storageKey = (date: string, areaId: string) => `chrono-time:${date}:${areaId}`;

function loadSplit(date: string, areaId: string): ChronoSplit | null {
  try {
    const raw = localStorage.getItem(storageKey(date, areaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.fixed === "number" && typeof parsed?.extra === "number") {
      return { fixed: Math.max(0, Math.round(parsed.fixed)), extra: Math.max(0, Math.round(parsed.extra)) };
    }
  } catch {
    // localStorage no disponible o dato corrupto: se ignora.
  }
  return null;
}

function persistSplit(date: string, areaId: string, split: ChronoSplit) {
  try {
    localStorage.setItem(storageKey(date, areaId), JSON.stringify(split));
  } catch {
    // sin persistencia disponible.
  }
}

/** Divide los minutos de un área en "Bloque fijo" + "Avance extra".
 *  La suma de ambos es el total del día (se guarda en la fuente principal). */
export function useChronoTime({ enabled, date, areaId, total, onTotalChange }: UseChronoTimeOptions) {
  const key = enabled && date ? `${date}:${areaId}` : "";
  const totalRef = useRef(total);
  totalRef.current = total;
  const onTotalChangeRef = useRef(onTotalChange);
  onTotalChangeRef.current = onTotalChange;

  const [split, setSplit] = useState<ChronoSplit>(() => {
    if (!key) return { fixed: Math.max(0, total), extra: 0 };
    const stored = loadSplit(date!, areaId);
    // El total de la DB manda: el extra guardado se conserva y el fijo absorbe la diferencia.
    const extra = Math.min(stored?.extra ?? 0, Math.max(0, total));
    return { fixed: Math.max(0, total - extra), extra };
  });

  // Ajusta el fijo cuando cambia el total externo (lectura de páginas, otra fuente…).
  const prevTotal = useRef(total);
  const pendingTotal = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    const changed = prevTotal.current !== total;
    prevTotal.current = total;
    if (!changed) return;
    if (pendingTotal.current !== null) {
      const caughtUp = total === pendingTotal.current;
      pendingTotal.current = null;
      if (caughtUp) return;
    }
    setSplit(prev => {
      const nextExtra = Math.min(prev.extra, total);
      const nextFixed = Math.max(0, total - nextExtra);
      if (nextFixed === prev.fixed && nextExtra === prev.extra) return prev;
      const next = { fixed: nextFixed, extra: nextExtra };
      if (key) persistSplit(date!, areaId, next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, enabled]);

  const emit = useCallback(
    (next: ChronoSplit) => {
      const clamped = { fixed: Math.max(0, next.fixed), extra: Math.max(0, next.extra) };
      const sum = clamped.fixed + clamped.extra;
      setSplit(clamped);
      if (key) persistSplit(date!, areaId, clamped);
      pendingTotal.current = sum;
      onTotalChangeRef.current(sum);
    },
    [key, date, areaId]
  );

  const setFixed = useCallback(
    (minutes: number) => emit({ fixed: minutes, extra: split.extra }),
    [emit, split.extra]
  );
  const setExtra = useCallback(
    (minutes: number) => emit({ fixed: split.fixed, extra: minutes }),
    [emit, split.fixed]
  );
  const addExtra = useCallback(
    (minutes: number) => emit({ fixed: split.fixed, extra: split.extra + minutes }),
    [emit, split]
  );
  const addFixed = useCallback(
    (minutes: number) => emit({ fixed: split.fixed + minutes, extra: split.extra }),
    [emit, split]
  );

  return {
    fixed: split.fixed,
    extra: split.extra,
    total: split.fixed + split.extra,
    setFixed,
    setExtra,
    addExtra,
    addFixed,
  };
}
