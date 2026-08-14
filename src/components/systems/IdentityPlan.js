import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { ArrowRight, Edit2, Check, Settings2, Plus, Trash2, AlertCircle, } from "lucide-react";
import { useIdentitySystems } from "@/hooks/useIdentitySystems";
const DEFAULT_AREAS = [
    { area_id: "universidad", area_label: "Universidad", icon: "🎓", color: "#3b82f6" },
    { area_id: "emprendimiento", area_label: "Emprendimiento", icon: "💼", color: "#8b5cf6" },
    { area_id: "proyectos", area_label: "Proyectos", icon: "💻", color: "#06b6d4" },
    { area_id: "piano", area_label: "Piano", icon: "🎹", color: "#ec4899" },
    { area_id: "guitarra", area_label: "Guitarra", icon: "🎸", color: "#f97316" },
    { area_id: "lectura", area_label: "Lectura", icon: "📖", color: "#14b8a6" },
    { area_id: "ajedrez", area_label: "Ajedrez", icon: "♟️", color: "#6366f1" },
    { area_id: "apariencia", area_label: "Apariencia", icon: "✨", color: "#f472b6" },
    { area_id: "gym", area_label: "Gym", icon: "💪", color: "#ef4444" },
    { area_id: "finanzas", area_label: "Finanzas", icon: "💰", color: "#22c55e" },
    { area_id: "idiomas", area_label: "Idiomas", icon: "🌐", color: "#10b981" },
];
export function IdentityPlan() {
    const [items, setItems] = useState([]);
    const [editing, setEditing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { dailyStates, createSystem, updateSystem, deleteSystem, toggleActive, toggleTaskState, getSystemsByArea, refetch: refetchSystems, } = useIdentitySystems();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSystem, setEditingSystem] = useState(null);
    const [dialogName, setDialogName] = useState("");
    const [dialogDescription, setDialogDescription] = useState("");
    const [dialogTasks, setDialogTasks] = useState([]);
    const [dialogAreaId, setDialogAreaId] = useState("");
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase.from("identity_plan").select("*").order("created_at");
            if (err)
                throw err;
            if (data && data.length > 0) {
                setItems(data);
            }
            else {
                const seeds = DEFAULT_AREAS.map(a => ({
                    area_id: a.area_id,
                    area_label: a.area_label,
                    icon: a.icon,
                    color: a.color,
                    point_a: "",
                    point_b: "",
                    progress_percentage: 0,
                }));
                const { data: inserted, error: insertErr } = await supabase
                    .from("identity_plan")
                    .upsert(seeds, { onConflict: "area_id" })
                    .select("*");
                if (insertErr)
                    throw insertErr;
                setItems(inserted || []);
            }
        }
        catch (err) {
            console.error("IdentityPlan load error:", err);
            setError(err?.message || "Error al cargar datos");
            setItems(DEFAULT_AREAS.map((a, i) => ({
                id: `seed-${i}`,
                area_id: a.area_id,
                area_label: a.area_label,
                point_a: "",
                point_b: "",
                progress_percentage: 0,
                icon: a.icon,
                color: a.color,
            })));
        }
        setLoading(false);
    };
    const updateItem = async (id, updates) => {
        setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i));
        await supabase.from("identity_plan").update(updates).eq("id", id);
    };
    const openCreateDialog = (areaId) => {
        setEditingSystem(null);
        setDialogAreaId(areaId);
        setDialogName("");
        setDialogDescription("");
        setDialogTasks([]);
        setDialogOpen(true);
    };
    const openEditDialog = (system) => {
        setEditingSystem(system);
        setDialogAreaId(system.area_id);
        setDialogName(system.name);
        setDialogDescription(system.description);
        setDialogTasks([...system.tasks]);
        setDialogOpen(true);
    };
    const handleSaveSystem = async () => {
        if (!dialogName.trim())
            return;
        if (editingSystem) {
            await updateSystem(editingSystem.id, {
                name: dialogName,
                description: dialogDescription,
                tasks: dialogTasks,
            });
        }
        else {
            const created = await createSystem(dialogAreaId, dialogName);
            const { data: fresh } = await supabase
                .from("identity_systems")
                .select("id")
                .eq("area_id", dialogAreaId)
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();
            if (fresh?.id) {
                await updateSystem(fresh.id, {
                    description: dialogDescription,
                    tasks: dialogTasks,
                });
            }
        }
        await refetchSystems();
        setDialogOpen(false);
    };
    const addTaskToDialog = () => {
        setDialogTasks(prev => [
            ...prev,
            { id: crypto.randomUUID(), description: "" },
        ]);
    };
    const updateTaskInDialog = (taskId, description) => {
        setDialogTasks(prev => prev.map(t => (t.id === taskId ? { ...t, description } : t)));
    };
    const removeTaskFromDialog = (taskId) => {
        setDialogTasks(prev => prev.filter(t => t.id !== taskId));
    };
    if (loading)
        return _jsxs(Card, { className: "p-8 text-center text-muted-foreground", children: [_jsx("div", { className: "animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" }), _jsx("p", { className: "text-xs", children: "Cargando plan de identidad..." })] });
    if (error)
        return _jsxs(Card, { className: "p-8 text-center", children: [_jsx(AlertCircle, { className: "h-6 w-6 text-amber-500 mx-auto mb-2" }), _jsx("p", { className: "text-xs text-muted-foreground", children: error }), _jsx(Button, { variant: "outline", size: "sm", className: "mt-2", onClick: () => { setLoading(true); setError(null); loadData(); }, children: "Reintentar" })] });
    return (_jsxs(_Fragment, { children: [_jsxs(Card, { className: "p-4 md:p-6", children: [_jsx("h3", { className: "text-lg font-bold mb-1", children: "\uD83E\uDE9E Plan Identidad" }), _jsx("p", { className: "text-xs text-muted-foreground mb-4", children: "Define tu Punto A \u2192 Punto B en cada \u00E1rea de vida" }), _jsx("div", { className: "space-y-4", children: items.map(item => {
                            const isEditing = editing === item.id;
                            const areaSystems = getSystemsByArea(item.area_id);
                            return (_jsxs("div", { className: "rounded-xl border p-3 space-y-2", style: { borderColor: item.color + "40" }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-lg", children: item.icon }), _jsx("span", { className: "font-semibold text-sm flex-1", children: item.area_label }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6", onClick: () => setEditing(isEditing ? null : item.id), children: isEditing ? _jsx(Check, { className: "h-3 w-3" }) : _jsx(Edit2, { className: "h-3 w-3" }) })] }), _jsxs("div", { className: "flex items-center gap-2 text-xs", children: [_jsxs("div", { className: "flex-1 rounded-lg bg-red-500/10 border border-red-500/20 p-2 min-h-[2.5rem]", children: [_jsx("p", { className: "text-[10px] text-red-500 font-semibold mb-0.5", children: "PUNTO A" }), isEditing ? (_jsx(Input, { value: item.point_a, onChange: e => updateItem(item.id, { point_a: e.target.value }), className: "h-6 text-xs border-0 p-0 bg-transparent", placeholder: "\u00BFD\u00F3nde estoy?" })) : (_jsx("p", { className: "text-muted-foreground", children: item.point_a || "Sin definir" }))] }), _jsx(ArrowRight, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "flex-1 rounded-lg bg-green-500/10 border border-green-500/20 p-2 min-h-[2.5rem]", children: [_jsx("p", { className: "text-[10px] text-green-500 font-semibold mb-0.5", children: "PUNTO B" }), isEditing ? (_jsx(Input, { value: item.point_b, onChange: e => updateItem(item.id, { point_b: e.target.value }), className: "h-6 text-xs border-0 p-0 bg-transparent", placeholder: "\u00BFA d\u00F3nde voy?" })) : (_jsx("p", { className: "text-muted-foreground", children: item.point_b || "Sin definir" }))] })] }), _jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex justify-between text-[10px]", children: [_jsx("span", { className: "text-muted-foreground", children: "Progreso" }), _jsxs("span", { className: "font-semibold", style: { color: item.color }, children: [item.progress_percentage, "%"] })] }), isEditing ? (_jsx(Slider, { value: [item.progress_percentage], max: 100, step: 5, onValueChange: ([v]) => updateItem(item.id, { progress_percentage: v }), className: "py-1" })) : (_jsx("div", { className: "relative h-2 rounded-full bg-secondary overflow-hidden", children: _jsx("div", { className: "absolute inset-y-0 left-0 rounded-full transition-all", style: { width: `${item.progress_percentage}%`, backgroundColor: item.color } }) }))] }), _jsxs("div", { className: "pt-1 space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-semibold text-muted-foreground", children: "\u2699\uFE0F SISTEMAS" }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs gap-1", onClick: () => openCreateDialog(item.area_id), children: [_jsx(Plus, { className: "h-3 w-3" }), " Agregar"] })] }), areaSystems.length === 0 && (_jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "Agrega sistemas que te lleven al Punto B" })), areaSystems.map(sys => {
                                                const states = dailyStates[sys.id] || {};
                                                const allDone = sys.tasks.length > 0 && sys.tasks.every(t => states[t.id]);
                                                return (_jsxs("div", { className: cn("rounded-lg border p-2 space-y-1.5 transition-opacity", !sys.is_active && "opacity-50"), style: { borderColor: item.color + "30" }, children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xs font-medium flex-1", children: sys.name }), _jsx(Switch, { checked: sys.is_active, onCheckedChange: v => toggleActive(sys.id, v), className: "scale-75" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5", onClick: () => openEditDialog(sys), children: _jsx(Settings2, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-5 w-5 text-red-400 hover:text-red-600", onClick: () => deleteSystem(sys.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }), sys.description && (_jsx("p", { className: "text-[10px] text-muted-foreground", children: sys.description })), sys.tasks.length > 0 && (_jsx("div", { className: "space-y-1 pl-0.5", children: sys.tasks.map(task => (_jsxs("label", { className: cn("flex items-center gap-1.5 cursor-pointer", allDone && "line-through text-muted-foreground/60"), children: [_jsx(Checkbox, { checked: states[task.id] || false, onCheckedChange: () => toggleTaskState(sys.id, task.id), className: "h-3 w-3" }), _jsx("span", { className: "text-[11px]", children: task.description })] }, task.id))) }))] }, sys.id));
                                            })] })] }, item.id));
                        }) })] }), _jsx(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: _jsxs(DialogContent, { className: "sm:max-w-md", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: editingSystem ? "Editar sistema" : "Nuevo sistema" }), _jsx(DialogDescription, { children: "Define las acciones diarias que te acercan al Punto B" })] }), _jsxs("div", { className: "space-y-4 py-2", children: [_jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Nombre del sistema" }), _jsx(Input, { value: dialogName, onChange: e => setDialogName(e.target.value), placeholder: "Ej: Baja energ\u00EDa, Normal, Motivado...", className: "text-sm" })] }), _jsxs("div", { className: "space-y-1", children: [_jsx(Label, { className: "text-xs", children: "Descripci\u00F3n" }), _jsx(Textarea, { value: dialogDescription, onChange: e => setDialogDescription(e.target.value), placeholder: "Describe qu\u00E9 implica este sistema...", className: "text-sm min-h-[60px]" })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx(Label, { className: "text-xs", children: "Subtareas" }), _jsxs(Button, { variant: "ghost", size: "sm", className: "h-6 text-xs gap-1", onClick: addTaskToDialog, children: [_jsx(Plus, { className: "h-3 w-3" }), " Agregar subtarea"] })] }), dialogTasks.length === 0 && (_jsx("p", { className: "text-[10px] text-muted-foreground italic", children: "No hay subtareas. Agrega acciones espec\u00EDficas." })), dialogTasks.map((task, idx) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-[10px] text-muted-foreground w-4", children: [idx + 1, "."] }), _jsx(Input, { value: task.description, onChange: e => updateTaskInDialog(task.id, e.target.value), placeholder: "Ej: Estudiar 2 bloques de 1hr", className: "h-7 text-xs flex-1" }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 shrink-0 text-red-400 hover:text-red-600", onClick: () => removeTaskFromDialog(task.id), children: _jsx(Trash2, { className: "h-3 w-3" }) })] }, task.id)))] })] }), _jsxs(DialogFooter, { children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => setDialogOpen(false), children: "Cancelar" }), _jsx(Button, { size: "sm", onClick: handleSaveSystem, disabled: !dialogName.trim(), children: editingSystem ? "Guardar cambios" : "Crear sistema" })] })] }) })] }));
}
