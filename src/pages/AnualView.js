import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import PeriodSections from '@/components/hierarchy/PeriodSections';
import { loadQuarterPlan, QUARTER_MONTH_KEYS } from '@/lib/hierarchy';
import { PeriodControlSection } from '@/components/control/PeriodControlSection';
import { EsfuerzoResultadosToggle, ResultadosPlaceholder } from '@/components/control/EsfuerzoResultadosToggle';
const QUARTERS = [
    { id: 1, name: 'Q1', dates: 'Ene – Mar' },
    { id: 2, name: 'Q2', dates: 'Abr – Jun' },
    { id: 3, name: 'Q3', dates: 'Jul – Sep' },
    { id: 4, name: 'Q4', dates: 'Oct – Dic' },
];
export default function AnualView() {
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [viewMode, setViewMode] = useState('esfuerzo');
    const currentQuarter = useMemo(() => Math.ceil((new Date().getMonth() + 1) / 3), []);
    const quarterStats = useMemo(() => QUARTERS.map(q => {
        const plan = loadQuarterPlan(q.id, year);
        let minutes = 0;
        QUARTER_MONTH_KEYS.forEach(mk => {
            Object.entries((plan?.timeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
            Object.entries((plan?.areaTimeGoals || {})[mk] || {}).forEach(([, v]) => { minutes += Number(v) || 0; });
        });
        const books = plan?.distribution
            ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.books || []).length), 0)
            : (plan?.books?.goal || 0);
        const songs = plan?.distribution
            ? QUARTER_MONTH_KEYS.reduce((s, mk) => s + ((plan.distribution?.[mk]?.songs || []).length), 0)
            : (plan?.songs?.goal || 0);
        return { ...q, minutes, books, songs, hasPlan: !!plan };
    }), [year]);
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-5xl mx-auto space-y-5", children: [_jsx("div", { className: "flex justify-center", children: _jsx(EsfuerzoResultadosToggle, { value: viewMode, onChange: setViewMode, withPlan: false }) }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl font-bold tracking-tight", children: ["A\u00F1o ", year] }), _jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Vista anual \u00B7 acumulado de los 4 trimestres" })] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setYear(y => y - 1), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => setYear(new Date().getFullYear()), children: "Actual" }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setYear(y => y + 1), children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] })] }), viewMode === 'esfuerzo' ? (_jsxs(_Fragment, { children: [_jsx(PeriodControlSection, { scope: "year", start: new Date(year, 0, 1), end: new Date(year, 11, 31) }), _jsx("div", { className: "grid grid-cols-4 gap-2.5", children: quarterStats.map(q => {
                                const isCurrent = q.id === currentQuarter && year === new Date().getFullYear();
                                return (_jsxs(Link, { to: `/12-week-year?q=${q.id}`, className: cn("relative rounded-2xl p-3.5 text-left transition-all border-0 backdrop-blur-xl", isCurrent
                                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                        : "bg-white/80 dark:bg-zinc-950/80 shadow-sm hover:shadow-md"), title: "Abrir trimestre en 3 Meses", children: [_jsx("div", { className: "text-lg font-bold", children: q.name }), _jsx("div", { className: cn("text-[10px] mt-0.5", isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"), children: q.dates }), _jsxs("div", { className: cn("mt-2 space-y-0.5 text-[10px]", isCurrent ? "text-primary-foreground/80" : "text-muted-foreground"), children: [_jsx("p", { children: q.minutes > 0 ? `${q.minutes}min meta` : 'Sin metas' }), _jsx("p", { children: q.books > 0 || q.songs > 0 ? `${q.books} libros · ${q.songs} canciones` : 'Sin libros/canciones' })] })] }, q.id));
                            }) }), _jsx(PeriodSections, { scope: "year", year: year, quarter: currentQuarter })] })) : (_jsx(ResultadosPlaceholder, {}))] }) }));
}
