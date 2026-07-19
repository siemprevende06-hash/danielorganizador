import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit3, Check, Palette } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCalendarEvents, getCategoryColor, CalendarEvent } from '@/hooks/useCalendarEvents';

const CATEGORIES = [
  { value: 'default', label: 'General', color: 'bg-blue-500' },
  { value: 'universidad', label: 'Universidad', color: 'bg-blue-500' },
  { value: 'emprendimiento', label: 'Emprendimiento', color: 'bg-purple-500' },
  { value: 'gym', label: 'Gym', color: 'bg-red-500' },
  { value: 'idiomas', label: 'Idiomas', color: 'bg-emerald-500' },
  { value: 'proyectos', label: 'Proyectos', color: 'bg-amber-500' },
  { value: 'lectura', label: 'Lectura', color: 'bg-cyan-500' },
  { value: 'musica', label: 'Música', color: 'bg-pink-500' },
  { value: 'salud', label: 'Salud', color: 'bg-green-500' },
  { value: 'social', label: 'Social', color: 'bg-orange-500' },
  { value: 'finanzas', label: 'Finanzas', color: 'bg-yellow-500' },
];

export default function NotionCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('default');
  const [newDescription, setNewDescription] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');
  const [editMode, setEditMode] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  const { events, addEvent, updateEvent, deleteEvent, getEventsForDay } = useCalendarEvents(currentMonth);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const navigate = (dir: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
      return d;
    });
  };

  const handleAddEvent = async () => {
    if (!newTitle.trim() || !selectedDate) return;
    await addEvent(newTitle.trim(), selectedDate, newCategory, newDescription || undefined, newStartTime || undefined, newEndTime || undefined);
    setNewTitle('');
    setNewDescription('');
    setNewCategory('default');
    setNewStartTime('');
    setNewEndTime('');
  };

  const handleUpdateEvent = async (id: string) => {
    await updateEvent(id, {
      title: editTitle,
      category: editCategory,
      description: editDescription || null,
      start_time: editStartTime || null,
      end_time: editEndTime || null,
    });
    setEditMode(null);
  };

  const today = new Date();
  const selectedEvents = selectedDate ? getEventsForDay(selectedDate) : [];

  return (
    <Card className="overflow-hidden">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: es })}
            </h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('next')}>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setCurrentMonth(new Date())}>
            Hoy
          </Button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-1">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (
            <div key={d} className="text-center text-[9px] font-medium text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-px bg-muted/30 rounded-lg overflow-hidden">
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayEvents = getEventsForDay(dateStr);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isSelected = selectedDate === dateStr;
            const isTodayDay = isToday(day);

            return (
              <div
                key={dateStr}
                className={cn(
                  'min-h-[60px] p-1 bg-card cursor-pointer transition-colors hover:bg-accent/40 relative',
                  !isCurrentMonth && 'opacity-30',
                  isSelected && 'ring-1 ring-primary ring-inset',
                  isTodayDay && 'bg-primary/5',
                )}
                onClick={() => setSelectedDate(dateStr)}
              >
                <span className={cn(
                  'text-[9px] font-medium leading-none block mb-0.5',
                  isTodayDay && 'text-primary font-bold',
                )}>
                  {format(day, 'd')}
                </span>
                <div className="space-y-0.5">
                  {dayEvents.slice(0, 3).map(ev => (
                    <div
                      key={ev.id}
                      className={cn('h-1.5 rounded-full', getCategoryColor(ev.category))}
                      title={ev.title}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[7px] text-muted-foreground block">+{dayEvents.length - 3}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Events for selected day */}
        {selectedDate && (
          <div className="mt-4 border-t pt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold">
                {format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es })}
              </p>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedDate(null)}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Add new event */}
            <div className="space-y-1.5 mb-3">
              <div className="flex gap-1.5">
                <Input
                  placeholder="Nuevo evento..."
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="h-7 text-[10px] flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') handleAddEvent(); }}
                />
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger className="h-7 w-20 text-[10px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c.value} value={c.value} className="text-[10px]">
                        <span className="flex items-center gap-1">
                          <span className={cn('w-2 h-2 rounded-full', c.color)} /> {c.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleAddEvent}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="flex gap-1.5">
                <Input
                  type="time"
                  value={newStartTime}
                  onChange={e => setNewStartTime(e.target.value)}
                  className="h-6 text-[9px] w-24"
                />
                <span className="text-[9px] text-muted-foreground self-center">a</span>
                <Input
                  type="time"
                  value={newEndTime}
                  onChange={e => setNewEndTime(e.target.value)}
                  className="h-6 text-[9px] w-24"
                />
                <span className="text-[9px] text-muted-foreground self-center">(opcional)</span>
              </div>
            </div>

            {/* Event list */}
            <div className="space-y-1">
              {selectedEvents.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">Sin eventos</p>
              )}
              {selectedEvents.map(ev => (
                <div key={ev.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors">
                  <span className={cn('w-2 h-2 rounded-full shrink-0', getCategoryColor(ev.category))} />
                  {editMode === ev.id ? (
                    <div className="flex-1 space-y-1">
                      <div className="flex gap-1 items-center">
                        <Input
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          className="h-6 text-[10px] flex-1"
                          autoFocus
                        />
                        <Select value={editCategory} onValueChange={setEditCategory}>
                          <SelectTrigger className="h-6 w-16 text-[9px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CATEGORIES.map(c => (
                              <SelectItem key={c.value} value={c.value} className="text-[10px]">{c.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleUpdateEvent(ev.id)}>
                          <Check className="h-3 w-3 text-green-500" />
                        </Button>
                      </div>
                      <div className="flex gap-1 items-center">
                        <Input
                          type="time"
                          value={editStartTime}
                          onChange={e => setEditStartTime(e.target.value)}
                          className="h-5 text-[8px] w-20"
                        />
                        <span className="text-[8px] text-muted-foreground">a</span>
                        <Input
                          type="time"
                          value={editEndTime}
                          onChange={e => setEditEndTime(e.target.value)}
                          className="h-5 text-[8px] w-20"
                        />
                        <span className="text-[8px] text-muted-foreground">(opcional)</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-[10px]">{ev.title}</span>
                      <Badge variant="outline" className="text-[8px] h-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {CATEGORIES.find(c => c.value === ev.category)?.label || ev.category}
                      </Badge>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
                        onClick={() => { setEditMode(ev.id); setEditTitle(ev.title); setEditCategory(ev.category); setEditDescription(ev.description || ''); setEditStartTime(ev.start_time || ''); setEditEndTime(ev.end_time || ''); }}
                      >
                        <Edit3 className="h-2.5 w-2.5 text-muted-foreground" />
                      </button>
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded"
                        onClick={() => deleteEvent(ev.id)}
                      >
                        <Trash2 className="h-2.5 w-2.5 text-destructive" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
