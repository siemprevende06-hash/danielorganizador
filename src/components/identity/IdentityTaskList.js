import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Star, ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
export function IdentityTaskList({ identityPlanId, color = "#22c55e" }) {
    const [tasks, setTasks] = useState([]);
    const [newTitle, setNewTitle] = useState("");
    const [newSubFor, setNewSubFor] = useState(null);
    const [subTitle, setSubTitle] = useState("");
    const [open, setOpen] = useState({});
    const load = async () => {
        const { data } = await supabase
            .from("identity_plan_tasks")
            .select("*")
            .eq("identity_plan_id", identityPlanId)
            .order("order_index", { ascending: true });
        setTasks(data || []);
    };
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identityPlanId]);
    const addTask = async (parent_task_id, title) => {
        if (!title.trim())
            return;
        const order_index = tasks.filter(t => t.parent_task_id === parent_task_id).length;
        const { data } = await supabase
            .from("identity_plan_tasks")
            .insert({ identity_plan_id: identityPlanId, parent_task_id, title: title.trim(), order_index })
            .select("*")
            .single();
        if (data)
            setTasks(prev => [...prev, data]);
    };
    const updateTask = async (id, patch) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
        await supabase.from("identity_plan_tasks").update(patch).eq("id", id);
    };
    const removeTask = async (id) => {
        setTasks(prev => prev.filter(t => t.id !== id && t.parent_task_id !== id));
        await supabase.from("identity_plan_tasks").delete().eq("id", id);
    };
    const setPrimary = async (id) => {
        setTasks(prev => prev.map(t => t.parent_task_id === null ? { ...t, is_primary: t.id === id } : t));
        await supabase.from("identity_plan_tasks").update({ is_primary: false }).eq("identity_plan_id", identityPlanId).is("parent_task_id", null);
        await supabase.from("identity_plan_tasks").update({ is_primary: true }).eq("id", id);
    };
    const roots = tasks.filter(t => !t.parent_task_id);
    const subs = (parentId) => tasks.filter(t => t.parent_task_id === parentId);
    const totalCount = tasks.length;
    const doneCount = tasks.filter(t => t.completed).length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
    return (_jsxs("div", { className: "space-y-1.5", children: [roots.length > 0 && (_jsxs("div", { className: "flex items-center justify-between text-[10px] mb-1", children: [_jsx("span", { className: "text-muted-foreground", children: "Tareas Punto B" }), _jsxs("span", { className: "font-semibold", style: { color }, children: [doneCount, "/", totalCount, " \u00B7 ", pct, "%"] })] })), roots.map(t => {
                const children = subs(t.id);
                const childDone = children.filter(c => c.completed).length;
                const expanded = open[t.id] ?? true;
                return (_jsxs("div", { className: "rounded-md border bg-card/40 p-1.5 space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Checkbox, { checked: t.completed, onCheckedChange: (c) => updateTask(t.id, { completed: !!c }), className: "h-3.5 w-3.5" }), _jsx("button", { onClick: () => setOpen(o => ({ ...o, [t.id]: !expanded })), className: "h-5 w-5 flex items-center justify-center text-muted-foreground", children: children.length > 0 ? (expanded ? _jsx(ChevronDown, { className: "h-3 w-3" }) : _jsx(ChevronRight, { className: "h-3 w-3" })) : null }), _jsx("span", { className: cn("flex-1 text-xs truncate", t.completed && "line-through text-muted-foreground"), children: t.title }), children.length > 0 && (_jsxs("span", { className: "text-[9px] text-muted-foreground", children: [childDone, "/", children.length] })), _jsx("button", { onClick: () => setPrimary(t.id), className: cn("h-5 w-5 flex items-center justify-center", t.is_primary ? "text-amber-500" : "text-muted-foreground/40"), title: "Marcar como principal", children: _jsx(Star, { className: cn("h-3 w-3", t.is_primary && "fill-amber-500") }) }), _jsx("button", { onClick: () => removeTask(t.id), className: "h-5 w-5 flex items-center justify-center text-muted-foreground hover:text-red-500", children: _jsx(Trash2, { className: "h-3 w-3" }) })] }), expanded && (_jsxs("div", { className: "pl-6 space-y-1", children: [children.map(c => (_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(Checkbox, { checked: c.completed, onCheckedChange: (v) => updateTask(c.id, { completed: !!v }), className: "h-3 w-3" }), _jsx("span", { className: cn("flex-1 text-[11px] truncate", c.completed && "line-through text-muted-foreground"), children: c.title }), _jsx("button", { onClick: () => removeTask(c.id), className: "h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-red-500", children: _jsx(Trash2, { className: "h-2.5 w-2.5" }) })] }, c.id))), newSubFor === t.id ? (_jsxs("div", { className: "flex gap-1", children: [_jsx(Input, { autoFocus: true, value: subTitle, onChange: (e) => setSubTitle(e.target.value), onKeyDown: (e) => {
                                                if (e.key === "Enter") {
                                                    addTask(t.id, subTitle);
                                                    setSubTitle("");
                                                    setNewSubFor(null);
                                                }
                                                if (e.key === "Escape") {
                                                    setSubTitle("");
                                                    setNewSubFor(null);
                                                }
                                            }, placeholder: "Subtarea...", className: "h-6 text-[11px]" }), _jsx(Button, { size: "sm", className: "h-6 px-2", onClick: () => { addTask(t.id, subTitle); setSubTitle(""); setNewSubFor(null); }, children: "OK" })] })) : (_jsxs("button", { onClick: () => setNewSubFor(t.id), className: "text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1", children: [_jsx(Plus, { className: "h-2.5 w-2.5" }), " Subtarea"] }))] }))] }, t.id));
            }), _jsxs("div", { className: "flex gap-1 pt-1", children: [_jsx(Input, { value: newTitle, onChange: (e) => setNewTitle(e.target.value), onKeyDown: (e) => { if (e.key === "Enter") {
                            addTask(null, newTitle);
                            setNewTitle("");
                        } }, placeholder: "+ Nueva tarea para llegar al Punto B...", className: "h-7 text-xs" }), _jsx(Button, { size: "sm", className: "h-7 px-2", onClick: () => { addTask(null, newTitle); setNewTitle(""); }, children: _jsx(Plus, { className: "h-3 w-3" }) })] })] }));
}
