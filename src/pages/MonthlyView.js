import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MonthlyTasks } from '@/components/monthly/MonthlyTasks';
import { MonthlySystemsStats } from '@/components/systems/MonthlySystemsStats';
import NotionCalendar from '@/components/calendar/NotionCalendar';
import { getQuarterFromDate } from '@/lib/hierarchy';
import { MejoraProcessPanel } from '@/components/mejora/MejoraProcessPanel';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle } from '@/components/control/EsfuerzoResultadosToggle';
import { ResultadosMes } from '@/components/resultados/ResultadosMes';
export default function MonthlyView() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [viewMode, setViewMode] = useState('esfuerzo');
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const { quarter, year } = getQuarterFromDate(currentMonth);
    const monthIndex = currentMonth.getMonth() - (quarter - 1) * 3;
    const navigateMonth = (dir) => {
        setCurrentMonth(prev => {
            const n = new Date(prev);
            n.setMonth(n.getMonth() + (dir === 'prev' ? -1 : 1));
            return n;
        });
    };
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-5xl mx-auto space-y-5", children: [_jsx("div", { className: "flex justify-center", children: _jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight capitalize", children: format(currentMonth, 'MMMM yyyy', { locale: es }) }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: ["Mes ", monthIndex + 1, " de Q", quarter, " \u00B7 ", year] })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateMonth('prev'), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setCurrentMonth(new Date()), children: "Hoy" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigateMonth('next'), children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }), viewMode === 'plan' ? (_jsxs("section", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Plan del mes" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Calendario de eventos" })] }), _jsx(NotionCalendar, {})] })) : viewMode === 'esfuerzo' ? (_jsxs(_Fragment, { children: [_jsx(PeriodControlSection, { scope: "month", start: monthStart, end: monthEnd }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Eventos" }), _jsx(NotionCalendar, {})] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Tareas" }), _jsx(MonthlyTasks, { currentMonth: currentMonth })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Sistemas" }), _jsx(MonthlySystemsStats, { monthDate: currentMonth })] }), _jsxs("section", { className: "space-y-4", children: [_jsx("h2", { className: "text-lg font-semibold tracking-tight", children: "Mejora" }), _jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: _jsx(CardContent, { className: "p-4", children: _jsx(MejoraProcessPanel, { anchorDate: monthStart }) }) })] })] })) : (_jsx(ResultadosMes, { month: currentMonth }))] }) }));
}
