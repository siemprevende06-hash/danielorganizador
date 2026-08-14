import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { format, startOfWeek, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Save, ListChecks, Plus, Trash2, Book, Music, FolderKanban, GraduationCap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useWeeklyPlan } from '@/hooks/useWeeklyPlan';
import { useMonthlyPlan } from '@/hooks/useMonthlyPlan';
import { cn } from '@/lib/utils';
import { MinutesGoalInput } from '@/components/hierarchy/MinutesGoalInput';
import { setWeekGoal, getWeekGoalEffective, getWeekGoalSum, ALL_HIERARCHY_AREAS, AREA_LABELS, } from '@/lib/hierarchy';
const CATEGORY_META = {
    book: { icon: _jsx(Book, { className: "w-3 h-3" }), color: 'text-indigo-500' },
    song: { icon: _jsx(Music, { className: "w-3 h-3" }), color: 'text-emerald-500' },
    project: { icon: _jsx(FolderKanban, { className: "w-3 h-3" }), color: 'text-amber-500' },
    subject: { icon: _jsx(GraduationCap, { className: "w-3 h-3" }), color: 'text-blue-500' },
    personal: { icon: _jsx(Target, { className: "w-3 h-3" }), color: 'text-purple-500' },
};
export default function WeeklyPlanningPage() {
    const [weekDate, setWeekDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const { planData, loading, saving, addAction, toggleAction, removeAction, savePlan } = useWeeklyPlan(weekDate);
    const month = new Date(weekDate.getFullYear(), weekDate.getMonth(), 1);
    const { planData: monthlyPlan, trimestralData } = useMonthlyPlan(month);
    const { toast } = useToast();
    const [newAction, setNewAction] = useState('');
    const weekStart = startOfWeek(weekDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const weekLabel = `${format(weekDays[0], 'd MMM', { locale: es })} - ${format(weekDays[6], 'd MMM', { locale: es })}`;
    const navigateWeek = (dir) => {
        setWeekDate(prev => {
            const n = new Date(prev);
            n.setDate(n.getDate() + (dir === 'prev' ? -7 : 7));
            return n;
        });
    };
    const handleSave = async () => {
        await savePlan();
        toast({ title: 'Plan semanal guardado' });
    };
    const handleAdd = () => {
        if (!newAction.trim())
            return;
        addAction({ title: newAction.trim(), category: 'personal', completed: false });
        setNewAction('');
    };
    const handleImportFromMonth = () => {
        if (monthlyPlan.books.selected.length > 0) {
            addAction({ title: 'Leer libro seleccionado', category: 'book', completed: false });
        }
        if (monthlyPlan.songs.selected.length > 0) {
            addAction({ title: 'Practicar canci├│n seleccionada', category: 'song', completed: false });
        }
        monthlyPlan.personal_goals.forEach(g => {
            addAction({ title: g.title, category: 'personal', completed: false });
        });
        toast({ title: 'Metas importadas del plan mensual' });
    };
    const completedCount = planData.actions.filter(a => a.completed).length;
    const totalCount = planData.actions.length;
    const [goalsVersion, setGoalsVersion] = useState(0);
    const applyWeekGoal = (area, value) => {
        const mins = Math.max(0, parseInt(value) || 0);
        setWeekGoal(weekStart, area, mins);
        setGoalsVersion(v => v + 1);
    };
    const weekGoalSum = getWeekGoalSum(weekStart);
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 max-w-5xl", children: [_jsxs("header", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500", children: _jsx(ListChecks, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-bold tracking-tight", children: "Plan Semanal" }), _jsx("p", { className: "text-sm text-muted-foreground", children: weekLabel })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "flex items-center gap-1 bg-muted/50 rounded-lg p-0.5", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateWeek('prev'), className: "h-8 w-8", children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsxs("span", { className: "text-sm font-semibold min-w-[140px] text-center", children: ["Semana ", planData.weekNumber] }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateWeek('next'), className: "h-8 w-8", children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }), _jsxs(Button, { onClick: handleSave, disabled: saving, size: "sm", className: "h-8 gap-1.5", children: [_jsx(Save, { className: "w-3.5 h-3.5" }), saving ? 'Guardando...' : 'Guardar'] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-4", children: [_jsx("div", { className: "lg:col-span-2 space-y-4", children: loading ? (_jsx("div", { className: "h-48 bg-muted/50 rounded-xl animate-pulse" })) : (_jsxs(_Fragment, { children: [_jsx(Card, { className: "border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs("div", { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(ListChecks, { className: "w-4 h-4 text-indigo-500" }), _jsx("span", { className: "text-sm font-semibold", children: "Acciones de la semana" }), totalCount > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-[10px]", children: [completedCount, "/", totalCount] }))] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 text-[10px]", onClick: handleImportFromMonth, children: "Importar del mes" })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "Nueva acci\u251C\u2502n...", value: newAction, onChange: e => setNewAction(e.target.value), onKeyDown: e => e.key === 'Enter' && handleAdd(), className: "h-8 text-xs" }), _jsx(Button, { size: "icon", variant: "ghost", onClick: handleAdd, className: "h-8 w-8 shrink-0", children: _jsx(Plus, { className: "h-4 w-4" }) })] }), planData.actions.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-6", children: "No hay acciones esta semana. Agrega una o imp\u251C\u2502rtalas del plan mensual." })) : (_jsx("div", { className: "space-y-0.5", children: planData.actions.map(action => {
                                                    const meta = CATEGORY_META[action.category] || CATEGORY_META.personal;
                                                    return (_jsxs("div", { className: "flex items-center gap-2.5 group py-1.5", children: [_jsx("button", { onClick: () => toggleAction(action.id), className: cn('w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors', action.completed
                                                                    ? 'bg-indigo-500 border-indigo-500 text-white'
                                                                    : 'border-muted-foreground/30 hover:border-indigo-400'), children: action.completed && _jsx("span", { className: "text-[8px]", children: "\u00D4\u00A3\u00F4" }) }), _jsx("span", { className: cn('text-xs flex-1', action.completed && 'line-through text-muted-foreground'), children: action.title }), _jsx("span", { className: meta.color, children: meta.icon }), _jsx("button", { onClick: () => removeAction(action.id), className: "opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx(Trash2, { className: "h-3 w-3 text-muted-foreground hover:text-destructive" }) })] }, action.id));
                                                }) }))] }) }), _jsx("div", { className: "grid grid-cols-7 gap-1", children: weekDays.map(day => (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-[10px] font-medium text-muted-foreground", children: format(day, 'EEE', { locale: es }).charAt(0).toUpperCase() + format(day, 'EEE', { locale: es }).slice(1, 3) }), _jsx("p", { className: "text-xs font-semibold mt-0.5", children: format(day, 'd') }), _jsx("div", { className: "mt-1 space-y-0.5", children: planData.actions.filter(a => a.completed).slice(0, 3).map(a => (_jsx("div", { className: "h-1 rounded-full bg-indigo-300/50" }, a.id))) })] }, day.toISOString()))) })] })) }), _jsxs("div", { className: "space-y-3", children: [trimestralData && (_jsx(Card, { className: "border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20", children: _jsxs("div", { className: "p-3", children: [_jsxs("p", { className: "text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5", children: ["Plan ", trimestralData.quarterLabel] }), _jsxs("div", { className: "space-y-1", children: [trimestralData.books.goal > 0 && (_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["\uD83D\uDCDA ", trimestralData.books.selected, "/", trimestralData.books.goal, " libros"] })), trimestralData.songs.goal > 0 && (_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["\uD83C\uDFB5 ", trimestralData.songs.selected, "/", trimestralData.songs.goal, " canciones"] })), trimestralData.projects > 0 && (_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["\uD83D\uDCC1 ", trimestralData.projects, " proyectos"] })), trimestralData.personal_goals > 0 && (_jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["\uD83C\uDFAF ", trimestralData.personal_goals, " metas"] }))] })] }) })), _jsx(Card, { className: "border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20", children: _jsxs("div", { className: "p-3", children: [_jsxs("p", { className: "text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 mb-1.5 flex items-center gap-1.5", children: [_jsx(Target, { className: "w-3.5 h-3.5" }), " Metas de minutos de la semana"] }), _jsx("div", { className: "space-y-1.5", children: ALL_HIERARCHY_AREAS.map(area => (_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-[10px] text-muted-foreground", children: AREA_LABELS[area] }), _jsx(MinutesGoalInput, { value: getWeekGoalEffective(weekStart, area), onApply: v => applyWeekGoal(area, v), className: "h-6 w-20 text-[10px]" })] }, area))) }), _jsxs("p", { className: "text-[10px] text-indigo-600 dark:text-indigo-400 font-medium mt-2", children: ["Total semana: ", weekGoalSum, " min"] })] }) }), _jsx(Card, { className: "border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs("div", { className: "p-3", children: [_jsx("p", { className: "text-[11px] font-semibold mb-2", children: "Progreso semanal" }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("div", { className: "relative w-16 h-16", children: [_jsxs("svg", { viewBox: "0 0 36 36", className: "w-16 h-16 -rotate-90", children: [_jsx("path", { d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "none", stroke: "#e5e7eb", strokeWidth: "3" }), _jsx("path", { d: "M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831", fill: "none", stroke: "#6366f1", strokeWidth: "3", strokeDasharray: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}, 100`, strokeLinecap: "round" })] }), _jsx("div", { className: "absolute inset-0 flex items-center justify-center", children: _jsxs("span", { className: "text-xs font-bold text-indigo-500", children: [totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0, "%"] }) })] }), _jsxs("div", { children: [_jsxs("p", { className: "text-xs font-semibold", children: [completedCount, "/", totalCount] }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: "acciones completadas" })] })] })] }) })] })] })] }));
}
