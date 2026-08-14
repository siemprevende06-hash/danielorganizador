import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { format, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Book, Music, FolderKanban, GraduationCap, Calendar, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProgressRing } from './ProgressRing';
const STORAGE_PREFIX = 'monthly_plan_';
function loadFromLocal(monthStr) {
    try {
        const raw = localStorage.getItem(STORAGE_PREFIX + monthStr);
        if (raw)
            return JSON.parse(raw);
    }
    catch { }
    return null;
}
export function MonthlyPlanSummary({ currentMonth }) {
    const [planData, setPlanData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const monthStr = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
        const local = loadFromLocal(monthStr);
        setPlanData(local);
        setLoading(false);
    }, [currentMonth]);
    if (loading)
        return null;
    if (!planData || (planData.books.goal === 0 &&
        planData.songs.goal === 0 &&
        planData.projects.length === 0 &&
        planData.subjects.length === 0 &&
        planData.events.length === 0 &&
        planData.personal_goals.length === 0)) {
        return (_jsx(Card, { className: "border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs("div", { className: "p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Target, { className: "w-4 h-4" }), "Sin planificaci\u251C\u2502n para ", format(currentMonth, 'MMMM', { locale: es })] }), _jsxs(Link, { to: "/monthly-planning", className: "text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1", children: ["Crear plan ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }) }));
    }
    const items = [
        { icon: _jsx(Book, { className: "w-3.5 h-3.5" }), label: 'Libros', count: planData.books.selected.length, goal: planData.books.goal, color: 'indigo', textColor: 'text-indigo-500' },
        { icon: _jsx(Music, { className: "w-3.5 h-3.5" }), label: 'Canciones', count: planData.songs.selected.length, goal: planData.songs.goal, color: 'emerald', textColor: 'text-emerald-500' },
        { icon: _jsx(FolderKanban, { className: "w-3.5 h-3.5" }), label: 'Proyectos', count: planData.projects.length, color: 'amber', textColor: 'text-amber-500' },
        { icon: _jsx(GraduationCap, { className: "w-3.5 h-3.5" }), label: 'Asignaturas', count: planData.subjects.length, color: 'blue', textColor: 'text-blue-500' },
        { icon: _jsx(Calendar, { className: "w-3.5 h-3.5" }), label: 'Eventos', count: planData.events.length, color: 'rose', textColor: 'text-rose-500' },
        { icon: _jsx(Target, { className: "w-3.5 h-3.5" }), label: 'Metas', count: planData.personal_goals.length, color: 'purple', textColor: 'text-purple-500' },
    ];
    return (_jsx(Card, { className: "border border-gray-200/70 dark:border-gray-800/70 shadow-sm", children: _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Target, { className: "w-4 h-4 text-indigo-500" }), _jsx("span", { className: "text-sm font-semibold", children: "Plan Mensual" })] }), _jsxs(Link, { to: "/monthly-planning", className: "text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1", children: ["Editar ", _jsx(ArrowRight, { className: "w-3 h-3" })] })] }), _jsx("div", { className: "flex gap-4 overflow-x-auto pb-1 -mx-1 px-1", children: items.filter(i => i.goal ? i.goal > 0 : i.count > 0).map(item => (_jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsx(ProgressRing, { progress: item.goal && item.goal > 0 ? Math.round((item.count / item.goal) * 100) : item.count > 0 ? 100 : 0, size: 40, strokeWidth: 3, strokeColor: item.color, children: _jsx("span", { className: `text-[9px] font-bold ${item.textColor}`, children: item.goal ? `${item.count}/${item.goal}` : item.count }) }), _jsxs("div", { children: [_jsx("p", { className: "text-[11px] font-medium", children: item.label }), _jsx("p", { className: "text-[10px] text-muted-foreground", children: item.goal ? `${item.count} de ${item.goal}` : `${item.count} items` })] })] }, item.label))) })] }) }));
}
