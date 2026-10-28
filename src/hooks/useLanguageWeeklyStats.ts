import { useEffect, useMemo, useState } from 'react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import type { Language } from '@/hooks/useLanguageLearning';
import { LANGUAGE_SKILLS, skillCompletionKey, type LanguageId } from '@/lib/languagePlan';

export type LanguageWeeklyDay = {
  day: string;
  minutes: number;
  skills: number;
  date: string;
};

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function toDateStr(d: Date) {
  return format(d, 'yyyy-MM-dd');
}

/**
 * Estadísticas semanales del dashboard de idiomas.
 * Fuente canónica: `daily_systems_tracking` (minutos + habilidades), no
 * `language_sessions` (que puede tener filas duplicadas).
 */
export function useLanguageWeeklyStats(language: Language) {
  const [weeklyData, setWeeklyData] = useState<LanguageWeeklyDay[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const languageKey: LanguageId = language === 'italian' ? 'italiano' : 'ingles';

  const dateRange = useMemo(() => {
    const end = new Date();
    const start = subDays(end, 6);
    return { startStr: toDateStr(start), endStr: toDateStr(end) };
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

        const byDate = new Map<string, { minutes: number; skills: number }>();
        (data ?? []).forEach((row: any) => {
          const date = String(row.tracking_date ?? '').slice(0, 10);
          if (!date) return;
          const minutes = Number(row.time_data?.[languageKey]) || 0;
          const completions = row.completions || {};
          const skills = LANGUAGE_SKILLS.filter(skill => completions[skillCompletionKey(languageKey, skill.id)] === true).length;
          byDate.set(date, { minutes, skills });
        });

        const days: LanguageWeeklyDay[] = [];
        for (let i = 6; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const dateStr = toDateStr(date);
          const row = byDate.get(dateStr);
          days.push({
            day: dayNames[date.getDay()],
            minutes: row?.minutes ?? 0,
            skills: row?.skills ?? 0,
            date: dateStr,
          });
        }

        // Racha: días consecutivos hacia atrás con minutos o habilidades.
        const streakDays = [...days]
          .reverse()
          .reduce((acc, day) => {
            if (acc.broken) return acc;
            if (day.minutes > 0 || day.skills > 0) return { ...acc, count: acc.count + 1 };
            return { ...acc, broken: true };
          }, { count: 0, broken: false as boolean }).count;

        setWeeklyData(days);
        setStreak(streakDays);
      } catch (e) {
        console.error('Error loading weekly language stats:', e);
        setWeeklyData([]);
        setStreak(0);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [languageKey, dateRange]);

  return { weeklyData, streak, loading };
}
