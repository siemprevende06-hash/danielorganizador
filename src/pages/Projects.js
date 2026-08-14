import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Pencil, FolderKanban, Target, ListTodo, ChevronDown, ChevronRight, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { useProjects } from '@/hooks/useProjects';
export default function ProjectsPage() {
    const { projects, loading, createProject, deleteProject: deleteProjectHook, updateProject, addTask: addTaskHook, toggleTask, deleteTask: deleteTaskHook, updateTask: updateTaskHook, addSubTask: addSubTaskHook, toggleSubTask: toggleSubTaskHook } = useProjects();
    const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
    const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
    const [currentProject, setCurrentProject] = useState(null);
    const [currentTask, setCurrentTask] = useState(null);
    const [projectName, setProjectName] = useState('');
    const [projectDescription, setProjectDescription] = useState('');
    const [taskTitle, setTaskTitle] = useState('');
    const [taskDueDate, setTaskDueDate] = useState('');
    const [subTaskTitle, setSubTaskTitle] = useState('');
    const { values: activeProjectIds, toggle: toggleSelectedProject } = useActiveSelections('activeProjects');
    const [expandedProjects, setExpandedProjects] = useState(new Set());
    const { toast } = useToast();
    const { uploadImage, uploading } = useImageUpload();
    useEffect(() => {
        setExpandedProjects(new Set(projects.map(p => p.id)));
    }, [projects.length]);
    const toggleProjectExpand = (projectId) => {
        setExpandedProjects(prev => {
            const next = new Set(prev);
            if (next.has(projectId))
                next.delete(projectId);
            else
                next.add(projectId);
            return next;
        });
    };
    const handleSelectProject = (projectId) => {
        const wasSelected = activeProjectIds.includes(projectId);
        toggleSelectedProject(projectId);
        toast({ title: wasSelected ? 'Proyecto deseleccionado' : 'Proyecto activo seleccionado' });
    };
    const handleImageUpload = async (projectId, event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const imageUrl = await uploadImage(file, 'project-covers');
        if (imageUrl) {
            updateProject(projectId, { coverImage: imageUrl });
            toast({ title: 'Imagen actualizada' });
        }
    };
    const handleCreateProject = () => {
        if (!projectName.trim())
            return;
        createProject(projectName, projectDescription);
        setProjectName('');
        setProjectDescription('');
        setIsProjectDialogOpen(false);
        toast({ title: 'Proyecto creado', description: `${projectName} ha sido añadido.` });
    };
    const handleDeleteProject = (projectId) => {
        deleteProjectHook(projectId);
        toast({ title: 'Proyecto eliminado' });
    };
    const handleAddTask = () => {
        if (!currentProject || !taskTitle.trim())
            return;
        addTaskHook(currentProject.id, taskTitle, taskDueDate || undefined);
        setTaskTitle('');
        setTaskDueDate('');
        setIsTaskDialogOpen(false);
        toast({ title: 'Tarea añadida' });
    };
    const handleEditTask = (projectId, taskId) => {
        const project = projects.find(p => p.id === projectId);
        const task = project?.tasks.find(t => t.id === taskId);
        if (task && project) {
            setCurrentProject(project);
            setCurrentTask(task);
            setTaskTitle(task.title);
            setTaskDueDate(task.dueDate || '');
            setIsEditTaskDialogOpen(true);
        }
    };
    const handleUpdateTask = () => {
        if (!currentProject || !currentTask || !taskTitle.trim())
            return;
        updateTaskHook(currentProject.id, currentTask.id, { title: taskTitle, dueDate: taskDueDate || undefined });
        setTaskTitle('');
        setTaskDueDate('');
        setCurrentTask(null);
        setIsEditTaskDialogOpen(false);
        toast({ title: 'Tarea actualizada' });
    };
    const handleToggleTask = (projectId, taskId) => {
        toggleTask(projectId, taskId);
    };
    const handleDeleteTask = (projectId, taskId) => {
        deleteTaskHook(projectId, taskId);
    };
    const handleAddSubTask = () => {
        if (!currentProject || !currentTask || !subTaskTitle.trim())
            return;
        addSubTaskHook(currentProject.id, currentTask.id, subTaskTitle);
        setSubTaskTitle('');
        setIsSubTaskDialogOpen(false);
        toast({ title: 'Sub-tarea añadida' });
    };
    const handleToggleSubTask = (projectId, taskId, subTaskId) => {
        toggleSubTaskHook(projectId, taskId, subTaskId);
    };
    const getProjectProgress = (project) => {
        if (project.tasks.length === 0)
            return 0;
        const completed = project.tasks.filter(t => t.completed).length;
        return (completed / project.tasks.length) * 100;
    };
    const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
    const totalDone = projects.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0);
    const totalSubs = projects.reduce((s, p) => s + p.tasks.reduce((s2, t) => s2 + (t.subTasks?.length || 0), 0), 0);
    return (_jsx("div", { className: "min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24", children: _jsxs("div", { className: "max-w-6xl mx-auto space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Proyectos" }), _jsxs("p", { className: "text-xs text-muted-foreground mt-0.5", children: [projects.length, " proyectos \u00B7 ", totalDone, "/", totalTasks, " tareas"] })] }), _jsxs(Dialog, { open: isProjectDialogOpen, onOpenChange: setIsProjectDialogOpen, children: [_jsxs(Button, { size: "sm", className: "h-8 text-xs rounded-full gap-1.5", onClick: () => setIsProjectDialogOpen(true), children: [_jsx(Plus, { className: "h-3.5 w-3.5" }), " Proyecto"] }), _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nuevo Proyecto" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { value: projectName, onChange: e => setProjectName(e.target.value), placeholder: "Nombre del proyecto" }), _jsx(Textarea, { value: projectDescription, onChange: e => setProjectDescription(e.target.value), placeholder: "Descripci\u00F3n...", rows: 2 }), _jsx(Button, { onClick: handleCreateProject, className: "w-full rounded-full", children: "Crear Proyecto" })] })] })] })] }), _jsx("div", { className: "grid grid-cols-4 gap-2.5", children: [
                        { icon: _jsx(FolderKanban, { className: "h-4 w-4 text-blue-500" }), label: "Proyectos", value: projects.length, gradient: "from-blue-500 to-cyan-400" },
                        { icon: _jsx(ListTodo, { className: "h-4 w-4 text-purple-500" }), label: "Tareas", value: totalTasks, gradient: "from-purple-500 to-pink-400" },
                        { icon: _jsx(CheckCheck, { className: "h-4 w-4 text-green-500" }), label: "Completadas", value: totalDone, gradient: "from-green-400 to-emerald-400" },
                        { icon: _jsx(Target, { className: "h-4 w-4 text-amber-500" }), label: "Sub-tareas", value: totalSubs, gradient: "from-amber-500 to-orange-400" },
                    ].map((s, i) => (_jsxs(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden", children: [_jsx("div", { className: cn("h-1 bg-gradient-to-r", s.gradient) }), _jsxs(CardContent, { className: "p-3.5 text-center space-y-1", children: [_jsx("div", { className: "flex justify-center", children: s.icon }), _jsx("div", { className: "text-lg font-bold tabular-nums", children: s.value }), _jsx("div", { className: "text-[10px] text-muted-foreground", children: s.label })] })] }, i))) }), projects.length === 0 ? (_jsx(Card, { className: "border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl", children: _jsxs(CardContent, { className: "flex flex-col items-center justify-center py-12", children: [_jsx(FolderKanban, { className: "h-10 w-10 text-muted-foreground mb-3" }), _jsx("p", { className: "font-medium mb-1", children: "Sin proyectos" }), _jsx("p", { className: "text-xs text-muted-foreground text-center mb-4", children: "Crea tu primer proyecto para comenzar" }), _jsx(Button, { onClick: () => setIsProjectDialogOpen(true), className: "rounded-full", children: "Crear Proyecto" })] }) })) : (_jsx("div", { className: "grid gap-3 md:grid-cols-2", children: projects.map((project) => {
                        const progress = getProjectProgress(project);
                        const isSelected = activeProjectIds.includes(project.id);
                        const isExpanded = expandedProjects.has(project.id);
                        const pendingTasks = project.tasks.filter(t => !t.completed).length;
                        return (_jsxs(Card, { className: cn("border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all", isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10"), children: [project.coverImage && (_jsx("div", { className: "h-28 overflow-hidden", children: _jsx("img", { src: project.coverImage, alt: project.name, className: "w-full h-full object-cover" }) })), _jsx("div", { className: cn("h-1", progress >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-primary to-primary/60") }), _jsxs(CardContent, { className: "p-4 space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between gap-2", children: [_jsxs("div", { className: "flex-1 min-w-0", onClick: () => toggleProjectExpand(project.id), children: [_jsxs("div", { className: "flex items-center gap-2 cursor-pointer", children: [isExpanded ? _jsx(ChevronDown, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }) : _jsx(ChevronRight, { className: "h-3.5 w-3.5 text-muted-foreground shrink-0" }), _jsx("h3", { className: "font-semibold text-sm truncate", children: project.name }), progress >= 100 && _jsx(Badge, { className: "text-[9px] h-4 rounded-full bg-green-500/10 text-green-500 border-green-500/30", children: "Hecho" }), pendingTasks > 0 && _jsxs(Badge, { variant: "outline", className: "text-[9px] h-4 rounded-full", children: [pendingTasks, " pendientes"] })] }), project.description && (_jsx("p", { className: "text-xs text-muted-foreground mt-0.5 ml-6 truncate", children: project.description }))] }), _jsxs("div", { className: "flex gap-1 shrink-0", children: [_jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 rounded-full", onClick: () => handleSelectProject(project.id), title: isSelected ? "Deseleccionar" : "Seleccionar activo", children: _jsx("div", { className: cn("w-3.5 h-3.5 rounded-full border-2 transition-all", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40") }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-7 w-7 rounded-full", onClick: () => handleDeleteProject(project.id), children: _jsx(Trash2, { className: "h-3.5 w-3.5 text-destructive" }) })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Progress, { value: progress, className: "flex-1 h-1", indicatorClassName: progress >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : "" }), _jsxs("span", { className: "text-[10px] font-semibold text-muted-foreground tabular-nums", children: [Math.round(progress), "%"] })] }), _jsxs("label", { className: "text-[10px] text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1", children: [project.coverImage ? 'Cambiar portada' : 'Añadir portada', _jsx("input", { id: `cover-${project.id}`, type: "file", accept: "image/*", className: "hidden", onChange: (e) => handleImageUpload(project.id, e) })] }), isExpanded && (_jsxs("div", { className: "space-y-2 pt-2 border-t", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("span", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: ["Tareas (", project.tasks.filter(t => t.completed).length, "/", project.tasks.length, ")"] }), _jsxs(Button, { variant: "outline", size: "sm", className: "h-6 text-[10px] rounded-full gap-1", onClick: () => { setCurrentProject(project); setIsTaskDialogOpen(true); }, children: [_jsx(Plus, { className: "h-3 w-3" }), " A\u00F1adir"] })] }), _jsxs("div", { className: "space-y-1 max-h-64 overflow-y-auto", children: [project.tasks.map((task) => (_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: cn("flex items-center gap-2 p-2 rounded-xl transition-all", task.completed ? "bg-green-500/5" : "bg-muted/30 hover:bg-muted/50"), children: [_jsx(Checkbox, { checked: task.completed, onCheckedChange: () => handleToggleTask(project.id, task.id), className: "h-4 w-4 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("span", { className: cn("text-xs", task.completed && "line-through text-muted-foreground"), children: task.title }), task.dueDate && _jsx("span", { className: "text-[10px] text-muted-foreground ml-2", children: new Date(task.dueDate).toLocaleDateString() })] }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 rounded-full", onClick: () => handleEditTask(project.id, task.id), children: _jsx(Pencil, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 rounded-full", onClick: () => { setCurrentProject(project); setCurrentTask(task); setIsSubTaskDialogOpen(true); }, children: _jsx(Target, { className: "h-3 w-3" }) }), _jsx(Button, { variant: "ghost", size: "icon", className: "h-6 w-6 rounded-full", onClick: () => handleDeleteTask(project.id, task.id), children: _jsx(Trash2, { className: "h-3 w-3 text-destructive" }) })] }), task.subTasks && task.subTasks.length > 0 && (_jsx("div", { className: "ml-8 space-y-1", children: task.subTasks.map(subTask => (_jsxs("div", { className: "flex items-center gap-2 p-1.5 rounded-lg", children: [_jsx(Checkbox, { checked: subTask.completed, onCheckedChange: () => handleToggleSubTask(project.id, task.id, subTask.id), className: "h-3 w-3 rounded-full data-[state=checked]:bg-green-500/70 data-[state=checked]:border-green-500/70" }), _jsx("span", { className: cn("text-[11px]", subTask.completed ? "line-through text-muted-foreground" : "text-muted-foreground"), children: subTask.title })] }, subTask.id))) }))] }, task.id))), project.tasks.length === 0 && (_jsx("p", { className: "text-[11px] text-muted-foreground text-center py-3", children: "Sin tareas a\u00FAn" }))] })] }))] })] }, project.id));
                    }) })), _jsx(Dialog, { open: isTaskDialogOpen, onOpenChange: setIsTaskDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nueva Tarea" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { value: taskTitle, onChange: e => setTaskTitle(e.target.value), placeholder: "T\u00EDtulo de la tarea" }), _jsx(Input, { type: "date", value: taskDueDate, onChange: e => setTaskDueDate(e.target.value) }), _jsx(Button, { onClick: handleAddTask, className: "w-full rounded-full", children: "A\u00F1adir Tarea" })] })] }) }), _jsx(Dialog, { open: isEditTaskDialogOpen, onOpenChange: setIsEditTaskDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Editar Tarea" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { value: taskTitle, onChange: e => setTaskTitle(e.target.value), placeholder: "T\u00EDtulo" }), _jsx(Input, { type: "date", value: taskDueDate, onChange: e => setTaskDueDate(e.target.value) }), _jsx(Button, { onClick: handleUpdateTask, className: "w-full rounded-full", children: "Actualizar" })] })] }) }), _jsx(Dialog, { open: isSubTaskDialogOpen, onOpenChange: setIsSubTaskDialogOpen, children: _jsxs(DialogContent, { children: [_jsx(DialogHeader, { children: _jsx(DialogTitle, { children: "Nueva Sub-tarea" }) }), _jsxs("div", { className: "space-y-3 mt-3", children: [_jsx(Input, { value: subTaskTitle, onChange: e => setSubTaskTitle(e.target.value), placeholder: "T\u00EDtulo de la sub-tarea" }), _jsx(Button, { onClick: handleAddSubTask, className: "w-full rounded-full", children: "A\u00F1adir" })] })] }) })] }) }));
}
