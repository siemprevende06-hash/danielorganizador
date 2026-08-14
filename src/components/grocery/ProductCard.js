import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Plus, Minus, Pencil, Trash2, Snowflake, Thermometer, Archive } from "lucide-react";
const storageIcons = {
    refrigerator: Snowflake,
    freezer: Thermometer,
    shelf: Archive,
};
export function ProductCard({ product, onUpdate, onDelete, onAdjustStock }) {
    const [editOpen, setEditOpen] = useState(false);
    const [name, setName] = useState(product.name);
    const [storageType, setStorageType] = useState(product.storage_type);
    const [category, setCategory] = useState(product.category || "");
    const [unit, setUnit] = useState(product.unit);
    const [price, setPrice] = useState(product.price.toString());
    const [packageQty, setPackageQty] = useState(product.package_quantity.toString());
    const [notes, setNotes] = useState(product.notes || "");
    const StorageIcon = storageIcons[product.storage_type] || Archive;
    const unitCost = (product.price || 0) / Math.max(1, product.package_quantity || 1);
    const handleSave = () => {
        onUpdate(product.id, {
            name: name.trim(),
            storage_type: storageType,
            category: category || null,
            unit: unit.trim(),
            price: parseFloat(price) || 0,
            package_quantity: parseInt(packageQty) || 1,
            notes: notes.trim() || null,
        });
        setEditOpen(false);
    };
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "p-3 flex items-center gap-3 hover:shadow-md transition-shadow", children: [_jsx("div", { className: "p-2 rounded-lg bg-muted", children: _jsx(StorageIcon, { className: "h-5 w-5 text-muted-foreground" }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "text-sm font-semibold truncate", children: product.name }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Stock: ", _jsx("span", { className: "font-medium", children: product.current_stock }), " ", product.unit, product.price > 0 && (_jsxs(_Fragment, { children: [" \u00B7 $", product.price, " / ", product.package_quantity, product.unit, " \u00B7 $", unitCost.toFixed(2), "/", product.unit] }))] })] }), _jsxs("div", { className: "flex items-center gap-1 shrink-0", children: [_jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => onAdjustStock(product.id, -1), disabled: product.current_stock <= 0, children: _jsx(Minus, { className: "h-3 w-3" }) }), _jsx("span", { className: "text-sm font-bold w-8 text-center", children: product.current_stock }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => onAdjustStock(product.id, 1), children: _jsx(Plus, { className: "h-3 w-3" }) }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => setEditOpen(true), children: _jsx(Pencil, { className: "h-3 w-3" }) }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 text-destructive", onClick: () => onDelete(product.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] })] }), _jsx(Dialog, { open: editOpen, onOpenChange: setEditOpen, children: _jsxs(DialogContent, { className: "max-w-sm", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Editar producto" }) }), _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { placeholder: "Nombre", value: name, onChange: e => setName(e.target.value) }), _jsxs(Select, { value: storageType, onValueChange: v => setStorageType(v), children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsxs(SelectContent, { children: [_jsx(SelectItem, { value: "shelf", children: "Estante" }), _jsx(SelectItem, { value: "refrigerator", children: "Refrigerador" }), _jsx(SelectItem, { value: "freezer", children: "Congelador" })] })] }), _jsx(Input, { placeholder: "Categor\u00EDa (ej: l\u00E1cteos, carnes...)", value: category, onChange: e => setCategory(e.target.value) }), _jsx("div", { className: "flex gap-2", children: _jsx(Input, { placeholder: "Unidad", value: unit, onChange: e => setUnit(e.target.value) }) }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "number", placeholder: "Precio $", value: price, onChange: e => setPrice(e.target.value) }), _jsx(Input, { type: "number", placeholder: "Cant/empaque", value: packageQty, onChange: e => setPackageQty(e.target.value) })] }), _jsx(Input, { placeholder: "Notas", value: notes, onChange: e => setNotes(e.target.value) })] }), _jsx(DialogFooter, { children: _jsx(Button, { onClick: handleSave, children: "Guardar" }) })] }) })] }));
}
