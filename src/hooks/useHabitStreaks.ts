import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays } from "date-fns";
import { SOSTEN_STRUCTURAL } from "@/lib/daySystems";

export interface HabitStreakRow {
  habitId: string;
  label: string;
  current: number;
  best: number;
  last: string | null;
  doneThisWeek: number;
  doneLastWeek: number;
  delta: number;
}

export interface AreaMinutes {
  area: string;
  label: string;
  minutes: number;
}

export interface HabitStreaksData {
  streaks: HabitStreakRow[];
  minutesByArea: AreaMinutes[];
  totalMinutes: number;
  prevTotalMinutes: number;
  loading: boolean;
}

const HABIT_NAMES: Record<string, string> = {
  'entrenamiento-fisico': 'Gym',
  'habit-sueno': 'Horario de sueño',
  'habit-rutina-activacion': 'Rutina de Activación',
  'habit-entrenamiento': 'Gym',
  'habit-desayuno': 'Alistamiento y desayuno',
  'habit-skincare-am': 'Skin Care AM',
  'habit-skincare-pm': 'Skin Care PM',
  'habit-rutina-desactivacion': 'Rutina de Desactivación',
  'habit-alimentacion': 'Alimentación y agua',
  'habit-finanzas': 'Control financiero',
  'mini-nofap': 'No FAP',
  'mini-nosocial': 'No Redes Sociales',
  'no-videojuegos': 'Videojuegos',
  'no-porn': 'No Porn',
  'no-fap': 'No FAP',
  'redes-sociales': 'Redes Sociales',
  universidad: 'Universidad',
  emprendimiento: 'Emprendimiento',
  proyectos: 'Proyectos',
  lectura: 'Lectura',
  musica: 'Música',
  idiomas: 'Idiomas',
  italiano: 'Italiano',
  ingles: 'Inglés',
  game: 'Game',
  ajedrez: 'Ajedrez',
  gym: 'Gym',
  finanzas: 'Finanzas',
  rutina_activacion: 'Rutina de Activación',
};

const AREA_LABELS: Record<string, string> = {
  universidad: 'Universidad',
  emprendimiento: 'Emprendimiento',
  proyectos: 'Proyectos',
  lectura: 'Lectura',
  musica: 'Música',
  idiomas: 'Idiomas',
  italiano: 'Italiano',
  ingles: 'Inglés',
  game: 'Game',
  ajedrez: 'Ajedrez',
  gym: 'Gym',
  finanzas: 'Finanzas',
  calistenia: 'Calistenia',
  boxeo: 'Boxeo',
  piano: 'Piano',
  guitarra: 'Guitarra',
  dibujo: 'Dibujo',
  skincare_am: 'Skin Care AM',
  skincare_pm: 'Skin Care PM',
  general: 'General',
};

function habitLabel(habitId: string): string {
  if (HABIT_NAMES[habitId]) return HABIT_NAMES[habitId];
  for (const list of Object.values(SOSTEN_STRUCTURAL)) {
    const found = list.find(h => h.id === habitId);
    if (found) return found.name;
  }
  const cleaned = habitId.replace(/[-_]/g, ' ');
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

export function useHabitStreaks(weekStart: Date): HabitStreaksData {
  const [data, setData] = useState<HabitStreaksData>({
    streaks: [],
    minutesByArea: [],
    totalMinutes: 0,
    prevTotalMinutes: 0,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const weekDays: string[] = [];
      const prevDays: string[] = [];
      for (let i = 0; i < 7; i++) {
        weekDays.push(format(addDays(weekStart, i), 'yyyy-MM-dd'));
        prevDays.push(format(addDays(weekStart, i - 7), 'yyyy-MM-dd'));
      }

      const [streakRes, weekRes, prevRes] = await Promise.all([
        supabase
          .from('system_habit_streaks')
          .select('habit_id, current_streak, longest_streak, last_completed_date')
          .order('current_streak', { ascending: false })
          .limit(30),
        supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions, time_data')
          .in('tracking_date', weekDays),
        supabase
          .from('daily_systems_tracking')
          .select('tracking_date, completions, time_data')
          .in('tracking_date', prevDays),
      ]);

      if (cancelled) return;

      const weekRows = weekRes.data || [];
      const prevRows = prevRes.data || [];

      const weekCompletions: Record<string, number> = {};
      weekRows.forEach(r => {
        const comps = (r.completions || {}) as Record<string, boolean>;
        Object.entries(comps).forEach(([k, v]) => {
          if (v && !k.startsWith('streak:')) weekCompletions[k] = (weekCompletions[k] || 0) + 1;
        });
      });
      const prevCompletions: Record<string, number> = {};
      prevRows.forEach(r => {
        const comps = (r.completions || {}) as Record<string, boolean>;
        Object.entries(comps).forEach(([k, v]) => {
          if (v && !k.startsWith('streak:')) prevCompletions[k] = (prevCompletions[k] || 0) + 1;
        });
      });

      const streakRows = streakRes.data || [];
      const streakedIds = streakRows.filter(r => r.current_streak > 0).map(r => r.habit_id);
      const activeIds = new Set([...Object.keys(weekCompletions), ...Object.keys(prevCompletions), ...streakedIds]);

      const streaks: HabitStreakRow[] = Array.from(activeIds)
        .map(id => {
          const row = streakRows.find(r => r.habit_id === id);
          const doneThisWeek = weekCompletions[id] || 0;
          const doneLastWeek = prevCompletions[id] || 0;
          return {
            habitId: id,
            label: habitLabel(id),
            current: row?.current_streak || 0,
            best: row?.longest_streak || 0,
            last: row?.last_completed_date || null,
            doneThisWeek,
            doneLastWeek,
            delta: doneThisWeek - doneLastWeek,
          };
        })
        .filter(r => r.doneThisWeek > 0 || r.doneLastWeek > 0 || r.current > 0)
        .sort((a, b) => b.doneThisWeek - a.doneThisWeek || b.current - a.current)
        .slice(0, 14);

      const areaAcc: Record<string, number> = {};
      weekRows.forEach(r => {
        const td = (r.time_data || {}) as Record<string, number>;
        Object.entries(td).forEach(([k, v]) => {
          const mins = Number(v) || 0;
          if (mins > 0) areaAcc[k] = (areaAcc[k] || 0) + mins;
        });
      });
      const exclude = new Set(['streak', 'tracking', 'water']);
      const minutesByArea = Object.entries(areaAcc)
        .filter(([k]) => !exclude.has(k) && !k.includes(':'))
        .map(([area, minutes]) => ({
          area,
          label: AREA_LABELS[area] || habitLabel(area),
          minutes,
        }))
        .sort((a, b) => b.minutes - a.minutes);

      const totalMinutes = Object.values(areaAcc).reduce((s, v) => s + v, 0);
      const prevAreaAcc: Record<string, number> = {};
      prevRows.forEach(r => {
        const td = (r.time_data || {}) as Record<string, number>;
        Object.entries(td).forEach(([k, v]) => {
          const mins = Number(v) || 0;
          if (mins > 0) prevAreaAcc[k] = (prevAreaAcc[k] || 0) + mins;
        });
      });
      const prevTotalMinutes = Object.values(prevAreaAcc).reduce((s, v) => s + v, 0);

      setData({ streaks, minutesByArea, totalMinutes, prevTotalMinutes, loading: false });
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [weekStart]);

  return data;
}