import { useEffect, useState } from 'react';
import { format, parseISO, startOfWeek } from 'date-fns';
import { pullPlansIntoLocal } from '@/lib/planSync';
import { getWeekEloPlan, type WeekEloPlan } from '@/lib/chessPlan';

/**
 * Lee el tramo de ELO de la semana desde los planes locales, sincronizando
 * primero con Supabase para que funcione también en otro dispositivo.
 */
export function useWeekEloPlan(weekStart: Date) {
  const weekKey = format(startOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd');
  const [plan, setPlan] = useState<WeekEloPlan>(() => getWeekEloPlan(weekStart));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await pullPlansIntoLocal();
      } catch {
        // Sin conexión se usa lo que ya hay en localStorage.
      }
      if (!cancelled) setPlan(getWeekEloPlan(parseISO(weekKey)));
    })();
    return () => {
      cancelled = true;
    };
  }, [weekKey]);

  return plan;
}
