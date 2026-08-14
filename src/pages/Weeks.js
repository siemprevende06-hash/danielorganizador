import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useRoutineBlocks } from "@/hooks/useRoutineBlocks";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Calendar, Target, Clock, CheckCircle2, Circle, GraduationCap, Rocket, FolderKanban, Dumbbell, Languages, Piano, Guitar, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { format, addDays, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
const CATEGORIES = [
    { id: "universidad", name: "Universidad", icon: GraduationCap, color: "text-blue-500" },
    { id: "emprendimiento", name: "Emprendimiento", icon: Rocket, color: "text-purple-500" },
    { id: "proyectos", name: "Proyectos", icon: FolderKanban, color: "text-green-500" },
    { id: "gym", name: "Gym", icon: Dumbbell, color: "text-red-500" },
    { id: "idiomas", name: "Idiomas", icon: Languages, color: "text-yellow-500" },
    { id: "piano", name: "Piano", icon: Piano, color: "text-pink-500" },
    { id: "guitarra", name: "Guitarra", icon: Guitar, color: "text-orange-500" },
    { id: "lectura", name: "Lectura", icon: BookOpen, color: "text-teal-500" },
];
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const ROUTINE_GOAL_MAP = {
    "idiomas": ["Idiomas"],
    "gym": ["Gym"],
    "emprendimiento": ["Focus Emprendimiento", "Deep Work"],
    "universidad": ["Focus Universidad", "Deep Work"],
    "lectura": ["Lectura"],
    "piano": ["Guitarra & Piano"],
    "guitarra": ["Guitarra & Piano"],
};
export default function Weeks() {
    const [goals, setGoals] = useState([]);
    const [weeklyPlans, setWeeklyPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuarter, setSelectedQuarter] = useState(1);
    const [selectedWeek, setSelectedWeek] = useState(1);
    const { blocks } = useRoutineBlocks();
    useEffect(() => {
        fetchData();
    }, [selectedQuarter]);
    const fetchData = async () => {
        try {
            const [goalsRes, plansRes] = await Promise.all([
                supabase
                    .from("twelve_week_goals")
                    .select("id, quarter, title, category, target_value, progress_percentage")
                    .eq("year", 2026)
                    .eq("quarter", selectedQuarter),
                supabase
                    .from("weekly_plans")
                    .select("*")
                    .eq("year", 2026)
                    .eq("quarter", selectedQuarter),
            ]);
            if (goalsRes.error)
                throw goalsRes.error;
            if (plansRes.error)
                throw plansRes.error;
            setGoals(goalsRes.data || []);
            setWeeklyPlans(plansRes.data || []);
        }
        catch (error) {
            console.error("Error fetching data:", error);
            toast.error("Error al cargar datos");
        }
        finally {
            setLoading(false);
        }
    };
    const getWeekDates = () => {
        const quarterStart = new Date(2026, (selectedQuarter - 1) * 3, 1);
        const weekStart = addDays(startOfWeek(quarterStart, { weekStartsOn: 1 }), (selectedWeek - 1) * 7);
        return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    };
    const getCategoryInfo = (categoryId) => {
        return CATEGORIES.find(c => c.id === categoryId);
    };
    const getBlocksForGoal = (category) => {
        const blockNames = ROUTINE_GOAL_MAP[category] || [];
        return blocks.filter(b => blockNames.some(name => b.title.includes(name)));
    };
    const getRecommendedDailyPlan = () => {
        const plan = [];
        blocks.forEach(block => {
            let matchedCategory = "";
            Object.entries(ROUTINE_GOAL_MAP).forEach(([cat, blockNames]) => {
                if (blockNames.some(name => block.title.includes(name))) {
                    matchedCategory = cat;
                }
            });
            if (matchedCategory) {
                const goal = goals.find(g => g.category === matchedCategory);
                if (goal) {
                    plan.push({
                        block: block.title,
                        time: `${block.startTime} - ${block.endTime}`,
                        goal: goal.title,
                        category: matchedCategory,
                    });
                }
            }
        });
        return plan;
    };
    const getTotalBlockMinutes = () => {
        let total = 0;
        blocks.forEach(block => {
            const [startH, startM] = block.startTime.split(":").map(Number);
            const [endH, endM] = block.endTime.split(":").map(Number);
            let startMinutes = startH * 60 + startM;
            let endMinutes = endH * 60 + endM;
            if (endMinutes < startMinutes)
                endMinutes += 24 * 60;
            total += endMinutes - startMinutes;
        });
        return total;
    };
    const formatMinutes = (mins) => {
        const hours = Math.floor(mins / 60);
        const minutes = mins % 60;
        return `${hours}h ${minutes}m`;
    };
    if (loading) {
        return (_jsx("div", { className: "container mx-auto px-4 pt-20 pb-8 flex items-center justify-center min-h-screen", children: _jsx("div", { className: "animate-spin rounded-full h-8 w-8 border-b-2 border-primary" }) }));
    }
    const weekDates = getWeekDates();
    const recommendedPlan = getRecommendedDailyPlan();
    return (_jsxs("div", { className: "container mx-auto px-4 pt-20 pb-8 space-y-6", style: { paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }, children: [_jsxs("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h1", { className: "text-3xl font-bold text-foreground flex items-center gap-2", children: [_jsx(Calendar, { className: "h-8 w-8 text-primary" }), "Semana ", selectedWeek, " de 12"] }), _jsxs("p", { className: "text-muted-foreground mt-1", children: ["Q", selectedQuarter, " 2026 \u2022 ", format(weekDates[0], "d MMM", { locale: es }), " - ", format(weekDates[6], "d MMM", { locale: es })] })] }), _jsx(Link, { to: "/12-week-year", children: _jsxs(Button, { variant: "outline", className: "gap-2", children: [_jsx(Target, { className: "h-4 w-4" }), "Ver Metas del A\u00F1o"] }) })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSelectedWeek(Math.max(1, selectedWeek - 1)), disabled: selectedWeek === 1, children: [_jsx(ChevronLeft, { className: "h-4 w-4" }), "Anterior"] }), _jsx("div", { className: "flex gap-1 overflow-x-auto px-4", children: Array.from({ length: 12 }, (_, i) => i + 1).map((week) => (_jsx(Button, { variant: selectedWeek === week ? "default" : "ghost", size: "sm", className: "w-8 h-8 p-0 flex-shrink-0", onClick: () => setSelectedWeek(week), children: week }, week))) }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setSelectedWeek(Math.min(12, selectedWeek + 1)), disabled: selectedWeek === 12, children: ["Siguiente", _jsx(ChevronRight, { className: "h-4 w-4" })] })] }), _jsx("div", { className: "flex gap-2", children: [1, 2, 3, 4].map((q) => (_jsxs(Button, { variant: selectedQuarter === q ? "default" : "outline", size: "sm", onClick: () => {
                        setSelectedQuarter(q);
                        setSelectedWeek(1);
                    }, children: ["Q", q] }, q))) }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-lg", children: "Vista de 7 D\u00EDas" }) }), _jsxs(CardContent, { children: [_jsx("div", { className: "grid grid-cols-7 gap-2", children: weekDates.map((date, idx) => (_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "text-xs text-muted-foreground", children: DAYS[idx] }), _jsx("div", { className: `text-sm font-medium rounded-full w-8 h-8 flex items-center justify-center mx-auto ${format(date, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
                                                ? "bg-primary text-primary-foreground"
                                                : ""}`, children: format(date, "d") })] }, idx))) }), _jsx("div", { className: "mt-4 grid grid-cols-7 gap-2", children: weekDates.map((date, idx) => (_jsxs("div", { className: "min-h-[100px] border rounded-lg p-2 text-xs space-y-1", children: [blocks.slice(0, 3).map((block, bIdx) => (_jsxs("div", { className: "flex items-center gap-1 text-muted-foreground", children: [_jsx(Circle, { className: "h-2 w-2" }), _jsx("span", { className: "truncate", children: block.title })] }, bIdx))), blocks.length > 3 && (_jsxs("div", { className: "text-muted-foreground", children: ["+", blocks.length - 3, " m\u00E1s"] }))] }, idx))) })] })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Target, { className: "h-5 w-5 text-primary" }), "Progreso de Metas Q", selectedQuarter] }) }), _jsx(CardContent, { children: goals.length === 0 ? (_jsxs("p", { className: "text-center text-muted-foreground py-4", children: ["No hay metas para este trimestre. ", _jsx(Link, { to: "/12-week-year", className: "text-primary underline", children: "Config\u00FAralas aqu\u00ED" })] })) : (_jsx("div", { className: "space-y-3", children: goals.map((goal) => {
                                const catInfo = getCategoryInfo(goal.category);
                                const Icon = catInfo?.icon || Target;
                                return (_jsxs("div", { className: "flex items-center gap-3", children: [_jsx(Icon, { className: `h-4 w-4 flex-shrink-0 ${catInfo?.color || "text-muted-foreground"}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between gap-2", children: [_jsx("span", { className: "text-sm font-medium truncate", children: goal.title }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [goal.progress_percentage, "%"] })] }), _jsx(Progress, { value: goal.progress_percentage, className: "h-1.5 mt-1" })] })] }, goal.id));
                            }) })) })] }), _jsxs(Card, { children: [_jsxs(CardHeader, { children: [_jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(Clock, { className: "h-5 w-5 text-primary" }), "Plan Diario Recomendado"] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: ["Basado en tu rutina \u2022 ", formatMinutes(getTotalBlockMinutes()), " de trabajo enfocado"] })] }), _jsx(CardContent, { children: _jsx(ScrollArea, { className: "h-[300px]", children: _jsx("div", { className: "space-y-2", children: recommendedPlan.length === 0 ? (_jsx("p", { className: "text-center text-muted-foreground py-4", children: "Configura tus metas para ver el plan recomendado" })) : (recommendedPlan.map((item, idx) => {
                                    const catInfo = getCategoryInfo(item.category);
                                    const Icon = catInfo?.icon || Target;
                                    return (_jsxs("div", { className: "flex items-center gap-3 p-3 rounded-lg border bg-card", children: [_jsx(Icon, { className: `h-5 w-5 flex-shrink-0 ${catInfo?.color || "text-muted-foreground"}` }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("div", { className: "font-medium text-sm", children: item.block }), _jsx("div", { className: "text-xs text-muted-foreground", children: item.goal })] }), _jsx(Badge, { variant: "outline", className: "text-xs", children: item.time })] }, idx));
                                })) }) }) })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "text-lg flex items-center gap-2", children: [_jsx(CheckCircle2, { className: "h-5 w-5 text-primary" }), "Checklist Semanal"] }) }), _jsx(CardContent, { children: _jsx("div", { className: "space-y-3", children: goals.slice(0, 5).map((goal) => {
                                const catInfo = getCategoryInfo(goal.category);
                                const Icon = catInfo?.icon || Target;
                                return (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors", children: [_jsx(Checkbox, { id: goal.id }), _jsx(Icon, { className: `h-4 w-4 ${catInfo?.color || "text-muted-foreground"}` }), _jsxs("label", { htmlFor: goal.id, className: "flex-1 text-sm cursor-pointer", children: ["Avanzar en: ", goal.title] })] }, goal.id));
                            }) }) })] })] }));
}
