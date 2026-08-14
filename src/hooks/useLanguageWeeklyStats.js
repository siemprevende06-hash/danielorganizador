import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
function toDateStr(d) {
    return d.toISOString().split('T')[0];
}
export function useLanguageWeeklyStats(language) {
    const [weeklyData, setWeeklyData] = useState([]);
    const [streak, setStreak] = useState(0);
    const [loading, setLoading] = useState(true);
    const dateRange = useMemo(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - 6);
        return { startStr: toDateStr(start), endStr: toDateStr(end) };
    }, []);
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const { startStr, endStr } = dateRange;
                const { data, error } = await supabase
                    .from('language_sessions')
                    .select('session_date,total_duration,vocabulary_completed,grammar_completed,speaking_completed,reading_completed,listening_completed')
                    .eq('language', language)
                    .gte('session_date', startStr)
                    .lte('session_date', endStr);
                if (error)
                    throw error;
                const sessionsByDate = new Map();
                (data ?? []).forEach((row) => {
                    // si hay duplicados por día, nos quedamos con el último (no perfecto, pero consistente)
                    sessionsByDate.set(row.session_date, row);
                });
                const days = [];
                for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    const dateStr = toDateStr(date);
                    const row = sessionsByDate.get(dateStr);
                    const completedSkills = row
                        ? [row.vocabulary_completed, row.grammar_completed, row.speaking_completed, row.reading_completed, row.listening_completed].filter(Boolean).length
                        : 0;
                    days.push({
                        day: dayNames[date.getDay()],
                        minutes: row?.total_duration ?? 0,
                        skills: completedSkills,
                        date: dateStr,
                    });
                }
                // streak: desde hoy hacia atrás
                const streakDays = [...days]
                    .reverse()
                    .reduce((acc, d) => {
                    if (acc.broken)
                        return acc;
                    if (d.skills > 0)
                        return { ...acc, count: acc.count + 1 };
                    return { ...acc, broken: true };
                }, { count: 0, broken: false }).count;
                setWeeklyData(days);
                setStreak(streakDays);
            }
            catch (e) {
                console.error('Error loading weekly language stats:', e);
                setWeeklyData([]);
                setStreak(0);
            }
            finally {
                setLoading(false);
            }
        };
        load();
    }, [language, dateRange]);
    return { weeklyData, streak, loading };
}
