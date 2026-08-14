import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon, Save, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { useDailyReview } from "@/hooks/useDailyReview";
import { DailyStatsOverview } from "@/components/self-review/DailyStatsOverview";
import { BlockRatingList } from "@/components/self-review/BlockRatingList";
import { ReflectionForm } from "@/components/self-review/ReflectionForm";
import { OverallRating } from "@/components/self-review/OverallRating";
import { PillarProgressGrid } from "@/components/pillars/PillarProgressGrid";
import { SecondaryGoalsProgress } from "@/components/pillars/SecondaryGoalsProgress";
import { DailyPillarSummary } from "@/components/pillars/DailyPillarSummary";
import { usePillarProgress } from "@/hooks/usePillarProgress";
import { PurposeVisualization } from "@/components/self-review/PurposeVisualization";
import { WeeklyReviewStats } from "@/components/self-review/WeeklyReviewStats";
import { cn } from "@/lib/utils";
export default function DailySelfReview() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [pillarRatings, setPillarRatings] = useState([]);
    const [viewMode, setViewMode] = useState("day");
    const dateStr = selectedDate.toISOString().split('T')[0];
    const { pillars, secondaryGoals, overallScore, loading: pillarsLoading } = usePillarProgress(selectedDate);
    const { review, systemsTracking, loading, saving, saveReview, updateBlockRating } = useDailyReview(dateStr);
    const navigateDate = (days) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(newDate.getDate() + days);
        if (newDate <= new Date()) {
            setSelectedDate(newDate);
        }
    };
    const handleSave = () => {
        if (review) {
            saveReview({
                whatWentWell: review.whatWentWell,
                whatCouldBeBetter: review.whatCouldBeBetter,
                tomorrowPlan: review.tomorrowPlan,
                overallRating: review.overallRating
            });
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsx("div", { className: "animate-pulse h-12 bg-muted rounded w-1/3" }), _jsx("div", { className: "animate-pulse h-64 bg-muted rounded" }), _jsx("div", { className: "animate-pulse h-64 bg-muted rounded" })] }) }));
    }
    if (!review) {
        return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20", children: _jsx("div", { className: "max-w-4xl mx-auto text-center py-12", children: _jsx("p", { className: "text-muted-foreground", children: "No se pudo cargar la autocr\u00EDtica" }) }) }));
    }
    const isToday = dateStr === new Date().toISOString().split('T')[0];
    return (_jsx("div", { className: "min-h-screen bg-background p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-2xl md:text-3xl font-bold text-foreground", children: ["Autocr\u00EDtica ", viewMode === 'week' ? 'Semanal' : 'Diaria'] }), _jsx("p", { className: "text-muted-foreground text-sm mt-1", children: viewMode === 'week' ? 'Estadísticas reales de la semana' : 'Califica tu día honestamente' })] }), _jsxs("div", { className: "flex items-center gap-1 bg-muted rounded-lg p-0.5", children: [_jsx("button", { onClick: () => setViewMode("day"), className: cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all", viewMode === "day"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"), children: "Hoy" }), _jsxs("button", { onClick: () => setViewMode("week"), className: cn("px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1", viewMode === "week"
                                        ? "bg-background text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"), children: [_jsx(CalendarDays, { className: "w-3 h-3" }), "Semana"] })] })] }), viewMode === "day" && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", size: "icon", onClick: () => navigateDate(-1), children: _jsx(ChevronLeft, { className: "w-4 h-4" }) }), _jsxs(Popover, { children: [_jsx(PopoverTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(CalendarIcon, { className: "w-4 h-4" }), isToday ? 'Hoy' : format(selectedDate, 'd MMM', { locale: es })] }) }), _jsx(PopoverContent, { className: "w-auto p-0", align: "end", children: _jsx(Calendar, { mode: "single", selected: selectedDate, onSelect: (date) => date && setSelectedDate(date), disabled: (date) => date > new Date(), initialFocus: true }) })] }), _jsx(Button, { variant: "outline", size: "icon", onClick: () => navigateDate(1), disabled: isToday, children: _jsx(ChevronRight, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "text-center py-2", children: _jsx("p", { className: "text-lg font-medium text-foreground", children: format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es }) }) })] })), viewMode === "day" ? (_jsxs(_Fragment, { children: [_jsx(PurposeVisualization, {}), _jsx(DailyStatsOverview, { systemsTracking: systemsTracking, blocksCompleted: review.blocksCompleted, blocksTotal: review.blocksTotal, tasksCompleted: review.tasksCompleted, tasksTotal: review.tasksTotal, habitsCompleted: review.habitsCompleted, habitsTotal: review.habitsTotal, focusMinutes: review.focusMinutes }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(PillarProgressGrid, { pillars: pillars, overallScore: overallScore, loading: pillarsLoading }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(SecondaryGoalsProgress, { goals: secondaryGoals, loading: pillarsLoading }) }) }), _jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsx(DailyPillarSummary, { pillars: pillars, ratings: pillarRatings, onRatingChange: (pillarId, rating) => {
                                        setPillarRatings(prev => {
                                            const existing = prev.find(r => r.pillarId === pillarId);
                                            if (existing) {
                                                return prev.map(r => r.pillarId === pillarId ? { ...r, rating } : r);
                                            }
                                            return [...prev, { pillarId, rating, notes: '' }];
                                        });
                                    }, onNotesChange: (pillarId, notes) => {
                                        setPillarRatings(prev => {
                                            const existing = prev.find(r => r.pillarId === pillarId);
                                            if (existing) {
                                                return prev.map(r => r.pillarId === pillarId ? { ...r, notes } : r);
                                            }
                                            return [...prev, { pillarId, rating: 0, notes }];
                                        });
                                    } }) }) }), _jsx(BlockRatingList, { blockRatings: review.blockRatings, onRatingChange: updateBlockRating }), _jsx(ReflectionForm, { whatWentWell: review.whatWentWell, whatCouldBeBetter: review.whatCouldBeBetter, tomorrowPlan: review.tomorrowPlan, onWhatWentWellChange: (value) => saveReview({ whatWentWell: value }), onWhatCouldBeBetterChange: (value) => saveReview({ whatCouldBeBetter: value }), onTomorrowPlanChange: (value) => saveReview({ tomorrowPlan: value }) }), _jsx(OverallRating, { rating: review.overallRating, onRatingChange: (rating) => saveReview({ overallRating: rating }) }), _jsx("div", { className: "sticky bottom-20 md:bottom-4 flex justify-center", children: _jsxs(Button, { onClick: handleSave, disabled: saving, className: "gap-2 shadow-lg", size: "lg", children: [_jsx(Save, { className: "w-4 h-4" }), saving ? 'Guardando...' : 'Guardar Autocrítica'] }) })] })) : (_jsx(WeeklyReviewStats, { weekStart: selectedDate }))] }) }));
}
