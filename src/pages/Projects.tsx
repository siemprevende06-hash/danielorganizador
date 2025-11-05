import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { PlusCircle, Trash2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

interface ProjectTask {
  id: string;
  title: string;
  completed: boolean;
  subTasks?: SubTask[];
}

interface Project {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  tasks: ProjectTask[];
}

const PROJECTS_KEY = 'userProjects';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isSubTaskDialogOpen, setIsSubTaskDialogOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentTask, setCurrentTask] = useState<ProjectTask | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [subTaskTitle, setSubTaskTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem(PROJECTS_KEY);
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
    }
  }, [projects]);

  const handleImageUpload = (projectId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? { ...p, coverImage: reader.result as string }
            : p
        )
      );
      toast({ title: 'Imagen actualizada', description: 'La portada del proyecto ha sido actualizada.' });
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProject = () => {
    if (!projectName.trim()) return;

    const newProject: Project = {
      id: `project-${Date.now()}`,
      name: projectName,
      description: projectDescription,
      tasks: [],
    };

    setProjects(prev => [...prev, newProject]);
    setProjectName('');
    setProjectDescription('');
    setIsProjectDialogOpen(false);
    toast({ title: 'Proyecto creado', description: `${projectName} ha sido añadido.` });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({ title: 'Proyecto eliminado', description: 'El proyecto ha sido eliminado.' });
  };

  const handleAddTask = () => {
    if (!currentProject || !taskTitle.trim()) return;

    const newTask: ProjectTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      completed: false,
    };

    setProjects(prev =>
      prev.map(p =>
        p.id === currentProject.id
          ? { ...p, tasks: [...p.tasks, newTask] }
          : p
      )
    );

    setTaskTitle('');
    setIsTaskDialogOpen(false);
    toast({ title: 'Tarea añadida', description: `Tarea añadida a ${currentProject.name}.` });
  };

  const handleToggleTask = (projectId: string, taskId: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : p
      )
    );
  };

  const handleDeleteTask = (projectId: string, taskId: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? { ...p, tasks: p.tasks.filter(t => t.id !== taskId) }
          : p
      )
    );
  };

  const handleAddSubTask = () => {
    if (!currentProject || !currentTask || !subTaskTitle.trim()) return;

    const newSubTask: SubTask = {
      id: `subtask-${Date.now()}`,
      title: subTaskTitle,
      completed: false,
    };

    setProjects(prev =>
      prev.map(p =>
        p.id === currentProject.id
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === currentTask.id
                  ? { ...t, subTasks: [...(t.subTasks || []), newSubTask] }
                  : t
              ),
            }
          : p
      )
    );

    setSubTaskTitle('');
    setIsSubTaskDialogOpen(false);
    toast({ title: 'Sub-tarea añadida', description: `Sub-tarea añadida a ${currentTask.title}.` });
  };

  const handleToggleSubTask = (projectId: string, taskId: string, subTaskId: string) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId
          ? {
              ...p,
              tasks: p.tasks.map(t =>
                t.id === taskId
                  ? {
                      ...t,
                      subTasks: (t.subTasks || []).map(st =>
                        st.id === subTaskId ? { ...st, completed: !st.completed } : st
                      ),
                    }
                  : t
              ),
            }
          : p
      )
    );
  };

  const getProjectProgress = (project: Project) => {
    if (project.tasks.length === 0) return 0;
    const completed = project.tasks.filter(t => t.completed).length;
    return (completed / project.tasks.length) * 100;
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold">Gestión de Proyectos</h1>
          <p className="text-muted-foreground">Administra tus proyectos y sus tareas.</p>
        </header>
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
              <DialogDescription>Define tu nuevo proyecto.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre del Proyecto</label>
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: App de Productividad"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descripción</label>
                <Textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Describe tu proyecto..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateProject}>Crear Proyecto</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const progress = getProjectProgress(project);
          return (
            <Card key={project.id}>
              <CardHeader>
                {project.coverImage && (
                  <div className="mb-4 -mt-6 -mx-6">
                    <img src={project.coverImage} alt={project.name} className="w-full h-32 object-cover rounded-t-lg" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle>{project.name}</CardTitle>
                    <CardDescription className="mt-1">{project.description}</CardDescription>
                    <div className="mt-2">
                      <label htmlFor={`cover-${project.id}`} className="text-xs text-muted-foreground cursor-pointer hover:text-primary">
                        {project.coverImage ? 'Cambiar portada' : 'Añadir portada'}
                      </label>
                      <input
                        id={`cover-${project.id}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleImageUpload(project.id, e)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteProject(project.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <div className="space-y-2 mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{Math.round(progress)}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Tareas ({project.tasks.filter(t => t.completed).length}/{project.tasks.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentProject(project);
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {project.tasks.map((task) => (
                      <div key={task.id} className="space-y-2">
                        <div className="flex items-center gap-2 p-2 rounded-md bg-accent/50 hover:bg-accent">
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => handleToggleTask(project.id, task.id)}
                          />
                          <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs px-2"
                            onClick={() => {
                              setCurrentProject(project);
                              setCurrentTask(task);
                              setIsSubTaskDialogOpen(true);
                            }}
                          >
                            Sub
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteTask(project.id, task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        {task.subTasks && task.subTasks.length > 0 && (
                          <div className="ml-8 space-y-1">
                            {task.subTasks.map((subTask) => (
                              <div key={subTask.id} className="flex items-center gap-2 p-1 text-xs">
                                <Checkbox
                                  checked={subTask.completed}
                                  onCheckedChange={() => handleToggleSubTask(project.id, task.id, subTask.id)}
                                  className="h-3 w-3"
                                />
                                <span className={subTask.completed ? 'line-through text-muted-foreground' : ''}>
                                  {subTask.title}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {project.tasks.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No hay tareas aún
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No tienes proyectos aún. Crea tu primer proyecto para comenzar.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>
              Añade una tarea a {currentProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Título de la Tarea</label>
            <Input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Ej: Diseñar interfaz principal"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask}>Añadir Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSubTaskDialogOpen} onOpenChange={setIsSubTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Sub-tarea</DialogTitle>
            <DialogDescription>
              Añade una sub-tarea a {currentTask?.title}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Título de la Sub-tarea</label>
            <Input
              value={subTaskTitle}
              onChange={(e) => setSubTaskTitle(e.target.value)}
              placeholder="Ej: Crear wireframes"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddSubTask}>Añadir Sub-tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
