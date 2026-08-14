import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Clock, BookOpen, Briefcase, FolderKanban, Dumbbell, Sun, Moon, Coffee, Languages, Target, Music, Book, X } from 'lucide-react';
import { parseTime } from '@/hooks/useRoutineBlocksDB';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import { useMusicRepertoire } from '@/hooks/useMusicRepertoire';
const FOCUS_OPTIONS = [
    { value: 'universidad', label: '🎓 Universidad', color: 'text-blue-500' },
    { value: 'emprendimiento', label: '💼 Emprendimiento', color: 'text-purple-500' },
    { value: 'proyectos', label: '💻 Proyectos', color: 'text-emerald-500' },
    { value: 'idiomas', label: '🗣️ Idiomas', color: 'text-teal-500' },
    { value: 'musica', label: '🎵 Música', color: 'text-pink-500' },
    { value: 'lectura', label: '📖 Lectura', color: 'text-indigo-500' },
    { value: 'descanso', label: '🛌 Descanso', color: 'text-slate-500' },
    { value: 'ocio', label: '☕ Ocio', color: 'text-orange-500' },
    { value: 'entretenimiento', label: '🎮 Entretenimiento', color: 'text-orange-500' },
];
const FOCUS_COLORS = {
    universidad: { border: 'border-l-blue-500', bg: 'bg-blue-500/10', dot: 'bg-blue-500', label: 'Universidad' },
    emprendimiento: { border: 'border-l-purple-500', bg: 'bg-purple-500/10', dot: 'bg-purple-500', label: 'Emprendimiento' },
    proyectos: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', dot: 'bg-emerald-500', label: 'Proyectos' },
    idiomas: { border: 'border-l-teal-500', bg: 'bg-teal-500/10', dot: 'bg-teal-500', label: 'Idiomas' },
    musica: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Música' },
    lectura: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Lectura' },
    descanso: { border: 'border-l-slate-500', bg: 'bg-slate-500/10', dot: 'bg-slate-500', label: 'Descanso' },
    ocio: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Ocio' },
    entretenimiento: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Entretenimiento' },
    gym: { border: 'border-l-orange-500', bg: 'bg-orange-500/10', dot: 'bg-orange-500', label: 'Gym' },
    estructural: { border: 'border-l-indigo-500', bg: 'bg-indigo-500/10', dot: 'bg-indigo-500', label: 'Estructural' },
    alimentacion: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', dot: 'bg-amber-500', label: 'Alimentación' },
    hobbys: { border: 'border-l-pink-500', bg: 'bg-pink-500/10', dot: 'bg-pink-500', label: 'Hobbys' },
    default: { border: 'border-l-muted-foreground/30', bg: 'bg-muted/30', dot: 'bg-muted-foreground', label: 'Otros' },
};
const EVENT_CATEGORY_COLORS = {
    default: { bg: 'bg-blue-500/20', border: 'border-l-blue-500', text: 'text-blue-600' },
    universidad: { bg: 'bg-blue-500/20', border: 'border-l-blue-500', text: 'text-blue-600' },
    emprendimiento: { bg: 'bg-purple-500/20', border: 'border-l-purple-500', text: 'text-purple-600' },
    gym: { bg: 'bg-red-500/20', border: 'border-l-red-500', text: 'text-red-600' },
    idiomas: { bg: 'bg-emerald-500/20', border: 'border-l-emerald-500', text: 'text-emerald-600' },
    proyectos: { bg: 'bg-amber-500/20', border: 'border-l-amber-500', text: 'text-amber-600' },
    lectura: { bg: 'bg-cyan-500/20', border: 'border-l-cyan-500', text: 'text-cyan-600' },
    musica: { bg: 'bg-pink-500/20', border: 'border-l-pink-500', text: 'text-pink-600' },
    salud: { bg: 'bg-green-500/20', border: 'border-l-green-500', text: 'text-green-600' },
    social: { bg: 'bg-orange-500/20', border: 'border-l-orange-500', text: 'text-orange-600' },
    finanzas: { bg: 'bg-yellow-500/20', border: 'border-l-yellow-500', text: 'text-yellow-600' },
};
const EVENT_CATEGORY_NAMES = {
    default: 'General', universidad: 'Uni', emprendimiento: 'Emp', gym: 'Gym',
    idiomas: 'Idiomas', proyectos: 'Proy', lectura: 'Lect', musica: 'Mus',
    salud: 'Salud', social: 'Social', finanzas: 'Fin',
};
function formatHour(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${ampm}`;
}
function parseMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
}
function eventsOverlapBlock(event, blockStart, blockEnd) {
    if (event.start_time && event.end_time) {
        const eStart = parseMinutes(event.start_time);
        const eEnd = parseMinutes(event.end_time);
        const bStart = parseMinutes(blockStart);
        const bEnd = parseMinutes(blockEnd);
        return eStart < bEnd && eEnd > bStart;
    }
    // All-day event: show on first block only
    return false;
}
function isFirstBlockOfDay(event, blocks, blockIndex) {
    if (event.start_time && event.end_time)
        return true;
    return blockIndex === 0;
}
const SOURCE_STYLES = {
    university: { icon: _jsx(BookOpen, { className: "h-3 w-3" }), color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    entrepreneurship: { icon: _jsx(Briefcase, { className: "h-3 w-3" }), color: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
    project: { icon: _jsx(FolderKanban, { className: "h-3 w-3" }), color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
    general: { icon: _jsx(Target, { className: "h-3 w-3" }), color: 'bg-muted text-muted-foreground border-border' },
};
function isDeepWork(title) {
    const t = title.toLowerCase();
    return t.includes('deep work') || t.includes('work-') || t.includes('trabajo') || (t.includes('bloque') && !t.includes('alistamiento'));
}
function identifyBlockType(title) {
    const t = title.toLowerCase();
    if (t.includes('gym') || t.includes('entreno'))
        return 'gym';
    if (t.includes('lectura') || t.includes('podcast'))
        return 'lectura';
    if (t.includes('música') || t.includes('piano') || t.includes('guitarra'))
        return 'musica';
    if (t.includes('idiomas'))
        return 'idiomas';
    return 'other';
}
function getBlockFocus(block) {
    const focus = block.currentFocus || block.defaultFocus;
    if (focus && focus !== 'none')
        return focus;
    const title = block.title.toLowerCase();
    if (title.includes('gym') || title.includes('entreno'))
        return 'gym';
    if (title.includes('activación') || title.includes('alistamiento') || title.includes('desactivación') || title.includes('dormir') || title.includes('skincare') || title.includes('bañ'))
        return 'estructural';
    if (title.includes('almuerzo') || title.includes('comida') || title.includes('desayuno') || title.includes('merienda'))
        return 'alimentacion';
    if (title.includes('lectura') || title.includes('música') || title.includes('piano') || title.includes('ajedrez'))
        return 'hobbys';
    if (title.includes('ocio'))
        return 'ocio';
    if (title.includes('idiomas'))
        return 'hobbys';
    return 'default';
}
function getBlockIcon(block) {
    const focus = getBlockFocus(block);
    switch (focus) {
        case 'universidad': return _jsx(BookOpen, { className: "h-4 w-4 text-blue-500" });
        case 'emprendimiento': return _jsx(Briefcase, { className: "h-4 w-4 text-purple-500" });
        case 'proyectos': return _jsx(FolderKanban, { className: "h-4 w-4 text-emerald-500" });
        case 'descanso': return _jsx(Moon, { className: "h-4 w-4 text-slate-500" });
        case 'lectura': return _jsx(Book, { className: "h-4 w-4 text-indigo-500" });
        case 'musica': return _jsx(Music, { className: "h-4 w-4 text-pink-500" });
        case 'entretenimiento': return _jsx(Target, { className: "h-4 w-4 text-orange-500" });
        case 'gym': return _jsx(Dumbbell, { className: "h-4 w-4 text-orange-500" });
        case 'estructural': return _jsx(Sun, { className: "h-4 w-4 text-indigo-500" });
        case 'alimentacion': return _jsx(Coffee, { className: "h-4 w-4 text-amber-500" });
        case 'hobbys': return _jsx(Music, { className: "h-4 w-4 text-pink-500" });
        case 'ocio': return _jsx(Moon, { className: "h-4 w-4 text-slate-400" });
        default: return _jsx(Clock, { className: "h-4 w-4 text-muted-foreground" });
    }
}
function formatTime(time) {
    const [h, m] = time.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
}
export function DailyTimelinePlanner({ blocks, tasksByBlock, onToggleBlock, isBlockCompleted, onDropTask, onRemoveTask, onUpdateFocus, events = [], musicInstrument, languageChoice, isFutureView = false, }) {
    const [currentMinutes, setCurrentMinutes] = useState(() => {
        const now = new Date();
        return now.getHours() * 60 + now.getMinutes();
    });
    const [dragOverBlockId, setDragOverBlockId] = useState(null);
    const { exercises, getTodayWorkout } = useWorkoutTracking();
    const { getCurrentlyReading } = useReadingLibrary();
    const { getSongsByStatus } = useMusicRepertoire();
    const todayWorkout = getTodayWorkout();
    const currentBook = getCurrentlyReading();
    const allLearningSongs = getSongsByStatus('learning');
    const learningSongs = musicInstrument
        ? allLearningSongs.filter(s => s.instrument === musicInstrument)
        : allLearningSongs;
    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentMinutes(now.getHours() * 60 + now.getMinutes());
        }, 30000);
        return () => clearInterval(interval);
    }, []);
    const sortedBlocks = useMemo(() => {
        return [...blocks]
            .filter(b => {
            const startM = parseTime(b.startTime);
            return startM >= 300;
        })
            .sort((a, b) => parseTime(a.startTime) - parseTime(b.startTime));
    }, [blocks]);
    const currentBlockIndex = useMemo(() => {
        return sortedBlocks.findIndex(block => {
            const startM = parseTime(block.startTime);
            const endM = parseTime(block.endTime);
            return currentMinutes >= startM && currentMinutes < endM;
        });
    }, [sortedBlocks, currentMinutes]);
    const handleDragOver = (e, blockId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverBlockId(blockId);
    };
    const handleDrop = (e, blockId) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        if (taskId) {
            onDropTask(taskId, blockId);
        }
        setDragOverBlockId(null);
    };
    const handleDragLeave = () => {
        setDragOverBlockId(null);
    };
    const allDayEvents = events.filter(e => !e.start_time || !e.end_time);
    const timedEvents = events.filter(e => e.start_time && e.end_time);
    return (_jsxs(Card, { className: "p-3 md:p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { children: [_jsxs("h3", { className: "text-sm font-bold uppercase tracking-wide text-foreground flex items-center gap-2", children: [_jsx(Clock, { className: "h-4 w-4 text-primary" }), isFutureView ? 'Mañana' : 'Hoy'] }), _jsx("p", { className: "text-xs text-muted-foreground", children: format(isFutureView ? new Date(Date.now() + 86400000) : new Date(), "EEEE, d 'de' MMMM", { locale: es }) })] }), !isFutureView && (_jsx(Badge, { variant: "outline", className: "text-xs font-mono", children: format(new Date(), 'h:mm a') }))] }), allDayEvents.length > 0 && (_jsx("div", { className: "mb-3 space-y-1", children: allDayEvents.map(ev => {
                    const ec = EVENT_CATEGORY_COLORS[ev.category] || EVENT_CATEGORY_COLORS.default;
                    return (_jsxs("div", { className: cn("flex items-center gap-2 py-1 px-2 rounded-lg border-l-2 text-xs", ec.bg, ec.border), children: [_jsx("span", { className: "font-medium truncate flex-1", children: ev.title }), _jsx("span", { className: cn("text-[9px] font-medium", ec.text), children: EVENT_CATEGORY_NAMES[ev.category] || ev.category })] }, ev.id));
                }) })), _jsx("div", { className: "relative space-y-1", children: sortedBlocks.map((block, index) => {
                    const blockId = block.id;
                    const startM = parseTime(block.startTime);
                    const endM = parseTime(block.endTime);
                    const completed = isBlockCompleted(blockId);
                    const focusKey = getBlockFocus(block);
                    const colors = FOCUS_COLORS[focusKey] || FOCUS_COLORS.default;
                    const isCurrent = !isFutureView && index === currentBlockIndex;
                    const isPast = !isFutureView && endM <= currentMinutes;
                    const isDragOver = dragOverBlockId === blockId;
                    const tasks = tasksByBlock[blockId] || [];
                    const isDW = isDeepWork(block.title);
                    const blockType = identifyBlockType(block.title);
                    const todayMuscleGroups = todayWorkout?.isWorkoutDay
                        ? exercises.filter(e => e.day_of_week === todayWorkout.dayName.toLowerCase()).map(e => e.muscle_group || e.name).filter(Boolean)
                        : [];
                    return (_jsx("div", { onDragOver: (e) => handleDragOver(e, blockId), onDragLeave: handleDragLeave, onDrop: (e) => handleDrop(e, blockId), children: _jsxs("div", { className: "flex items-start gap-2", children: [_jsx("div", { className: "w-12 flex-shrink-0 text-[10px] text-muted-foreground font-mono pt-2 text-right leading-tight", children: formatTime(block.startTime) }), (() => {
                                    const blockEvents = timedEvents.filter(e => eventsOverlapBlock(e, block.startTime, block.endTime));
                                    return (_jsxs("div", { className: cn("flex-1 border-l-[3px] rounded-lg border transition-all relative", colors.border, completed && "opacity-70", isCurrent && "ring-2 ring-primary shadow-md", isDragOver && "ring-2 ring-primary/60 bg-primary/10 scale-[1.01]", !completed && !isCurrent && isPast && "opacity-40"), children: [_jsxs("div", { className: cn("p-2.5 rounded-r-lg", colors.bg, isDragOver && "bg-primary/10"), children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsxs("div", { className: "flex items-center gap-2 flex-1 min-w-0", children: [_jsx(Checkbox, { checked: completed, onCheckedChange: () => onToggleBlock(blockId), className: "h-4 w-4 shrink-0" }), getBlockIcon(block), _jsx("span", { className: cn("text-xs font-medium truncate", completed && "line-through text-muted-foreground"), children: block.title }), _jsx("span", { className: "text-[9px] text-muted-foreground hidden sm:inline font-mono", children: formatTime(block.endTime) }), isDW && onUpdateFocus && (_jsxs(Select, { value: block.currentFocus || block.defaultFocus || '', onValueChange: (v) => onUpdateFocus(blockId, v), children: [_jsx(SelectTrigger, { className: "h-5 w-[90px] text-[9px] border-0 bg-muted/50 hover:bg-muted", children: _jsx(SelectValue, { placeholder: "Objetivo" }) }), _jsx(SelectContent, { children: FOCUS_OPTIONS.map(opt => (_jsx(SelectItem, { value: opt.value, className: "text-xs", children: opt.label }, opt.value))) })] }))] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [isCurrent && (_jsx(Badge, { className: "text-[9px] px-1.5 py-0 h-4 bg-primary text-primary-foreground animate-pulse", children: "En curso" })), tasks.length > 0 && (_jsx(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0 h-4", children: tasks.length }))] })] }), blockType === 'gym' && todayMuscleGroups.length > 0 && (_jsxs("div", { className: "mt-1 ml-6 flex items-center gap-1.5", children: [_jsx(Dumbbell, { className: "h-2.5 w-2.5 text-orange-500" }), _jsx("span", { className: "text-[9px] text-muted-foreground", children: todayMuscleGroups.slice(0, 3).join(' · ') })] })), blockType === 'lectura' && currentBook && (_jsxs("div", { className: "mt-1 ml-6 flex items-center gap-1.5", children: [_jsx(Book, { className: "h-2.5 w-2.5 text-indigo-500" }), _jsx("span", { className: "text-[9px] text-muted-foreground truncate max-w-[200px]", children: currentBook.title })] })), blockType === 'musica' && learningSongs.length > 0 && (_jsxs("div", { className: "mt-1 ml-6 flex items-center gap-1.5", children: [_jsx(Music, { className: "h-2.5 w-2.5 text-pink-500" }), _jsxs("span", { className: "text-[9px] text-muted-foreground", children: [learningSongs[0].instrument === 'piano' ? '🎹' : '🎸', " ", learningSongs[0].title] })] })), blockType === 'idiomas' && languageChoice && (_jsxs("div", { className: "mt-1 ml-6 flex items-center gap-1.5", children: [_jsx(Languages, { className: "h-2.5 w-2.5 text-teal-500" }), _jsxs("span", { className: "text-[9px] text-muted-foreground", children: [languageChoice === 'ingles' ? '🇬🇧' : '🇮🇹', " ", languageChoice === 'ingles' ? 'Inglés' : 'Italiano'] })] })), tasks.length > 0 && (_jsx("div", { className: "mt-1.5 ml-6 space-y-0.5", children: tasks.map(task => (_jsxs("div", { className: "flex items-center justify-between py-0.5 px-1.5 rounded bg-background/60 group", children: [_jsxs("div", { className: "flex items-center gap-1.5 flex-1 min-w-0", children: [_jsx("span", { className: cn("w-1.5 h-1.5 rounded-full shrink-0", task.completed ? "bg-green-500" : colors.dot) }), _jsx("span", { className: cn("text-[11px] truncate", task.completed && "line-through text-muted-foreground"), children: task.title }), task.source && SOURCE_STYLES[task.source] && (_jsx(Badge, { variant: "outline", className: cn("text-[8px] px-1 py-0 h-3.5 border-0", SOURCE_STYLES[task.source].color), children: SOURCE_STYLES[task.source].icon }))] }), _jsx("button", { onClick: () => onRemoveTask(task.id), className: "h-5 w-5 p-0 flex items-center justify-center shrink-0 rounded hover:bg-destructive/10 transition-colors", children: _jsx(X, { className: "h-3 w-3 text-muted-foreground hover:text-destructive" }) })] }, task.id))) }))] }), isCurrent && (_jsx("div", { className: "h-0.5 bg-primary rounded-full" })), blockEvents.length > 0 && (_jsx("div", { className: "absolute right-0 top-0 bottom-0 w-[35%] pointer-events-none overflow-hidden rounded-r-lg", children: blockEvents.map(ev => {
                                                    const ec = EVENT_CATEGORY_COLORS[ev.category] || EVENT_CATEGORY_COLORS.default;
                                                    return (_jsxs("div", { className: cn("absolute inset-0 border-l-2 flex flex-col justify-center px-2", ec.bg, ec.border), title: `${ev.title}${ev.start_time ? ` (${formatHour(ev.start_time)} - ${formatHour(ev.end_time)})` : ''}`, children: [_jsx("span", { className: "text-[9px] font-bold truncate leading-tight", children: ev.title }), ev.start_time && (_jsxs("span", { className: "text-[7px] text-muted-foreground font-mono leading-tight", children: [formatHour(ev.start_time), " - ", formatHour(ev.end_time)] })), _jsx("span", { className: cn("text-[7px] font-medium leading-tight", ec.text), children: EVENT_CATEGORY_NAMES[ev.category] || ev.category })] }, ev.id));
                                                }) }))] }));
                                })()] }) }, blockId));
                }) }), _jsxs("div", { className: "mt-2 flex items-center gap-1.5 text-[9px] text-muted-foreground flex-wrap", children: [_jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.universidad.dot) }), " Uni", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.emprendimiento.dot) }), " Emp", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.proyectos.dot) }), " Proy", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.descanso.dot) }), " Desc", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.lectura.dot) }), " Lec", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.musica.dot) }), " Mus", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.gym.dot) }), " Gym", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.estructural.dot) }), " Est", _jsx("span", { className: cn("w-1.5 h-1.5 rounded-full", FOCUS_COLORS.alimentacion.dot) }), " Ali"] })] }));
}
