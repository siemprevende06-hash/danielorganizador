import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, addDays } from "date-fns";
import { es } from "date-fns/locale";
import { ShoppingCart, ChevronLeft, ChevronRight, Snowflake, Thermometer, Archive } from "lucide-react";
import { Link } from "react-router-dom";
import { useRecipes, useMealPlan } from "@/hooks/useRecipes";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";
const SLOTS = [
    { id: "desayuno", label: "Desayuno" },
    { id: "merienda-1", label: "Merienda 1" },
    { id: "almuerzo", label: "Almuerzo" },
    { id: "merienda-2", label: "Merienda 2" },
    { id: "comida", label: "Comida" },
];
const storageIcons = {
    refrigerator: Snowflake,
    freezer: Thermometer,
    shelf: Archive,
};
export function WeeklyMealPlan() {
    const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
    const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { recipes } = useRecipes();
    const { plan, assign } = useMealPlan(startStr, endStr);
    const { products } = useGroceryProducts();
    const shoppingItems = useShoppingGenerator(plan, products);
    const getRecipeFor = (date, slot) => plan.find(p => p.plan_date === date && p.meal_slot === slot);
    const totalToBuy = shoppingItems.filter(i => i.toBuy > 0).length;
    const totalCost = shoppingItems.reduce((s, i) => s + i.estimatedCost, 0);
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "icon", variant: "ghost", onClick: () => setWeekStart(addDays(weekStart, -7)), children: _jsx(ChevronLeft, { className: "h-4 w-4" }) }), _jsxs("span", { className: "text-sm font-semibold", children: ["Semana del ", format(weekStart, "d MMM", { locale: es })] }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => setWeekStart(addDays(weekStart, 7)), children: _jsx(ChevronRight, { className: "h-4 w-4" }) })] }), _jsx(Link, { to: `/shopping-list`, children: _jsxs(Button, { size: "sm", variant: "outline", children: [_jsx(ShoppingCart, { className: "h-3 w-3 mr-1" }), "Lista (", totalToBuy, ")"] }) })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("div", { className: "min-w-[700px] grid grid-cols-[80px_repeat(7,1fr)] gap-1 text-xs", children: [_jsx("div", {}), days.map(d => (_jsx("div", { className: "text-center font-semibold capitalize p-1", children: format(d, "EEE d", { locale: es }) }, d.toISOString()))), SLOTS.map(slot => (_jsxs(_Fragment, { children: [_jsx("div", { className: "font-medium py-2", children: slot.label }, slot.id), days.map(d => {
                                    const ds = format(d, "yyyy-MM-dd");
                                    const entry = getRecipeFor(ds, slot.id);
                                    return (_jsx("div", { children: _jsxs(Select, { value: entry?.recipe_id || "__none__", onValueChange: (v) => assign(ds, slot.id, v === "__none__" ? null : v), children: [_jsx(SelectTrigger, { className: "h-12 text-[10px]", children: _jsx(SelectValue, { placeholder: "\u2014" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "__none__", children: "\u2014" }), recipes.map(r => (_jsx(SelectItem, { value: r.id, children: r.name }, r.id)))] })] }) }, ds + slot.id));
                                })] })))] }) }), shoppingItems.length > 0 && (_jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center justify-between mb-2", children: [_jsx("p", { className: "text-xs font-semibold", children: "Resumen de compras semanal" }), totalCost > 0 && _jsxs("p", { className: "text-xs text-muted-foreground", children: ["$", totalCost.toFixed(2)] })] }), _jsx("div", { className: "space-y-1 max-h-60 overflow-y-auto", children: shoppingItems.map((it, i) => {
                            const Icon = storageIcons[it.storageType] || Archive;
                            return (_jsxs("div", { className: "flex items-center gap-2 text-xs border-b py-1", children: [_jsx(Icon, { className: "h-3 w-3 text-muted-foreground shrink-0" }), _jsx("span", { className: "flex-1 capitalize truncate font-medium", children: it.productName }), _jsxs("span", { className: "text-muted-foreground shrink-0", children: [it.totalNeeded.toFixed(1), " ", it.unit] }), it.inStock > 0 && (_jsxs("span", { className: "text-green-600 shrink-0", children: ["(stock: ", it.inStock, ")"] })), _jsxs("span", { className: "font-bold shrink-0", children: [it.toBuy.toFixed(1), " ", it.unit] }), it.estimatedCost > 0 && (_jsxs("span", { className: "text-muted-foreground shrink-0", children: ["$", it.estimatedCost.toFixed(2)] }))] }, i));
                        }) }), _jsx(Link, { to: `/shopping-list`, className: "block mt-2", children: _jsxs(Button, { size: "sm", variant: "outline", className: "w-full", children: [_jsx(ShoppingCart, { className: "h-3 w-3 mr-1" }), "Ir a la lista de compra"] }) })] }))] }));
}
