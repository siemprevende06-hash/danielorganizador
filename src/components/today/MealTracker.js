import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useMealTracking } from '@/hooks/useMealTracking';
import { UtensilsCrossed, Clock, Target, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
export const MealTracker = () => {
    const { meals, loading, toggleMealCompletion, getNextMeal, getTimeUntilNextMeal, completedCount, totalCount, progressPercentage, goals, } = useMealTracking();
    const nextMeal = getNextMeal();
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    const formatMinutes = (mins) => {
        if (mins < 60)
            return `${mins} min`;
        const hours = Math.floor(mins / 60);
        const remainingMins = mins % 60;
        return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`;
    };
    if (loading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-8 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(UtensilsCrossed, { className: "w-4 h-4" }), "Alimentaci\u00F3n"] }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [_jsx(Target, { className: "w-3 h-3 mr-1" }), goals.currentWeight, "kg \u2192 ", goals.targetWeight, "kg"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [nextMeal && (_jsx("div", { className: "bg-primary/10 border border-primary/20 rounded-lg p-3", children: _jsxs("div", { className: "flex items-center gap-2 text-sm", children: [_jsx(Clock, { className: "w-4 h-4 text-primary" }), _jsx("span", { className: "font-medium", children: "Pr\u00F3xima comida:" }), _jsx("span", { className: "text-primary font-semibold", children: nextMeal.label }), _jsxs("span", { className: "text-muted-foreground", children: ["en ", formatMinutes(getTimeUntilNextMeal(nextMeal)), " (", formatTime(nextMeal.scheduledTime), ")"] })] }) })), _jsx("div", { className: "space-y-2", children: meals.map((meal, index) => {
                            const isNext = nextMeal?.type === meal.type;
                            const now = new Date();
                            const currentMinutes = now.getHours() * 60 + now.getMinutes();
                            const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
                            const mealMinutes = hours * 60 + minutes;
                            const isPast = mealMinutes < currentMinutes && !meal.completed;
                            return (_jsxs("div", { className: cn('flex items-center gap-3 p-2 rounded-md transition-colors', isNext && 'bg-primary/5 border border-primary/20', isPast && !meal.completed && 'bg-destructive/5 border border-destructive/20', meal.completed && 'opacity-60'), children: [_jsx(Checkbox, { checked: meal.completed, onCheckedChange: () => toggleMealCompletion(meal.type), className: "h-5 w-5" }), _jsx("span", { className: "text-sm font-mono text-muted-foreground w-16", children: formatTime(meal.scheduledTime) }), _jsx("span", { className: cn('text-sm flex-1', meal.completed && 'line-through text-muted-foreground'), children: meal.label }), isNext && (_jsx(Badge, { variant: "default", className: "text-xs", children: "Pr\u00F3xima" })), isPast && !meal.completed && (_jsx(Badge, { variant: "destructive", className: "text-xs", children: "Atrasada" })), meal.completed && (_jsx("span", { className: "text-xs text-green-600", children: "\u2713" }))] }, meal.type));
                        }) }), _jsxs("div", { className: "space-y-2 pt-2 border-t", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso hoy" }), _jsxs("span", { className: "font-medium", children: [completedCount, "/", totalCount, " comidas (", progressPercentage, "%)"] })] }), _jsx(Progress, { value: progressPercentage, className: "h-2" })] }), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground pt-2 border-t", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), _jsxs("span", { children: ["Meta mensual: +", goals.monthlyGain, "kg"] })] }), _jsxs("span", { children: ["Faltan ", goals.targetWeight - goals.currentWeight, "kg para tu objetivo"] })] })] })] }));
};
