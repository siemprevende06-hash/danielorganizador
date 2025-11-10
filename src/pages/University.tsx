import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, GraduationCap, BookOpen, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubjectTask {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

interface StudySession {
  id: string;
  topic: string;
  duration: string;
  date: string;
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
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isEditTaskDialogOpen, setIsEditTaskDialogOpen] = useState(false);
  const [isStudyDialogOpen, setIsStudyDialogOpen] = useState(false);
  const [isEditStudyDialogOpen, setIsEditStudyDialogOpen] = useState(false);
  const [currentSubject, setCurrentSubject] = useState<Subject | null>(null);
  const [currentTask, setCurrentTask] = useState<SubjectTask | null>(null);
  const [currentStudySession, setCurrentStudySession] = useState<StudySession | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [studyTopic, setStudyTopic] = useState('');
  const [studyDuration, setStudyDuration] = useState('');
  const [studyDate, setStudyDate] = useState('');
  const [studyDueDate, setStudyDueDate] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadSubjects();
    loadStudySessions();
  }, []);

  const loadSubjects = async () => {
    try {
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('university_subjects')
        .select('*')
        .order('created_at', { ascending: false });

      if (subjectsError) throw subjectsError;

      const { data: tasksData, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('source', 'university');

      if (tasksError) throw tasksError;

      const subjectsWithTasks: Subject[] = (subjectsData || []).map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.color || '',
        professor: '',
        schedule: '',
        tasks: (tasksData || [])
          .filter(task => task.source_id === subject.id)
          .map(task => ({
            id: task.id,
            title: task.title,
            description: task.description || '',
            completed: task.completed,
            dueDate: task.due_date || undefined
          }))
      }));

      setSubjects(subjectsWithTasks);
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadStudySessions = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('source', 'study_session')
        .order('created_at', { ascending: false});

      if (error) throw error;

      const sessions: StudySession[] = (data || []).map(task => ({
        id: task.id,
        topic: task.title,
        duration: task.description || '',
        date: task.start_date || '',
        completed: task.completed,
        dueDate: task.due_date || undefined
      }));

      setStudySessions(sessions);
    } catch (error) {
      console.error('Error loading study sessions:', error);
    }
  };

  const handleCreateSubject = async () => {
    if (!subjectName.trim()) return;

    try {
      const { error } = await supabase
        .from('university_subjects')
        .insert({
          name: subjectName,
          color: subjectCode,
          user_id: null
        });

      if (error) throw error;

      await loadSubjects();
      setSubjectName('');
      setSubjectCode('');
      setProfessor('');
      setSchedule('');
      setIsSubjectDialogOpen(false);
      toast({ title: 'Asignatura creada', description: `${subjectName} ha sido añadida.` });
    } catch (error: any) {
      console.error('Error creating subject:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('university_subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;
      await loadSubjects();
      toast({ title: 'Asignatura eliminada' });
    } catch (error: any) {
      console.error('Error deleting subject:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleAddTask = async () => {
    if (!currentSubject || !taskTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: taskTitle,
          description: taskDescription,
          completed: false,
          due_date: taskDueDate || null,
          source: 'university',
          source_id: currentSubject.id,
          status: 'pendiente',
          user_id: null
        });

      if (error) throw error;

      await loadSubjects();
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setIsTaskDialogOpen(false);
      toast({ title: 'Tarea añadida' });
    } catch (error: any) {
      console.error('Error adding task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleTask = async (subjectId: string, taskId: string) => {
    try {
      const subject = subjects.find(s => s.id === subjectId);
      if (!subject) return;
      
      const task = subject.tasks.find(t => t.id === taskId);
      if (!task) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId);

      if (error) throw error;
      await loadSubjects();
    } catch (error: any) {
      console.error('Error toggling task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (subjectId: string, taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      await loadSubjects();
    } catch (error: any) {
      console.error('Error deleting task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditTask = (subjectId: string, taskId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    const task = subject?.tasks.find(t => t.id === taskId);
    if (task && subject) {
      setCurrentSubject(subject);
      setCurrentTask(task);
      setTaskTitle(task.title);
      setTaskDescription(task.description);
      setTaskDueDate(task.dueDate || '');
      setIsEditTaskDialogOpen(true);
    }
  };

  const handleUpdateTask = async () => {
    if (!currentSubject || !currentTask || !taskTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: taskTitle,
          description: taskDescription,
          due_date: taskDueDate || null
        })
        .eq('id', currentTask.id);

      if (error) throw error;

      await loadSubjects();
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setCurrentTask(null);
      setIsEditTaskDialogOpen(false);
      toast({ title: 'Tarea actualizada' });
    } catch (error: any) {
      console.error('Error updating task:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCreateStudySession = async () => {
    if (!studyTopic.trim() || !studyDuration.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .insert({
          title: studyTopic,
          description: studyDuration,
          completed: false,
          start_date: studyDate || null,
          due_date: studyDueDate || null,
          source: 'study_session',
          status: 'pendiente',
          user_id: null
        });

      if (error) throw error;

      await loadStudySessions();
      setStudyTopic('');
      setStudyDuration('');
      setStudyDate('');
      setStudyDueDate('');
      setIsStudyDialogOpen(false);
      toast({ title: 'Tiempo de estudio creado' });
    } catch (error: any) {
      console.error('Error creating study session:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleEditStudySession = (session: StudySession) => {
    setCurrentStudySession(session);
    setStudyTopic(session.topic);
    setStudyDuration(session.duration);
    setStudyDate(session.date);
    setStudyDueDate(session.dueDate || '');
    setIsEditStudyDialogOpen(true);
  };

  const handleUpdateStudySession = async () => {
    if (!currentStudySession || !studyTopic.trim() || !studyDuration.trim()) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          title: studyTopic,
          description: studyDuration,
          start_date: studyDate || null,
          due_date: studyDueDate || null
        })
        .eq('id', currentStudySession.id);

      if (error) throw error;

      await loadStudySessions();
      setStudyTopic('');
      setStudyDuration('');
      setStudyDate('');
      setStudyDueDate('');
      setCurrentStudySession(null);
      setIsEditStudyDialogOpen(false);
      toast({ title: 'Tiempo de estudio actualizado' });
    } catch (error: any) {
      console.error('Error updating study session:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleToggleStudySession = async (sessionId: string) => {
    try {
      const session = studySessions.find(s => s.id === sessionId);
      if (!session) return;

      const { error } = await supabase
        .from('tasks')
        .update({ completed: !session.completed })
        .eq('id', sessionId);

      if (error) throw error;
      await loadStudySessions();
    } catch (error: any) {
      console.error('Error toggling study session:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteStudySession = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      await loadStudySessions();
      toast({ title: 'Tiempo de estudio eliminado' });
    } catch (error: any) {
      console.error('Error deleting study session:', error);
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
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
          <TabsTrigger value="study">Tiempos de Estudio</TabsTrigger>
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
                      {subject.code}
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
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleEditTask(subject.id, task.id)}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleDeleteTask(subject.id, task.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
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

        <TabsContent value="study" className="space-y-4 mt-6">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setIsStudyDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Tiempo de Estudio
            </Button>
          </div>
          {studySessions.map((session) => (
            <Card key={session.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={session.completed}
                    onCheckedChange={() => handleToggleStudySession(session.id)}
                  />
                  <div className="flex-1">
                    <p className={`font-medium ${session.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {session.topic}
                    </p>
                    <p className="text-sm text-muted-foreground">Duración: {session.duration}</p>
                    {session.date && (
                      <p className="text-xs text-muted-foreground">Fecha: {session.date}</p>
                    )}
                    {session.dueDate && (
                      <p className="text-xs text-muted-foreground">Vencimiento: {session.dueDate}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStudySession(session)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteStudySession(session.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Tarea</DialogTitle>
            <DialogDescription>Agrega una nueva tarea a {currentSubject?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Título de la tarea" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Descripción" />
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

      {/* Edit Task Dialog */}
      <Dialog open={isEditTaskDialogOpen} onOpenChange={setIsEditTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tarea</DialogTitle>
            <DialogDescription>Actualiza los detalles de la tarea.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Título</label>
              <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Título de la tarea" />
            </div>
            <div>
              <label className="text-sm font-medium">Descripción</label>
              <Textarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Descripción" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha de entrega</label>
              <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateTask}>Actualizar Tarea</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Study Dialog */}
      <Dialog open={isStudyDialogOpen} onOpenChange={setIsStudyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Tiempo de Estudio</DialogTitle>
            <DialogDescription>Programa un tiempo de estudio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tema</label>
              <Input value={studyTopic} onChange={(e) => setStudyTopic(e.target.value)} placeholder="Tema de estudio" />
            </div>
            <div>
              <label className="text-sm font-medium">Duración</label>
              <Input value={studyDuration} onChange={(e) => setStudyDuration(e.target.value)} placeholder="Ej: 2 horas" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Vencimiento</label>
              <Input type="date" value={studyDueDate} onChange={(e) => setStudyDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateStudySession}>Crear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Study Dialog */}
      <Dialog open={isEditStudyDialogOpen} onOpenChange={setIsEditStudyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tiempo de Estudio</DialogTitle>
            <DialogDescription>Actualiza el tiempo de estudio.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Tema</label>
              <Input value={studyTopic} onChange={(e) => setStudyTopic(e.target.value)} placeholder="Tema de estudio" />
            </div>
            <div>
              <label className="text-sm font-medium">Duración</label>
              <Input value={studyDuration} onChange={(e) => setStudyDuration(e.target.value)} placeholder="Ej: 2 horas" />
            </div>
            <div>
              <label className="text-sm font-medium">Fecha</label>
              <Input type="date" value={studyDate} onChange={(e) => setStudyDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium">Vencimiento</label>
              <Input type="date" value={studyDueDate} onChange={(e) => setStudyDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateStudySession}>Actualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
