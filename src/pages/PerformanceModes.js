import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Rocket, Activity, BatteryLow, Heart, Clock, CheckCircle2, Zap, Moon, Sun, Edit2, Save, RotateCcw, Plus, Trash2 } from "lucide-react";
import { usePerformanceModes } from "@/hooks/usePerformanceModes";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
const ICON_MAP = {
    rocket: Rocket,
    activity: Activity,
    "battery-low": BatteryLow,
    heart: Heart,
};
export default function PerformanceModes() {
    const { modes, selectedModeId, isLoaded, selectMode, updateBlockInMode, addBlockToMode, removeBlockFromMode, resetModeToDefault } = usePerformanceModes();
    const [previewMode, setPreviewMode] = useState(null);
    const [editingBlock, setEditingBlock] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [showAddBlock, setShowAddBlock] = useState(null);
    const [newBlock, setNewBlock] = useState({ title: '', startTime: '', endTime: '' });
    const { toast } = useToast();
    const handleSelectMode = (modeId) => {
        selectMode(modeId);
        toast({
            title: "Modo aplicado",
            description: `Los bloques de "${modes.find(m => m.id === modeId)?.name}" ahora son tu rutina del día.`,
        });
    };
    const formatTime = (time) => {
        const [hours, minutes] = time.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
    };
    const countDeepWorkBlocks = (mode) => {
        return mode.blocks.filter(b => b.isFocusBlock).length;
    };
    const getTotalDeepWorkHours = (mode) => {
        const totalMinutes = mode.blocks
            .filter(b => b.isFocusBlock)
            .reduce((acc, block) => {
            const [startH, startM] = block.startTime.split(":").map(Number);
            const [endH, endM] = block.endTime.split(":").map(Number);
            let diff = (endH * 60 + endM) - (startH * 60 + startM);
            if (diff < 0)
                diff += 24 * 60;
            return acc + diff;
        }, 0);
        return (totalMinutes / 60).toFixed(1);
    };
    const startEditBlock = (modeId, block) => {
        setEditingBlock({ modeId, blockId: block.id });
        setEditForm({
            title: block.title,
            startTime: block.startTime,
            endTime: block.endTime,
        });
    };
    const saveBlockEdit = () => {
        if (editingBlock && editForm.title && editForm.startTime && editForm.endTime) {
            updateBlockInMode(editingBlock.modeId, editingBlock.blockId, editForm);
            setEditingBlock(null);
            setEditForm({});
            toast({ title: "Bloque actualizado" });
        }
    };
    const handleAddBlock = (modeId) => {
        if (newBlock.title && newBlock.startTime && newBlock.endTime) {
            const mode = modes.find(m => m.id === modeId);
            const newId = `${modeId}-${Date.now()}`;
            addBlockToMode(modeId, {
                id: newId,
                title: newBlock.title,
                startTime: newBlock.startTime,
                endTime: newBlock.endTime,
                tasks: [],
                order: mode?.blocks.length || 0,
            });
            setNewBlock({ title: '', startTime: '', endTime: '' });
            setShowAddBlock(null);
            toast({ title: "Bloque agregado" });
        }
    };
    const handleDeleteBlock = (modeId, blockId) => {
        removeBlockFromMode(modeId, blockId);
        toast({ title: "Bloque eliminado" });
    };
    const handleResetMode = (modeId) => {
        resetModeToDefault(modeId);
        toast({ title: "Modo restaurado a valores predeterminados" });
    };
    if (!isLoaded) {
        return _jsx("div", { className: "flex items-center justify-center min-h-screen", children: "Cargando..." });
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8 pt-24", children: _jsxs("div", { className: "max-w-7xl mx-auto space-y-8", children: [_jsxs("div", { className: "text-center space-y-4", children: [_jsx("h1", { className: "text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent", children: "Modos de Rendimiento" }), _jsx("p", { className: "text-lg text-muted-foreground max-w-2xl mx-auto", children: "Selecciona y personaliza el modo que define la distribuci\u00F3n de tus bloques de tiempo" })] }), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: modes.map((mode) => {
                        const IconComponent = ICON_MAP[mode.icon] || Activity;
                        const isSelected = selectedModeId === mode.id;
                        const deepWorkBlocks = countDeepWorkBlocks(mode);
                        const deepWorkHours = getTotalDeepWorkHours(mode);
                        return (_jsxs(Card, { className: cn("relative overflow-hidden transition-all duration-300 cursor-pointer group", isSelected
                                ? "ring-2 ring-primary shadow-lg shadow-primary/20"
                                : "hover:shadow-lg hover:scale-[1.02]"), onClick: () => setPreviewMode(mode), children: [_jsx("div", { className: cn("absolute inset-0 opacity-10 bg-gradient-to-br", mode.color) }), _jsxs("div", { className: "relative p-6 space-y-4", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("p-3 rounded-xl bg-gradient-to-br", mode.color), children: _jsx(IconComponent, { className: "h-6 w-6 text-white" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-xl font-bold", children: mode.name }), _jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [_jsx(Sun, { className: "h-4 w-4" }), _jsxs("span", { children: ["Despertar: ", formatTime(mode.wakeTime)] })] })] })] }), isSelected && (_jsxs(Badge, { className: "bg-primary", children: [_jsx(CheckCircle2, { className: "h-3 w-3 mr-1" }), "Activo"] }))] }), _jsx("p", { className: "text-muted-foreground", children: mode.description }), _jsxs("div", { className: "grid grid-cols-3 gap-4 pt-2", children: [_jsxs("div", { className: "text-center p-3 rounded-lg bg-background/50", children: [_jsx(Zap, { className: "h-5 w-5 mx-auto mb-1 text-yellow-500" }), _jsx("p", { className: "text-2xl font-bold", children: deepWorkBlocks }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Deep Work" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-background/50", children: [_jsx(Clock, { className: "h-5 w-5 mx-auto mb-1 text-blue-500" }), _jsxs("p", { className: "text-2xl font-bold", children: [deepWorkHours, "h"] }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Productivas" })] }), _jsxs("div", { className: "text-center p-3 rounded-lg bg-background/50", children: [_jsx(Moon, { className: "h-5 w-5 mx-auto mb-1 text-purple-500" }), _jsx("p", { className: "text-2xl font-bold", children: mode.blocks.length }), _jsx("p", { className: "text-xs text-muted-foreground", children: "Bloques" })] })] }), _jsxs("div", { className: "flex gap-3 pt-2", children: [_jsx(Button, { variant: isSelected ? "default" : "outline", className: "flex-1", onClick: (e) => {
                                                        e.stopPropagation();
                                                        handleSelectMode(mode.id);
                                                    }, children: isSelected ? (_jsxs(_Fragment, { children: [_jsx(CheckCircle2, { className: "h-4 w-4 mr-2" }), "Activo"] })) : ("Aplicar Modo") }), _jsxs(Button, { variant: "ghost", onClick: (e) => {
                                                        e.stopPropagation();
                                                        setPreviewMode(mode);
                                                    }, children: [_jsx(Edit2, { className: "h-4 w-4 mr-2" }), "Editar"] })] })] })] }, mode.id));
                    }) }), previewMode && (_jsxs(Card, { className: "p-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-6", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: cn("p-2 rounded-lg bg-gradient-to-br", previewMode.color), children: (() => {
                                                const Icon = ICON_MAP[previewMode.icon] || Activity;
                                                return _jsx(Icon, { className: "h-5 w-5 text-white" });
                                            })() }), _jsxs("h2", { className: "text-2xl font-bold", children: ["Editar: ", previewMode.name] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs(Button, { variant: "outline", size: "sm", onClick: () => handleResetMode(previewMode.id), children: [_jsx(RotateCcw, { className: "h-4 w-4 mr-2" }), "Restaurar"] }), _jsxs(Button, { variant: "outline", size: "sm", onClick: () => setShowAddBlock(previewMode.id), children: [_jsx(Plus, { className: "h-4 w-4 mr-2" }), "Agregar Bloque"] }), _jsx(Button, { variant: "ghost", onClick: () => setPreviewMode(null), children: "Cerrar" })] })] }), showAddBlock === previewMode.id && (_jsxs("div", { className: "mb-4 p-4 border rounded-lg bg-muted/30 space-y-3", children: [_jsx("h4", { className: "font-medium", children: "Nuevo Bloque" }), _jsxs("div", { className: "grid grid-cols-3 gap-3", children: [_jsx(Input, { placeholder: "T\u00EDtulo", value: newBlock.title, onChange: (e) => setNewBlock({ ...newBlock, title: e.target.value }) }), _jsx(Input, { type: "time", value: newBlock.startTime, onChange: (e) => setNewBlock({ ...newBlock, startTime: e.target.value }) }), _jsx(Input, { type: "time", value: newBlock.endTime, onChange: (e) => setNewBlock({ ...newBlock, endTime: e.target.value }) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { size: "sm", onClick: () => handleAddBlock(previewMode.id), children: "Agregar" }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setShowAddBlock(null), children: "Cancelar" })] })] })), _jsx(ScrollArea, { className: "h-[400px]", children: _jsx("div", { className: "space-y-3", children: previewMode.blocks.map((block) => (_jsx("div", { className: cn("flex items-center gap-4 p-4 rounded-lg border transition-colors", block.isFocusBlock
                                        ? "bg-primary/5 border-primary/30"
                                        : "bg-muted/30 border-border"), children: editingBlock?.blockId === block.id ? (
                                    // Edit Mode
                                    _jsxs("div", { className: "flex-1 flex items-center gap-3", children: [_jsx(Input, { value: editForm.title || '', onChange: (e) => setEditForm({ ...editForm, title: e.target.value }), className: "flex-1" }), _jsx(Input, { type: "time", value: editForm.startTime || '', onChange: (e) => setEditForm({ ...editForm, startTime: e.target.value }), className: "w-32" }), _jsx(Input, { type: "time", value: editForm.endTime || '', onChange: (e) => setEditForm({ ...editForm, endTime: e.target.value }), className: "w-32" }), _jsx(Button, { size: "sm", onClick: saveBlockEdit, children: _jsx(Save, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "ghost", onClick: () => setEditingBlock(null), children: "Cancelar" })] })) : (
                                    // View Mode
                                    _jsxs(_Fragment, { children: [_jsxs("div", { className: "text-center min-w-[100px]", children: [_jsx("p", { className: "text-sm font-medium", children: formatTime(block.startTime) }), _jsx("p", { className: "text-xs text-muted-foreground", children: formatTime(block.endTime) })] }), _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-medium", children: block.title }), block.isFocusBlock && (_jsxs(Badge, { variant: "secondary", className: "text-xs", children: [_jsx(Zap, { className: "h-3 w-3 mr-1" }), "Deep Work"] }))] }), _jsx("p", { className: "text-sm text-muted-foreground", children: block.tasks?.join(", ") })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { size: "sm", variant: "ghost", onClick: () => startEditBlock(previewMode.id, block), children: _jsx(Edit2, { className: "h-4 w-4" }) }), _jsx(Button, { size: "sm", variant: "ghost", className: "text-destructive", onClick: () => handleDeleteBlock(previewMode.id, block.id), children: _jsx(Trash2, { className: "h-4 w-4" }) })] })] })) }, block.id))) }) })] })), _jsx(Card, { className: "p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20", children: _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "p-3 rounded-full bg-primary/20", children: _jsx(Activity, { className: "h-6 w-6 text-primary" }) }), _jsxs("div", { children: [_jsx("h3", { className: "font-semibold text-lg mb-2", children: "\u00BFC\u00F3mo funcionan los modos?" }), _jsx("p", { className: "text-muted-foreground", children: "Al hacer clic en \"Aplicar Modo\", los bloques de ese modo se convertir\u00E1n en tu rutina del d\u00EDa. Los ver\u00E1s reflejados en la p\u00E1gina de Inicio y Rutina del D\u00EDa. Puedes editar los horarios de cada modo haciendo clic en \"Editar\"." })] })] }) })] }) }));
}
