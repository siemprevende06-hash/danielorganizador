import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ShoppingCart, Plus, Trash2, Sparkles, Snowflake, Thermometer, Archive, DollarSign } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { useMealPlan } from "@/hooks/useRecipes";
import { useShoppingGenerator } from "@/hooks/useShoppingGenerator";
import { startOfWeek, addDays, format } from "date-fns";
import { toast } from "sonner";
const storageIcons = { refrigerator: Snowflake, freezer: Thermometer, shelf: Archive };
const storageLabels = { refrigerator: "Refri", freezer: "Congelador", shelf: "Estante" };
export default function ShoppingList() {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState("");
    const [params, setParams] = useSearchParams();
    const today = new Date().toISOString().split("T")[0];
    const [importMode, setImportMode] = useState("manual");
    const { products } = useGroceryProducts();
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const startStr = format(weekStart, "yyyy-MM-dd");
    const endStr = format(addDays(weekStart, 6), "yyyy-MM-dd");
    const { plan } = useMealPlan(startStr, endStr);
    const shoppingItems = useShoppingGenerator(plan, products);
    useEffect(() => {
        (async () => {
            const { data } = await supabase.from("daily_systems_tracking")
                .select("completions").eq("tracking_date", today).maybeSingle();
            const stored = (data?.completions || {})['shopping_list'];
            if (Array.isArray(stored))
                setItems(stored);
        })();
    }, [today]);
    const persist = async (next) => {
        setItems(next);
        const { data: row } = await supabase.from("daily_systems_tracking")
            .select("id, completions").eq("tracking_date", today).maybeSingle();
        const comp = { ...(row?.completions || {}), shopping_list: next };
        if (row?.id)
            await supabase.from("daily_systems_tracking").update({ completions: comp }).eq("id", row.id);
        else
            await supabase.from("daily_systems_tracking").upsert({ tracking_date: today, completions: comp }, { onConflict: "tracking_date" });
    };
    const addItem = () => {
        if (!newItem.trim())
            return;
        persist([...items, { id: crypto.randomUUID(), name: newItem.trim(), checked: false }]);
        setNewItem("");
    };
    const toggleItem = (id) => persist(items.map(i => i.id === id ? { ...i, checked: !i.checked } : i));
    const removeItem = (id) => persist(items.filter(i => i.id !== id));
    const clearChecked = () => persist(items.filter(i => !i.checked));
    const importFromPlan = () => {
        const additions = shoppingItems
            .filter(i => i.toBuy > 0)
            .map(i => ({
            id: crypto.randomUUID(),
            name: `${i.productName}${i.toBuy ? ` — ${i.toBuy.toFixed(2)} ${i.unit}` : ""}`,
            checked: false,
            qty: i.toBuy,
            unit: i.unit,
            productId: i.productId || undefined,
            storageType: i.storageType,
            price: i.estimatedCost,
        }));
        if (additions.length > 0) {
            persist([...items, ...additions]);
            toast.success(`Importados ${additions.length} productos del plan semanal`);
        }
    };
    const totalCost = items.filter(i => !i.checked).reduce((s, i) => s + (i.price || 0), 0);
    const unchecked = items.filter(i => !i.checked);
    const checked = items.filter(i => i.checked);
    const grouped = useMemo(() => {
        const groups = { shelf: [], refrigerator: [], freezer: [], other: [] };
        unchecked.forEach(i => {
            const st = i.storageType || "other";
            if (!groups[st])
                groups[st] = [];
            groups[st].push(i);
        });
        return groups;
    }, [unchecked]);
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/10", children: _jsx(ShoppingCart, { className: "h-7 w-7 text-green-500" }) }), _jsx("h1", { className: "text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent", children: "Lista de la Compra" })] }), _jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Button, { size: "sm", variant: importMode === "manual" ? "default" : "outline", onClick: () => setImportMode("manual"), children: "Manual" }), _jsxs(Button, { size: "sm", variant: importMode === "plan" ? "default" : "outline", onClick: () => setImportMode("plan"), children: ["Plan semanal (", shoppingItems.filter(i => i.toBuy > 0).length, ")"] })] })] }), importMode === "plan" && shoppingItems.filter(i => i.toBuy > 0).length > 0 && (_jsxs(Card, { className: "border-green-500/30", children: [_jsx(CardHeader, { className: "pb-2", children: _jsx(CardTitle, { className: "text-sm", children: "Del plan semanal \u2014 descuento stock" }) }), _jsxs(CardContent, { className: "space-y-1", children: [shoppingItems.filter(i => i.toBuy > 0).map((item, idx) => {
                                    const Icon = storageIcons[item.storageType] || Archive;
                                    return (_jsxs("div", { className: "flex items-center gap-2 text-xs border-b py-1", children: [_jsx(Icon, { className: "h-3 w-3 text-muted-foreground shrink-0" }), _jsx("span", { className: "flex-1 truncate font-medium", children: item.productName }), _jsxs("span", { className: "text-muted-foreground shrink-0", children: [item.totalNeeded.toFixed(1), " ", item.unit] }), item.inStock > 0 && (_jsxs("span", { className: "text-green-600 shrink-0", children: ["(stock: ", item.inStock, ")"] })), _jsxs("span", { className: "font-bold shrink-0", children: [item.toBuy.toFixed(1), " ", item.unit] }), item.estimatedCost > 0 && (_jsxs("span", { className: "text-muted-foreground shrink-0", children: ["$", item.estimatedCost.toFixed(2)] }))] }, idx));
                                }), _jsxs(Button, { size: "sm", className: "w-full mt-2", onClick: importFromPlan, children: [_jsx(ShoppingCart, { className: "h-3 w-3 mr-1" }), "A\u00F1adir a la lista"] })] })] })), importMode === "manual" && (_jsx(Card, { children: _jsx(CardContent, { className: "p-4", children: _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { placeholder: "A\u00F1adir producto...", value: newItem, onChange: (e) => setNewItem(e.target.value), onKeyDown: (e) => e.key === "Enter" && addItem() }), _jsxs(Button, { onClick: addItem, disabled: !newItem.trim(), children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "A\u00F1adir"] })] }) }) })), unchecked.length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3 flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg", children: ["Pendientes (", unchecked.length, ")"] }), totalCost > 0 && (_jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [_jsx(DollarSign, { className: "h-3 w-3" }), "$", totalCost.toFixed(2)] }))] }), _jsx(CardContent, { className: "space-y-2", children: Object.entries(grouped).map(([st, stItems]) => {
                                if (stItems.length === 0)
                                    return null;
                                const Icon = storageIcons[st] || Archive;
                                const label = storageLabels[st] || st;
                                return (_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-1", children: [_jsx(Icon, { className: "h-3 w-3" }), _jsx("span", { children: label }), _jsxs("span", { children: ["(", stItems.length, ")"] })] }), stItems.map(item => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group", children: [_jsx(Checkbox, { checked: item.checked, onCheckedChange: () => toggleItem(item.id) }), _jsx("span", { className: "flex-1 text-sm", children: item.name }), item.price ? _jsxs("span", { className: "text-[10px] text-muted-foreground", children: ["$", item.price.toFixed(2)] }) : null, _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 opacity-0 group-hover:opacity-100", onClick: () => removeItem(item.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground" }) })] }, item.id)))] }, st));
                            }) })] })), checked.length > 0 && (_jsxs(Card, { children: [_jsxs(CardHeader, { className: "pb-3 flex-row items-center justify-between", children: [_jsxs(CardTitle, { className: "text-lg", children: ["Comprados (", checked.length, ")"] }), _jsx(Button, { size: "sm", variant: "ghost", onClick: clearChecked, children: "Limpiar" })] }), _jsx(CardContent, { className: "space-y-2", children: checked.map(item => (_jsxs("div", { className: "flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 group", children: [_jsx(Checkbox, { checked: item.checked, onCheckedChange: () => toggleItem(item.id) }), _jsx("span", { className: cn("flex-1 text-sm line-through text-muted-foreground"), children: item.name }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 opacity-0 group-hover:opacity-100", onClick: () => removeItem(item.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-muted-foreground" }) })] }, item.id))) })] })), items.length === 0 && (_jsx(Card, { children: _jsxs(CardContent, { className: "p-8 text-center text-muted-foreground", children: [_jsx(Sparkles, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }), _jsx("p", { children: "Tu lista est\u00E1 vac\u00EDa" }), _jsx("p", { className: "text-sm", children: "Ve a la pesta\u00F1a \"Plan semanal\" o a\u00F1ade manualmente" }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-3", asChild: true, children: _jsx(Link, { to: "/alimentacion", children: "Ir a Alimentaci\u00F3n" }) })] }) }))] }) }));
}
