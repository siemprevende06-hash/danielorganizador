import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useRoutineBlocks, formatTimeDisplay, ROUTINES } from "@/hooks/useRoutineBlocks";
import { GripVertical, Clock, Target, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
const ROUTINE_STYLES = {
    disciplina: {
        active: "bg-orange-500/20 border-orange-500/60 text-orange-500",
        inactive: "border-orange-500/20 text-orange-400/60 hover:border-orange-500/40",
    },
    normal: {
        active: "bg-blue-500/20 border-blue-500/60 text-blue-500",
        inactive: "border-blue-500/20 text-blue-400/60 hover:border-blue-500/40",
    },
    super: {
        active: "bg-purple-500/20 border-purple-500/60 text-purple-500",
        inactive: "border-purple-500/20 text-purple-400/60 hover:border-purple-500/40",
    },
    descanso: {
        active: "bg-green-500/20 border-green-500/60 text-green-500",
        inactive: "border-green-500/20 text-green-400/60 hover:border-green-500/40",
    },
};
export default function RoutineDay() {
    const { blocks, isLoaded, routineType, setRoutineType, reorderBlocks, updateBlock, saveBlocks } = useRoutineBlocks();
    const { toast } = useToast();
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ title: '', startTime: '', endTime: '', tasks: '' });
    const currentRoutine = ROUTINES.find(r => r.type === routineType) || ROUTINES[0];
    const handleDragStart = (index) => setDraggedIndex(index);
    const handleDragOver = (e, index) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index)
            return;
        reorderBlocks(draggedIndex, index);
        setDraggedIndex(index);
    };
    const handleDragEnd = () => setDraggedIndex(null);
    const startEditing = (block) => {
        setEditingId(block.id);
        setEditForm({ title: block.title, startTime: block.startTime, endTime: block.endTime, tasks: (block.tasks || []).join(', ') });
    };
    const cancelEditing = () => setEditingId(null);
    const saveEditing = (block) => {
        updateBlock({
            ...block,
            title: editForm.title,
            startTime: editForm.startTime,
            endTime: editForm.endTime,
            tasks: editForm.tasks.split(',').map(t => t.trim()).filter(Boolean),
        });
        setEditingId(null);
        toast({ title: "Bloque actualizado" });
    };
    const addNewBlock = () => {
        const newBlock = {
            id: Date.now().toString(),
            title: "Nuevo Bloque",
            startTime: "12:00",
            endTime: "13:00",
            tasks: ["Nueva tarea"],
            currentStreak: 0,
            maxStreak: 0,
            weeklyCompletion: [false, false, false, false, false, false, false],
            order: blocks.length,
        };
        saveBlocks([...blocks, newBlock]);
    };
    const deleteBlock = (id) => {
        saveBlocks(blocks.filter(b => b.id !== id).map((b, idx) => ({ ...b, order: idx })));
    };
    if (!isLoaded)
        return _jsx("div", { className: "min-h-screen flex items-center justify-center", children: _jsx("p", { className: "text-muted-foreground", children: "Cargando rutina..." }) });
    return (_jsx("div", { className: "min-h-screen bg-background p-6 pt-24 pb-24", children: _jsxs("div", { className: "max-w-4xl mx-auto space-y-6", children: [_jsxs("header", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold", children: "Configurar Rutina" }), _jsxs("p", { className: "text-muted-foreground", children: [currentRoutine.label, " \u00B7 ", currentRoutine.totalBlocks, " bloques \u00B7 ", currentRoutine.wakeTime, " \u2014 ", currentRoutine.sleepTime] })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsxs(Button, { onClick: addNewBlock, size: "sm", children: [_jsx(Plus, { className: "w-4 h-4 mr-1" }), "Agregar Bloque"] }) })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto pb-1 scrollbar-none", children: ROUTINES.map((r) => {
                        const style = ROUTINE_STYLES[r.type];
                        const isActive = routineType === r.type;
                        return (_jsxs("button", { onClick: () => setRoutineType(r.type), className: cn("flex-shrink-0 flex flex-col items-center gap-1 px-4 py-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px]", isActive ? style.active : `${style.inactive} bg-transparent`, isActive && "scale-[1.02]"), children: [_jsx("span", { className: "text-xl leading-none", children: r.icon }), _jsx("span", { className: cn("text-xs font-semibold tracking-tight whitespace-nowrap", isActive ? "opacity-100" : "opacity-70"), children: r.shortLabel }), _jsxs("span", { className: cn("text-[10px] font-mono tracking-tight", isActive ? "opacity-80" : "opacity-40"), children: [r.wakeTime, "\u2014", r.sleepTime] })] }, r.type));
                    }) }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Arrastra los bloques para reordenarlos. Ed\u00EDtalos o elim\u00EDnalos seg\u00FAn necesites." }), _jsx("div", { className: "space-y-2", children: blocks.map((block, index) => (_jsx(Card, { draggable: true, onDragStart: () => handleDragStart(index), onDragOver: (e) => handleDragOver(e, index), onDragEnd: handleDragEnd, className: cn("transition-all cursor-move", draggedIndex === index && "opacity-50 scale-[0.98]", block.isFocusBlock && "border-l-4 border-l-primary"), children: _jsx(CardContent, { className: "p-3", children: _jsxs("div", { className: "flex items-start gap-3", children: [_jsx("div", { className: "flex items-center justify-center w-6 h-6 mt-1 text-muted-foreground", children: _jsx(GripVertical, { className: "w-4 h-4" }) }), editingId === block.id ? (_jsxs("div", { className: "flex-1 space-y-2", children: [_jsx(Input, { value: editForm.title, onChange: (e) => setEditForm({ ...editForm, title: e.target.value }), className: "font-semibold" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Input, { type: "time", value: editForm.startTime, onChange: (e) => setEditForm({ ...editForm, startTime: e.target.value }), className: "w-32" }), _jsx("span", { className: "flex items-center text-muted-foreground", children: "-" }), _jsx(Input, { type: "time", value: editForm.endTime, onChange: (e) => setEditForm({ ...editForm, endTime: e.target.value }), className: "w-32" })] }), _jsx(Input, { value: editForm.tasks, onChange: (e) => setEditForm({ ...editForm, tasks: e.target.value }), placeholder: "Tareas separadas por coma", className: "text-sm" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { size: "sm", onClick: () => saveEditing(block), children: [_jsx(Check, { className: "w-4 h-4 mr-1" }), "Guardar"] }), _jsxs(Button, { size: "sm", variant: "outline", onClick: cancelEditing, children: [_jsx(X, { className: "w-4 h-4 mr-1" }), "Cancelar"] })] })] })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2 mb-0.5", children: [_jsx("h3", { className: "font-semibold text-sm", children: block.title }), block.isFocusBlock && _jsxs(Badge, { variant: "default", className: "text-xs", children: [_jsx(Target, { className: "w-3 h-3 mr-1" }), "Focus"] })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground", children: [_jsx(Clock, { className: "w-3 h-3" }), _jsxs("span", { children: [formatTimeDisplay(block.startTime), " - ", formatTimeDisplay(block.endTime)] })] }), block.tasks && block.tasks.length > 0 && (_jsx("p", { className: "text-xs text-muted-foreground/60 mt-1 truncate max-w-md", children: block.tasks.join(' · ') }))] }), _jsxs("div", { className: "flex gap-1", children: [_jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7", onClick: () => startEditing(block), children: _jsx(Edit2, { className: "w-3 h-3" }) }), _jsx(Button, { size: "icon", variant: "ghost", className: "h-7 w-7 text-destructive", onClick: () => deleteBlock(block.id), children: _jsx(Trash2, { className: "w-3 h-3" }) })] })] }))] }) }) }, block.id))) })] }) }));
}
