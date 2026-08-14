import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { ShelfView } from "@/components/grocery/ShelfView";
import { FridgeView } from "@/components/grocery/FridgeView";
import { CostAnalysis } from "@/components/grocery/CostAnalysis";
import { useRecipes } from "@/hooks/useRecipes";
import { Package, BarChart3, ShoppingCart } from "lucide-react";
export default function Grocery() {
    const { products, loading, createProduct, updateProduct, deleteProduct, adjustStock } = useGroceryProducts();
    const { recipes } = useRecipes();
    const [tab, setTab] = useState("products");
    if (loading)
        return _jsx("div", { className: "p-8 text-center text-sm", children: "Cargando..." });
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("div", { className: "text-center space-y-2", children: [_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx("div", { className: "p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10", children: _jsx(Package, { className: "h-7 w-7 text-amber-500" }) }), _jsx("h1", { className: "text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent", children: "Despensa" })] }), _jsxs("p", { className: "text-sm text-muted-foreground", children: [products.length, " productos \u00B7 Stock total: ", products.reduce((s, p) => s + (p.current_stock || 0), 0), " uds"] })] }), _jsxs(Tabs, { value: tab, onValueChange: setTab, children: [_jsxs(TabsList, { className: "w-full", children: [_jsxs(TabsTrigger, { value: "products", className: "flex-1", children: [_jsx(Package, { className: "h-4 w-4 mr-1" }), "Productos"] }), _jsxs(TabsTrigger, { value: "costs", className: "flex-1", children: [_jsx(BarChart3, { className: "h-4 w-4 mr-1" }), "Costos"] }), _jsxs(TabsTrigger, { value: "shopping", className: "flex-1", children: [_jsx(ShoppingCart, { className: "h-4 w-4 mr-1" }), "Lista"] })] }), _jsxs(TabsContent, { value: "products", className: "space-y-6", children: [_jsx(ShelfView, { products: products, onCreate: createProduct, onUpdate: updateProduct, onDelete: deleteProduct, onAdjustStock: adjustStock }), _jsx(FridgeView, { products: products, onCreate: createProduct, onUpdate: updateProduct, onDelete: deleteProduct, onAdjustStock: adjustStock })] }), _jsx(TabsContent, { value: "costs", children: _jsx(CostAnalysis, { recipes: recipes, products: products }) }), _jsx(TabsContent, { value: "shopping", children: _jsxs("div", { className: "text-center py-12 text-sm text-muted-foreground", children: [_jsx(ShoppingCart, { className: "h-12 w-12 mx-auto mb-3 opacity-30" }), _jsx("p", { children: "Genera tu lista de compra desde" }), _jsx("p", { className: "font-medium", children: "Alimentaci\u00F3n \u2192 Planificar" })] }) })] })] }) }));
}
