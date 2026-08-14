import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
export const AddItemDialog = ({ type, onAdd }) => {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const handleAdd = () => {
        if (title.trim()) {
            onAdd(title.trim());
            setTitle("");
            setOpen(false);
        }
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { className: "gradient-primary", children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), type === "habit" ? "Nuevo Hábito" : "Nueva Tarea"] }) }), _jsxs(DialogContent, { children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: type === "habit" ? "Añadir Nuevo Hábito" : "Añadir Nueva Tarea" }), _jsx(DialogDescription, { children: type === "habit"
                                    ? "Crea un hábito para seguir tu progreso diario"
                                    : "Añade una tarea para completar hoy" })] }), _jsx("div", { className: "grid gap-4 py-4", children: _jsxs("div", { className: "grid gap-2", children: [_jsx(Label, { htmlFor: "title", children: "T\u00EDtulo" }), _jsx(Input, { id: "title", placeholder: type === "habit" ? "Ej: Hacer ejercicio" : "Ej: Terminar informe", value: title, onChange: (e) => setTitle(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleAdd() })] }) }), _jsxs(DialogFooter, { children: [_jsx(Button, { type: "button", variant: "secondary", onClick: () => setOpen(false), children: "Cancelar" }), _jsx(Button, { type: "button", onClick: handleAdd, children: "A\u00F1adir" })] })] })] }));
};
