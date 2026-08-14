import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Briefcase, GraduationCap, FolderKanban, ListTodo } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
export const DailyTaskSelector = ({ selectedTasks, onTasksChange, routineBlockId }) => {
    const [open, setOpen] = useState(false);
    const [generalTasks, setGeneralTasks] = useState([]);
    const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [universityTasks, setUniversityTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    useEffect(() => {
        if (open) {
            loadAllTasks();
        }
    }, [open]);
    const loadAllTasks = async () => {
        setLoading(true);
        try {
            // Load general tasks
            const { data: tasksData } = await supabase
                .from("tasks")
                .select("*")
                .or("source.eq.general,source.eq.university,source.eq.study_session,source.eq.project")
                .eq("completed", false)
                .order("created_at", { ascending: false });
            if (tasksData) {
                const mapped = tasksData.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || undefined,
                    source: (t.source === "university" || t.source === "study_session" ? "university" :
                        t.source === "project" ? "project" : "tasks"),
                    dueDate: t.due_date || undefined,
                    completed: t.completed || false,
                }));
                setGeneralTasks(mapped.filter(t => t.source === "tasks"));
                setUniversityTasks(mapped.filter(t => t.source === "university"));
                setProjectTasks(mapped.filter(t => t.source === "project"));
            }
            // Load entrepreneurship tasks
            const { data: entTasks } = await supabase
                .from("entrepreneurship_tasks")
                .select("*, entrepreneurships(name)")
                .eq("completed", false)
                .order("created_at", { ascending: false });
            if (entTasks) {
                setEntrepreneurshipTasks(entTasks.map(t => ({
                    id: t.id,
                    title: t.title,
                    description: t.description || undefined,
                    source: "entrepreneurship",
                    sourceId: t.entrepreneurship_id,
                    sourceName: t.entrepreneurships?.name,
                    dueDate: t.due_date || undefined,
                    completed: t.completed,
                })));
            }
        }
        catch (error) {
            console.error("Error loading tasks:", error);
        }
        finally {
            setLoading(false);
        }
    };
    const isTaskSelected = (taskId) => {
        return selectedTasks.some(t => t.id === taskId);
    };
    const toggleTask = (task) => {
        if (isTaskSelected(task.id)) {
            onTasksChange(selectedTasks.filter(t => t.id !== task.id));
        }
        else {
            onTasksChange([...selectedTasks, task]);
        }
    };
    const renderTaskList = (tasks, emptyMessage) => {
        if (loading) {
            return _jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: "Cargando..." });
        }
        if (tasks.length === 0) {
            return _jsx("p", { className: "text-sm text-muted-foreground py-4 text-center", children: emptyMessage });
        }
        return (_jsx("div", { className: "space-y-2", children: tasks.map(task => (_jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors", onClick: () => toggleTask(task), children: [_jsx(Checkbox, { checked: isTaskSelected(task.id), onCheckedChange: () => toggleTask(task), className: "mt-1" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("p", { className: "font-medium text-sm", children: task.title }), task.description && (_jsx("p", { className: "text-xs text-muted-foreground truncate", children: task.description })), task.sourceName && (_jsx(Badge, { variant: "outline", className: "mt-1 text-xs", children: task.sourceName }))] })] }, task.id))) }));
    };
    return (_jsxs(Dialog, { open: open, onOpenChange: setOpen, children: [_jsx(DialogTrigger, { asChild: true, children: _jsxs(Button, { variant: "outline", size: "sm", className: "gap-2", children: [_jsx(Plus, { className: "h-4 w-4" }), "Agregar Tareas"] }) }), _jsxs(DialogContent, { className: "max-w-2xl max-h-[80vh]", children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Seleccionar Tareas para el D\u00EDa" }) }), _jsxs(Tabs, { defaultValue: "general", className: "w-full", children: [_jsxs(TabsList, { className: "grid w-full grid-cols-4", children: [_jsxs(TabsTrigger, { value: "general", className: "gap-1 text-xs", children: [_jsx(ListTodo, { className: "h-3 w-3" }), "General"] }), _jsxs(TabsTrigger, { value: "entrepreneurship", className: "gap-1 text-xs", children: [_jsx(Briefcase, { className: "h-3 w-3" }), "Emprendimiento"] }), _jsxs(TabsTrigger, { value: "university", className: "gap-1 text-xs", children: [_jsx(GraduationCap, { className: "h-3 w-3" }), "Universidad"] }), _jsxs(TabsTrigger, { value: "projects", className: "gap-1 text-xs", children: [_jsx(FolderKanban, { className: "h-3 w-3" }), "Proyectos"] })] }), _jsxs(ScrollArea, { className: "h-[400px] mt-4", children: [_jsx(TabsContent, { value: "general", className: "mt-0", children: renderTaskList(generalTasks, "No hay tareas generales pendientes") }), _jsx(TabsContent, { value: "entrepreneurship", className: "mt-0", children: renderTaskList(entrepreneurshipTasks, "No hay tareas de emprendimiento pendientes") }), _jsx(TabsContent, { value: "university", className: "mt-0", children: renderTaskList(universityTasks, "No hay tareas de universidad pendientes") }), _jsx(TabsContent, { value: "projects", className: "mt-0", children: renderTaskList(projectTasks, "No hay tareas de proyectos pendientes") })] })] }), _jsxs("div", { className: "flex justify-between items-center pt-4 border-t", children: [_jsxs("p", { className: "text-sm text-muted-foreground", children: [selectedTasks.length, " tarea(s) seleccionada(s)"] }), _jsx(Button, { onClick: () => setOpen(false), children: "Listo" })] })] })] }));
};
