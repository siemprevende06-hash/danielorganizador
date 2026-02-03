import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PlusCircle, GraduationCap, BookOpen, Clock, Target, Calendar, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversity } from '@/hooks/useUniversity';
import { useExams, Exam } from '@/hooks/useExams';
import { ExamCard } from '@/components/university/ExamCard';
import { AddExamDialog } from '@/components/university/AddExamDialog';
import { UpdateExamProgressDialog } from '@/components/university/UpdateExamProgressDialog';
import { SubjectDetailCard } from '@/components/university/SubjectDetailCard';
import { UniversitySettings } from '@/components/university/UniversitySettings';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(200, "El nombre es muy largo"),
  code: z.string().max(50).optional(),
  professor: z.string().max(100).optional(),
  schedule: z.string().max(200).optional(),
  credits: z.number().min(1).max(20).optional()
});

export default function UniversityPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    subjects,
    settings,
    loading,
    updateSettings,
    createSubject,
    deleteSubject,
    addTopic,
    deleteTopic,
    addPartialExam,
    updatePartialExamGrade,
    deletePartialExam,
    addTask,
    toggleTask,
    deleteTask,
    getSubjectsByCurrentSemester,
    getTodayStudyTime
  } = useUniversity();

  const { exams, createExam, updateExamProgress, deleteExam, getExamsBySubject } = useExams();

  // Dialog states
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [credits, setCredits] = useState('3');

  // Exam dialogs
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isUpdateExamProgressOpen, setIsUpdateExamProgressOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examSubjectId, setExamSubjectId] = useState<string>('');
  const [examSubjectName, setExamSubjectName] = useState<string>('');

  // Stats
  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);

  useEffect(() => {
    getTodayStudyTime().then(setTodayStudyMinutes);
  }, []);

  const currentSemesterSubjects = getSubjectsByCurrentSemester();

  // Calculate stats
  const totalTasks = subjects.flatMap(s => s.tasks);
  const pendingDeliveryTasks = totalTasks.filter(t => t.task_type === 'delivery' && !t.completed);
  const pendingStudyTasks = totalTasks.filter(t => t.task_type === 'study' && !t.completed);
  const upcomingPartials = subjects.flatMap(s => s.partialExams).filter(p => {
    if (!p.exam_date) return false;
    const days = differenceInDays(parseISO(p.exam_date), new Date());
    return days >= 0 && days <= 14;
  });

  const handleCreateSubject = async () => {
    try {
      const validated = subjectSchema.parse({
        name: subjectName,
        code: subjectCode || undefined,
        professor: professor || undefined,
        schedule: schedule || undefined,
        credits: credits ? parseInt(credits) : 3
      });

      const success = await createSubject({
        name: validated.name,
        code: validated.code,
        professor: validated.professor,
        schedule: validated.schedule,
        credits: validated.credits
      });
      if (success) {
        setSubjectName('');
        setSubjectCode('');
        setProfessor('');
        setSchedule('');
        setCredits('3');
        setIsSubjectDialogOpen(false);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Error de validación",
          description: error.errors[0].message
        });
      }
    }
  };

  const goToFocusWithTask = (taskId: string, title: string) => {
    navigate(`/focus?taskId=${taskId}&title=${encodeURIComponent(title)}&area=universidad`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8" />
            Universidad
          </h1>
          <p className="text-muted-foreground">
            {settings.current_year}° Año - {settings.current_semester}° Semestre
          </p>
        </header>
        <div className="flex gap-2 flex-wrap">
          <UniversitySettings
            currentYear={settings.current_year}
            currentSemester={settings.current_semester}
            academicSchedule={settings.academic_schedule}
            onSave={updateSettings}
          />
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
                <DialogDescription>
                  Agrega una asignatura al {settings.current_semester}° semestre de {settings.current_year}° año
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nombre *</label>
                  <Input 
                    value={subjectName} 
                    onChange={(e) => setSubjectName(e.target.value)} 
                    placeholder="Ej: Cálculo I" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Código</label>
                    <Input 
                      value={subjectCode} 
                      onChange={(e) => setSubjectCode(e.target.value)} 
                      placeholder="Ej: MAT-101" 
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Créditos</label>
                    <Input 
                      type="number"
                      value={credits} 
                      onChange={(e) => setCredits(e.target.value)} 
                      min="1" max="20"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Profesor</label>
                  <Input 
                    value={professor} 
                    onChange={(e) => setProfessor(e.target.value)} 
                    placeholder="Nombre del profesor" 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Horario</label>
                  <Textarea 
                    value={schedule} 
                    onChange={(e) => setSchedule(e.target.value)} 
                    placeholder="Ej: Lunes y Miércoles 8:00-10:00 AM"
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSubject}>Crear Asignatura</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{currentSemesterSubjects.length}</p>
                <p className="text-xs text-muted-foreground">Asignaturas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-500/10 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingDeliveryTasks.length}</p>
                <p className="text-xs text-muted-foreground">Tareas Pendientes</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{todayStudyMinutes}</p>
                <p className="text-xs text-muted-foreground">Min Estudio Hoy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{upcomingPartials.length}</p>
                <p className="text-xs text-muted-foreground">Parciales Próximos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subjects">Asignaturas</TabsTrigger>
          <TabsTrigger value="tasks">Tareas</TabsTrigger>
          <TabsTrigger value="study">Estudio</TabsTrigger>
          <TabsTrigger value="exams">Exámenes</TabsTrigger>
        </TabsList>

        {/* Subjects Tab */}
        <TabsContent value="subjects" className="space-y-4 mt-6">
          {currentSemesterSubjects.length > 0 ? (
            currentSemesterSubjects.map(subject => (
              <SubjectDetailCard
                key={subject.id}
                subject={subject}
                onDeleteSubject={deleteSubject}
                onAddTopic={addTopic}
                onDeleteTopic={deleteTopic}
                onAddPartialExam={addPartialExam}
                onUpdatePartialExamGrade={updatePartialExamGrade}
                onDeletePartialExam={deletePartialExam}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
              />
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No tienes asignaturas en el {settings.current_semester}° semestre
                </p>
                <Button className="mt-4" onClick={() => setIsSubjectDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Agregar Primera Asignatura
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab - Delivery Tasks */}
        <TabsContent value="tasks" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5" />
                Tareas a Entregar
              </CardTitle>
              <CardDescription>
                {pendingDeliveryTasks.length} pendientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingDeliveryTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingDeliveryTasks
                    .sort((a, b) => {
                      if (!a.due_date) return 1;
                      if (!b.due_date) return -1;
                      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                    })
                    .map(task => {
                      const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                      const daysLeft = task.due_date 
                        ? differenceInDays(parseISO(task.due_date), new Date())
                        : null;
                      
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium">{task.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {subject?.name}
                              </Badge>
                              {task.due_date && (
                                <span className={`text-xs ${
                                  daysLeft !== null && daysLeft <= 1 
                                    ? 'text-destructive' 
                                    : daysLeft !== null && daysLeft <= 3 
                                      ? 'text-yellow-600' 
                                      : 'text-muted-foreground'
                                }`}>
                                  <Calendar className="h-3 w-3 inline mr-1" />
                                  {format(parseISO(task.due_date), "d MMM", { locale: es })}
                                  {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => goToFocusWithTask(task.id, task.title)}
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Focus
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => toggleTask(task.id)}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  ¡No tienes tareas pendientes! 🎉
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Study Tab */}
        <TabsContent value="study" className="space-y-4 mt-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="h-5 w-5" />
                    Tiempos de Estudio
                  </CardTitle>
                  <CardDescription>
                    {pendingStudyTasks.length} sesiones pendientes
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{todayStudyMinutes}</p>
                  <p className="text-xs text-muted-foreground">minutos hoy</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {pendingStudyTasks.length > 0 ? (
                <div className="space-y-2">
                  {pendingStudyTasks.map(task => {
                    const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                    const topic = subject?.topics.find(t => t.id === task.topic_id);
                    
                    return (
                      <div key={task.id} className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <div className="flex-1">
                          <p className="font-medium">{task.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {subject?.name}
                            </Badge>
                            {topic && (
                              <Badge variant="secondary" className="text-xs">
                                {topic.title}
                              </Badge>
                            )}
                            {task.estimated_minutes && (
                              <span className="text-xs text-muted-foreground">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {task.estimated_minutes} min
                              </span>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="default" 
                          onClick={() => goToFocusWithTask(task.id, task.title)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Focus
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay sesiones de estudio pendientes
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Agrega tiempos de estudio desde cada asignatura
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Study by Subject */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Estudio por Asignatura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {currentSemesterSubjects.map(subject => {
                const studyTasks = subject.tasks.filter(t => t.task_type === 'study');
                const completedStudy = studyTasks.filter(t => t.completed).length;
                const progress = studyTasks.length > 0 ? (completedStudy / studyTasks.length) * 100 : 0;

                return (
                  <div key={subject.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{subject.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {completedStudy}/{studyTasks.length} sesiones
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams Tab */}
        <TabsContent value="exams" className="space-y-4 mt-6">
          {(() => {
            const allPartials = subjects.flatMap(s => 
              s.partialExams.map(p => ({ ...p, subjectName: s.name }))
            );
            const sortedPartials = allPartials
              .filter(p => p.status === 'pending' && p.exam_date)
              .sort((a, b) => {
                if (!a.exam_date || !b.exam_date) return 0;
                return new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime();
              });

            const urgentExams = sortedPartials.filter(e => {
              if (!e.exam_date) return false;
              const days = differenceInDays(parseISO(e.exam_date), new Date());
              return days <= 3 && days >= 0;
            });

            const soonExams = sortedPartials.filter(e => {
              if (!e.exam_date) return false;
              const days = differenceInDays(parseISO(e.exam_date), new Date());
              return days > 3 && days <= 7;
            });

            const laterExams = sortedPartials.filter(e => {
              if (!e.exam_date) return false;
              const days = differenceInDays(parseISO(e.exam_date), new Date());
              return days > 7;
            });

            return (
              <>
                {urgentExams.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-4 w-4" />
                      Urgentes (3 días o menos)
                    </h3>
                    {urgentExams.map(exam => (
                      <Card key={exam.id} className="bg-destructive/10 border-l-4 border-l-destructive">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{exam.title}</p>
                              <p className="text-sm text-muted-foreground">{exam.subjectName}</p>
                              {exam.exam_date && (
                                <p className="text-xs text-destructive mt-1">
                                  {format(parseISO(exam.exam_date), "EEEE d 'de' MMMM", { locale: es })}
                                </p>
                              )}
                            </div>
                            <Badge variant="destructive">{exam.weight_percentage}%</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {soonExams.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-yellow-600">
                      <Clock className="h-4 w-4" />
                      Esta semana (4-7 días)
                    </h3>
                    {soonExams.map(exam => (
                      <Card key={exam.id} className="bg-yellow-500/10 border-l-4 border-l-yellow-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{exam.title}</p>
                              <p className="text-sm text-muted-foreground">{exam.subjectName}</p>
                              {exam.exam_date && (
                                <p className="text-xs text-yellow-600 mt-1">
                                  {format(parseISO(exam.exam_date), "EEEE d 'de' MMMM", { locale: es })}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-yellow-500">{exam.weight_percentage}%</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {laterExams.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600">
                      <Calendar className="h-4 w-4" />
                      Próximamente (+7 días)
                    </h3>
                    {laterExams.map(exam => (
                      <Card key={exam.id} className="bg-green-500/10 border-l-4 border-l-green-500">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{exam.title}</p>
                              <p className="text-sm text-muted-foreground">{exam.subjectName}</p>
                              {exam.exam_date && (
                                <p className="text-xs text-green-600 mt-1">
                                  {format(parseISO(exam.exam_date), "EEEE d 'de' MMMM", { locale: es })}
                                </p>
                              )}
                            </div>
                            <Badge className="bg-green-500">{exam.weight_percentage}%</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {allPartials.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No tienes exámenes parciales programados
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Agrega parciales desde cada asignatura
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>

      {/* Final Exam Dialog */}
      <AddExamDialog 
        open={isExamDialogOpen}
        onOpenChange={setIsExamDialogOpen}
        subjectId={examSubjectId}
        subjectName={examSubjectName}
        onSubmit={createExam}
      />

      {/* Update Exam Progress Dialog */}
      {currentExam && (
        <UpdateExamProgressDialog
          open={isUpdateExamProgressOpen}
          onOpenChange={setIsUpdateExamProgressOpen}
          exam={currentExam}
          onSubmit={(examId, data) => updateExamProgress(examId, data)}
        />
      )}
    </div>
  );
}
