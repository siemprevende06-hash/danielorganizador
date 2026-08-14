import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Target, Book, Music, Gamepad2, Globe, Code, Briefcase, ListTodo, GraduationCap, FolderKanban, Calendar, Brain, Dumbbell, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useTrimestralPlan, getQuarterFromDate } from '@/hooks/useTrimestralPlan';
import { ItemSelector } from '@/components/monthly-planning/ItemSelector';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import { setQuarterGoal } from '@/lib/hierarchy';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle } from '@/components/control/EsfuerzoResultadosToggle';
import { ResultadosTrimestre } from '@/components/resultados/ResultadosTrimestre';
import { AutocriticaSection } from '@/components/autocritica/AutocriticaSection';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
const MONTH_KEYS = ["month1", "month2", "month3"];
function NoteCard({ icon, label, value, onChange, children }) {
    return (_jsx(Card, { className: "overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs(CardContent, { className: "p-3 space-y-1.5", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0", children: icon }), _jsx("span", { className: "text-xs font-semibold", children: label })] }), _jsx("div", { className: "min-h-[36px]", children: _jsx(Input, { value: value, onChange: e => onChange(e.target.value), placeholder: `Meta para ${label.toLowerCase()}...`, className: "h-7 text-xs" }) }), children] }) }));
}
export default function TrimestralPlanningPage() {
    const now = new Date();
    const { quarter: currentQ, year: currentY } = getQuarterFromDate(now);
    const [quarter, setQuarter] = useState(currentQ);
    const [year, setYear] = useState(currentY);
    const [activeMonth, setActiveMonth] = useState(0);
    const [viewMode, setViewMode] = useState('esfuerzo');
    const { planData, loading, saving, books, songs, projects, subjects, entrepreneurships, events, quarterTasks, updatePlanData, savePlan, fetchPlan, getMonthNamesForQuarter, toggleTaskCompletion, toggleEventCompletion, getMonthRange, } = useTrimestralPlan(quarter, year);
    const { toast } = useToast();
    const monthLabels = getMonthNamesForQuarter();
    const activeMonthKey = MONTH_KEYS[activeMonth];
    const navigateQ = (dir) => {
        if (dir === 'prev') {
            if (quarter === 1) {
                setQuarter(4);
                setYear(y => y - 1);
            }
            else
                setQuarter(q => q - 1);
        }
        else {
            if (quarter === 4) {
                setQuarter(1);
                setYear(y => y + 1);
            }
            else
                setQuarter(q => q + 1);
        }
    };
    const handleSave = async () => {
        await savePlan();
        toast({ title: 'Plan trimestral guardado', description: `Q${quarter} ${year} actualizado.` });
    };
    const setNote = (key, value) => {
        updatePlanData(p => ({ ...p, notes: { ...p.notes, [key]: value } }));
    };
    const bookItems = books.map(b => ({ id: b.id, title: b.title, subtitle: b.author || undefined }));
    const songItems = songs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist ? `${s.artist} · ${s.instrument}` : s.instrument }));
    const projectItems = projects.map(p => ({ id: p.id, title: p.name }));
    // Split songs by instrument
    const pianoSongs = songs.filter(s => s.instrument === 'piano');
    const guitarSongs = songs.filter(s => s.instrument === 'guitar');
    const activeMonthSongs = planData.distribution[activeMonthKey]?.songs || [];
    const activePianoSelected = pianoSongs.filter(s => activeMonthSongs.includes(s.id)).map(s => s.id);
    const activeGuitarSelected = guitarSongs.filter(s => activeMonthSongs.includes(s.id)).map(s => s.id);
    // Tasks for active month
    const { start: monthStart, end: monthEnd } = getMonthRange(activeMonth);
    const monthTasks = useMemo(() => quarterTasks.filter(t => {
        if (!t.due_date)
            return false;
        const d = new Date(t.due_date);
        return d >= monthStart && d <= monthEnd;
    }), [quarterTasks, monthStart, monthEnd]);
    // Events for active month
    const monthEvents = useMemo(() => events.filter(e => {
        const d = new Date(e.event_date);
        return d >= monthStart && d <= monthEnd;
    }), [events, monthStart, monthEnd]);
    const handleSongChange = (sectionIds, section) => {
        const sectionItems = section === "piano" ? pianoSongs : guitarSongs;
        const otherIds = section === "piano" ? activeGuitarSelected : activePianoSelected;
        const merged = [...new Set([...sectionIds, ...otherIds])];
        updatePlanData(p => ({
            ...p,
            distribution: {
                ...p.distribution,
                [activeMonthKey]: { ...p.distribution[activeMonthKey], songs: merged },
            },
        }));
    };
    const setTimeGoal = (key, value) => {
        const mins = Math.max(0, parseInt(value) || 0);
        updatePlanData(p => ({
            ...p,
            timeGoals: {
                ...p.timeGoals,
                [activeMonthKey]: { ...p.timeGoals[activeMonthKey], [key]: mins },
            },
        }));
    };
    const setAreaTimeGoal = (key, value) => {
        const mins = Math.max(0, parseInt(value) || 0);
        updatePlanData(p => ({
            ...p,
            areaTimeGoals: {
                ...p.areaTimeGoals,
                [activeMonthKey]: { ...p.areaTimeGoals[activeMonthKey], [key]: mins },
            },
        }));
    };
    const TimeGoalField = ({ label, value, onChange }) => (_jsx(MinutesGoalInput, { label: label, value: value, onApply: onChange }));
    const quarterGoalValue = (bucket, area) => (planData[bucket]?.month1?.[area] || 0) + (planData[bucket]?.month2?.[area] || 0) + (planData[bucket]?.month3?.[area] || 0);
    const applyQuarterGoal = async (area, value) => {
        const mins = Math.max(0, parseInt(value) || 0);
        await savePlan();
        setQuarterGoal(quarter, year, area, mins);
        fetchPlan();
    };
    const QuarterGoalField = ({ bucket, area }) => (_jsx(MinutesGoalInput, { label: "Meta trimestre", value: quarterGoalValue(bucket, area), onApply: v => applyQuarterGoal(area, v), className: "h-6 w-24 text-[10px]" }));
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 max-w-5xl", children: [_jsx("div", { className: "flex justify-center mb-6", children: _jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode }) }), _jsxs("header", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500", children: _jsx(Target, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Plan Trimestral" }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Metas para 3 meses" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 bg-muted/50 rounded-lg p-0.5", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateQ('prev'), className: "h-8 w-8", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsxs("span", { className: "text-sm font-semibold min-w-[100px] text-center", children: ["Q", quarter, " ", year] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateQ('next'), className: "h-8 w-8", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }), _jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "h-8 gap-1.5", children: [_jsx(Save, { className: "w-3.5 h-3.5" }), saving ? 'Guardando...' : 'Guardar'] })] })] }), viewMode === 'plan' ? (_jsx("div", { className: "space-y-4", children: [loading ? (_jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4", children: Array.from({ length: 6 }).map((_, i) => (_jsx("div", { className: "h-32 bg-muted/50 rounded-xl animate-pulse" }, i))) })) : (_jsxs("div", { className: "space-y-6", children: [_jsx("div", { className: "flex gap-2", children: monthLabels.map((label, i) => (_jsxs("button", { onClick: () => setActiveMonth(i), className: cn("flex-1 relative rounded-2xl p-3.5 text-left transition-all border-0", activeMonth === i
                                        ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 scale-[1.02]"
                                        : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), children: [_jsx("div", { className: "text-base font-bold", children: label }), _jsxs("div", { className: cn("text-[10px] mt-0.5", activeMonth === i ? "text-white/70" : "text-muted-foreground"), children: ["Mes ", i + 1] })] }, i))) }), _jsx("div", { className: "flex items-center justify-between", children: _jsxs("p", { className: "text-xs text-muted-foreground", children: ["Organizando ", _jsx("span", { className: "font-semibold text-indigo-500", children: monthLabels[activeMonth] })] }) }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-500" }), _jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold", children: "Desarrollo Personal" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Crecimiento intelectual, creatividad y bienestar" })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-emerald-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Book, { className: "h-3.5 w-3.5 text-emerald-500" }), _jsx("span", { className: "text-xs font-semibold text-emerald-700 dark:text-emerald-400", children: "Lectura" }), _jsx("div", { className: "flex items-center gap-1.5 ml-auto", children: _jsx(MinutesGoalInput, { label: "Meta", value: planData.books.goal || 0, onApply: v => updatePlanData(p => ({
                                                                ...p,
                                                                books: { ...p.books, goal: Math.max(1, parseInt(v) || 0) },
                                                            })), className: "h-7 w-16 text-xs", placeholder: "libro" }) }), _jsx(TimeGoalField, { label: "Min/mes", value: planData.timeGoals[activeMonthKey]?.lectura || 0, onChange: v => setTimeGoal('lectura', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "lectura" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: _jsx(ItemSelector, { items: bookItems, selected: planData.distribution[activeMonthKey]?.books || [], onChange: ids => updatePlanData(p => ({
                                                        ...p,
                                                        distribution: {
                                                            ...p.distribution,
                                                            [activeMonthKey]: { ...p.distribution[activeMonthKey], books: ids },
                                                        },
                                                    })), placeholder: "Seleccionar libros...", searchPlaceholder: "Buscar libro..." }) })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-sky-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Brain, { className: "h-3.5 w-3.5 text-sky-500" }), _jsx("span", { className: "text-xs font-semibold text-sky-700 dark:text-sky-400", children: "Hobbies Intelectuales" })] }), _jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3", children: [_jsx(Card, { className: "overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs(CardContent, { className: "p-3 space-y-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500 shrink-0", children: _jsx(Gamepad2, { className: "h-3.5 w-3.5" }) }), _jsx("span", { className: "text-xs font-semibold", children: "Ajedrez" })] }), _jsxs("div", { className: "flex gap-3", children: [_jsxs("div", { className: "flex-1 space-y-1", children: [_jsx("span", { className: "text-[9px] text-muted-foreground", children: "Partidas/mes" }), _jsx(MinutesGoalInput, { value: planData.chessGoals?.[activeMonthKey]?.partidas || 0, onApply: v => updatePlanData(p => ({
                                                                                        ...p,
                                                                                        chessGoals: { ...p.chessGoals, [activeMonthKey]: { ...p.chessGoals[activeMonthKey], partidas: Math.max(0, parseInt(v) || 0) } },
                                                                                    })), className: "h-7 text-xs w-full", placeholder: "0" })] }), _jsxs("div", { className: "flex-1 space-y-1", children: [_jsx("span", { className: "text-[9px] text-muted-foreground", children: "Minutos/mes" }), _jsx(MinutesGoalInput, { value: planData.chessGoals?.[activeMonthKey]?.minutos || 0, onApply: v => updatePlanData(p => ({
                                                                                        ...p,
                                                                                        chessGoals: { ...p.chessGoals, [activeMonthKey]: { ...p.chessGoals[activeMonthKey], minutos: Math.max(0, parseInt(v) || 0) } },
                                                                                    })), className: "h-7 text-xs w-full", placeholder: "0" })] })] })] }) }), _jsxs(NoteCard, { icon: _jsx(Globe, { className: "h-3.5 w-3.5" }), label: "Italiano", value: planData.notes.italiano || '', onChange: v => setNote('italiano', v), children: [_jsx(TimeGoalField, { label: "Min/mes", value: planData.timeGoals[activeMonthKey]?.italiano || 0, onChange: v => setTimeGoal('italiano', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "italiano" })] }), _jsxs(NoteCard, { icon: _jsx(Globe, { className: "h-3.5 w-3.5" }), label: "Ingl\u00E9s", value: planData.notes.ingles || '', onChange: v => setNote('ingles', v), children: [_jsx(TimeGoalField, { label: "Min/mes", value: planData.timeGoals[activeMonthKey]?.ingles || 0, onChange: v => setTimeGoal('ingles', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "ingles" })] }), _jsxs(NoteCard, { icon: _jsx(Sword, { className: "h-3.5 w-3.5" }), label: "Game Seducci\u00F3n", value: planData.notes.game_seduccion || '', onChange: v => setNote('game_seduccion', v), children: [_jsx(TimeGoalField, { label: "Min/mes", value: planData.timeGoals[activeMonthKey]?.game || 0, onChange: v => setTimeGoal('game', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "game" })] })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-rose-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Music, { className: "h-3.5 w-3.5 text-rose-500" }), _jsx("span", { className: "text-xs font-semibold text-rose-700 dark:text-rose-400", children: "Canciones" }), _jsxs("div", { className: "ml-auto", children: [_jsx(TimeGoalField, { label: "Min/mes", value: planData.timeGoals[activeMonthKey]?.musica || 0, onChange: v => setTimeGoal('musica', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "musica" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsxs("div", { className: "space-y-1.5", children: [_jsxs("p", { className: "text-[10px] font-semibold text-muted-foreground flex items-center gap-1", children: ["Piano (", pianoSongs.length, ")"] }), _jsx(ItemSelector, { items: pianoSongs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined })), selected: activePianoSelected, onChange: ids => handleSongChange(ids, "piano"), placeholder: "Seleccionar piano...", searchPlaceholder: "Buscar canci\u00F3n de piano..." })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("p", { className: "text-[10px] font-semibold text-muted-foreground flex items-center gap-1", children: ["Guitarra (", guitarSongs.length, ")"] }), _jsx(ItemSelector, { items: guitarSongs.map(s => ({ id: s.id, title: s.title, subtitle: s.artist || undefined })), selected: activeGuitarSelected, onChange: ids => handleSongChange(ids, "guitar"), placeholder: "Seleccionar guitarra...", searchPlaceholder: "Buscar canci\u00F3n de guitarra..." })] })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-cyan-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Code, { className: "h-3.5 w-3.5 text-cyan-500" }), _jsx("span", { className: "text-xs font-semibold text-cyan-700 dark:text-cyan-400", children: "Habilidades Valiosas" })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3", children: _jsx(NoteCard, { icon: _jsx(Code, { className: "h-3.5 w-3.5" }), label: "Habilidades T\u00E9cnicas", value: planData.notes.habilidades_tecnicas || '', onChange: v => setNote('habilidades_tecnicas', v) }) })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-orange-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Dumbbell, { className: "h-3.5 w-3.5 text-orange-500" }), _jsx("span", { className: "text-xs font-semibold text-orange-700 dark:text-orange-400", children: "Bienestar F\u00EDsico" })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(TimeGoalField, { label: "Min/mes (Gym)", value: planData.timeGoals[activeMonthKey]?.gym || 0, onChange: v => setTimeGoal('gym', v) }), _jsx(QuarterGoalField, { bucket: "timeGoals", area: "gym" })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-purple-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "h-3.5 w-3.5 text-purple-500" }), _jsx("span", { className: "text-xs font-semibold text-purple-700 dark:text-purple-400", children: "Metas Personales" })] }), _jsxs("div", { className: "max-w-md space-y-2", children: [_jsx("div", { className: "flex gap-2", children: _jsx(Input, { placeholder: "Agregar meta personal...", className: "h-8 text-xs", onKeyDown: e => {
                                                                if (e.key === 'Enter' && e.target.value.trim()) {
                                                                    updatePlanData(p => ({ ...p, personal_goals: [...p.personal_goals, { title: e.target.value.trim() }] }));
                                                                    e.target.value = '';
                                                                }
                                                            } }) }), planData.personal_goals.map((goal, i) => (_jsxs("div", { className: "flex items-center gap-2 group", children: [_jsx("div", { className: "w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" }), _jsx("p", { className: "text-xs flex-1 truncate", children: goal.title }), _jsx("button", { onClick: () => updatePlanData(p => ({ ...p, personal_goals: p.personal_goals.filter((_, idx) => idx !== i) })), className: "opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-muted-foreground hover:text-destructive", children: "Eliminar" })] }, i)))] })] })] }), _jsxs("div", { className: "space-y-4 pt-2", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-1 h-8 rounded-full bg-gradient-to-b from-sky-400 to-blue-500" }), _jsxs("div", { children: [_jsx("h2", { className: "text-base font-bold", children: "Profesional Acad\u00E9mico" }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "Carrera, estudios y proyectos" })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-blue-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(GraduationCap, { className: "h-3.5 w-3.5 text-blue-500" }), _jsx("span", { className: "text-xs font-semibold text-blue-700 dark:text-blue-400", children: "Asignaturas" }), _jsxs("div", { className: "ml-auto", children: [_jsx(TimeGoalField, { label: "Min/mes enfoque", value: planData.areaTimeGoals[activeMonthKey]?.universidad || 0, onChange: v => setAreaTimeGoal('universidad', v) }), _jsx(QuarterGoalField, { bucket: "areaTimeGoals", area: "universidad" })] })] }), _jsx("div", { className: "max-w-md", children: _jsx(ItemSelector, { items: subjects.map(s => ({ id: s.id, title: s.name })), selected: planData.monthSubjects[activeMonthKey] || [], onChange: ids => updatePlanData(p => ({
                                                        ...p,
                                                        monthSubjects: { ...p.monthSubjects, [activeMonthKey]: ids },
                                                    })), placeholder: "Asignaturas a estudiar este mes...", searchPlaceholder: "Buscar asignatura..." }) })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-amber-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(FolderKanban, { className: "h-3.5 w-3.5 text-amber-500" }), _jsx("span", { className: "text-xs font-semibold text-amber-700 dark:text-amber-400", children: "Proyectos" }), _jsxs("div", { className: "ml-auto", children: [_jsx(TimeGoalField, { label: "Min/mes enfoque", value: planData.areaTimeGoals[activeMonthKey]?.proyectos || 0, onChange: v => setAreaTimeGoal('proyectos', v) }), _jsx(QuarterGoalField, { bucket: "areaTimeGoals", area: "proyectos" })] })] }), _jsx("div", { className: "max-w-md", children: _jsx(ItemSelector, { items: projectItems, selected: planData.monthProjects[activeMonthKey] || [], onChange: ids => updatePlanData(p => ({
                                                        ...p,
                                                        monthProjects: { ...p.monthProjects, [activeMonthKey]: ids },
                                                    })), placeholder: "Seleccionar proyectos para este mes...", searchPlaceholder: "Buscar proyecto..." }) })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-purple-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Briefcase, { className: "h-3.5 w-3.5 text-purple-500" }), _jsx("span", { className: "text-xs font-semibold text-purple-700 dark:text-purple-400", children: "Emprendimiento" }), _jsxs("div", { className: "ml-auto", children: [_jsx(TimeGoalField, { label: "Min/mes enfoque", value: planData.areaTimeGoals[activeMonthKey]?.emprendimiento || 0, onChange: v => setAreaTimeGoal('emprendimiento', v) }), _jsx(QuarterGoalField, { bucket: "areaTimeGoals", area: "emprendimiento" })] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(ItemSelector, { items: entrepreneurships.map(e => ({ id: e.id, title: e.name })), selected: planData.monthEntrepreneurships[activeMonthKey] || [], onChange: ids => updatePlanData(p => ({
                                                            ...p,
                                                            monthEntrepreneurships: { ...p.monthEntrepreneurships, [activeMonthKey]: ids },
                                                        })), placeholder: "Seleccionar emprendimientos...", searchPlaceholder: "Buscar emprendimiento..." }), _jsx(NoteCard, { icon: _jsx(Briefcase, { className: "h-3.5 w-3.5" }), label: "Enfoque del Mes", value: planData.notes.emprendimiento || '', onChange: v => setNote('emprendimiento', v) })] })] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-emerald-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListTodo, { className: "h-3.5 w-3.5 text-emerald-500" }), _jsx("span", { className: "text-xs font-semibold text-emerald-700 dark:text-emerald-400", children: "Tareas del Mes" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: [monthTasks.filter(t => (planData.completedTasks[activeMonthKey] || []).includes(t.id)).length, "/", monthTasks.length, " completadas"] })] }), monthTasks.length === 0 ? (_jsxs("p", { className: "text-[10px] text-muted-foreground italic pl-1", children: ["Sin tareas con fecha en ", monthLabels[activeMonth]] })) : (_jsx("div", { className: "space-y-1 max-w-lg", children: monthTasks.map(task => {
                                                    const done = (planData.completedTasks[activeMonthKey] || []).includes(task.id);
                                                    return (_jsxs("div", { className: cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-xs cursor-pointer transition-colors", done ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200" : "hover:bg-muted/30"), onClick: () => toggleTaskCompletion(activeMonthKey, task.id), children: [_jsx(Checkbox, { checked: done }), _jsx("span", { className: cn("flex-1 truncate", done && "line-through text-muted-foreground"), children: task.title }), _jsx(Badge, { variant: "outline", className: "text-[9px] px-1", children: task.source }), task.due_date && _jsx("span", { className: "text-[9px] text-muted-foreground shrink-0", children: format(new Date(task.due_date), 'd MMM', { locale: es }) })] }, task.id));
                                                }) }))] }), _jsxs("div", { className: "space-y-2 pl-4 border-l-2 border-red-200/50", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Calendar, { className: "h-3.5 w-3.5 text-red-500" }), _jsx("span", { className: "text-xs font-semibold text-red-700 dark:text-red-400", children: "Eventos del Mes" }), _jsxs(Badge, { variant: "secondary", className: "text-[9px] px-1.5 py-0", children: [monthEvents.filter(e => (planData.completedEvents[activeMonthKey] || []).includes(e.id)).length, "/", monthEvents.length, " realizados"] })] }), monthEvents.length === 0 ? (_jsxs("p", { className: "text-[10px] text-muted-foreground italic pl-1", children: ["Sin eventos en ", monthLabels[activeMonth]] })) : (_jsx("div", { className: "space-y-1 max-w-lg", children: monthEvents.map(ev => {
                                                    const done = (planData.completedEvents[activeMonthKey] || []).includes(ev.id);
                                                    return (_jsxs("div", { className: cn("flex items-center gap-2.5 p-2 rounded-lg border border-border/40 text-xs cursor-pointer transition-colors", done ? "bg-red-50/40 dark:bg-red-950/20 border-red-200" : "hover:bg-muted/30"), onClick: () => toggleEventCompletion(activeMonthKey, ev.id), children: [_jsx(Checkbox, { checked: done }), _jsx("span", { className: cn("flex-1 truncate", done && "line-through text-muted-foreground"), children: ev.title }), _jsx(Badge, { variant: "outline", className: "text-[9px] px-1", children: ev.category }), _jsx("span", { className: "text-[9px] text-muted-foreground shrink-0", children: format(new Date(ev.event_date), 'd MMM', { locale: es }) })] }, ev.id));
                                                }) }))] })] })] }))] })) : viewMode === 'esfuerzo' ? (_jsx(PeriodControlSection, { scope: "quarter", start: new Date(year, (quarter - 1) * 3, 1), end: new Date(year, quarter * 3, 0) })) : viewMode === 'resultados' ? (_jsx(ResultadosTrimestre, { quarter: quarter, year: year })) : (_jsx(AutocriticaSection, { start: new Date(year, (quarter - 1) * 3, 1), end: new Date(year, quarter * 3, 0), scope: 'quarter' }))] }));
}
