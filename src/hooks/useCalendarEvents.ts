import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  category: string;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  default: 'bg-blue-500',
  universidad: 'bg-blue-500',
  emprendimiento: 'bg-purple-500',
  gym: 'bg-red-500',
  idiomas: 'bg-emerald-500',
  proyectos: 'bg-amber-500',
  lectura: 'bg-cyan-500',
  musica: 'bg-pink-500',
  salud: 'bg-green-500',
  social: 'bg-orange-500',
  finanzas: 'bg-yellow-500',
};

export const CATEGORIES = Object.keys(CATEGORY_COLORS);

function normalizeCalendarEvent(event: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: event.id || '',
    user_id: event.user_id || '',
    title: event.title || '',
    description: event.description ?? null,
    event_date: event.event_date || '',
    category: event.category || 'default',
    start_time: event.start_time ?? null,
    end_time: event.end_time ?? null,
    created_at: event.created_at || '',
  };
}

export function getCategoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] || 'bg-gray-400';
}

export function useCalendarEvents(month: Date) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadEvents = useCallback(async () => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    const end = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const s = start.toISOString().split('T')[0];
    const e = end.toISOString().split('T')[0];

    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', s)
      .lte('event_date', e)
      .order('event_date', { ascending: true });

    setEvents(((data || []) as unknown as Partial<CalendarEvent>[]).map(normalizeCalendarEvent));
    setLoading(false);
  }, [month]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const addEvent = async (title: string, eventDate: string, category?: string, description?: string, startTime?: string, endTime?: string) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({ title, event_date: eventDate, category: category || 'default', description })
      .select()
      .single();

    if (error) {
      toast({ title: 'Error', description: 'No se pudo crear el evento', variant: 'destructive' });
      return null;
    }
    await loadEvents();
    toast({ title: 'Evento creado' });
    return normalizeCalendarEvent(data as unknown as Partial<CalendarEvent>);
  };

  const updateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    const { start_time, end_time, ...persistedUpdates } = updates;
    const { error } = await supabase.from('calendar_events').update(persistedUpdates).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo actualizar el evento', variant: 'destructive' });
      return;
    }
    await loadEvents();
    toast({ title: 'Evento actualizado' });
  };

  const deleteEvent = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'No se pudo eliminar el evento', variant: 'destructive' });
      return;
    }
    await loadEvents();
    toast({ title: 'Evento eliminado' });
  };

  const getEventsForDay = (dateStr: string) => events.filter(e => e.event_date === dateStr);

  return { events, loading, addEvent, updateEvent, deleteEvent, getEventsForDay, reload: loadEvents };
}
