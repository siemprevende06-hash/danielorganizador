import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Save, ChevronLeft, ChevronRight, CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import { format, addWeeks, subWeeks, addMonths, subMonths, addQuarters, subQuarters } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePeriodicReview, getPeriodRange } from '@/hooks/usePeriodicReview';
import { ConsistencyOverview } from '@/components/periodic-review/ConsistencyOverview';
import { ObjectivesList } from '@/components/periodic-review/ObjectivesList';
import { ReflectionSection } from '@/components/periodic-review/ReflectionSection';
import { ScoreSummary } from '@/components/periodic-review/ScoreSummary';
function ReviewContent({ type, referenceDate }) {
    const { review, consistency, loading, saving, periodStart, periodEnd, saveReview, addObjective, updateObjective, removeObjective, updateReflection, setOverallRating } = usePeriodicReview(type, referenceDate);
    if (loading) {
        return (_jsxs("div", { className: "space-y-4", children: [_jsx("div", { className: "animate-pulse h-24 bg-muted rounded-lg" }), _jsx("div", { className: "animate-pulse h-48 bg-muted rounded-lg" })] }));
    }
    if (!review)
        return null;
    const effortScore = review.effort_objectives.length > 0
        ? Math.round(review.effort_objectives.reduce((s, o) => s + o.score, 0) / review.effort_objectives.length)
        : null;
    const resultScore = review.result_objectives.length > 0
        ? Math.round(review.result_objectives.reduce((s, o) => s + o.score, 0) / review.result_objectives.length)
        : null;
    const handleSave = () => {
        saveReview({
            effort_objectives: review.effort_objectives,
            result_objectives: review.result_objectives,
            overall_rating: review.overall_rating,
            wins: review.wins,
            struggles: review.struggles,
            lessons_learned: review.lessons_learned,
            next_period_focus: review.next_period_focus,
        });
    };
    const periodLabel = type === 'weekly' ? 'Semanal' : type === 'monthly' ? 'Mensual' : 'Trimestral';
    return (_jsxs("div", { className: "space-y-6", children: [_jsx(ScoreSummary, { effortScore: effortScore, resultScore: resultScore, overallRating: review.overall_rating, effortCount: review.effort_objectives.length, resultCount: review.result_objectives.length, onRatingChange: setOverallRating }), _jsx(ConsistencyOverview, { consistency: consistency }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsx(ObjectivesList, { type: "effort", objectives: review.effort_objectives, onAdd: obj => addObjective('effort', obj), onUpdate: (id, updates) => updateObjective('effort', id, updates), onRemove: id => removeObjective('effort', id) }), _jsx(ObjectivesList, { type: "result", objectives: review.result_objectives, onAdd: obj => addObjective('result', obj), onUpdate: (id, updates) => updateObjective('result', id, updates), onRemove: id => removeObjective('result', id) })] }), _jsx(ReflectionSection, { wins: review.wins, struggles: review.struggles, lessonsLearned: review.lessons_learned, nextPeriodFocus: review.next_period_focus, onUpdate: updateReflection, periodLabel: periodLabel }), _jsx("div", { className: "flex justify-end", children: _jsxs(Button, { onClick: handleSave, disabled: saving, size: "lg", children: [_jsx(Save, { className: "h-4 w-4 mr-2" }), saving ? 'Guardando...' : 'Guardar Autocrítica'] }) })] }));
}
export default function PeriodicReviewPage() {
    const [activeTab, setActiveTab] = useState('weekly');
    const [weekRef, setWeekRef] = useState(new Date());
    const [monthRef, setMonthRef] = useState(new Date());
    const [quarterRef, setQuarterRef] = useState(new Date());
    const refs = {
        weekly: { date: weekRef, setDate: setWeekRef },
        monthly: { date: monthRef, setDate: setMonthRef },
        quarterly: { date: quarterRef, setDate: setQuarterRef },
    };
    const navigate = (direction) => {
        const { date, setDate } = refs[activeTab];
        if (activeTab === 'weekly')
            setDate(direction > 0 ? addWeeks(date, 1) : subWeeks(date, 1));
        else if (activeTab === 'monthly')
            setDate(direction > 0 ? addMonths(date, 1) : subMonths(date, 1));
        else
            setDate(direction > 0 ? addQuarters(date, 1) : subQuarters(date, 1));
    };
    const currentRef = refs[activeTab].date;
    const { start, end } = getPeriodRange(activeTab, currentRef);
    const periodLabel = useMemo(() => {
        if (activeTab === 'weekly') {
            return `${format(start, "d MMM", { locale: es })} — ${format(end, "d MMM yyyy", { locale: es })}`;
        }
        else if (activeTab === 'monthly') {
            return format(start, "MMMM yyyy", { locale: es });
        }
        else {
            const q = Math.ceil((start.getMonth() + 1) / 3);
            return `Q${q} ${format(start, "yyyy")} (${format(start, "MMM", { locale: es })} — ${format(end, "MMM", { locale: es })})`;
        }
    }, [activeTab, start, end]);
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6 max-w-5xl", children: [_jsxs("header", { children: [_jsxs("h1", { className: "text-3xl font-bold flex items-center gap-2", children: [_jsx(CalendarRange, { className: "h-8 w-8 text-primary" }), "Autocr\u00EDtica Peri\u00F3dica"] }), _jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "Eval\u00FAa tu esfuerzo y resultados por per\u00EDodo" })] }), _jsxs(Tabs, { value: activeTab, onValueChange: v => setActiveTab(v), children: [_jsxs(TabsList, { className: "grid grid-cols-3 w-full max-w-md", children: [_jsxs(TabsTrigger, { value: "weekly", className: "gap-1", children: [_jsx(CalendarDays, { className: "h-3.5 w-3.5" }), "Semanal"] }), _jsxs(TabsTrigger, { value: "monthly", className: "gap-1", children: [_jsx(Calendar, { className: "h-3.5 w-3.5" }), "Mensual"] }), _jsxs(TabsTrigger, { value: "quarterly", className: "gap-1", children: [_jsx(CalendarRange, { className: "h-3.5 w-3.5" }), "Trimestral"] })] }), _jsxs("div", { className: "flex items-center justify-between mt-4 mb-2", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate(-1), children: _jsx(ChevronLeft, { className: "h-5 w-5" }) }), _jsx("div", { className: "text-center", children: _jsx("p", { className: "font-semibold capitalize", children: periodLabel }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => navigate(1), disabled: end > new Date(), children: _jsx(ChevronRight, { className: "h-5 w-5" }) })] }), _jsx(TabsContent, { value: "weekly", children: _jsx(ReviewContent, { type: "weekly", referenceDate: weekRef }) }), _jsx(TabsContent, { value: "monthly", children: _jsx(ReviewContent, { type: "monthly", referenceDate: monthRef }) }), _jsx(TabsContent, { value: "quarterly", children: _jsx(ReviewContent, { type: "quarterly", referenceDate: quarterRef }) })] })] }));
}
