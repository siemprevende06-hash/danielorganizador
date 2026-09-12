import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, FileText, CalendarDays, BookOpenCheck, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface AcademicItem {
  id: string;
  type: 'exam' | 'delivery' | 'event';
  title: string;
  date: string;
  subject?: string;
  status?: string;
  category?: string;
}

export function CalendarioAcademico({ month }: { month: Date }) {
  const [items, setItems] = useState<AcademicItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const start = startOfMonth(month);
      const end = endOfMonth(month);
      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      const [examsRes, tasksRes, eventsRes, subjectsRes] = await Promise.all([
        supabase.from('exams').select('id, title, exam_date, status, subject_id').gte('exam_date', startStr).lte('exam_date', endStr),
        supabase.from('tasks').select('id, title, due_date, completed, area_id').eq('source', 'university').gte('due_date', startStr).lte('due_date', endStr),
        supabase.from('calendar_events').select('id, title, event_date, category, description').gte('event_date', startStr).lte('event_date', endStr),
        supabase.from('university_subjects').select('id, name'),
      ]);

      if (cancelled) return;

      const subjects = new Map<string, string>((subjectsRes.data || []).map(s => [s.id, s.name]));

      const exams: AcademicItem[] = (examsRes.data || []).map(e => ({
        id: `ex-${e.id}`,
        type: 'exam',
        title: e.title,
        date: e.exam_date,
        subject: e.subject_id ? subjects.get(e.subject_id) : undefined,
        status: e.status ?? undefined,
      }));

      const deliveries: AcademicItem[] = (tasksRes.data || []).map(t => ({
        id: `t-${t.id}`,
        type: 'delivery',
        title: t.title,
        date: t.due_date || '',
        status: t.completed ? 'completed' : t.status || 'pending',
      }));

      const events: AcademicItem[] = (eventsRes.data || [])
        .filter(ev => {
          const cat = (ev.category || '').toLowerCase();
          return ['examen', 'entrega', 'universidad', 'uni', 'clase', 'estudio', 'test'].includes(cat) || /exam|entreg|parcial|final|clase|uni/i.test(ev.title || '');
        })
        .map(ev => ({
          id: `ev-${ev.id}`,
          type: 'event',
          title: ev.title,
          date: ev.event_date,
          category: ev.category ?? undefined,
        }));

      const merged = [...exams, ...deliveries, ...events].sort((a, b) => a.date.localeCompare(b.date));
      setItems(merged);
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [month]);

  const grouped = items.reduce<Record<string, AcademicItem[]>>((acc, item) => {
    (acc[item.date] = acc[item.date] || []).push(item);
    return acc;
  }, {});

  const today = format(new Date(), 'yyyy-MM-dd');

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-500" />
          <h2 className="text-sm font-semibold">Calendario académico</h2>
          {loading && <span className="text-[10px] text-muted-foreground ml-auto animate-pulse">Cargando...</span>}
        </div>

        {!loading && items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border/60">
            Sin exámenes, entregas ni eventos académicos este mes.
          </p>
        )}

        <div className="space-y-2">
          {Object.entries(grouped).map(([date, dayItems]) => (
            <div key={date} className="rounded-xl bg-muted/30 p-2.5 space-y-1.5">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarDays className="h-3 w-3" />
                {format(new Date(date + 'T12:00:00'), 'EEEE d MMM', { locale: es })}
                {isSameDay(new Date(date + 'T12:00:00'), new Date(today + 'T12:00:00')) && (
                  <Badge className="text-[9px]">Hoy</Badge>
                )}
              </div>
              {dayItems.map(item => (
                <div key={item.id} className="flex items-center gap-2 text-xs">
                  {item.type === 'exam' && <BookOpenCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                  {item.type === 'delivery' && <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                  {item.type === 'event' && <MapPin className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                  <span className="font-medium truncate flex-1">{item.title}</span>
                  {item.subject && <span className="text-[9px] text-muted-foreground truncate max-w-[140px] hidden sm:inline">{item.subject}</span>}
                  <span
                    className={cn(
                      'text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0',
                      item.type === 'exam' ? 'bg-blue-500/10 text-blue-500'
                        : item.type === 'delivery'
                          ? (item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')
                          : 'bg-violet-500/10 text-violet-500'
                    )}
                  >
                    {item.type === 'exam' ? (item.status === 'done' ? 'Hecho' : 'Examen') : item.type === 'delivery' ? (item.status === 'completed' ? 'Entregada' : 'Entrega') : (item.category || 'Evento')}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}