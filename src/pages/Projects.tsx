import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Plus, Trash2, Pencil, FolderKanban, Target, ListTodo, CheckCheck, AlertTriangle, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useImageUpload } from '@/hooks/useImageUpload';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { useProjects, type Project, type ProjectTask } from '@/hooks/useProjects';

const todayIso = () => new Date().toISOString().slice(0, 10);

const taskIsOverdue = (task: ProjectTask) => !!task.dueDate && !task.completed && task.dueDate.slice(0, 10) < todayIso();

const projectHasOverdue = (project: Project) => project.tasks.some(taskIsOverdue);

const getProjectProgress = (project: Project) => {
  if (project.tasks.length === 0) return 0;
  const completed = project.tasks.filter(t => t.completed).length;
  return (completed / project.tasks.length) * 100;
};

const sortTasks = (tasks: ProjectTask[]) => [...tasks].sort((a, b) => {
  const ao = taskIsOverdue(a) ? 0 : 1;
  const bo = taskIsOverdue(b) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  const ad = a.dueDate ?? '9999-99-99';
  const bd = b.dueDate ?? '9999-99-99';
  if (ad !== bd) return ad.localeCompare(bd);
  return a.title.localeCompare(b.title);
});

const sortProjects = (projects: Project[]) => [...projects].sort((a, b) => {
  const ao = projectHasOverdue(a) ? 0 : 1;
  const bo = projectHasOverdue(b) ? 0 : 1;
  if (ao !== bo) return ao - bo;
  const pa = getProjectProgress(a);
  const pb = getProjectProgress(b);
  if (pb !== pa) return pb - pa;
  return a.name.localeCompare(b.name);
});

