import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, Briefcase, Code2, ListTodo, Plus, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const AREAS = [
    { id: "universidad", label: "Universidad", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/30", link: "/university" },
    { id: "emprendimiento", label: "Emprendimiento", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", link: "/entrepreneurship" },
    { id: "proyectos", label: "Proyectos", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/30", link: "/projects" },
    { id: "tareas", label: "Tareas", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/30", link: "/tasks" },
];
export function FocusTasksPanel() {
    const [tasksByArea, setTasksByArea] = useState({});
    const [open, setOpen] = useState({
        universidad: true, emprendimiento: true, proyectos: true, tareas: true,
    });
    const [dialogOpen, setDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newDesc, setNewDesc] = useState("");
    const [newArea, setNewArea] = useState("tareas");
    const load = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
            .from("tasks")
            .select("id, title, area_id, completed")
            .or(`due_date.gte.${today}T00:00:00,due_date.is.null`)
            .or(`due_date.lte.${today}T23:59:59,due_date.is.null`)
            .order("completed", { ascending: true })
            .order("created_at", { ascending: false })
            .limit(80);
        const grouped = {};
        AREAS.forEach(a => (grouped[a.id] = []));
        (data || []).forEach((t) => {
            const k = t.area_id && grouped[t.area_id] ? t.area_id : "tareas";
            grouped[k].push(t);
        });
        setTasksByArea(grouped);
    };
    useEffect(() => { load(); }, []);
    const toggleTask = async (id, completed) => {
        await supabase.from("tasks").update({ completed: !completed, status: !completed ? "completada" : "pendiente" }).eq("id", id);
        setTasksByArea(prev => {
            const next = {};
            Object.entries(prev).forEach(([k, list]) => {
                next[k] = list.map(t => t.id === id ? { ...t, completed: !completed } : t);
            });
            return next;
        });
    };
    const createTask = async () => {
        if (!newTitle.trim())
            return;
        const today = new Date();
        today.setHours(23, 59, 0, 0);
        const { error } = await supabase.from("tasks").insert({
            title: newTitle.trim(),
            description: newDesc.trim() || null,
            area_id: newArea,
            status: "pendiente",
            completed: false,
            due_date: today.toISOString(),
            source: "foco",
        });
        if (error) {
            toast.error("Error al crear tarea");
            return;
        }
        toast.success("Tarea creada");
        setNewTitle("");
        setNewDesc("");
        setDialogOpen(false);
        load();
    };
    return (_jsxs(Card, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-sm font-bold", children: "\uD83C\uDFAF Tareas de Foco" }), _jsx("p", { className: "text-[11px] text-muted-foreground", children: "Por \u00E1rea: Universidad \u00B7 Emprendimiento \u00B7 Proyectos \u00B7 Tareas" })] }), _jsxs(Dialog, { open: dialogOpen, onOpenChange: setDialogOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { size: "sm", className: "h-7 text-[11px] gap-1", children: [_jsx(Plus, { className: "h-3 w-3" }), " Nueva tarea"] }) }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nueva tarea de foco" }) }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "\u00C1rea" }), _jsxs(Select, { value: newArea, onValueChange: setNewArea, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }), _jsx(SelectContent, { children: AREAS.map(a => (_jsx(SelectItem, { value: a.id, children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx(a.icon, { className: cn("h-4 w-4", a.color) }), " ", a.label] }) }, a.id))) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "T\u00EDtulo" }), _jsx(Input, { value: newTitle, onChange: e => setNewTitle(e.target.value), placeholder: "\u00BFQu\u00E9 quieres lograr hoy?" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-muted-foreground", children: "Descripci\u00F3n (opcional)" }), _jsx(Textarea, { value: newDesc, onChange: e => setNewDesc(e.target.value), rows: 3 })] }), _jsx(Button, { onClick: createTask, className: "w-full", children: "Crear tarea" })] })] })] })] }), _jsx("div", { className: "space-y-2", children: AREAS.map(area => {
                    const list = tasksByArea[area.id] || [];
                    const done = list.filter(t => t.completed).length;
                    const Icon = area.icon;
                    const isOpen = open[area.id];
                    return (_jsxs("div", { className: cn("rounded-lg border", area.border, area.bg), children: [_jsxs("button", { className: "w-full flex items-center gap-2 px-2 py-1.5", onClick: () => setOpen(o => ({ ...o, [area.id]: !isOpen })), children: [isOpen ? _jsx(ChevronDown, { className: "h-3 w-3" }) : _jsx(ChevronRight, { className: "h-3 w-3" }), _jsx(Icon, { className: cn("h-4 w-4", area.color) }), _jsx("span", { className: "text-xs font-semibold flex-1 text-left", children: area.label }), _jsxs("span", { className: "text-[10px] text-muted-foreground", children: [done, "/", list.length] }), _jsx(Link, { to: area.link, onClick: (e) => e.stopPropagation(), className: "text-[10px] text-primary underline", children: "Ver" })] }), isOpen && (_jsxs("div", { className: "px-2 pb-2 space-y-1", children: [list.length === 0 && (_jsx("p", { className: "text-[11px] text-muted-foreground py-1 italic", children: "Sin tareas hoy" })), list.map(t => (_jsxs("button", { onClick: () => toggleTask(t.id, t.completed), className: "w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/50 text-left", children: [_jsx("div", { className: cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0", t.completed ? "bg-green-500 border-green-500" : "border-muted-foreground/40"), children: t.completed && _jsx(Check, { className: "h-2.5 w-2.5 text-white", strokeWidth: 3 }) }), _jsx("span", { className: cn("text-[11px] flex-1 truncate", t.completed && "line-through text-muted-foreground"), children: t.title })] }, t.id)))] }))] }, area.id));
                }) })] }));
}
