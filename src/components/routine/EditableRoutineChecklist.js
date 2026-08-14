import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoutineSteps } from "@/hooks/useRoutineSteps";
export const EditableRoutineChecklist = ({ type, title, subtitle }) => {
    const { steps, completed, loading, toggle, addStep, removeStep } = useRoutineSteps(type);
    const [newTitle, setNewTitle] = useState("");
    const [newGroup, setNewGroup] = useState("");
    if (loading) {
        return _jsx("div", { className: "container mx-auto px-4 py-24", children: "Cargando..." });
    }
    const groups = steps.reduce((acc, s) => {
        const key = s.group_title || "General";
        if (!acc[key])
            acc[key] = [];
        acc[key].push(s);
        return acc;
    }, {});
    const total = steps.length;
    const done = completed.size;
    const progress = total ? (done / total) * 100 : 0;
    return (_jsxs("div", { className: "container mx-auto px-4 py-24 space-y-6", children: [_jsxs("header", { children: [_jsx("h1", { className: "text-3xl font-bold", children: title }), subtitle && _jsx("p", { className: "text-muted-foreground mt-1", children: subtitle })] }), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsxs(CardTitle, { className: "flex items-center justify-between", children: [_jsx("span", { children: "Progreso" }), _jsxs(Badge, { variant: "outline", children: [done, "/", total] })] }) }), _jsx(CardContent, { children: _jsx(Progress, { value: progress, className: "h-3" }) })] }), Object.entries(groups).map(([group, items]) => (_jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: group }) }), _jsx(CardContent, { className: "space-y-2", children: items.map((s) => {
                            const isDone = completed.has(s.id);
                            return (_jsxs("div", { className: cn("flex items-center gap-3 p-2 rounded-md transition-colors hover:bg-muted/50 group", isDone && "bg-muted/30"), children: [_jsx(Checkbox, { checked: isDone, onCheckedChange: () => toggle(s.id) }), _jsx("span", { className: cn("text-sm flex-1 cursor-pointer", isDone && "line-through text-muted-foreground"), onClick: () => toggle(s.id), children: s.title }), _jsx(Button, { size: "icon", variant: "ghost", className: "opacity-0 group-hover:opacity-100 h-7 w-7", onClick: () => removeStep(s.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })] }, s.id));
                        }) })] }, group))), _jsxs(Card, { children: [_jsx(CardHeader, { children: _jsx(CardTitle, { className: "text-base", children: "Agregar paso" }) }), _jsxs(CardContent, { className: "flex flex-col sm:flex-row gap-2", children: [_jsx(Input, { placeholder: "Grupo (opcional)", value: newGroup, onChange: (e) => setNewGroup(e.target.value), className: "sm:w-48" }), _jsx(Input, { placeholder: "Nuevo paso...", value: newTitle, onChange: (e) => setNewTitle(e.target.value), onKeyDown: (e) => {
                                    if (e.key === "Enter" && newTitle.trim()) {
                                        addStep(newTitle.trim(), newGroup.trim() || undefined);
                                        setNewTitle("");
                                    }
                                } }), _jsxs(Button, { onClick: () => {
                                    if (newTitle.trim()) {
                                        addStep(newTitle.trim(), newGroup.trim() || undefined);
                                        setNewTitle("");
                                    }
                                }, children: [_jsx(Plus, { className: "h-4 w-4 mr-1" }), " Agregar"] })] })] })] }));
};
