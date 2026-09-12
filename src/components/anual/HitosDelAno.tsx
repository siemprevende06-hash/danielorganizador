import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Milestone, CalendarDays, GraduationCap, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface MilestoneItem {
  id: string;
  type: 'event' | 'exam' | 'delivery';
  title: string;
  date: string;
  category?: string;
  subject?: string;
  status?: string;
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

export function HitosDelAno({ year }: { year: number }) {
  const [items, setItems] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const startStr = `${year}-01-01`;
      const endStr = `${year}-12-31`;

      const [eventsRes, examsRes, tasksRes, subjectsRes] = await Promise.all([
        supabase.from('calendar_events').select('id, title, event_date, category, description').gte('event_date', startStr).lte('event_date', endStr).order('event_date'),
        supabase.from('exams').select('id, title, exam_date, status, subject_id').gte('exam_date', startStr).lte('exam_date', endStr).order('exam_date'),
        supabase.from('tasks').select('id, title, due_date, completed, source').eq('source', 'university').gte('due_date', startStr).lte('due_date', endStr).order('due_date'),
        supabase.from('university_subjects').select('id, name'),
      ]);

      if (cancelled) return;

      const subjects = new Map<string, string>((subjectsRes.data || []).map((s) => [s.id, s.name]));

      const events: MilestoneItem[] = (eventsRes.data || []).map((e) => ({
        id: `ev-${e.id}`,
        type: 'event',
        title: e.title,
        date: e.event_date,
        category: e.category || 'Evento',
      }));

      const exams: MilestoneItem[] = (examsRes.data || []).map((e) => ({
        id: `ex-${e.id}`,
        type: 'exam',
        title: e.title,
        date: e.exam_date,
        subject: e.subject_id ? subjects.get(e.subject_id) : undefined,
        status: e.status ?? undefined,
      }));

      const deliveries: MilestoneItem[] = (tasksRes.data || []).map((t) => ({
        id: `t-${t.id}`,
        type: 'delivery',
        title: t.title,
        date: t.due_date || '',
        status: t.completed ? 'completed' : 'pending',
      }));

      setItems([...events, ...exams, ...deliveries].sort((a, b) => a.date.localeCompare(b.date)));
      setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [year]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: m,
    items: items.filter(i => i.date.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`)),
  })).filter(g => g.items.length > 0);

  return (
    <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-violet-500 to-fuchsia-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Milestone className="h-4 w-4 text-violet-500" />
          <h2 className="text-sm font-semibold">Hitos del año</h2>
          {loading && <span className="text-[10px] text-muted-foreground ml-auto animate-pulse">Cargando...</span>}
          <Badge variant="outline" className="text-[10px] ml-auto">{items.length} hitos</Badge>
        </div>

        {!loading && items.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 rounded-xl border border-dashed border-border/60">
            Sin hitos registrados para {year}. Usa el calendario o marca exámenes y entregas.
          </p>
        )}

        <div className="space-y-3">
          {monthly.map(g => (
            <div key={g.month}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {MONTH_NAMES[g.month]} <span className="text-muted-foreground/50">· {g.items.length}</span>
                </span>
              </div>
              <div className="space-y-1.5 pl-3.5 border-l-2 border-violet-100 dark:border-violet-500/20">
                {g.items.map(item => (
                  <div key={item.id} className="rounded-xl bg-muted/25 p-2 flex items-center gap-2 text-xs">
                    {item.type === 'event' && <CalendarDays className="h-3.5 w-3.5 text-violet-500 shrink-0" />}
                    {item.type === 'exam' && <GraduationCap className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
                    {item.type === 'delivery' && <FileText className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                    <span className="font-medium truncate flex-1">{item.title}</span>
                    {item.subject && <span className="text-[10px] text-muted-foreground truncate hidden sm:inline max-w-[150px]">{item.subject}</span>}
                    <span className="text-[10px] tabular-nums text-muted-foreground shrink-0">
                      {format(new Date(item.date + 'T12:00:00'), 'd MMM', { locale: es })}
                    </span>
                    {item.date === today && <Badge className="text-[9px] shrink-0">Hoy</Badge>}
                    <span
                      className={cn(
                        'text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0',
                        item.type === 'exam' ? 'bg-blue-500/10 text-blue-600'
                          : item.type === 'delivery'
                            ? (item.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600')
                            : 'bg-violet-500/10 text-violet-600'
                      )}
                    >
                      {item.type === 'exam' ? (item.status === 'done' ? 'Hecho' : 'Examen') : item.type === 'delivery' ? (item.status === 'completed' ? 'Entregada' : 'Entrega') : item.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}