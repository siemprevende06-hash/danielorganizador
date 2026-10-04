import { useEffect, useState } from 'react';
import { format, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CalendarDays, Check, Clock, Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

export interface WeekEvent {
  id: string;
  title: string;
  description?: string | null;
  event_date: string;
  category: string;
  start_time?: string | null;
  end_time?: string | null;
}

const CATEGORIES = [
  { value: 'default', label: 'General' },
  { value: 'universidad', label: 'Universidad' },
  { value: 'emprendimiento', label: 'Emprendimiento' },
  { value: 'proyectos', label: 'Proyectos' },
  { value: 'idiomas', label: 'Idiomas' },
  { value: 'lectura', label: 'Lectura' },
  { value: 'musica', label: 'Música' },
  { value: 'gym', label: 'Gym' },
  { value: 'salud', label: 'Salud' },
  { value: 'social', label: 'Social' },
  { value: 'finanzas', label: 'Finanzas' },
];

const CAT_DOT: Record<string, string> = {
  default: 'bg-slate-400',
  universidad: 'bg-blue-500',
  emprendimiento: 'bg-purple-500',
  proyectos: 'bg-amber-500',
  idiomas: 'bg-emerald-500',
  lectura: 'bg-cyan-500',
  musica: 'bg-pink-500',
  gym: 'bg-red-500',
  salud: 'bg-green-500',
  social: 'bg-orange-500',
  finanzas: 'bg-yellow-500',
};

const catLabel = (v: string) => CATEGORIES.find(c => c.value === v)?.label ?? v;

export function WeekEventsCalendar({
  weekStart,
  weekEnd,
  events,
  onRefresh,
}: {
  weekStart: Date;
  weekEnd: Date;
  events: WeekEvent[];
  onRefresh: () => void;
}) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  const [editing, setEditing] = useState<WeekEvent | null>(null);
  const [addingDay, setAddingDay] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'default',
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    if (editing) {
      setForm({
        title: editing.title,
        description: editing.description ?? '',
        category: editing.category ?? 'default',
        start_time: (editing.start_time ?? '').slice(0, 5),
        end_time: (editing.end_time ?? '').slice(0, 5),
      });
    } else {
      setForm({ title: '', description: '', category: 'default', start_time: '', end_time: '' });
    }
  }, [editing]);

  const byDay = (ds: string) => events.filter(e => e.event_date === ds);

  const save = async (day: string) => {
    if (!form.title.trim()) return;
    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      event_date: day,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
    };
    const { error } = editing
      ? await supabase.from('calendar_events').update(payload).eq('id', editing.id)
      : await supabase.from('calendar_events').insert(payload);
    setSaving(false);
    if (error) {
      console.error('Error al guardar evento:', error.message);
      return;
    }
    setEditing(null);
    setAddingDay(null);
    onRefresh();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', id);
    if (!error) onRefresh();
  };

  const dayKey = (d: Date) => format(d, 'yyyy-MM-dd');

  return (
    <div className="rounded-2xl border-2 border-muted bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm overflow-hidden">
      <div className="px-3 py-2 border-b border-muted/60 flex items-center gap-2">
        <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Calendario semanal</p>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 ml-auto">
          {events.length} evento{events.length === 1 ? '' : 's'}
        </Badge>
      </div>

      <div className="grid grid-cols-7 divide-x divide-muted/40">
        {days.map(day => {
          const ds = dayKey(day);
          const dayEvents = byDay(ds);
          const isAdding = addingDay === ds;
          return (
            <div
              key={ds}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const evId = e.dataTransfer.getData('text/calendar-event');
                const targetDate = e.dataTransfer.getData('text/calendar-date');
                if (!evId || !targetDate || targetDate === ds) return;
                void supabase.from('calendar_events').update({ event_date: ds }).eq('id', evId).then(() => onRefresh());
              }}
              className={cn('min-h-[130px] p-1.5 transition-colors', isToday(day) && 'bg-indigo-500/5')}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={cn('text-[9px] font-semibold uppercase text-muted-foreground', isToday(day) && 'text-indigo-600 dark:text-indigo-400')}>
                  {format(day, 'EEE', { locale: es })}
                </span>
                <button
                  onClick={() => { setEditing(null); setAddingDay(isAdding ? null : ds); }}
                  className="text-muted-foreground/40 hover:text-foreground"
                  title="Añadir evento"
                >
                  {isAdding ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </button>
              </div>
              <span className={cn('block text-[11px] font-bold tabular-nums mb-1', isToday(day) && 'text-indigo-600 dark:text-indigo-400')}>
                {format(day, 'd')}
              </span>

              {isAdding && (
                <div className="mb-1 space-y-1 rounded-md border border-primary/40 bg-background p-1">
                  <Input
                    autoFocus
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    onKeyDown={e => { if (e.key === 'Enter') void save(ds); if (e.key === 'Escape') setAddingDay(null); }}
                    placeholder="Evento..."
                    className="h-6 text-[10px] px-1"
                  />
                  <div className="flex gap-0.5">
                    <Input
                      type="time"
                      value={form.start_time}
                      onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                      className="h-5 px-0.5 text-[8px]"
                    />
                    <Input
                      type="time"
                      value={form.end_time}
                      onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                      className="h-5 px-0.5 text-[8px]"
                    />
                  </div>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="h-5 w-full rounded border border-input bg-background px-0.5 text-[8px] outline-none"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <Button
                    size="icon"
                    className="h-5 w-5"
                    disabled={!form.title.trim() || saving}
                    onClick={() => void save(ds)}
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </Button>
                </div>
              )}

              <div className="space-y-0.5">
                {dayEvents.map(ev => (
                  <div
                    key={ev.id}
                    draggable
                    onDragStart={e => {
                      e.dataTransfer.setData('text/calendar-event', ev.id);
                      e.dataTransfer.setData('text/calendar-date', ds);
                    }}
                    onClick={() => { setAddingDay(null); setEditing(ev); }}
                    className="group cursor-pointer rounded border-l-2 bg-muted/40 px-1 py-0.5 text-[9px] leading-tight hover:bg-muted/70"
                    style={{ borderLeftColor: 'currentColor' }}
                    title={`${ev.title}${ev.start_time ? ` ${ev.start_time.slice(0, 5)}` : ''} — clic para editar`}
                  >
                    <div className="flex items-center gap-1">
                      <span className={cn('w-1 h-1 rounded-full shrink-0', CAT_DOT[ev.category] ?? 'bg-slate-400')} />
                      <span className="truncate font-medium">{ev.title}</span>
                    </div>
                    {ev.start_time && (
                      <span className="flex items-center gap-0.5 text-[8px] text-muted-foreground tabular-nums">
                        <Clock className="w-2 h-2" />
                        {ev.start_time.slice(0, 5)}{ev.end_time ? `-${ev.end_time.slice(0, 5)}` : ''}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="border-t border-muted/60 bg-primary/5 p-2.5 space-y-2">
          <div className="flex items-center gap-1.5">
            <Pencil className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold">Editar evento</span>
            <span className="text-[9px] text-muted-foreground ml-auto">
              {format(new Date(`${editing.event_date}T12:00:00`), 'EEEE d MMM', { locale: es })}
            </span>
          </div>
          <Input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            className="h-7 text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            <Input
              type="time"
              value={form.start_time}
              onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
              className="h-7 w-24 text-[10px]"
            />
            <Input
              type="time"
              value={form.end_time}
              onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
              className="h-7 w-24 text-[10px]"
            />
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="h-7 rounded-md border border-input bg-background px-1.5 text-[10px] outline-none"
            >
              {CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <Button size="sm" className="h-7 text-[10px]" disabled={!form.title.trim() || saving} onClick={() => void save(editing.event_date)}>
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditing(null)}>
              <X className="w-3.5 h-3.5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => void remove(editing.id)} className="text-destructive">
                  Eliminar evento ({catLabel(editing.category)})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Descripción..."
            className="text-[10px] min-h-[48px] resize-y"
          />
        </div>
      )}
    </div>
  );
}