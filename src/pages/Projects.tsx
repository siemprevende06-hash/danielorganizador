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
import { useActiveSelection } from '@/hooks/useActiveSelection';
import { useProjects, type Project, type ProjectTask } from '@/hooks/useProjects';

export default function ProjectsPage() {
  const { projects, loading, createProject, deleteProject: deleteProjectHook, updateProject, addTask: addTaskHook, toggleTask, deleteTask: deleteTaskHook, updateTask: updateTaskHook, addSubTask: addSubTaskHook, toggleSubTask: toggleSubTaskHook } = useProjects();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentTask, setCurrentTask] = useState<ProjectTask | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const { value: selectedProjectId, set: setSelectedProjectId, toggle: toggleSelectedProject } = useActiveSelection('selectedProjectId');
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload();

  useEffect(() => {
    setExpandedProjects(new Set(projects.map(p => p.id)));
  }, [projects.length]);

  const toggleProjectExpand = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev);
      if (next.has(projectId)) next.delete(projectId);
      else next.add(projectId);
      return next;
    });
  };

  const handleSelectProject = (projectId: string) => {
    const wasSelected = selectedProjectId === projectId;
    toggleSelectedProject(projectId);
    toast({ title: wasSelected ? 'Proyecto deseleccionado' : 'Proyecto activo seleccionado' });
  };

  const handleImageUpload = async (projectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await uploadImage(file, 'project-covers');
    if (imageUrl) {
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, coverImage: imageUrl } : p));
      toast({ title: 'Imagen actualizada' });
    }
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) return;
    createProject(projectName, projectDescription);
    setProjectName('');
    setProjectDescription('');
    setIsProjectDialogOpen(false);
    toast({ title: 'Proyecto creado', description: `${projectName} ha sido añadido.` });
  };

  const handleDeleteProject = (projectId: string) => {
    deleteProjectHook(projectId);
    toast({ title: 'Proyecto eliminado' });
  };

  const handleAddTask = () => {
    if (!currentProject || !taskTitle.trim()) return;
    addTaskHook(currentProject.id, taskTitle, taskDueDate || undefined);
    setTaskTitle('');
    setTaskDueDate('');
    setIsTaskDialogOpen(false);
    toast({ title: 'Tarea añadida' });
  };

  const handleEditTask = (projectId: string, taskId: string) => {
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
    if (!currentProject || !currentTask || !taskTitle.trim()) return;
    updateTaskHook(currentProject.id, currentTask.id, { title: taskTitle, dueDate: taskDueDate || undefined });
    setTaskTitle('');
    setTaskDueDate('');
    setCurrentTask(null);
    setIsEditTaskDialogOpen(false);
    toast({ title: 'Tarea actualizada' });
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    toggleTask(projectId, taskId);
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    deleteTaskHook(projectId, taskId);
  };

  const handleAddSubTask = () => {
    if (!currentProject || !currentTask || !subTaskTitle.trim()) return;
    addSubTaskHook(currentProject.id, currentTask.id, subTaskTitle);
    setSubTaskTitle('');
    setIsSubTaskDialogOpen(false);
    toast({ title: 'Sub-tarea añadida' });
  };

  const handleToggleSubTask = (projectId: string, taskId: string, subTaskId: string) => {
    toggleSubTaskHook(projectId, taskId, subTaskId);
  };

  const getProjectProgress = (project: Project) => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.completed).length;
    return (completed / project.tasks.length) * 100;
  };

  const totalTasks = projects.reduce((s, p) => s + p.tasks.length, 0);
  const totalDone = projects.reduce((s, p) => s + p.tasks.filter(t => t.completed).length, 0);
  const totalSubs = projects.reduce((s, p) => s + p.tasks.reduce((s2, t) => s2 + (t.subTasks?.length || 0), 0), 0);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{projects.length} proyectos · {totalDone}/{totalTasks} tareas</p>
          </div>
          <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
            <Button size="sm" className="h-8 text-xs rounded-full gap-1.5" onClick={() => setIsProjectDialogOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Proyecto
            </Button>
              <DialogContent>
              <DialogHeader><DialogTitle>Nuevo Proyecto</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-3">
                <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="Nombre del proyecto" />
                <Textarea value={projectDescription} onChange={e => setProjectDescription(e.target.value)} placeholder="Descripción..." rows={2} />
                <Button onClick={handleCreateProject} className="w-full rounded-full">Crear Proyecto</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-2.5">
          {[
            { icon: <FolderKanban className="h-4 w-4 text-blue-500" />, label: "Proyectos", value: projects.length, gradient: "from-blue-500 to-cyan-400" },
            { icon: <ListTodo className="h-4 w-4 text-purple-500" />, label: "Tareas", value: totalTasks, gradient: "from-purple-500 to-pink-400" },
            { icon: <CheckCheck className="h-4 w-4 text-green-500" />, label: "Completadas", value: totalDone, gradient: "from-green-400 to-emerald-400" },
            { icon: <Target className="h-4 w-4 text-amber-500" />, label: "Sub-tareas", value: totalSubs, gradient: "from-amber-500 to-orange-400" },
          ].map((s, i) => (
            <Card key={i} className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
              <div className={cn("h-1 bg-gradient-to-r", s.gradient)} />
              <CardContent className="p-3.5 text-center space-y-1">
                <div className="flex justify-center">{s.icon}</div>
                <div className="text-lg font-bold tabular-nums">{s.value}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects grid */}
        {projects.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin proyectos</p>
              <p className="text-xs text-muted-foreground text-center mb-4">Crea tu primer proyecto para comenzar</p>
              <Button onClick={() => setIsProjectDialogOpen(true)} className="rounded-full">Crear Proyecto</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {projects.map((project) => {
              const progress = getProjectProgress(project);
              const isSelected = selectedProjectId === project.id;
              const isExpanded = expandedProjects.has(project.id);
              const pendingTasks = project.tasks.filter(t => !t.completed).length;
              return (
                <Card key={project.id} className={cn(
                  "border-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all",
                  isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10"
                )}>
                  {project.coverImage && (
                    <div className="h-28 overflow-hidden">
                      <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className={cn("h-1", progress >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : "bg-gradient-to-r from-primary to-primary/60")} />
                  <CardContent className="p-4 space-y-3">
                    {/* Project header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0" onClick={() => toggleProjectExpand(project.id)}>
                        <div className="flex items-center gap-2 cursor-pointer">
                          {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                          <h3 className="font-semibold text-sm truncate">{project.name}</h3>
                          {progress >= 100 && <Badge className="text-[9px] h-4 rounded-full bg-green-500/10 text-green-500 border-green-500/30">Hecho</Badge>}
                          {pendingTasks > 0 && <Badge variant="outline" className="text-[9px] h-4 rounded-full">{pendingTasks} pendientes</Badge>}
                        </div>
                        {project.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 ml-6 truncate">{project.description}</p>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleSelectProject(project.id)} title={isSelected ? "Deseleccionar" : "Seleccionar activo"}>
                          <div className={cn("w-3.5 h-3.5 rounded-full border-2 transition-all", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => handleDeleteProject(project.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="flex-1 h-1" indicatorClassName={progress >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : ""} />
                      <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
                    </div>

                    {/* Cover image upload */}
                    <label className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
                      {project.coverImage ? 'Cambiar portada' : 'Añadir portada'}
                      <input id={`cover-${project.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(project.id, e)} />
                    </label>

                    {/* Tasks section */}
                    {isExpanded && (
                      <div className="space-y-2 pt-2 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Tareas ({project.tasks.filter(t => t.completed).length}/{project.tasks.length})
                          </span>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] rounded-full gap-1" onClick={() => { setCurrentProject(project); setIsTaskDialogOpen(true); }}>
                            <Plus className="h-3 w-3" /> Añadir
                          </Button>
                        </div>
                        <div className="space-y-1 max-h-64 overflow-y-auto">
                          {project.tasks.map((task) => (
                            <div key={task.id} className="space-y-1">
                              <div className={cn(
                                "flex items-center gap-2 p-2 rounded-xl transition-all",
                                task.completed ? "bg-green-500/5" : "bg-muted/30 hover:bg-muted/50"
                              )}>
                                <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(project.id, task.id)}
                                  className="h-4 w-4 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
                                <div className="flex-1 min-w-0">
                                  <span className={cn("text-xs", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                                  {task.dueDate && <span className="text-[10px] text-muted-foreground ml-2">{new Date(task.dueDate).toLocaleDateString()}</span>}
                                </div>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleEditTask(project.id, task.id)}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setCurrentProject(project); setCurrentTask(task); setIsSubTaskDialogOpen(true); }}>
                                  <Target className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => handleDeleteTask(project.id, task.id)}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                              {task.subTasks && task.subTasks.length > 0 && (
                                <div className="ml-8 space-y-1">
                                  {task.subTasks.map(subTask => (
                                    <div key={subTask.id} className="flex items-center gap-2 p-1.5 rounded-lg">
                                      <Checkbox checked={subTask.completed} onCheckedChange={() => handleToggleSubTask(project.id, task.id, subTask.id)}
                                        className="h-3 w-3 rounded-full data-[state=checked]:bg-green-500/70 data-[state=checked]:border-green-500/70" />
                                      <span className={cn("text-[11px]", subTask.completed ? "line-through text-muted-foreground" : "text-muted-foreground")}>{subTask.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          {project.tasks.length === 0 && (
                            <p className="text-[11px] text-muted-foreground text-center py-3">Sin tareas aún</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Dialogs */}
        <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Tarea</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Título de la tarea" />
              <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
              <Button onClick={handleAddTask} className="w-full rounded-full">Añadir Tarea</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Editar Tarea</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <Input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="Título" />
              <Input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} />
              <Button onClick={handleUpdateTask} className="w-full rounded-full">Actualizar</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isSubTaskDialogOpen} onOpenChange={setIsSubTaskDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nueva Sub-tarea</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-3">
              <Input value={subTaskTitle} onChange={e => setSubTaskTitle(e.target.value)} placeholder="Título de la sub-tarea" />
              <Button onClick={handleAddSubTask} className="w-full rounded-full">Añadir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}