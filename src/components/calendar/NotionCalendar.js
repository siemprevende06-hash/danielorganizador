import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, X, Trash2, Edit3, Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCalendarEvents, getCategoryColor } from '@/hooks/useCalendarEvents';
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
    const [selectedDate, setSelectedDate] = useState(null);
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState('default');
    const [newDescription, setNewDescription] = useState('');
    const [newStartTime, setNewStartTime] = useState('');
    const [newEndTime, setNewEndTime] = useState('');
    const [editMode, setEditMode] = useState(null);
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
    const navigate = (dir) => {
        setCurrentMonth(prev => {
            const d = new Date(prev);
            d.setMonth(d.getMonth() + (dir === 'prev' ? -1 : 1));
            return d;
        });
    };
    const handleAddEvent = async () => {
        if (!newTitle.trim() || !selectedDate)
            return;
        await addEvent(newTitle.trim(), selectedDate, newCategory, newDescription || undefined, newStartTime || undefined, newEndTime || undefined);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('default');
        setNewStartTime('');
        setNewEndTime('');
    };
    const handleUpdateEvent = async (id) => {
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
    return (_jsx(Card, { className: "overflow-hidden", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-sm font-semibold capitalize", children: format(currentMonth, 'MMMM yyyy', { locale: es }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => navigate('prev'), children: _jsx(ChevronLeft, { className: "h-3.5 w-3.5" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => navigate('next'), children: _jsx(ChevronRight, { className: "h-3.5 w-3.5" }) })] }), _jsx(Button, { variant: "outline", size: "sm", className: "h-7 text-[10px]", onClick: () => setCurrentMonth(new Date()), children: "Hoy" })] }), _jsx("div", { className: "grid grid-cols-7 mb-1", children: ['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => (_jsx("div", { className: "text-center text-[9px] font-medium text-muted-foreground py-1", children: d }, d))) }), _jsx("div", { className: "grid grid-cols-7 gap-px bg-muted/30 rounded-lg overflow-hidden", children: days.map(day => {
                        const dateStr = format(day, 'yyyy-MM-dd');
                        const dayEvents = getEventsForDay(dateStr);
                        const isCurrentMonth = isSameMonth(day, currentMonth);
                        const isSelected = selectedDate === dateStr;
                        const isTodayDay = isToday(day);
                        return (_jsxs("div", { className: cn('min-h-[60px] p-1 bg-card cursor-pointer transition-colors hover:bg-accent/40 relative', !isCurrentMonth && 'opacity-30', isSelected && 'ring-1 ring-primary ring-inset', isTodayDay && 'bg-primary/5'), onClick: () => setSelectedDate(dateStr), children: [_jsx("span", { className: cn('text-[9px] font-medium leading-none block mb-0.5', isTodayDay && 'text-primary font-bold'), children: format(day, 'd') }), _jsxs("div", { className: "space-y-0.5", children: [dayEvents.slice(0, 3).map(ev => (_jsx("div", { className: cn('h-1.5 rounded-full', getCategoryColor(ev.category)), title: ev.title }, ev.id))), dayEvents.length > 3 && (_jsxs("span", { className: "text-[7px] text-muted-foreground block", children: ["+", dayEvents.length - 3] }))] })] }, dateStr));
                    }) }), selectedDate && (_jsxs("div", { className: "mt-4 border-t pt-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-xs font-semibold", children: format(new Date(selectedDate + 'T12:00:00'), "EEEE d 'de' MMMM", { locale: es }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5", onClick: () => setSelectedDate(null), children: _jsx(X, { className: "h-3 w-3" }) })] }), _jsxs("div", { className: "space-y-1.5 mb-3", children: [_jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { placeholder: "Nuevo evento...", value: newTitle, onChange: e => setNewTitle(e.target.value), className: "h-7 text-[10px] flex-1", onKeyDown: e => { if (e.key === 'Enter')
                                                handleAddEvent(); } }), _jsxs(Select, { value: newCategory, onValueChange: setNewCategory, children: [_jsx(SelectTrigger, { className: "h-7 w-20 text-[10px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: CATEGORIES.map(c => (_jsx(SelectItem, { value: c.value, className: "text-[10px]", children: _jsxs("span", { className: "flex items-center gap-1", children: [_jsx("span", { className: cn('w-2 h-2 rounded-full', c.color) }), " ", c.label] }) }, c.value))) })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 shrink-0", onClick: handleAddEvent, children: _jsx(Plus, { className: "h-3 w-3" }) })] }), _jsxs("div", { className: "flex gap-1.5", children: [_jsx(Input, { type: "time", value: newStartTime, onChange: e => setNewStartTime(e.target.value), className: "h-6 text-[9px] w-24" }), _jsx("span", { className: "text-[9px] text-muted-foreground self-center", children: "a" }), _jsx(Input, { type: "time", value: newEndTime, onChange: e => setNewEndTime(e.target.value), className: "h-6 text-[9px] w-24" }), _jsx("span", { className: "text-[9px] text-muted-foreground self-center", children: "(opcional)" })] })] }), _jsxs("div", { className: "space-y-1", children: [selectedEvents.length === 0 && (_jsx("p", { className: "text-[10px] text-muted-foreground text-center py-2", children: "Sin eventos" })), selectedEvents.map(ev => (_jsxs("div", { className: "group flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-accent/30 transition-colors", children: [_jsx("span", { className: cn('w-2 h-2 rounded-full shrink-0', getCategoryColor(ev.category)) }), editMode === ev.id ? (_jsxs("div", { className: "flex-1 space-y-1", children: [_jsxs("div", { className: "flex gap-1 items-center", children: [_jsx(Input, { value: editTitle, onChange: e => setEditTitle(e.target.value), className: "h-6 text-[10px] flex-1", autoFocus: true }), _jsxs(Select, { value: editCategory, onValueChange: setEditCategory, children: [_jsx(SelectTrigger, { className: "h-6 w-16 text-[9px]", children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: CATEGORIES.map(c => (_jsx(SelectItem, { value: c.value, className: "text-[10px]", children: c.label }, c.value))) })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5", onClick: () => handleUpdateEvent(ev.id), children: _jsx(Check, { className: "h-3 w-3 text-green-500" }) })] }), _jsxs("div", { className: "flex gap-1 items-center", children: [_jsx(Input, { type: "time", value: editStartTime, onChange: e => setEditStartTime(e.target.value), className: "h-5 text-[8px] w-20" }), _jsx("span", { className: "text-[8px] text-muted-foreground", children: "a" }), _jsx(Input, { type: "time", value: editEndTime, onChange: e => setEditEndTime(e.target.value), className: "h-5 text-[8px] w-20" }), _jsx("span", { className: "text-[8px] text-muted-foreground", children: "(opcional)" })] })] })) : (_jsxs(_Fragment, { children: [_jsx("span", { className: "flex-1 text-[10px]", children: ev.title }), _jsx(Badge, { variant: "outline", className: "text-[8px] h-4 px-1 opacity-0 group-hover:opacity-100 transition-opacity", children: CATEGORIES.find(c => c.value === ev.category)?.label || ev.category }), _jsx("button", { className: "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded", onClick: () => { setEditMode(ev.id); setEditTitle(ev.title); setEditCategory(ev.category); setEditDescription(ev.description || ''); setEditStartTime(ev.start_time || ''); setEditEndTime(ev.end_time || ''); }, children: _jsx(Edit3, { className: "h-2.5 w-2.5 text-muted-foreground" }) }), _jsx("button", { className: "opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-accent rounded", onClick: () => deleteEvent(ev.id), children: _jsx(Trash2, { className: "h-2.5 w-2.5 text-destructive" }) })] }))] }, ev.id)))] })] }))] }) }));
}
