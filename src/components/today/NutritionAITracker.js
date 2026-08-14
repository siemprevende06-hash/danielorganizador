import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useNutritionAI, DAILY_GOALS } from '@/hooks/useNutritionAI';
import { useMealTracking } from '@/hooks/useMealTracking';
import { UtensilsCrossed, Plus, Loader2, Target, TrendingUp, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
export const NutritionAITracker = () => {
    const { meals, loading: mealsLoading, toggleMealCompletion, getNextMeal, } = useMealTracking();
    const { loading: aiLoading, todayMeals, analyzeFood, getTodayTotals, getProgressPercentage, getRemainingCalories, deleteMeal, fetchTodayMeals, } = useNutritionAI();
    const [selectedMeal, setSelectedMeal] = useState(null);
    const [foodDescription, setFoodDescription] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    useEffect(() => {
        fetchTodayMeals();
    }, []);
    const formatTime = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };
    const handleAnalyze = async () => {
        if (!foodDescription.trim())
            return;
        await analyzeFood(foodDescription, selectedMeal || undefined);
        setFoodDescription('');
        setDialogOpen(false);
        // Also mark the meal as completed
        if (selectedMeal) {
            const meal = meals.find(m => m.type === selectedMeal);
            if (meal && !meal.completed) {
                toggleMealCompletion(meal.type);
            }
        }
    };
    const totals = getTodayTotals();
    const progress = getProgressPercentage();
    const remaining = getRemainingCalories();
    const nextMeal = getNextMeal();
    if (mealsLoading) {
        return (_jsx(Card, { children: _jsx(CardContent, { className: "pt-6", children: _jsxs("div", { className: "animate-pulse space-y-3", children: [_jsx("div", { className: "h-4 bg-muted rounded w-1/3" }), _jsx("div", { className: "h-8 bg-muted rounded" })] }) }) }));
    }
    return (_jsxs(Card, { children: [_jsx(CardHeader, { className: "pb-3", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(CardTitle, { className: "text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [_jsx(UtensilsCrossed, { className: "w-4 h-4" }), "\uD83C\uDF7D\uFE0F Nutrici\u00F3n con IA"] }), _jsxs(Badge, { variant: "outline", className: "text-xs", children: [_jsx(Target, { className: "w-3 h-3 mr-1" }), DAILY_GOALS.calories, " kcal/d\u00EDa"] })] }) }), _jsxs(CardContent, { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2 p-3 bg-primary/5 rounded-lg border border-primary/10", children: [_jsxs("div", { className: "flex items-center justify-between text-sm", children: [_jsx("span", { className: "font-medium", children: "Calor\u00EDas Hoy" }), _jsxs("span", { className: "font-bold text-lg", children: [totals.calories, "/", DAILY_GOALS.calories, " kcal"] })] }), _jsx(Progress, { value: progress.calories, className: "h-3" }), _jsxs("div", { className: "flex justify-between text-xs text-muted-foreground", children: [_jsxs("span", { children: ["\uD83E\uDD69 Prote\u00EDna: ", totals.protein, "g/", DAILY_GOALS.protein, "g"] }), _jsxs("span", { children: ["Te faltan ~", remaining, " kcal"] })] })] }), _jsx("div", { className: "space-y-2", children: meals.map((meal) => {
                            const mealDetails = todayMeals.filter(d => d.meal_tracking_id === meal.type ||
                                new Date(d.created_at).getHours() === parseInt(meal.scheduledTime.split(':')[0]));
                            const mealCalories = mealDetails.reduce((acc, d) => acc + (d.estimated_calories || 0), 0);
                            const isNext = nextMeal?.type === meal.type;
                            const now = new Date();
                            const currentMinutes = now.getHours() * 60 + now.getMinutes();
                            const [hours, minutes] = meal.scheduledTime.split(':').map(Number);
                            const mealMinutes = hours * 60 + minutes;
                            const isPast = mealMinutes < currentMinutes && !meal.completed;
                            return (_jsxs("div", { className: cn('flex items-center gap-3 p-2 rounded-md transition-colors', isNext && 'bg-primary/5 border border-primary/20', isPast && !meal.completed && 'bg-destructive/5 border border-destructive/20', meal.completed && 'opacity-60'), children: [_jsx(Checkbox, { checked: meal.completed, onCheckedChange: () => toggleMealCompletion(meal.type), className: "h-5 w-5" }), _jsx("span", { className: "text-sm font-mono text-muted-foreground w-16", children: formatTime(meal.scheduledTime) }), _jsx("span", { className: cn('text-sm flex-1', meal.completed && 'line-through text-muted-foreground'), children: meal.label }), mealCalories > 0 && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [mealCalories, " kcal"] })), _jsxs(Dialog, { open: dialogOpen && selectedMeal === meal.type, onOpenChange: (open) => {
                                            setDialogOpen(open);
                                            if (open)
                                                setSelectedMeal(meal.type);
                                        }, children: [_jsx(DialogTrigger, { asChild: true, children: _jsx(Button, { variant: "ghost", size: "sm", className: "h-7 px-2", onClick: () => setSelectedMeal(meal.type), children: _jsx(Plus, { className: "w-4 h-4" }) }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsxs(DialogTitle, { children: ["Registrar ", meal.label] }) }), _jsxs("div", { className: "space-y-4 pt-4", children: [_jsxs("div", { children: [_jsx("label", { className: "text-sm font-medium", children: "\u00BFQu\u00E9 comiste?" }), _jsx(Input, { placeholder: "Ej: 2 huevos, 2 tostadas, caf\u00E9 con leche", value: foodDescription, onChange: (e) => setFoodDescription(e.target.value), className: "mt-2" })] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "La IA estimar\u00E1 las calor\u00EDas y macros para tu meta de aumento de peso." }), _jsx(Button, { onClick: handleAnalyze, disabled: aiLoading || !foodDescription.trim(), className: "w-full", children: aiLoading ? (_jsxs(_Fragment, { children: [_jsx(Loader2, { className: "w-4 h-4 mr-2 animate-spin" }), "Analizando..."] })) : ('🤖 Analizar con IA') })] })] })] })] }, meal.type));
                        }) }), todayMeals.length > 0 && (_jsxs("div", { className: "border-t pt-3 space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Registros de hoy:" }), todayMeals.map((detail) => (_jsxs("div", { className: "flex items-center justify-between text-xs bg-muted/50 p-2 rounded", children: [_jsx("span", { className: "truncate flex-1", children: detail.description }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs(Badge, { variant: "outline", className: "text-xs", children: [detail.estimated_calories, " kcal"] }), _jsx(Button, { variant: "ghost", size: "sm", className: "h-6 w-6 p-0", onClick: () => deleteMeal(detail.id), children: _jsx(Trash2, { className: "w-3 h-3 text-destructive" }) })] })] }, detail.id)))] })), _jsxs("div", { className: "flex items-center justify-between text-xs text-muted-foreground pt-2 border-t", children: [_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(TrendingUp, { className: "w-3 h-3" }), _jsx("span", { children: "Meta mensual: +2.2kg" })] }), _jsx("span", { children: "50kg \u2192 70kg" })] })] })] }));
};
