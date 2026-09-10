import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { eachDayOfInterval, format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, Plus, Loader2, X } from 'lucide-react';
import { getCategoryColor } from '@/hooks/useCalendarEvents';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WeekEvent {
  id: string;
  title: string;
  event_date: string;
  category: string;
  start_time: string | null;
}

export function WeeklyAgenda({ weekStart, weekEnd }: { weekStart: Date; weekEnd: Date }) {
  const queryClient = useQueryClient();
  const startStr = format(weekStart, 'yyyy-MM-dd');
  const endStr = format(weekEnd, 'yyyy-MM-dd');
  const queryKey = ['weeklyAgenda', startStr];

  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [title, setTitle] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id, title, event_date, category, start_time')
        .gte('event_date', startStr)
        .lte('event_date', endStr)
        .order('event_date');
      if (error) throw error;
      return (data || []) as WeekEvent[];
    },
  });

  const addEvent = async () => {
    if (!title.trim() || !addingDay) return;
    const { error } = await supabase.from('calendar_events').insert({
      title: title.trim(),
      event_date: addingDay,
      category: 'default',
    });
    if (error) {
      toast.error('No se pudo crear el evento');
      return;
    }
    setTitle('');
    setAddingDay(null);
    toast.success('Evento agregado a la agenda');
    queryClient.invalidateQueries({ queryKey });
  };

  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <CalendarDays className="w-4 h-4 text-indigo-500" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Eventos y citas
          </h3>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="h-9 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {days.map(day => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayEvents = events.filter(e => e.event_date === dayKey);
              const active = isToday(day);
              return (
                <div key={dayKey} className="rounded-xl border border-border/50 bg-muted/20 px-3 py-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-[10px] font-bold uppercase tracking-wider", active ? "text-primary" : "text-muted-foreground")}>
                      {format(day, 'EEE d MMM', { locale: es })}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => { setAddingDay(dayKey); setTitle(''); }}
                    >
                      <Plus className="w-3 h-3 mr-0.5" /> evento
                    </Button>
                  </div>

                  {dayEvents.length === 0 && !addingDay && (
                    <p className="text-[10px] text-muted-foreground/50 italic mt-0.5">Sin eventos</p>
                  )}

                  {dayEvents.map(ev => (
                    <p key={ev.id} className="text-xs flex items-center gap-2 mt-1">
                      <span className={cn("w-2 h-2 rounded-full shrink-0", getCategoryColor(ev.category))} />
                      <span className="font-medium truncate">{ev.title}</span>
                      {ev.start_time && <span className="text-[10px] text-muted-foreground shrink-0">{ev.start_time}</span>}
                    </p>
                  ))}

                  {addingDay === dayKey && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Input
                        autoFocus
                        placeholder="Título del evento…"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addEvent(); if (e.key === 'Escape') setAddingDay(null); }}
                        className="h-7 text-xs flex-1"
                      />
                      <Button size="sm" className="h-7 w-7 px-0" onClick={addEvent} disabled={!title.trim()}>
                        <Loader2 className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 px-0" onClick={() => setAddingDay(null)}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}