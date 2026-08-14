import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Camera, Utensils, Droplets, Flame, Beef, Wheat, Apple, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useNutritionAI } from "@/hooks/useNutritionAI";
import { RecipeManager } from "@/components/alimentacion/RecipeManager";
import { WeeklyMealPlan } from "@/components/alimentacion/WeeklyMealPlan";
import { ImageLightbox } from "@/components/ImageLightbox";
const MEALS = [
    { id: "pre-entreno", name: "Pre-entreno", time: "5:30 AM" },
    { id: "desayuno", name: "Desayuno", time: "8:00 AM" },
    { id: "merienda-1", name: "Merienda 1", time: "10:30 AM" },
    { id: "almuerzo", name: "Almuerzo", time: "1:20 PM" },
    { id: "merienda-2", name: "Merienda 2", time: "4:00 PM" },
    { id: "comida", name: "Comida", time: "7:00 PM" },
    { id: "antes-dormir", name: "Antes de Dormir", time: "8:40 PM" },
];
function MacroProgressBar({ label, current, goal, icon, color }) {
    const pct = Math.min(Math.round((current / goal) * 100), 100);
    const barColor = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-yellow-500" : color;
    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between text-[10px]", children: [_jsxs("span", { className: "flex items-center gap-1 text-muted-foreground", children: [icon, " ", label] }), _jsxs("span", { className: "font-medium", children: [current, "/", goal, _jsx("span", { className: "text-muted-foreground ml-0.5", children: label === "Calorías" ? "" : "g" })] })] }), _jsx(Progress, { value: pct, className: "h-1.5", indicatorClassName: barColor })] }));
}
export default function Alimentacion() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [photos, setPhotos] = useState([]);
    const [lightbox, setLightbox] = useState(null);
    const { uploadImage, deleteImage, uploading } = useImageUpload();
    const nutritionAI = useNutritionAI();
    const [foodInputs, setFoodInputs] = useState({});
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const isToday = dateStr === format(new Date(), "yyyy-MM-dd");
    useEffect(() => {
        loadData();
        if (isToday) {
            nutritionAI.fetchTodayMeals();
        }
    }, [selectedDate]);
    const loadData = async () => {
        setLoading(true);
        const start = format(subDays(selectedDate, 30), "yyyy-MM-dd");
        const { data } = await supabase
            .from("daily_systems_tracking")
            .select("tracking_date, meal_photos, water_data, completions")
            .gte("tracking_date", start)
            .lte("tracking_date", dateStr)
            .order("tracking_date", { ascending: false });
        setEntries(data || []);
        const { data: photoRows } = await supabase
            .from("meal_photos")
            .select("id, tracking_date, meal_id, photo_url")
            .gte("tracking_date", start)
            .lte("tracking_date", dateStr)
            .order("created_at", { ascending: true });
        setPhotos(photoRows || []);
        setLoading(false);
    };
    const todayEntry = entries.find(e => e.tracking_date === dateStr);
    const legacyMealPhotos = (todayEntry?.meal_photos || {});
    const waterData = (todayEntry?.water_data || {});
    const photosByMeal = (dateKey) => {
        const reps = {};
        for (const p of photos) {
            if (p.tracking_date !== dateKey)
                continue;
            (reps[p.meal_id] = reps[p.meal_id] || []).push(p);
        }
        return reps;
    };
    const allMealPhotos = photosByMeal(dateStr);
    const legacyPhotos = Object.entries(legacyMealPhotos).filter(([, v]) => v);
    const handlePhotoUpload = async (mealId) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file)
                return;
            const url = await uploadImage(file, "meal-photos");
            if (!url)
                return;
            await supabase
                .from("meal_photos")
                .insert({ tracking_date: dateStr, meal_id: mealId, photo_url: url });
            loadData();
        };
        input.click();
    };
    const handleDeletePhoto = async (photo) => {
        await supabase.from("meal_photos").delete().eq("id", photo.id);
        if (photo.photo_url)
            await deleteImage(photo.photo_url);
        loadData();
    };
    const waterCount = Object.values(waterData).filter(Boolean).length;
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const todayTotals = isToday ? nutritionAI.getTodayTotals() : { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const header = _jsxs("div", { className: "text-center space-y-2", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10", children: _jsx(Utensils, { className: "h-7 w-7 text-amber-500" }) }), _jsx("h1", { className: "text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent", children: "Alimentación" })] }), _jsx("p", { className: "text-sm text-muted-foreground", children: "Registro fotográfico y macros" })] });
    const dateNav = _jsxs("div", { className: "flex items-center justify-center gap-4", children: [_jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSelectedDate(d => subDays(d, 1)), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsx("span", { className: "text-lg font-semibold capitalize", children: format(selectedDate, "EEEE d 'de' MMMM", { locale: es }) }), _jsx(Button, { variant: "ghost", size: "icon", onClick: () => setSelectedDate(d => new Date(d.getTime() + 86400000)), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] });
    const summaryCard = _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Flame, { className: "h-5 w-5 text-orange-500" }), _jsx("span", { className: "text-sm font-bold", children: "Resumen Diario" })] }), _jsxs("span", { className: cn("text-xl font-bold", todayTotals.calories > nutritionAI.DAILY_GOALS.calories ? "text-red-500" : "text-foreground"), children: [todayTotals.calories, _jsxs("span", { className: "text-xs text-muted-foreground font-normal ml-1", children: ["/ ", nutritionAI.DAILY_GOALS.calories] })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsx(MacroProgressBar, { label: "Calorías", current: todayTotals.calories, goal: nutritionAI.DAILY_GOALS.calories, icon: _jsx(Flame, { className: "h-3 w-3 text-orange-500" }), color: "bg-orange-500" }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(MacroProgressBar, { label: "Proteína", current: todayTotals.protein, goal: nutritionAI.DAILY_GOALS.protein, icon: _jsx(Beef, { className: "h-3 w-3 text-red-400" }), color: "bg-red-400" }), _jsx(MacroProgressBar, { label: "Carbos", current: todayTotals.carbs, goal: nutritionAI.DAILY_GOALS.carbs, icon: _jsx(Wheat, { className: "h-3 w-3 text-amber-400" }), color: "bg-amber-400" }), _jsx(MacroProgressBar, { label: "Grasa", current: todayTotals.fat, goal: nutritionAI.DAILY_GOALS.fat, icon: _jsx(Apple, { className: "h-3 w-3 text-green-400" }), color: "bg-green-400" })] })] })] });
    const waterCard = _jsxs(Card, { className: "p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Droplets, { className: "h-5 w-5 text-blue-500" }), _jsx("span", { className: "font-medium", children: "Hidratación" }), _jsxs(Badge, { variant: "secondary", children: [waterCount, "/7 vasos"] })] })] });
    const todayTab = _jsx(TabsContent, { value: "today", className: "space-y-3 mt-4", children: MEALS.map(meal => {
        const mealPhotoRows = allMealPhotos[meal.id] || [];
        const mealLegacyPhoto = legacyPhotos.find(([id]) => id === meal.id)?.[1];
        const photoList = [
            ...mealPhotoRows.map(p => ({ id: p.id, url: p.photo_url, row: true })),
            ...(mealLegacyPhoto ? [{ id: `legacy-${meal.id}`, url: mealLegacyPhoto, row: false }] : []),
        ];
        const mealFoods = isToday ? nutritionAI.todayMeals.filter(m => m.description?.toLowerCase().includes(meal.name.toLowerCase())) : [];
        const mealCals = mealFoods.reduce((s, m) => s + (m.estimated_calories || 0), 0);
        const mealProtein = mealFoods.reduce((s, m) => s + (m.protein_grams || 0), 0);
        const mealCarbs = mealFoods.reduce((s, m) => s + (m.carbs_grams || 0), 0);
        const mealFat = mealFoods.reduce((s, m) => s + (m.fat_grams || 0), 0);
        let infoCol = _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm", children: meal.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: meal.time })] });
        if (mealFoods.length > 0) {
            infoCol = _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm", children: meal.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: meal.time }), _jsx("div", { className: "flex gap-2 mt-1 flex-wrap", children: mealFoods.map(f => (_jsxs(Badge, { variant: "secondary", className: "text-[10px] gap-1", children: [f.description, " ~", f.estimated_calories, " kcal", _jsx("button", { onClick: () => nutritionAI.deleteMeal(f.id), className: "hover:text-destructive ml-0.5", children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) })] }, f.id))) })] });
        }
        if (mealCals > 0) {
            infoCol = _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm", children: meal.name }), _jsx("p", { className: "text-xs text-muted-foreground", children: meal.time }), mealFoods.length > 0 && (_jsx("div", { className: "flex gap-2 mt-1 flex-wrap", children: mealFoods.map(f => (_jsxs(Badge, { variant: "secondary", className: "text-[10px] gap-1", children: [f.description, " ~", f.estimated_calories, " kcal", _jsx("button", { onClick: () => nutritionAI.deleteMeal(f.id), className: "hover:text-destructive ml-0.5", children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) })] }, f.id))) })), _jsxs("div", { className: "flex gap-3 mt-1.5 text-[10px] text-muted-foreground", children: [_jsxs("span", { children: [Math.round(mealCals), " kcal"] }), _jsxs("span", { children: ["P: ", Math.round(mealProtein), "g"] }), _jsxs("span", { children: ["C: ", Math.round(mealCarbs), "g"] }), _jsxs("span", { children: ["G: ", Math.round(mealFat), "g"] })] })] });
        }
        const photoUploadRow = isToday ? _jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex gap-1", children: [_jsx(Input, { placeholder: "¿Qué comiste?", value: foodInputs[meal.id] || "", onChange: e => setFoodInputs(p => ({ ...p, [meal.id]: e.target.value })), className: "h-7 w-28 text-[10px]", onKeyDown: async (e) => {
                        if (e.key === "Enter" && foodInputs[meal.id]) {
                            await nutritionAI.analyzeFood(foodInputs[meal.id]);
                            setFoodInputs(p => ({ ...p, [meal.id]: "" }));
                        }
                    } }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7", disabled: nutritionAI.loading || !foodInputs[meal.id], onClick: async () => {
                        if (foodInputs[meal.id]) {
                            await nutritionAI.analyzeFood(foodInputs[meal.id]);
                            setFoodInputs(p => ({ ...p, [meal.id]: "" }));
                        }
                    }, children: _jsx(Plus, { className: "h-3 w-3" }) })] }) ]}) : null;
        const thumbs = photoList.length > 0 ? _jsxs("div", { className: "flex items-center gap-1 flex-wrap justify-end max-w-[220px]", children: [photoList.slice(0, 4).map(p => (_jsxs("div", { key: p.id, className: "relative group", children: [_jsx("img", { src: p.url, alt: meal.name, className: "h-12 w-12 rounded-lg object-cover cursor-pointer", onClick: () => setLightbox(p.url) }), p.row && (_jsx("button", { onClick: () => handleDeletePhoto({ id: p.id, photo_url: p.url }), className: "absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-white hidden group-hover:flex items-center justify-center", children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) }))] }))), photoList.length > 4 && (_jsxs("span", { className: "text-[10px] text-muted-foreground", children: ["+", photoList.length - 4] }))] }) : null;
        const photoBtn = _jsxs("div", { className: "flex justify-end mt-1", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handlePhotoUpload(meal.id), disabled: uploading, className: "gap-1 h-7 text-[10px]", children: [_jsx(Camera, { className: "h-3 w-3" }), " ", photoList.length > 0 ? "Agregar" : "Foto"] })] });
        const actionsCol = _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [photoUploadRow, thumbs, photoBtn] });
        return _jsx(Card, { className: "overflow-hidden", children: _jsx("div", { className: "p-4", children: _jsxs("div", { className: "flex items-center gap-3", children: [infoCol, actionsCol] }) }) }, meal.id);
    }) });
    const weekTab = _jsx(TabsContent, { value: "week", className: "mt-4", children: _jsx("div", { className: "space-y-4", children: weekDays.map(day => {
        const dayStr = format(day, "yyyy-MM-dd");
        const photosForDay = photosByMeal(dayStr);
        const legacy = entries.find(e => e.tracking_date === dayStr)?.meal_photos || {};
        const photoList = [
            ...Object.entries(photosForDay).flatMap(([mealId, rows]) => rows.map(p => ({ mealId, url: p.photo_url }))),
            ...Object.entries(legacy).filter(([, v]) => v).map(([mealId, url]) => ({ mealId, url })),
        ];
        return _jsxs(Card, { className: "p-4", children: [_jsx("p", { className: "text-sm font-semibold capitalize mb-2", children: format(day, "EEEE d", { locale: es }) }), photoList.length > 0 ? (_jsx("div", { className: "flex gap-2 overflow-x-auto pb-2", children: photoList.map((p, i) => (_jsxs("div", { key: i, className: "shrink-0", children: [_jsx("img", { src: p.url, alt: p.mealId, className: "h-16 w-16 rounded-lg object-cover cursor-pointer", onClick: () => setLightbox(p.url) }), _jsx("p", { className: "text-[10px] text-center text-muted-foreground mt-1", children: MEALS.find(m => m.id === p.mealId)?.name || p.mealId })] }))) })) : (_jsx("p", { className: "text-xs text-muted-foreground", children: "Sin fotos registradas" }))] }, dayStr);
    }) }) });
    const tabs = _jsxs(Tabs, { defaultValue: "today", children: [_jsxs(TabsList, { className: "grid grid-cols-4", children: [_jsx(TabsTrigger, { value: "today", children: "Hoy" }), _jsx(TabsTrigger, { value: "week", children: "Semana" }), _jsx(TabsTrigger, { value: "recipes", children: "Recetas" }), _jsx(TabsTrigger, { value: "plan", children: "Planificar" })] }), todayTab, weekTab, _jsx(TabsContent, { value: "recipes", className: "mt-4", children: _jsx(RecipeManager, {}) }), _jsx(TabsContent, { value: "plan", className: "mt-4", children: _jsx(WeeklyMealPlan, {}) })] });
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: [_jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [header, dateNav, summaryCard, waterCard, tabs] }), lightbox && (_jsx(ImageLightbox, { src: lightbox, onClose: () => setLightbox(null) }))] }));
}