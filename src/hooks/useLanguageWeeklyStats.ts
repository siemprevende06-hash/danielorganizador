import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { getCubaDate } from '@/lib/cubaTime';
import type { Language } from '@/hooks/useLanguageLearning';
import { LANGUAGE_SKILLS, skillCompletionKey, type LanguageId } from '@/lib/languagePlan';

export type LanguageWeeklyDay = {
  day: string;
  minutes: number;
  skills: number;
  date: string;
};

export type LanguageHistoryDay = {
  date: string;
  day: string;
  minutes: number;
  /** Habilidades canónicas practicadas ese día. */
  skills: string[];
};

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

/** 90 días: suficiente para racha, heatmap de 28 y tendencias sin peso extra. */
const RANGE_DAYS = 90;
const HEATMAP_DAYS = 28;

function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

/**
 * Estadísticas del dashboard de idiomas.
 * Fuente canónica: `daily_systems_tracking` (minutos + habilidades), no
 * `language_sessions` (que puede tener filas duplicadas).
 *
 * `weeklyData` se mantiene con la forma de siempre (7 días) y se añade
 * `history` (28 días), `skillDays` (días practicados por habilidad esta
 * semana) y una racha real, sin el tope de 7 que tenía la versión anterior.
 */
export function useLanguageWeeklyStats(language: Language) {
  const [weeklyData, setWeeklyData] = useState<LanguageWeeklyDay[]>([]);
  const [history, setHistory] = useState<LanguageHistoryDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [skillDays, setSkillDays] = useState<Record<string, number>>({});
  const [skillLastDate, setSkillLastDate] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const languageKey: LanguageId = language === 'italian' ? 'italiano' : 'ingles';

  const dateRange = useMemo(() => {
    // La app usa la fecha de Cuba para el corte diario; no mezclar con UTC.
    const end = parseLocalDate(getCubaDate());
    const start = subDays(end, RANGE_DAYS - 1);
    return { startStr: toDateStr(start), endStr: toDateStr(end), end };
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { startStr, endStr } = dateRange;

        const { data, error } = await supabase
          .from('daily_systems_tracking')
          .select('tracking_date,time_data,completions')
          .gte('tracking_date', startStr)
          .lte('tracking_date', endStr);

        if (error) throw error;

        const byDate = new Map<string, { minutes: number; skills: string[] }>();
        (data ?? []).forEach((row: { tracking_date: string | null; time_data: unknown; completions: unknown }) => {
          const date = String(row.tracking_date ?? '').slice(0, 10);
          if (!date) return;
          const timeData = (row.time_data && typeof row.time_data === 'object' ? row.time_data : {}) as Record<
            string,
            unknown
          >;
          const completions = (row.completions && typeof row.completions === 'object' ? row.completions : {}) as Record<
            string,
            boolean
          >;
          const minutes = Number(timeData[languageKey]) || 0;
          const skills = LANGUAGE_SKILLS
            .filter(skill => completions[skillCompletionKey(languageKey, skill.id)] === true)
            .map(skill => skill.id);
          byDate.set(date, { minutes, skills });
        });

        const days: LanguageHistoryDay[] = [];
        for (let i = RANGE_DAYS - 1; i >= 0; i--) {
          const date = subDays(dateRange.end, i);
          const dateStr = toDateStr(date);
          const row = byDate.get(dateStr);
          days.push({
            date: dateStr,
            day: dayNames[date.getDay()],
            minutes: row?.minutes ?? 0,
            skills: row?.skills ?? [],
          });
        }

        const week = days.slice(-7).map(day => ({
          day: day.day,
          minutes: day.minutes,
          skills: day.skills.length,
          date: day.date,
        }));

        // Racha: días consecutivos hacia atrás. Si hoy aún no hay práctica,
        // se conserva la racha de ayer para no castigar el día en curso.
        const todayActive = isActive(days[days.length - 1]);
        let index = todayActive ? days.length - 1 : days.length - 2;
        let streakDays = 0;
        while (index >= 0 && isActive(days[index])) {
          streakDays += 1;
          index -= 1;
        }

        const weekDays = days.slice(-7);
        const daysBySkill: Record<string, number> = {};
        LANGUAGE_SKILLS.forEach(skill => {
          daysBySkill[skill.id] = weekDays.filter(day => day.skills.includes(skill.id)).length;
        });

        const lastBySkill: Record<string, string> = {};
        for (const day of days) {
          for (const skill of day.skills) lastBySkill[skill] = day.date;
        }

        setWeeklyData(week);
        setHistory(days.slice(-HEATMAP_DAYS));
        setStreak(streakDays);
        setSkillDays(daysBySkill);
        setSkillLastDate(lastBySkill);
      } catch (e) {
        console.error('Error loading weekly language stats:', e);
        setWeeklyData([]);
        setHistory([]);
        setStreak(0);
        setSkillDays({});
        setSkillLastDate({});
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [languageKey, dateRange]);

  return { weeklyData, history, streak, skillDays, skillLastDate, loading };
}

function isActive(day: LanguageHistoryDay | undefined): boolean {
  if (!day) return false;
  return day.minutes > 0 || day.skills.length > 0;
}
