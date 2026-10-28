import { format, startOfMonth, startOfWeek } from 'date-fns';
import type { MonthlyPlanData } from '@/hooks/useMonthlyPlan';

export interface WeekEloPlan {
  /** ELO que tenías al planificar la semana (0 si no hay dato). */
  start: number;
  /** ELO objetivo de la semana (0 si no hay dato). */
  target: number;
}

function readLocal<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Resuelve el tramo de ELO de una semana. Prioriza el espejo guardado en el
 * plan mensual (`week_distribution`) y cae al plan semanal local.
 */
export function getWeekEloPlan(weekStart: Date, planData?: MonthlyPlanData | null): WeekEloPlan {
  const weekKey = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const slot = planData?.week_distribution?.[weekKey];

  let start = Number(slot?.elo_start) || 0;
  let target = Number(slot?.elo_target) || 0;
  if (target > 0) return { start, target };

  const monthKey = format(startOfMonth(weekStart), 'yyyy-MM-dd');
  const localMonthly = readLocal<MonthlyPlanData>(`monthly_plan_${monthKey}`);
  const localSlot = localMonthly?.week_distribution?.[weekKey];
  start = start || Number(localSlot?.elo_start) || 0;
  target = target || Number(localSlot?.elo_target) || 0;
  if (target > 0) return { start, target };

  const weekId = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-ww');
  const weekly = readLocal<{ chessEloStart?: number; chessEloTarget?: number }>(`weekly_plan_${weekId}`);
  return {
    start: start || Number(weekly?.chessEloStart) || 0,
    target: target || Number(weekly?.chessEloTarget) || 0,
  };
}
