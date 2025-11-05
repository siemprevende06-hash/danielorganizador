import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, GraduationCap, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SubjectTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  professor: string;
  schedule: string;
  tasks: SubjectTask[];
}

export default function UniversityPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('universitySubjects');
    if (stored) {
      setSubjects(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    if (subjects.length > 0) {
      localStorage.setItem('universitySubjects', JSON.stringify(subjects));
    }
  }, [subjects]);

  const handleCreateSubject = () => {
    if (!subjectName.trim()) return;

    const newSubject: Subject = {
      id: `subject-${Date.now()}`,
      name: subjectName,
      code: subjectCode,
      professor,
      schedule,
      tasks: [],
    };

    setSubjects(prev => [...prev, newSubject]);
    setSubjectName('');
    setSubjectCode('');
    setProfessor('');
    setSchedule('');
    setIsSubjectDialogOpen(false);
    toast({ title: 'Asignatura creada', description: `${subjectName} ha sido añadida.` });
  };

  const handleDeleteSubject = (subjectId: string) => {
    setSubjects(prev => prev.filter(s => s.id !== subjectId));
    toast({ title: 'Asignatura eliminada' });
  };

  const handleAddTask = () => {
    if (!currentSubject || !taskTitle.trim()) return;

    const newTask: SubjectTask = {
      id: `task-${Date.now()}`,
      title: taskTitle,
      description: taskDescription,
      completed: false,
      dueDate: taskDueDate || undefined,
    };

    setSubjects(prev =>
      prev.map(s =>
        s.id === currentSubject.id
          ? { ...s, tasks: [...s.tasks, newTask] }
          : s
      )
    );

    setTaskTitle('');
    setTaskDescription('');
    setTaskDueDate('');
    setIsTaskDialogOpen(false);
    toast({ title: 'Tarea añadida' });
  };

  const handleToggleTask = (subjectId: string, taskId: string) => {
    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? {
              ...s,
              tasks: s.tasks.map(t =>
                t.id === taskId ? { ...t, completed: !t.completed } : t
              ),
            }
          : s
      )
    );
  };

  const handleDeleteTask = (subjectId: string, taskId: string) => {
    setSubjects(prev =>
      prev.map(s =>
        s.id === subjectId
          ? { ...s, tasks: s.tasks.filter(t => t.id !== taskId) }
          : s
      )
    );
  };

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Universidad
          </h1>
          <p className="text-muted-foreground">Gestiona tus asignaturas y tareas académicas</p>
        </header>
        <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Asignatura
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Crear Nueva Asignatura</DialogTitle>
              <DialogDescription>Agrega una nueva asignatura a tu plan de estudios.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nombre</label>
                <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Ej: Cálculo I" />
              </div>
              <div>
                <label className="text-sm font-medium">Código</label>
                <Input value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="Ej: MAT-101" />
              </div>
              <div>
                <label className="text-sm font-medium">Profesor</label>
                <Input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Nombre del profesor" />
              </div>
              <div>
                <label className="text-sm font-medium">Horario</label>
                <Input value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Ej: Lun/Mie 10:00-12:00" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreateSubject}>Crear Asignatura</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="subjects" className="w-full">
        <TabsList>
          <TabsTrigger value="subjects">Asignaturas</TabsTrigger>
          <TabsTrigger value="tasks">Todas las Tareas</TabsTrigger>
        </TabsList>

        <TabsContent value="subjects" className="space-y-4 mt-6">
          {subjects.map((subject) => (
            <Card key={subject.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      {subject.name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {subject.code} • {subject.professor}
                      <br />
                      {subject.schedule}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteSubject(subject.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-semibold">
                      Tareas ({subject.tasks.filter(t => t.completed).length}/{subject.tasks.length})
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentSubject(subject);
                        setIsTaskDialogOpen(true);
                      }}
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Añadir
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {subject.tasks.map((task) => (
                      <div key={task.id} className="flex items-start gap-2 p-2 rounded-md bg-accent/50">
                        <Checkbox
                          checked={task.completed}
                          onCheckedChange={() => handleToggleTask(subject.id, task.id)}
                        />
                        <div className="flex-1">
                          <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </p>
                          {task.description && (
                            <p className="text-xs text-muted-foreground">{task.description}</p>
                          )}
                          {task.dueDate && (
                            <p className="text-xs text-muted-foreground">Entrega: {task.dueDate}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteTask(subject.id, task.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {subjects.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No tienes asignaturas aún.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-2 mt-6">
          {subjects.flatMap(subject =>
            subject.tasks.map(task => ({...task, subjectName: subject.name, subjectId: subject.id}))
          ).map((task) => (
            <Card key={task.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => handleToggleTask(task.subjectId, task.id)}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{task.subjectName}</p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">Entrega: {task.dueDate}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Tarea</DialogTitle>
            <DialogDescription>Añade una tarea a {currentSubject?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Ej: Entregar tarea 3" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Detalles..." />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de entrega</label>
              <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask}>Añadir Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