function ProgressRing({ value, size = 56, stroke = 6 }: { value: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} className="stroke-muted/30" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          className={cn("transition-all duration-500", value >= 100 ? "stroke-green-500" : "stroke-primary")}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums">{Math.round(value)}%</div>
    </div>
  );
}

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
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isPendingOpen, setIsPendingOpen] = useState(true);
  const { values: activeProjectIds, toggle: toggleSelectedProject } = useActiveSelections('activeProjects');
  const { toast } = useToast();
  const { uploadImage, uploading } = useImageUpload();

  const stats = useMemo(() => {
    let totalTasks = 0;
    let totalDone = 0;
    let totalSubs = 0;
    let overdue = 0;
    for (const p of projects) {
      totalTasks += p.tasks.length;
      totalDone += p.tasks.filter(t => t.completed).length;
      totalSubs += p.tasks.reduce((s, t) => s + (t.subTasks?.length || 0), 0);
      overdue += p.tasks.filter(taskIsOverdue).length;
    }
    return { totalTasks, totalDone, totalSubs, overdue, pending: totalTasks - totalDone };
  }, [projects]);

  const allDone = stats.totalTasks > 0 && stats.totalDone === stats.totalTasks;
  const overallPct = stats.totalTasks > 0 ? (stats.totalDone / stats.totalTasks) * 100 : 0;

  const groups = useMemo(() => ({
    sinIniciar: sortProjects(projects.filter(p => getProjectProgress(p) === 0)),
    enProgreso: sortProjects(projects.filter(p => getProjectProgress(p) > 0 && getProjectProgress(p) < 100)),
    completados: sortProjects(projects.filter(p => getProjectProgress(p) === 100)),
  }), [projects]);

  const sections = [
    { key: 'sin-iniciar', label: 'Sin iniciar', dot: 'bg-zinc-400', items: groups.sinIniciar },
    { key: 'en-progreso', label: 'En progreso', dot: 'bg-blue-500', items: groups.enProgreso },
    { key: 'completados', label: 'Completados', dot: 'bg-green-500', items: groups.completados },
  ].filter(s => s.items.length > 0);

  const pendingProjects = useMemo(() => sortProjects(projects.filter(p => p.tasks.some(t => !t.completed))), [projects]);

  const handleSelectProject = (projectId: string) => {
    const wasSelected = activeProjectIds.includes(projectId);
    toggleSelectedProject(projectId);
    toast({ title: wasSelected ? 'Proyecto deseleccionado' : 'Proyecto activo seleccionado' });
  };

  const handleImageUpload = async (projectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imageUrl = await uploadImage(file, 'project-covers');
    if (imageUrl) {
      updateProject(projectId, { coverImage: imageUrl });
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
    setDetailProject(null);
    setIsDetailOpen(false);
    toast({ title: 'Proyecto eliminado' });
  };

  const openDetail = (project: Project) => {
    setCurrentProject(project);
    setDetailProject(project);
    setIsDetailOpen(true);
  };

  const handleAddTask = () => {
    if (!currentProject || !taskTitle.trim()) return;
    addTaskHook(currentProject.id, taskTitle, taskDueDate || undefined);
    setTaskTitle('');
    setTaskDueDate('');
    setIsTaskDialogOpen(false);
    toast({ title: 'Tarea añadida' });
  };

  const handleEditTask = (task: ProjectTask) => {
    setCurrentTask(task);
    setTaskTitle(task.title);
    setTaskDueDate(task.dueDate || '');
    setIsEditTaskDialogOpen(true);
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

  const renderTaskRows = (project: Project) => (
    <div className="space-y-1">
      {project.tasks.map((task) => {
        const overdue = taskIsOverdue(task);
        return (
          <div key={task.id} className="space-y-1">
            <div className={cn(
              "flex items-center gap-2 p-2 rounded-xl transition-all",
              task.completed ? "bg-green-500/5" : overdue ? "bg-red-500/5" : "bg-muted/30 hover:bg-muted/50"
            )}>
              <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(project.id, task.id)}
                className="h-4 w-4 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500" />
              <div className="flex-1 min-w-0">
                <span className={cn("text-xs", task.completed && "line-through text-muted-foreground")}>{task.title}</span>
                {task.dueDate && (
                  <span className={cn("flex items-center gap-1 text-[10px] mt-0.5", overdue ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                    {overdue && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                    {new Date(task.dueDate).toLocaleDateString()}{overdue && " · Vencida"}
                  </span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => { setCurrentProject(project); handleEditTask(task); }}>
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
        );
      })}
    </div>
  );

  const renderProjectsCard = (project: Project) => {
    const progress = getProjectProgress(project);
    const isSelected = activeProjectIds.includes(project.id);
    const pending = project.tasks.filter(t => !t.completed).length;
    const overdue = project.tasks.filter(taskIsOverdue).length;
    const done = project.tasks.filter(t => t.completed).length;
    return (
      <Card
        key={project.id}
        onClick={() => openDetail(project)}
        className={cn(
          "group border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden transition-all cursor-pointer hover:shadow-md hover:-translate-y-0.5",
          isSelected && "ring-2 ring-primary shadow-lg shadow-primary/10"
        )}
      >
        {project.coverImage ? (
          <div className="h-24 overflow-hidden">
            <img src={project.coverImage} alt={project.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          </div>
        ) : (
          <div className="h-14 bg-gradient-to-br from-primary/10 to-transparent flex items-center justify-center">
            <FolderKanban className="h-5 w-5 text-muted-foreground/60" />
          </div>
        )}
        <div className={cn("h-1 bg-gradient-to-r", progress >= 100 ? "from-green-400 to-emerald-400" : projectHasOverdue(project) ? "from-red-400 to-amber-400" : "from-primary to-primary/60")} />
        <CardContent className="p-4 space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{project.name}</h3>
              {project.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
              )}
            </div>
            <Button
              variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0"
              onClick={(e) => { e.stopPropagation(); handleSelectProject(project.id); }}
              title={isSelected ? "Deseleccionar como activo" : "Marcar como proyecto activo"}
            >
              <div className={cn("w-3.5 h-3.5 rounded-full border-2 transition-all", isSelected ? "bg-primary border-primary" : "border-muted-foreground/40")} />
            </Button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {progress >= 100 && <Badge className="text-[9px] h-4 rounded-full bg-green-500/10 text-green-500 border-green-500/30">Hecho</Badge>}
            {overdue > 0 && <Badge className="text-[9px] h-4 rounded-full bg-red-500/10 text-red-500 border-red-500/30">{overdue} vencida{overdue > 1 ? 's' : ''}</Badge>}
            {pending > 0 && <Badge variant="outline" className="text-[9px] h-4 rounded-full">{pending} pendientes</Badge>}
          </div>

          <div className="flex items-center gap-2">
            <Progress value={progress} className="flex-1 h-1" indicatorClassName={progress >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : ""} />
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{Math.round(progress)}%</span>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="tabular-nums">{done}/{project.tasks.length} tareas</span>
            <span className="inline-flex items-center gap-1 text-primary/80 group-hover:text-primary transition-colors">
              Ver detalle <ExternalLink className="h-3 w-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_hsl(var(--primary)/0.04)_0%,_transparent_50%)] p-4 md:p-6 pt-20 pb-24">
      <div className="max-w-6xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Proyectos</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {projects.length} proyectos · {stats.totalDone}/{stats.totalTasks} tareas
              {stats.overdue > 0 && <span className="text-red-500"> · {stats.overdue} vencidas</span>}
            </p>
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

        {/* Summary bar */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-primary to-primary/60" />
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <ProgressRing value={overallPct} />
              <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-xs text-muted-foreground">
                  Progreso global {allDone ? '· todo completado' : ''}
                </p>
                <p className="text-xl font-bold tabular-nums leading-none">
                  {Math.round(overallPct)}% <span className="text-sm font-medium text-muted-foreground">· {stats.totalDone}/{stats.totalTasks} tareas</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] h-5 rounded-full gap-1">
                    <FolderKanban className="h-3 w-3 text-blue-500" /> {projects.length} proyectos
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-5 rounded-full gap-1">
                    <ListTodo className="h-3 w-3 text-purple-500" /> {stats.pending} pendientes
                  </Badge>
                  <Badge variant="outline" className="text-[10px] h-5 rounded-full gap-1">
                    <Target className="h-3 w-3 text-amber-500" /> {stats.totalSubs} sub-tareas
                  </Badge>
                  {stats.overdue > 0 && (
                    <Badge className="text-[10px] h-5 rounded-full gap-1 bg-red-500/10 text-red-500 border-red-500/30">
                      <AlertTriangle className="h-3 w-3" /> {stats.overdue} vencidas
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mis pendientes */}
        <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
          <button className="w-full flex items-center justify-between p-4" onClick={() => setIsPendingOpen(v => !v)}>
            <div className="flex items-center gap-2 min-w-0">
              {isPendingOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <ListTodo className="h-4 w-4 text-primary" /> Mis pendientes
              </span>
              <Badge className="text-[10px] h-4 rounded-full bg-primary/10 text-primary border-primary/20">{stats.pending}</Badge>
            </div>
            {pendingProjects.length > 0 && (
              <span className="hidden sm:inline text-[10px] text-muted-foreground">
                vencidas primero · {pendingProjects.length} proyecto{pendingProjects.length > 1 ? 's' : ''}
              </span>
            )}
          </button>
          {isPendingOpen && (
            <CardContent className="px-4 pb-4 pt-0">
              {pendingProjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <CheckCheck className="h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium">¡Todo al día!</p>
                  <p className="text-xs text-muted-foreground">No tienes tareas pendientes.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingProjects.map(project => (
                    <div key={project.id} className="rounded-2xl bg-muted/20 border border-border/40 p-3">
                      <button
                        className="w-full flex items-center justify-between gap-2 mb-2"
                        onClick={() => openDetail(project)}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <FolderKanban className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-xs font-semibold truncate hover:underline">{project.name}</span>
                          <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{Math.round(getProjectProgress(project))}%</span>
                        </span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                      </button>
                      <div className="space-y-1">
                        {sortTasks(project.tasks.filter(t => !t.completed)).map(task => {
                          const overdue = taskIsOverdue(task);
                          const pendingSubs = (task.subTasks || []).filter(st => !st.completed);
                          return (
                            <div key={task.id} className="space-y-1">
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 hover:bg-muted/50">
                                <Checkbox checked={task.completed} onCheckedChange={() => handleToggleTask(project.id, task.id)}
                                  className={cn("h-4 w-4 rounded-full data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500", overdue && "border-red-400")} />
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs">{task.title}</span>
                                  {task.dueDate && (
                                    <span className={cn("flex items-center gap-1 text-[10px] mt-0.5", overdue ? "text-red-500 font-semibold" : "text-muted-foreground")}>
                                      {overdue && <AlertTriangle className="h-2.5 w-2.5 shrink-0" />}
                                      {new Date(task.dueDate).toLocaleDateString()}{overdue && " · Vencida"}
                                    </span>
                                  )}
                                </div>
                                {pendingSubs.length > 0 && (
                                  <Badge variant="outline" className="text-[9px] h-4 rounded-full shrink-0">{pendingSubs.length} sub</Badge>
                                )}
                              </div>
                              {pendingSubs.length > 0 && (
                                <div className="ml-8 space-y-1">
                                  {pendingSubs.map(subTask => (
                                    <div key={subTask.id} className="flex items-center gap-2 p-1.5 rounded-lg">
                                      <Checkbox checked={subTask.completed} onCheckedChange={() => handleToggleSubTask(project.id, task.id, subTask.id)}
                                        className="h-3 w-3 rounded-full data-[state=checked]:bg-green-500/70 data-[state=checked]:border-green-500/70" />
                                      <span className="text-[11px] text-muted-foreground">{subTask.title}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button
                          className="w-full text-left mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-primary px-2 py-1 rounded-lg transition-colors"
                          onClick={() => openDetail(project)}
                        >
                          <Plus className="h-3 w-3" /> Gestionar tareas
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        {/* Projects grouped by state */}
        {projects.length === 0 ? (
          <Card className="border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderKanban className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="font-medium mb-1">Sin proyectos</p>
              <p className="text-xs text-muted-foreground text-center mb-4">Crea tu primer proyecto para comenzar</p>
              <Button onClick={() => setIsProjectDialogOpen(true)} className="rounded-full">Crear Proyecto</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {sections.map(section => (
              <div key={section.key} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", section.dot)} />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{section.label}</span>
                  <Badge variant="outline" className="text-[10px] h-4 rounded-full">{section.items.length}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {section.items.map(renderProjectsCard)}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Project detail dialog */}
        <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle className="truncate pr-8">{detailProject?.name}</DialogTitle></DialogHeader>
            {detailProject && (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {detailProject.coverImage && (
                  <div className="h-28 overflow-hidden rounded-2xl">
                    <img src={detailProject.coverImage} alt={detailProject.name} className="w-full h-full object-cover" />
                  </div>
                )}
                {detailProject.description && (
                  <p className="text-xs text-muted-foreground">{detailProject.description}</p>
                )}

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Progress value={getProjectProgress(detailProject)} className="flex-1 h-1.5" indicatorClassName={getProjectProgress(detailProject) >= 100 ? "bg-gradient-to-r from-green-400 to-emerald-400" : ""} />
                    <span className="text-[10px] font-semibold text-muted-foreground tabular-nums">{Math.round(getProjectProgress(detailProject))}%</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-[10px] h-5 rounded-full gap-1">
                      <ListTodo className="h-3 w-3 text-purple-500" />
                      {detailProject.tasks.filter(t => t.completed).length}/{detailProject.tasks.length} tareas
                    </Badge>
                    {detailProject.tasks.filter(taskIsOverdue).length > 0 && (
                      <Badge className="text-[10px] h-5 rounded-full gap-1 bg-red-500/10 text-red-500 border-red-500/30">
                        <AlertTriangle className="h-3 w-3" /> {detailProject.tasks.filter(taskIsOverdue).length} vencidas
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tareas</span>
                    <Button variant="outline" size="sm" className="h-6 text-[10px] rounded-full gap-1" onClick={() => { setCurrentProject(detailProject); setIsTaskDialogOpen(true); }}>
                      <Plus className="h-3 w-3" /> Añadir
                    </Button>
                  </div>
                  <div className="space-y-1">
                    {detailProject.tasks.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground text-center py-3">Sin tareas aún</p>
                    ) : (
                      renderTaskRows(detailProject)
                    )}
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proyecto</span>
                  <div className="flex items-center gap-2">
                    <label className="text-[10px] text-muted-foreground cursor-pointer hover:text-primary transition-colors flex items-center gap-1">
                      {detailProject.coverImage ? 'Cambiar portada' : 'Añadir portada'}
                      <input id={`cover-${detailProject.id}`} type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(detailProject.id, e)} />
                    </label>
                    <Button
                      variant="ghost" size="sm" className="h-6 text-[10px] rounded-full gap-1 text-destructive hover:text-destructive ml-auto"
                      onClick={() => handleDeleteProject(detailProject.id)}
                    >
                      <Trash2 className="h-3 w-3" /> Eliminar proyecto
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

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