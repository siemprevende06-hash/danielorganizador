import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Edit2, ChefHat, Sun, Cookie, UtensilsCrossed, MoonStar, DollarSign } from "lucide-react";
import { useRecipes } from "@/hooks/useRecipes";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useGroceryProducts } from "@/hooks/useGroceryProducts";
import { toast } from "@/hooks/use-toast";
const CATEGORIES = [
    { value: "desayuno", label: "Desayuno", icon: Sun },
    { value: "merienda", label: "Meriendas", icon: Cookie },
    { value: "almuerzo", label: "Almuerzo", icon: UtensilsCrossed },
    { value: "comida", label: "Comida", icon: ChefHat },
    { value: "antes-dormir", label: "Antes de Dormir", icon: MoonStar },
];
export function RecipeManager() {
    const { recipes, loading, createRecipe, updateRecipe, deleteRecipe } = useRecipes();
    const { uploadImage } = useImageUpload();
    const { products } = useGroceryProducts();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [name, setName] = useState("");
    const [servings, setServings] = useState(1);
    const [instructions, setInstructions] = useState("");
    const [photoUrl, setPhotoUrl] = useState(null);
    const [category, setCategory] = useState("");
    const [ingredients, setIngredients] = useState([]);
    const reset = () => {
        setEditing(null);
        setName("");
        setServings(1);
        setInstructions("");
        setPhotoUrl(null);
        setCategory("");
        setIngredients([]);
    };
    const openNew = () => { reset(); setOpen(true); };
    const openEdit = (r) => {
        setEditing(r);
        setName(r.name);
        setServings(r.servings || 1);
        setInstructions(r.instructions || "");
        setPhotoUrl(r.photo_url || null);
        setCategory(r.category || "");
        setIngredients(r.ingredients || []);
        setOpen(true);
    };
    const save = async () => {
        if (!name.trim()) {
            toast({ title: "Nombre requerido" });
            return;
        }
        const payload = { name: name.trim(), servings, instructions, photo_url: photoUrl, category: category || null, ingredients };
        if (editing)
            await updateRecipe(editing.id, payload);
        else
            await createRecipe(payload);
        setOpen(false);
        reset();
        toast({ title: editing ? "Receta actualizada" : "Receta creada" });
    };
    const handlePhoto = async () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = async (e) => {
            const f = e.target.files?.[0];
            if (!f)
                return;
            const url = await uploadImage(f);
            if (url)
                setPhotoUrl(url);
        };
        input.click();
    };
    const grouped = CATEGORIES.map(cat => ({
        ...cat,
        items: recipes.filter(r => r.category === cat.value)
    }));
    const uncategorized = recipes.filter(r => !r.category);
    return (_jsxs("div", { className: "space-y-8", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("h3", { className: "text-lg font-bold flex items-center gap-2", children: [_jsx(ChefHat, { className: "h-5 w-5" }), " Recetario"] }), _jsxs(Button, { onClick: openNew, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), "Nueva receta"] })] }), loading ? (_jsx("p", { className: "text-sm text-muted-foreground", children: "Cargando..." })) : recipes.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground text-center py-10", children: "A\u00FAn no hay recetas. Crea la primera." })) : (_jsxs(_Fragment, { children: [grouped.map(cat => {
                        if (cat.items.length === 0)
                            return null;
                        const Icon = cat.icon;
                        return (_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx(Icon, { className: "h-5 w-5 text-muted-foreground" }), _jsx("h4", { className: "text-base font-semibold", children: cat.label }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", cat.items.length, ")"] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: cat.items.map(r => (_jsxs(Card, { className: "p-4 group relative", children: [r.photo_url && _jsx("img", { src: r.photo_url, alt: r.name, className: "h-40 w-full rounded object-cover mb-3" }), _jsx("p", { className: "text-sm font-semibold truncate", children: r.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [r.ingredients?.length || 0, " ingredientes"] }), r.servings && _jsxs("p", { className: "text-xs text-muted-foreground", children: [r.servings, " porciones"] }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition", children: [_jsx(Button, { size: "icon", variant: "secondary", className: "h-8 w-8", onClick: () => openEdit(r), children: _jsx(Edit2, { className: "h-4 w-4" }) }), _jsx(Button, { size: "icon", variant: "destructive", className: "h-8 w-8", onClick: () => deleteRecipe(r.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, r.id))) })] }, cat.value));
                    }), uncategorized.length > 0 && (_jsxs("section", { children: [_jsxs("div", { className: "flex items-center gap-2 mb-3", children: [_jsx("h4", { className: "text-base font-semibold", children: "Sin categor\u00EDa" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", uncategorized.length, ")"] })] }), _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4", children: uncategorized.map(r => (_jsxs(Card, { className: "p-4 group relative", children: [r.photo_url && _jsx("img", { src: r.photo_url, alt: r.name, className: "h-40 w-full rounded object-cover mb-3" }), _jsx("p", { className: "text-sm font-semibold truncate", children: r.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [r.ingredients?.length || 0, " ingredientes"] }), r.servings && _jsxs("p", { className: "text-xs text-muted-foreground", children: [r.servings, " porciones"] }), _jsxs("div", { className: "absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition", children: [_jsx(Button, { size: "icon", variant: "secondary", className: "h-8 w-8", onClick: () => openEdit(r), children: _jsx(Edit2, { className: "h-4 w-4" }) }), _jsx(Button, { size: "icon", variant: "destructive", className: "h-8 w-8", onClick: () => deleteRecipe(r.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] }, r.id))) })] }))] })), _jsx(Dialog, { open: open, onOpenChange: setOpen, children: _jsxs(DialogContent, { className: "max-w-lg max-h-[90vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: editing ? "Editar receta" : "Nueva receta" }) }), _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { placeholder: "Nombre", value: name, onChange: e => setName(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", min: 1, value: servings, onChange: e => setServings(+e.target.value), placeholder: "Porciones" }), _jsx(Button, { variant: "outline", size: "sm", onClick: handlePhoto, children: photoUrl ? "Cambiar foto" : "Subir foto" })] }), _jsxs(Select, { value: category || "__none__", onValueChange: v => setCategory(v === "__none__" ? "" : v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Seleccionar categor\u00EDa" }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "__none__", children: "Sin categor\u00EDa" }), CATEGORIES.map(cat => (_jsx(SelectItem, { value: cat.value, children: cat.label }, cat.value)))] })] }), photoUrl && _jsx("img", { src: photoUrl, alt: "", className: "h-24 w-full rounded object-cover" }), _jsx(Textarea, { placeholder: "Instrucciones...", value: instructions, onChange: e => setInstructions(e.target.value), rows: 3 }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center justify-between mb-1", children: [_jsx("p", { className: "text-xs font-semibold", children: "Ingredientes" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setIngredients([...ingredients, { name: "", quantity: 1, unit: "g" }]), children: _jsx(Plus, { className: "h-3 w-3" }) })] }), _jsx("div", { className: "space-y-1", children: ingredients.map((ing, i) => (_jsxs("div", { className: "flex flex-col gap-1", children: [_jsxs("div", { className: "flex gap-1", children: [_jsxs(Select, { value: ing.product_id || "", onValueChange: v => {
                                                                    const p = v ? products.find(pr => pr.id === v) : null;
                                                                    setIngredients(ingredients.map((x, j) => j === i ? {
                                                                        ...x,
                                                                        product_id: v || null,
                                                                        name: p?.name || x.name,
                                                                        unit: p?.unit || x.unit || "g",
                                                                        quantity_for_recipe: x.quantity_for_recipe || x.quantity || null,
                                                                    } : x));
                                                                }, children: [_jsx(SelectTrigger, { className: "flex-1 h-8 text-xs", children: _jsx(SelectValue, { placeholder: "Buscar producto..." }) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "", children: "Sin producto" }), products.filter(p => !ingredients.some((x, j) => j !== i && x.product_id === p.id)).map(p => (_jsxs(SelectItem, { value: p.id, children: [p.name, " ", p.current_stock > 0 ? `(stock: ${p.current_stock} ${p.unit})` : ""] }, p.id)))] })] }), _jsx(Input, { className: "w-16", type: "number", value: ing.quantity ?? "", placeholder: "Cant", onChange: e => setIngredients(ingredients.map((x, j) => j === i ? { ...x, quantity: +e.target.value } : x)) }), _jsx(Input, { className: "w-14", placeholder: "Unidad", value: ing.unit ?? "", onChange: e => setIngredients(ingredients.map((x, j) => j === i ? { ...x, unit: e.target.value } : x)) }), _jsx(Button, { size: "icon", variant: "ghost", onClick: () => setIngredients(ingredients.filter((_, j) => j !== i)), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }), ing.product_id && (_jsx("div", { className: "text-[10px] text-muted-foreground ml-1", children: (() => {
                                                            const p = products.find(pr => pr.id === ing.product_id);
                                                            if (!p)
                                                                return null;
                                                            const uc = (p.price || 0) / Math.max(1, p.package_quantity || 1);
                                                            const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
                                                            const cost = qty * uc;
                                                            return _jsxs(_Fragment, { children: ["$", p.price, "/", p.package_quantity, p.unit, " \u2192 $", uc.toFixed(2), "/", p.unit, " \u2192 $", cost.toFixed(2)] });
                                                        })() }))] }, i))) }), (() => {
                                            const totalCost = ingredients.reduce((sum, ing) => {
                                                if (!ing.product_id)
                                                    return sum;
                                                const p = products.find(pr => pr.id === ing.product_id);
                                                if (!p || !p.price)
                                                    return sum;
                                                const uc = (p.price || 0) / Math.max(1, p.package_quantity || 1);
                                                const qty = Number(ing.quantity_for_recipe ?? ing.quantity ?? 0);
                                                return sum + qty * uc;
                                            }, 0);
                                            if (totalCost <= 0)
                                                return null;
                                            return (_jsxs("div", { className: "text-xs text-muted-foreground text-right mt-2 flex items-center justify-end gap-1", children: [_jsx(DollarSign, { className: "h-3 w-3" }), "Costo total: ", _jsxs("span", { className: "font-semibold", children: ["$", totalCost.toFixed(2)] }), servings > 0 && _jsxs(_Fragment, { children: [", ", _jsxs("span", { className: "font-semibold", children: ["$", (totalCost / servings).toFixed(2)] }), "/porci\u00F3n"] })] }));
                                        })()] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: save, children: "Guardar" }) })] }) })] }));
}
