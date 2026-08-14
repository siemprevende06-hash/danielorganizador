import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Plus, Archive } from "lucide-react";
import { ProductCard } from "./ProductCard";
export function ShelfView({ products, onCreate, onUpdate, onDelete, onAdjustStock }) {
    const [newOpen, setNewOpen] = useState(false);
    const [name, setName] = useState("");
    const [storageType, setStorageType] = useState("shelf");
    const [category, setCategory] = useState("");
    const [unit, setUnit] = useState("unidad");
    const [price, setPrice] = useState("0");
    const [packageQty, setPackageQty] = useState("1");
    const filtered = products.filter(p => p.storage_type === "shelf");
    const handleCreate = () => {
        if (!name.trim())
            return;
        onCreate({
            name: name.trim(),
            storage_type: storageType,
            category: category || null,
            unit: unit.trim(),
            price: parseFloat(price) || 0,
            package_quantity: parseInt(packageQty) || 1,
            current_stock: 0,
        });
        setName("");
        setCategory("");
        setUnit("unidad");
        setPrice("0");
        setPackageQty("1");
        setNewOpen(false);
    };
    return (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Archive, { className: "h-5 w-5 text-amber-600" }), _jsx("h3", { className: "text-base font-bold", children: "Estante" }), _jsxs("span", { className: "text-xs text-muted-foreground", children: ["(", filtered.length, ")"] })] }), _jsxs(Button, { size: "sm", onClick: () => setNewOpen(true), children: [_jsx(Plus, { className: "h-3 w-3 mr-1" }), "A\u00F1adir"] })] }), _jsx("div", { className: "grid grid-cols-1 gap-2", children: filtered.length === 0 ? (_jsx("p", { className: "text-xs text-muted-foreground text-center py-4", children: "No hay productos en el estante" })) : (filtered.map(p => (_jsx(ProductCard, { product: p, onUpdate: onUpdate, onDelete: onDelete, onAdjustStock: onAdjustStock }, p.id)))) }), _jsx(Dialog, { open: newOpen, onOpenChange: setNewOpen, children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nuevo producto" }) }), _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { placeholder: "Nombre", value: name, onChange: e => setName(e.target.value) }), _jsxs(Select, { value: storageType, onValueChange: v => setStorageType(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "shelf", children: "Estante" }), _jsx(SelectItem, { value: "refrigerator", children: "Refrigerador" }), _jsx(SelectItem, { value: "freezer", children: "Congelador" })] })] }), _jsx(Input, { placeholder: "Categor\u00EDa (ej: granos, enlatados)", value: category, onChange: e => setCategory(e.target.value) }), _jsx(Input, { placeholder: "Unidad", value: unit, onChange: e => setUnit(e.target.value) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", placeholder: "Precio $", value: price, onChange: e => setPrice(e.target.value) }), _jsx(Input, { type: "number", placeholder: "Cant/empaque", value: packageQty, onChange: e => setPackageQty(e.target.value) })] })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleCreate, children: "Crear" }) })] }) })] }));
}
