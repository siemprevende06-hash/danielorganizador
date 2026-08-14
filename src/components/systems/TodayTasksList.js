import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { GraduationCap, Briefcase, Code } from "lucide-react";
const AREA_CONFIG = {
    universidad: { label: "Universidad", icon: GraduationCap, color: "text-purple-500" },
    emprendimiento: { label: "Emprendimiento", icon: Briefcase, color: "text-amber-500" },
    "proyectos-personales": { label: "Proyectos", icon: Code, color: "text-cyan-500" },
};
export function TodayTasksList() {
    const [tasks, setTasks] = useState([]);
    useEffect(() => {
        fetchTasks();
    }, []);
    const fetchTasks = async () => {
        const today = new Date().toISOString().split("T")[0];
        const { data } = await supabase
            .from("tasks")
            .select("id, title, completed, area_id, source")
            .or(`due_date.eq.${today},due_date.is.null`)
            .in("area_id", ["universidad", "emprendimiento", "proyectos-personales"])
            .eq("completed", false)
            .order("created_at", { ascending: false })
            .limit(20);
        if (data)
            setTasks(data);
    };
    const toggleTask = async (id, completed) => {
        await supabase.from("tasks").update({ completed: !completed }).eq("id", id);
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t));
    };
    const grouped = tasks.reduce((acc, t) => {
        const key = t.area_id || "otros";
        if (!acc[key])
            acc[key] = [];
        acc[key].push(t);
        return acc;
    }, {});
    return (_jsxs(Card, { className: "p-4 md:p-6", children: [_jsx("h3", { className: "text-lg font-bold mb-1", children: "\uD83D\uDCCB Tareas del D\u00EDa" }), _jsx("p", { className: "text-xs text-muted-foreground mb-4", children: "Universidad, Emprendimiento y Proyectos" }), Object.keys(grouped).length === 0 && (_jsx("p", { className: "text-sm text-muted-foreground text-center py-6", children: "No hay tareas pendientes para hoy" })), Object.entries(grouped).map(([areaId, areaTasks]) => {
                const config = AREA_CONFIG[areaId];
                if (!config)
                    return null;
                const AreaIcon = config.icon;
                return (_jsxs("div", { className: "mb-4 last:mb-0", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(AreaIcon, { className: cn("h-4 w-4", config.color) }), _jsx("span", { className: "text-sm font-semibold", children: config.label }), _jsx(Badge, { variant: "secondary", className: "text-[10px]", children: areaTasks.length })] }), _jsx("div", { className: "space-y-1.5 pl-6", children: areaTasks.map(task => (_jsxs("div", { className: "flex items-center gap-2 p-2 rounded-md hover:bg-muted/50", children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => toggleTask(task.id, task.completed), className: "h-4 w-4" }), _jsx("span", { className: cn("text-sm flex-1", task.completed && "line-through text-muted-foreground"), children: task.title })] }, task.id))) })] }, areaId));
            })] }));
}
