import {
  differenceInCalendarDays,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
} from "date-fns";
import type { Timeframe } from "@/contexts/TimeframeContext";

export interface NaturalPeriodRange {
  /** Primer día del periodo natural (lunes en la semana, día 1 en el mes…). */
  start: Date;
  /**
   * Último día del periodo visible. Si el periodo está en curso, termina hoy;
   * si es un periodo pasado, termina en su último día natural.
   */
  end: Date;
  startKey: string;
  endKey: string;
  /** Días del periodo visible. */
  days: number;
}

function periodStart(timeframe: Timeframe, date: Date): Date {
  switch (timeframe) {
    case "today":
      return startOfDay(date);
    case "month":
      return startOfMonth(date);
    case "quarter":
      return startOfQuarter(date);
    case "year":
      return startOfYear(date);
    case "week":
    case "sprint":
    default:
      return startOfWeek(date, { weekStartsOn: 1 });
  }
}

function periodEnd(timeframe: Timeframe, date: Date): Date {
  switch (timeframe) {
    case "today":
      return startOfDay(date);
    case "month":
      return endOfMonth(date);
    case "quarter":
      return endOfQuarter(date);
    case "year":
      return endOfYear(date);
    case "week":
    case "sprint":
    default:
      return endOfWeek(date, { weekStartsOn: 1 });
  }
}

/**
 * Periodos naturales en lugar de ventanas móviles:
 * - hoy: solo el día ancla
 * - semana / sprint: de lunes a domingo
 * - mes, trimestre y año: el periodo natural completo
 *
 * Si el ancla cae en el periodo actual, el rango termina hoy para no contar
 * días futuros. Si es un periodo pasado, se devuelve completo.
 */
export function naturalPeriodRange(
  timeframe: Timeframe,
  anchorDate: Date = new Date(),
): NaturalPeriodRange {
  const anchor = startOfDay(anchorDate);
  const today = startOfDay(new Date());
  const start = periodStart(timeframe, anchor);
  const currentStart = periodStart(timeframe, today);
  const end = start.getTime() === currentStart.getTime()
    ? today
    : periodEnd(timeframe, anchor);

  return {
    start,
    end,
    startKey: format(start, "yyyy-MM-dd"),
    endKey: format(end, "yyyy-MM-dd"),
    days: Math.max(1, differenceInCalendarDays(end, start) + 1),
  };
}
