import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { ArrowUpDown, DollarSign, TrendingDown, TrendingUp } from "lucide-react";
export function CostAnalysis({ recipes, products }) {
    const costs = useMemo(() => {
        return recipes
            .map(r => {
            const ings = r.ingredients || [];
            let totalCost = 0;
            ings.forEach(ing => {
                if (!ing.product_id)
                    return;
                const product = products.find(p => p.id === ing.product_id);
                if (!product || !product.price)
                    return;
                const unitCost = product.price / Math.max(1, product.package_quantity || 1);
                const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
                totalCost += qty * unitCost;
            });
            return {
                id: r.id,
                name: r.name,
                servings: r.servings || 1,
                totalCost,
                costPerServing: (r.servings || 1) > 0 ? totalCost / (r.servings || 1) : totalCost,
            };
        })
            .filter(c => c.totalCost > 0)
            .sort((a, b) => b.totalCost - a.totalCost);
    }, [recipes, products]);
    const cheapest = [...costs].reverse().slice(0, 5);
    if (costs.length === 0) {
        return (_jsxs(Card, { className: "p-4 text-center text-sm text-muted-foreground", children: [_jsx(DollarSign, { className: "h-8 w-8 mx-auto mb-2 opacity-30" }), _jsx("p", { children: "Vincula productos a tus recetas para ver costos" })] }));
    }
    return (_jsxs("div", { className: "space-y-4", children: [_jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(TrendingUp, { className: "h-4 w-4 text-red-500" }), _jsx("h4", { className: "text-sm font-bold", children: "Recetas m\u00E1s caras" })] }), _jsx("div", { className: "space-y-1", children: costs.slice(0, 5).map(c => (_jsxs("div", { className: "flex justify-between text-xs border-b py-1", children: [_jsx("span", { className: "font-medium truncate", children: c.name }), _jsxs("span", { className: "text-muted-foreground shrink-0 ml-2", children: ["$", c.totalCost.toFixed(2), " \u00B7 $", c.costPerServing.toFixed(2), "/porc"] })] }, c.id))) })] }), _jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(TrendingDown, { className: "h-4 w-4 text-green-500" }), _jsx("h4", { className: "text-sm font-bold", children: "Recetas m\u00E1s baratas" })] }), _jsx("div", { className: "space-y-1", children: cheapest.map(c => (_jsxs("div", { className: "flex justify-between text-xs border-b py-1", children: [_jsx("span", { className: "font-medium truncate", children: c.name }), _jsxs("span", { className: "text-muted-foreground shrink-0 ml-2", children: ["$", c.totalCost.toFixed(2), " \u00B7 $", c.costPerServing.toFixed(2), "/porc"] })] }, c.id))) })] }), _jsxs(Card, { className: "p-3", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(ArrowUpDown, { className: "h-4 w-4 text-muted-foreground" }), _jsx("h4", { className: "text-sm font-bold", children: "Todas las recetas" })] }), _jsx("div", { className: "space-y-1 max-h-60 overflow-y-auto", children: costs.map(c => (_jsxs("div", { className: "flex justify-between text-xs border-b py-1", children: [_jsx("span", { className: "font-medium truncate", children: c.name }), _jsxs("span", { className: "text-muted-foreground shrink-0 ml-2", children: ["$", c.totalCost.toFixed(2), " \u00B7 $", c.costPerServing.toFixed(2), "/porc \u00B7 ", c.servings, " porc"] })] }, c.id))) })] })] }));
}
