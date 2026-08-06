import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, subDays, startOfWeek, startOfMonth, startOfQuarter } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ReadingSession {
  id: string;
  user_id: string | null;
  session_date: string;
  book_id: string | null;
  minutes: number;
  page_start: number | null;
  page_end: number | null;
  pages_read: number;
  notes: string | null;
  created_at: string;
}

export interface SaveReadingPayload {
  sessionDate?: string;
  minutes?: number;
  bookId?: string | null;
  pageStart?: number | null;
  pageEnd?: number | null;
  notes?: string | null;
}

export interface ReadingStats {
  today: number;
  week: number;
  month: number;
  quarter: number;
  todayMinutes: number;
  days: { date: string; pages: number }[];
}

const dateKey = (d: Date) => format(d, 'yyyy-MM-dd');

export function useReadingSessions() {
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [statDays, setStatDays] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const start = dateKey(subDays(new Date(), 120));
    try {
      const [s, das] = await Promise.all([
        supabase
          .from('reading_sessions')
          .select('*')
          .gte('session_date', start)
          .order('session_date', { ascending: true }),
        supabase
          .from('daily_area_stats')
          .select('area_id, stat_date, pages_done')
          .eq('area_id', 'lectura')
          .gte('stat_date', start),
      ]);
      setSessions((s.data as ReadingSession[]) || []);
      const map: Record<string, number> = {};
      ((das.data as any[]) || []).forEach((r: any) => {
        if (r.pages_done) map[r.stat_date] = r.pages_done;
      });
      setStatDays(map);
    } catch (e) {
      console.error('[useReadingSessions] error:', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Páginas por día: las sessions mandan; si una fecha no tiene sesiones usa daily_area_stats
  const perDayPages = useMemo(() => {
    const byDay: Record<string, number> = {};
    sessions.forEach((s) => {
      byDay[s.session_date] = (byDay[s.session_date] || 0) + (s.pages_read || 0);
    });
    const days: Record<string, number> = {};
    const today = new Date();
    for (let i = 120; i >= 0; i--) {
      const d = subDays(today, i);
      const key = dateKey(d);
      days[key] = byDay[key] ?? statDays[key] ?? 0;
    }
    return days;
  }, [sessions, statDays]);

  const stats = useMemo(() => {
    const today = new Date();
    const todayStr = dateKey(today);
    const wStart = dateKey(startOfWeek(today, { weekStartsOn: 1 }));
    const mStart = dateKey(startOfMonth(today));
    const qStart = dateKey(startOfQuarter(today));

    const sumRange = (from: string) =>
      Object.entries(perDayPages)
        .filter(([d]) => d >= from && d <= todayStr)
        .reduce((acc, [, v]) => acc + v, 0);

    const todayMinutes = sessions
      .filter((s) => s.session_date === todayStr)
      .reduce((acc, s) => acc + (s.minutes || 0), 0);

    return {
      today: sumRange(todayStr),
      week: sumRange(wStart),
      month: sumRange(mStart),
      quarter: sumRange(qStart),
      todayMinutes,
      days: Object.entries(perDayPages)
        .map(([date, pages]) => ({ date, pages }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    };
  }, [perDayPages, sessions]);

  const saveSession = useCallback(
    async ({ sessionDate, minutes, bookId, pageStart, pageEnd, notes }: SaveReadingPayload) => {
      const date = sessionDate || dateKey(new Date());
      const pages = Math.max(0, (Number(pageEnd) || 0) - (Number(pageStart) || 0));

      try {
        const { data: row, error } = await supabase
          .from('reading_sessions')
          .insert({
            session_date: date,
            minutes: minutes || 0,
            book_id: bookId || null,
            page_start: pageStart ?? null,
            page_end: pageEnd ?? null,
            notes: notes || null,
          })
          .select()
          .single();
        if (error) throw error;

        // Recalcular totales del día para mantener daily_area_stats sincronizada
        const allToday = [row, ...sessions.filter((s) => s.session_date === date)];
        const dayPages = allToday.reduce((acc, s) => acc + (s.pages_read || 0), 0);
        const dayMinutes = allToday.reduce((acc, s) => acc + (s.minutes || 0), 0);

        await supabase.from('daily_area_stats').upsert(
          {
            area_id: 'lectura',
            stat_date: date,
            time_spent_minutes: dayMinutes || null,
            pages_done: dayPages || null,
          },
          { onConflict: 'area_id,stat_date' }
        );

        setSessions((prev) => [...prev, row as ReadingSession]);
        toast.success(`${dayPages} páginas registradas${pages > 0 ? ` (${pages} en esta sesión)` : ''}`);
        return row;
      } catch (e) {
        console.error('[useReadingSessions] save error:', e);
        toast.error('No se pudo guardar la sesión de lectura');
        return null;
      }
    },
    [sessions]
  );

  const removeSession = useCallback(async (id: string) => {
    try {
      await supabase.from('reading_sessions').delete().eq('id', id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error('[useReadingSessions] delete error:', e);
    }
  }, []);

  return { sessions, statDays, loading, stats, perDayPages, saveSession, removeSession, refetch: load };
}