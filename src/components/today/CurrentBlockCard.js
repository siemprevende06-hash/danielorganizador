import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Dumbbell, Book, Music, Target, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseTime } from '@/hooks/useRoutineBlocksDB';
import { useWorkoutTracking } from '@/hooks/useWorkoutTracking';
import { useReadingLibrary } from '@/hooks/useReadingLibrary';
import { useMusicRepertoire } from '@/hooks/useMusicRepertoire';
function identifyBlockType(title) {
    const t = title.toLowerCase();
    if (t.includes('gym') || t.includes('entreno'))
        return 'gym';
    if (t.includes('lectura') || t.includes('podcast'))
        return 'lectura';
    if (t.includes('música') || t.includes('piano') || t.includes('guitarra'))
        return 'musica';
    if (t.includes('ajedrez'))
        return 'ajedrez';
    if (t.includes('deep work') || t.includes('work-') || t.includes('trabajo') || t.includes('focus') || t.includes('bloque'))
        return 'deepwork';
    if (t.includes('almuerzo'))
        return 'almuerzo';
    return 'other';
}
export function CurrentBlockCard({ currentBlock, blockProgress, tasksByBlock }) {
    const { routine, exercises, getTodayWorkout, isLoading: workoutLoading } = useWorkoutTracking();
    const { getCurrentlyReading } = useReadingLibrary();
    const { getSongsByStatus } = useMusicRepertoire();
    const blockType = currentBlock ? identifyBlockType(currentBlock.title) : 'other';
    const todayWorkout = getTodayWorkout();
    const currentBook = getCurrentlyReading();
    const learningSongs = getSongsByStatus('learning');
    const timeRemaining = useMemo(() => {
        if (!currentBlock)
            return null;
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        const endMinutes = parseTime(currentBlock.endTime);
        const remaining = endMinutes - currentMinutes;
        if (remaining <= 0)
            return null;
        return remaining;
    }, [currentBlock]);
    const blockTasks = currentBlock ? tasksByBlock[currentBlock.id] || [] : [];
    const incompleteTasks = blockTasks.filter(t => !t.completed);
    return (_jsx(Card, { className: cn("p-3 border-l-[3px] transition-all", currentBlock ? "border-l-primary" : "border-l-muted-foreground/30"), children: currentBlock ? (_jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Zap, { className: "h-4 w-4 text-primary" }), _jsx("span", { className: "font-bold text-sm", children: currentBlock.title }), _jsxs(Badge, { variant: "secondary", className: "text-[10px] h-5", children: [currentBlock.startTime, " - ", currentBlock.endTime] })] }), timeRemaining && (_jsxs(Badge, { variant: "outline", className: "text-[10px] h-5", children: [_jsx(Clock, { className: "h-3 w-3 mr-1" }), timeRemaining, " min"] }))] }), _jsx(Progress, { value: blockProgress, className: "h-1.5" }), _jsxs("div", { className: "flex items-center gap-2 flex-wrap text-xs", children: [blockType === 'gym' && !workoutLoading && routine && (_jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx(Dumbbell, { className: "h-3 w-3 text-orange-500" }), todayWorkout?.isWorkoutDay ? (_jsxs("span", { children: ["Hoy: ", _jsx("strong", { children: todayWorkout.dayName }), " \u00B7", ' ', exercises.filter(e => e.day_of_week === todayWorkout.dayName.toLowerCase()).slice(0, 3).map(e => e.muscle_group || e.name).join(', ') || 'Ejercicios'] })) : (_jsx("span", { children: "D\u00EDa de descanso" }))] })), blockType === 'lectura' && currentBook && (_jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx(Book, { className: "h-3 w-3 text-indigo-500" }), _jsxs("span", { children: [_jsx("strong", { children: currentBook.title }), currentBook.author && _jsxs("span", { children: [" \u2014 ", currentBook.author] }), currentBook.pages_total && (_jsxs("span", { children: [" \u00B7 ", currentBook.pages_read || 0, "/", currentBook.pages_total, " p\u00E1g"] }))] })] })), blockType === 'musica' && learningSongs.length > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx(Music, { className: "h-3 w-3 text-pink-500" }), _jsx("span", { children: learningSongs.slice(0, 2).map(s => `${s.title} (${s.instrument === 'piano' ? '🎹' : '🎸'})`).join(', ') })] })), blockType === 'deepwork' && incompleteTasks.length > 0 && (_jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx(Target, { className: "h-3 w-3 text-emerald-500" }), _jsxs("span", { className: "truncate max-w-[300px]", children: [incompleteTasks.slice(0, 3).map(t => t.title).join(' · '), incompleteTasks.length > 3 && ` +${incompleteTasks.length - 3}`] })] })), blockType === 'ajedrez' && (_jsxs("div", { className: "flex items-center gap-1.5 text-muted-foreground", children: [_jsx(ChevronRight, { className: "h-3 w-3" }), _jsx("span", { children: "Partidas de hoy" })] }))] }), blockTasks.length > 0 && (_jsx("div", { className: "flex flex-wrap gap-1", children: blockTasks.map(task => (_jsx(Badge, { variant: task.completed ? 'default' : 'outline', className: cn("text-[9px] px-1.5 py-0 h-4", task.completed && "bg-green-500/20 text-green-600"), children: task.title }, task.id))) }))] })) : (_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Clock, { className: "h-4 w-4" }), "Sin bloque activo en este momento"] })) }));
}
