import {
  differenceInCalendarDays,
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
  /** Último día transcurrido del periodo (hoy). */
  end: Date;
  startKey: string;
  endKey: string;
  /** Días transcurridos del periodo, contando hoy. */
  days: number;
}

/**
 * Periodos naturales en lugar de ventanas móviles:
 * - hoy: solo hoy
 * - semana / sprint: desde el lunes hasta hoy
 * - mes: desde el día 1 hasta hoy
 * - trimestre: desde el primer día del trimestre hasta hoy
 * - año: desde el 1 de enero hasta hoy
 */
export function naturalPeriodRange(
  timeframe: Timeframe,
  anchorDate: Date = new Date(),
): NaturalPeriodRange {
  const end = startOfDay(anchorDate);
  let start: Date;

  switch (timeframe) {
    case "today":
      start = end;
      break;
    case "month":
      start = startOfMonth(end);
      break;
    case "quarter":
      start = startOfQuarter(end);
      break;
    case "year":
      start = startOfYear(end);
      break;
    case "week":
    case "sprint":
    default:
      start = startOfWeek(end, { weekStartsOn: 1 });
      break;
  }

  return {
    start,
    end,
    startKey: format(start, "yyyy-MM-dd"),
    endKey: format(end, "yyyy-MM-dd"),
    days: Math.max(1, differenceInCalendarDays(end, start) + 1),
  };
}
