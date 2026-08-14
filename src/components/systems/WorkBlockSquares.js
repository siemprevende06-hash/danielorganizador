import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Check, Plus, X, GraduationCap, Briefcase, Code2, Languages, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
const WORK_BLOCKS = [
    { id: "work-1", start: "9:00", end: "10:30" },
    { id: "work-2", start: "10:30", end: "12:00" },
    { id: "work-3", start: "12:00", end: "13:20" },
    { id: "work-4", start: "14:00", end: "15:30" },
    { id: "work-5", start: "15:30", end: "17:00" },
    { id: "work-6", start: "17:00", end: "18:30" },
    { id: "work-7", start: "18:30", end: "20:00" },
];
const AREAS = [
    { id: "universidad", label: "Uni", icon: GraduationCap, color: "text-purple-500", bg: "bg-purple-500/15 border-purple-500/40" },
    { id: "emprendimiento", label: "Emp", icon: Briefcase, color: "text-amber-500", bg: "bg-amber-500/15 border-amber-500/40" },
    { id: "proyectos", label: "Proy", icon: Code2, color: "text-cyan-500", bg: "bg-cyan-500/15 border-cyan-500/40" },
    { id: "idiomas", label: "Idi", icon: Languages, color: "text-green-500", bg: "bg-green-500/15 border-green-500/40" },
    { id: "tareas", label: "Tar", icon: ListTodo, color: "text-blue-500", bg: "bg-blue-500/15 border-blue-500/40" },
];
const parseTime = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
};
const formatT = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
const UNIFIED_PREFIX = "__mode__";
const isUnified = (cellAssignments, parentId) => cellAssignments[`${UNIFIED_PREFIX}${parentId}`] === "unified";
export function WorkBlockSquares({ cellAssignments, cellCompletions, onAssignArea, onToggleCell }) {
    const [selectedCell, setSelectedCell] = useState(null);
    const [cellTasks, setCellTasks] = useState({});
    const [availableTasks, setAvailableTasks] = useState([]);
    const [currentMinutes, setCurrentMinutes] = useState(() => {
        const n = new Date();
        return n.getHours() * 60 + n.getMinutes();
    });
    useEffect(() => {
        const i = setInterval(() => {
            const n = new Date();
            setCurrentMinutes(n.getHours() * 60 + n.getMinutes());
        }, 30000);
        return () => clearInterval(i);
    }, []);
    // Build 30-min cells per work block
    const blocksWithCells = WORK_BLOCKS.map(b => {
        const startM = parseTime(b.start);
        const endM = parseTime(b.end);
        const count = Math.max(1, Math.round((endM - startM) / 30));
        const cells = [];
        for (let i = 0; i < count; i++) {
            const s = startM + i * 30;
            const e = Math.min(s + 30, endM);
            cells.push({
                id: `${b.id}-${i}`,
                parentId: b.id,
                index: i,
                start: formatT(s),
                end: formatT(e),
            });
        }
        return { parent: b, cells };
    });
    // Load tasks per cell (uses tasks.routine_block_id with composed cell id)
    useEffect(() => {
        const load = async () => {
            const today = new Date().toISOString().split("T")[0];
            const cellIds = [
                ...blocksWithCells.flatMap(b => b.cells.map(c => c.id)),
                ...WORK_BLOCKS.map(b => `${b.id}-all`),
            ];
            const { data } = await supabase
                .from("tasks")
                .select("id, title, area_id, completed, routine_block_id")
                .in("routine_block_id", cellIds)
                .or(`due_date.eq.${today}T00:00:00,due_date.is.null`);
            const grouped = {};
            (data || []).forEach((t) => {
                const k = t.routine_block_id;
                if (!grouped[k])
                    grouped[k] = [];
                grouped[k].push({ id: t.id, title: t.title, area_id: t.area_id, completed: t.completed });
            });
            setCellTasks(grouped);
        };
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const loadAvailableTasks = async (areaFilter) => {
        const today = new Date().toISOString().split("T")[0];
        let q = supabase
            .from("tasks")
            .select("id, title, area_id, completed")
            .eq("completed", false)
            .is("routine_block_id", null)
            .or(`due_date.eq.${today}T00:00:00,due_date.is.null`)
            .order("created_at", { ascending: false })
            .limit(40);
        if (areaFilter)
            q = q.eq("area_id", areaFilter);
        const { data } = await q;
        setAvailableTasks(data || []);
    };
    const assignTask = async (taskId, cellId) => {
        await supabase.from("tasks").update({ routine_block_id: cellId }).eq("id", taskId);
        const t = availableTasks.find(t => t.id === taskId);
        if (t) {
            setCellTasks(prev => ({ ...prev, [cellId]: [...(prev[cellId] || []), t] }));
            setAvailableTasks(prev => prev.filter(x => x.id !== taskId));
        }
    };
    const removeTask = async (taskId, cellId) => {
        await supabase.from("tasks").update({ routine_block_id: null }).eq("id", taskId);
        setCellTasks(prev => ({ ...prev, [cellId]: (prev[cellId] || []).filter(t => t.id !== taskId) }));
    };
    const openCell = (cellId) => {
        setSelectedCell(cellId);
        const area = cellAssignments[cellId];
        loadAvailableTasks(area);
    };
    const renderCell = (cell) => {
        const areaId = cellAssignments[cell.id];
        const area = AREAS.find(a => a.id === areaId);
        const Icon = area?.icon;
        const completed = !!cellCompletions[cell.id];
        const tasks = cellTasks[cell.id] || [];
        const startM = parseTime(cell.start);
        const endM = parseTime(cell.end);
        const isPast = currentMinutes >= endM;
        const isCurrent = currentMinutes >= startM && currentMinutes < endM;
        return (_jsxs("button", { onClick: () => openCell(cell.id), className: cn("relative aspect-square flex-1 min-w-0 rounded-lg border-2 p-1.5 transition-all flex flex-col items-center justify-between text-center overflow-hidden", area ? area.bg : "bg-muted/40 border-dashed border-muted-foreground/30", isCurrent && "ring-2 ring-primary shadow-md", isPast && !completed && "opacity-50", completed && "ring-2 ring-green-500/60"), children: [_jsx("span", { className: "text-[9px] font-mono leading-none text-muted-foreground", children: cell.start }), Icon ? (_jsx(Icon, { className: cn("h-5 w-5", area.color) })) : (_jsx(Plus, { className: "h-4 w-4 text-muted-foreground/60" })), _jsxs("div", { className: "flex flex-col items-center gap-0.5", children: [_jsx("span", { className: "text-[9px] font-medium leading-none truncate max-w-full", children: area ? area.label : "—" }), tasks.length > 0 && (_jsx(Badge, { variant: "secondary", className: "text-[8px] px-1 py-0 h-3 leading-none", children: tasks.length }))] }), completed && (_jsx("span", { className: "absolute top-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-green-500 flex items-center justify-center", children: _jsx(Check, { className: "h-2.5 w-2.5 text-white", strokeWidth: 3 }) }))] }, cell.id));
    };
    const selected = selectedCell
        ? (() => {
            if (selectedCell.endsWith("-all")) {
                const parentId = selectedCell.replace(/-all$/, "");
                const parent = WORK_BLOCKS.find(b => b.id === parentId);
                if (parent)
                    return { id: selectedCell, parentId, start: parent.start, end: parent.end, index: 0 };
                return null;
            }
            return blocksWithCells.flatMap(b => b.cells).find(c => c.id === selectedCell) || null;
        })()
        : null;
    return (_jsxs(Card, { className: "p-4 md:p-5", children: [_jsxs("div", { className: "mb-3", children: [_jsx("h3", { className: "text-lg font-bold", children: "\uD83E\uDDF1 Bloques de Trabajo (30 min)" }), _jsx("p", { className: "text-xs text-muted-foreground", children: "3 cajas = 1 bloque de 90min. Toca para asignar \u00E1rea y tareas." })] }), _jsx("div", { className: "space-y-3", children: blocksWithCells.map(({ parent, cells }) => {
                    const unified = isUnified(cellAssignments, parent.id);
                    const unifiedId = `${parent.id}-all`;
                    const unifiedArea = cellAssignments[unifiedId];
                    const unifiedAreaInfo = AREAS.find(a => a.id === unifiedArea);
                    const UnifiedIcon = unifiedAreaInfo?.icon;
                    const unifiedDone = !!cellCompletions[unifiedId];
                    return (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center justify-between px-1", children: [_jsxs("span", { className: "text-[11px] font-mono text-muted-foreground", children: [parent.start, " \u2013 ", parent.end] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("span", { className: "text-[10px] uppercase tracking-wider text-muted-foreground", children: ["Bloque ", parent.id.split("-")[1]] }), _jsx("button", { onClick: () => onAssignArea(`${UNIFIED_PREFIX}${parent.id}`, unified ? "split" : "unified"), className: "text-[10px] px-1.5 py-0.5 rounded border border-muted-foreground/30 hover:border-primary hover:text-primary transition-colors", children: unified ? "→ 3×30m" : "→ 1×1:30h" })] })] }), unified ? (_jsxs("button", { onClick: () => openCell(unifiedId), className: cn("w-full rounded-lg border-2 p-3 transition-all flex items-center gap-3 text-left", unifiedAreaInfo ? unifiedAreaInfo.bg : "bg-muted/40 border-dashed border-muted-foreground/30", unifiedDone && "ring-2 ring-green-500/60"), children: [UnifiedIcon ? (_jsx(UnifiedIcon, { className: cn("h-6 w-6", unifiedAreaInfo.color) })) : (_jsx(Plus, { className: "h-5 w-5 text-muted-foreground/60" })), _jsxs("div", { className: "flex-1", children: [_jsx("p", { className: "text-sm font-semibold", children: unifiedAreaInfo ? unifiedAreaInfo.label : "Sin asignar" }), _jsxs("p", { className: "text-[10px] text-muted-foreground", children: ["Bloque unificado de 1:30h \u00B7 ", (cellTasks[unifiedId] || []).length, " tarea(s)"] })] }), unifiedDone && (_jsx("span", { className: "h-5 w-5 rounded-full bg-green-500 flex items-center justify-center", children: _jsx(Check, { className: "h-3 w-3 text-white", strokeWidth: 3 }) }))] })) : (_jsx("div", { className: "flex gap-1.5", children: cells.map(renderCell) }))] }, parent.id));
                }) }), _jsx("div", { className: "flex flex-wrap gap-2 mt-4 pt-3 border-t", children: AREAS.map(a => {
                    const Icon = a.icon;
                    return (_jsxs("div", { className: "flex items-center gap-1", children: [_jsx(Icon, { className: cn("h-3 w-3", a.color) }), _jsx("span", { className: "text-[10px] text-muted-foreground", children: a.label })] }, a.id));
                }) }), _jsx(Dialog, { open: !!selectedCell, onOpenChange: (o) => !o && setSelectedCell(null), children: _jsxs(DialogContent, { className: "max-h-[85vh] overflow-y-auto", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: selected && `${selected.start} – ${selected.end}` }) }), selected && (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "space-y-2", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "\u00C1rea" }), _jsxs(Select, { value: cellAssignments[selected.id] || "", onValueChange: (v) => {
                                                onAssignArea(selected.id, v);
                                                loadAvailableTasks(v);
                                            }, children: [_jsx(SelectTrigger, { children: _jsx(SelectValue, { placeholder: "Selecciona un \u00E1rea..." }) }), _jsx(SelectContent, { children: AREAS.map(a => {
                                                        const Icon = a.icon;
                                                        return (_jsx(SelectItem, { value: a.id, children: _jsxs("span", { className: "flex items-center gap-2", children: [_jsx(Icon, { className: cn("h-4 w-4", a.color) }), a.label] }) }, a.id));
                                                    }) })] })] }), _jsxs(Button, { variant: cellCompletions[selected.id] ? "default" : "outline", onClick: () => onToggleCell(selected.id), className: "w-full gap-2", children: [_jsx(Check, { className: "h-4 w-4" }), cellCompletions[selected.id] ? "Completado ✓" : "Marcar como completado"] }), (cellTasks[selected.id] || []).length > 0 && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("p", { className: "text-xs font-medium text-muted-foreground", children: "Tareas asignadas" }), (cellTasks[selected.id] || []).map(t => (_jsxs("div", { className: "flex items-center justify-between px-2 py-1.5 rounded bg-muted/50", children: [_jsx("span", { className: "text-sm truncate", children: t.title }), _jsx(Button, { size: "sm", variant: "ghost", className: "h-6 w-6 p-0", onClick: () => removeTask(t.id, selected.id), children: _jsx(X, { className: "h-3 w-3" }) })] }, t.id)))] })), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("p", { className: "text-xs font-medium text-muted-foreground", children: ["Tareas disponibles ", cellAssignments[selected.id] ? `(${cellAssignments[selected.id]})` : ""] }), availableTasks.length === 0 && (_jsx("p", { className: "text-xs text-muted-foreground", children: "No hay tareas disponibles" })), availableTasks.map(t => (_jsxs("div", { className: "flex items-center justify-between px-2 py-1.5 rounded border hover:bg-muted/50 cursor-pointer", onClick: () => assignTask(t.id, selected.id), children: [_jsx("span", { className: "text-sm truncate", children: t.title }), _jsx(Plus, { className: "h-3 w-3 text-muted-foreground" })] }, t.id)))] })] }))] }) })] }));
}
