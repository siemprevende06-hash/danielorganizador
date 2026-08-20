import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PlusCircle, GraduationCap, BookOpen, Clock, Target,
  Calendar, AlertTriangle, CheckCircle2, Play, BarChart3, Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversity } from '@/hooks/useUniversity';
import { useExams, Exam } from '@/hooks/useExams';
import { ExamCard } from '@/components/university/ExamCard';
import { AddExamDialog } from '@/components/university/AddExamDialog';
import { AddSubjectTaskDialog } from '@/components/university/AddSubjectTaskDialog';
import { UpdateExamProgressDialog } from '@/components/university/UpdateExamProgressDialog';
import { SubjectDetailCard } from '@/components/university/SubjectDetailCard';
import { UniversitySettings } from '@/components/university/UniversitySettings';
import { SubjectProgressCard } from '@/components/university/SubjectProgressCard';
import { GPATracker } from '@/components/university/GPATracker';
import { ExamCalendar } from '@/components/university/ExamCalendar';
import { AcademicAnalytics } from '@/components/university/AcademicAnalytics';
import { UniversityDashboard } from '@/components/university/UniversityDashboard';
import { RoutineBlockSchedule } from '@/components/university/RoutineBlockSchedule';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(200, "El nombre es muy largo"),
  code: z.string().max(50).optional(),
  professor: z.string().max(100).optional(),
  schedule: z.string().max(200).optional()
});

export default function UniversityPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    subjects, settings, loading, gpaData, overallGPA,
    updateSettings, createSubject, deleteSubject, toggleApproved,
    addTopic, deleteTopic, addPartialExam, updatePartialExamGrade,
    deletePartialExam, addTask, toggleTask, deleteTask,
    getSubjectsByCurrentSemester, getTodayStudyTime, getStudyMinutesByDay
  } = useUniversity();

  const { exams, createExam, updateExamProgress, deleteExam } = useExams();

  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [professor, setProfessor] = useState('');
  const [schedule, setSchedule] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isUpdateExamProgressOpen, setIsUpdateExamProgressOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examSubjectId, setExamSubjectId] = useState('');
  const [examSubjectName, setExamSubjectName] = useState('');

  const [todayStudyMinutes, setTodayStudyMinutes] = useState(0);
  const [studyByDay, setStudyByDay] = useState<{ day: string; minutes: number }[]>([]);
  const { values: activeSubjectIds, toggle: toggleActiveSubject } = useActiveSelections('activeSubjects');

  useEffect(() => {
    getTodayStudyTime().then(setTodayStudyMinutes);
    getStudyMinutesByDay(14).then(setStudyByDay);
  }, []);

  const currentSemesterSubjects = getSubjectsByCurrentSemester();

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
        schedule: schedule || undefined
      });
      const success = await createSubject({
        name: validated.name,
        code: validated.code,
        professor: validated.professor,
        schedule: validated.schedule
      });
      if (success) {
        setSubjectName('');
        setSubjectCode('');
        setProfessor('');
        setSchedule('');
        setIsSubjectDialogOpen(false);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast({ variant: "destructive", title: "Error", description: error.errors[0].message });
      }
    }
  };

  const goToFocusWithTask = (taskId: string, title: string) => {
    navigate(`/focus?taskId=${taskId}&title=${encodeURIComponent(title)}&area=universidad`);
  };

  const selectedSubject = selectedSubjectId
    ? currentSemesterSubjects.find(s => s.id === selectedSubjectId) || null
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24 flex items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <header>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            Universidad
          </h1>
          <p className="text-muted-foreground text-sm">
            {settings.current_year}° Año · {settings.current_semester}° Semestre
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
              <Button size="sm">
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
                  <Input value={subjectName} onChange={(e) => setSubjectName(e.target.value)} placeholder="Ej: Cálculo I" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Código</label>
                    <Input value={subjectCode} onChange={(e) => setSubjectCode(e.target.value)} placeholder="MAT-101" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Profesor</label>
                    <Input value={professor} onChange={(e) => setProfessor(e.target.value)} placeholder="Nombre del profesor" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Horario</label>
                  <Textarea value={schedule} onChange={(e) => setSchedule(e.target.value)} placeholder="Lunes y Miércoles 8:00-10:00" rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCreateSubject}>Crear Asignatura</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{currentSemesterSubjects.length}</p>
              <p className="text-[10px] text-muted-foreground">Asignaturas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0">
              <Target className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{pendingDeliveryTasks.length}</p>
              <p className="text-[10px] text-muted-foreground">Entregas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg shrink-0">
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{todayStudyMinutes}</p>
              <p className="text-[10px] text-muted-foreground">Min Hoy</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-lg shrink-0">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">{upcomingPartials.length}</p>
              <p className="text-[10px] text-muted-foreground">Próximos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-3 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg shrink-0">
              <Award className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="text-xl font-bold leading-none">
                {overallGPA !== null ? overallGPA.toFixed(1) : '—'}
              </p>
              <p className="text-[10px] text-muted-foreground">Promedio</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full flex overflow-x-auto justify-start">
          <TabsTrigger value="overview" className="flex-1 min-w-fit whitespace-nowrap text-xs sm:text-sm">Resumen</TabsTrigger>
          <TabsTrigger value="subjects" className="flex-1 min-w-fit whitespace-nowrap text-xs sm:text-sm">Materias</TabsTrigger>
          <TabsTrigger value="tasks" className="flex-1 min-w-fit whitespace-nowrap text-xs sm:text-sm">Tareas</TabsTrigger>
          <TabsTrigger value="exams" className="flex-1 min-w-fit whitespace-nowrap text-xs sm:text-sm">Exámenes</TabsTrigger>
          <TabsTrigger value="analytics" className="flex-1 min-w-fit whitespace-nowrap text-xs sm:text-sm">Analytics</TabsTrigger>
        </TabsList>

        {/* === OVERVIEW TAB === */}
        <TabsContent value="overview" className="mt-6">
          <UniversityDashboard
            subjects={currentSemesterSubjects}
            gpaData={gpaData}
            overallGPA={overallGPA}
            studyByDay={studyByDay}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
            {/* Left: Subject cards + Exam calendar */}
            <div className="lg:col-span-2 space-y-6">
              {/* Subject grid */}
              <div>
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Mis Asignaturas
                </h2>
                {currentSemesterSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {currentSemesterSubjects.map(subject => {
                      const gpa = gpaData.find(g => g.subjectId === subject.id);
                      return (
                        <SubjectProgressCard
                          key={subject.id}
                          subject={subject}
                          weightedAverage={gpa?.weightedAverage ?? null}
                          onClick={() => setSelectedSubjectId(subject.id)}
                          isActive={activeSubjectIds.includes(subject.id)}
                          onToggleActive={() => toggleActiveSubject(subject.id)}
                          onToggleApproved={() => toggleApproved(subject.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="py-8 text-center">
                      <GraduationCap className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">Sin asignaturas en este semestre</p>
                      <Button size="sm" className="mt-3" onClick={() => setIsSubjectDialogOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Exam calendar */}
              <ExamCalendar subjects={currentSemesterSubjects} />

              {/* Urgent tasks */}
              {pendingDeliveryTasks.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Entregas Pendientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {pendingDeliveryTasks
                      .sort((a, b) => {
                        if (!a.due_date) return 1;
                        if (!b.due_date) return -1;
                        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                      })
                      .slice(0, 5)
                      .map(task => {
                        const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                        const daysLeft = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;

                        return (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 bg-accent/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">{subject?.name}</Badge>
                                {task.due_date && (
                                  <span className={`text-[10px] ${
                                    daysLeft !== null && daysLeft <= 1 ? 'text-destructive' :
                                    daysLeft !== null && daysLeft <= 3 ? 'text-yellow-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    {format(parseISO(task.due_date), "d MMM", { locale: es })}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" variant="default" className="h-7 text-xs"
                                onClick={() => goToFocusWithTask(task.id, task.title)}>
                                <Play className="h-3 w-3 mr-1" />Focus
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                onClick={() => toggleTask(task.id)}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: GPA Tracker */}
            <div>
              <GPATracker gpaData={gpaData} overallGPA={overallGPA} />
            </div>
          </div>

          {/* Routine Block Schedule */}
          <div className="mt-6">
            <RoutineBlockSchedule />
          </div>
        </TabsContent>

        {/* === SUBJECTS TAB === */}
        <TabsContent value="subjects" className="space-y-4 mt-6">
          {selectedSubject ? (
            <div className="space-y-4">
              <Button variant="ghost" size="sm" onClick={() => setSelectedSubjectId(null)}>
                ← Volver a Asignaturas
              </Button>
              <SubjectDetailCard
                subject={selectedSubject}
                onDeleteSubject={(id) => { deleteSubject(id); setSelectedSubjectId(null); }}
                onToggleApproved={() => toggleApproved(selectedSubject.id)}
                onAddTopic={addTopic}
                onDeleteTopic={deleteTopic}
                onAddPartialExam={addPartialExam}
                onUpdatePartialExamGrade={updatePartialExamGrade}
                onDeletePartialExam={deletePartialExam}
                onAddTask={addTask}
                onToggleTask={toggleTask}
                onDeleteTask={deleteTask}
              />
            </div>
          ) : (
            <>
              {currentSemesterSubjects.length > 0 ? (
                currentSemesterSubjects.map(subject => (
                  <SubjectDetailCard
                    key={subject.id}
                    subject={subject}
                    onDeleteSubject={deleteSubject}
                    onToggleApproved={() => toggleApproved(subject.id)}
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
                    <p className="text-muted-foreground">Sin asignaturas en este semestre</p>
                    <Button className="mt-4" onClick={() => setIsSubjectDialogOpen(true)}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar Primera Asignatura
                    </Button>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* === TASKS TAB === */}
        <TabsContent value="tasks" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Tareas y Estudio
            </h2>
            <Button size="sm" onClick={() => setIsTaskDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Tarea
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Delivery Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Target className="h-4 w-4" />
                  Tareas a Entregar
                </CardTitle>
                <CardDescription>{pendingDeliveryTasks.length} pendientes</CardDescription>
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
                        const daysLeft = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;

                        return (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 bg-accent/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">{subject?.name}</Badge>
                                {task.due_date && (
                                  <span className={`text-[10px] ${
                                    daysLeft !== null && daysLeft <= 1 ? 'text-destructive' :
                                    daysLeft !== null && daysLeft <= 3 ? 'text-yellow-600' :
                                    'text-muted-foreground'
                                  }`}>
                                    <Calendar className="h-2.5 w-2.5 inline mr-0.5" />
                                    {format(parseISO(task.due_date), "d MMM", { locale: es })}
                                    {daysLeft !== null && daysLeft >= 0 && ` (${daysLeft}d)`}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              <Button size="sm" className="h-7 text-xs"
                                onClick={() => goToFocusWithTask(task.id, task.title)}>
                                <Play className="h-3 w-3 mr-1" />Focus
                              </Button>
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0"
                                onClick={() => toggleTask(task.id)}>
                                <CheckCircle2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-sm">¡Sin tareas pendientes! 🎉</p>
                )}
              </CardContent>
            </Card>

            {/* Study Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="h-4 w-4" />
                      Sesiones de Estudio
                    </CardTitle>
                    <CardDescription>{pendingStudyTasks.length} pendientes</CardDescription>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold">{todayStudyMinutes}</p>
                    <p className="text-[10px] text-muted-foreground">min hoy</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {pendingStudyTasks.length > 0 ? (
                  <div className="space-y-2">
                    {pendingStudyTasks.map(task => {
                      const subject = subjects.find(s => s.tasks.some(t => t.id === task.id));
                      return (
                        <div key={task.id} className="flex items-center gap-3 p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{task.title}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">{subject?.name}</Badge>
                              {task.estimated_minutes && (
                                <span className="text-[10px] text-muted-foreground">
                                  <Clock className="h-2.5 w-2.5 inline mr-0.5" />{task.estimated_minutes} min
                                </span>
                              )}
                            </div>
                          </div>
                          <Button size="sm" className="h-7 text-xs shrink-0"
                            onClick={() => goToFocusWithTask(task.id, task.title)}>
                            <Play className="h-3 w-3 mr-1" />Focus
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6 text-sm">Sin sesiones pendientes</p>
                )}

                {/* Study by subject */}
                {currentSemesterSubjects.length > 0 && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Por Asignatura</p>
                    {currentSemesterSubjects.map(subject => {
                      const studyTasks = subject.tasks.filter(t => t.task_type === 'study');
                      const done = studyTasks.filter(t => t.completed).length;
                      const progress = studyTasks.length > 0 ? (done / studyTasks.length) * 100 : 0;
                      return (
                        <div key={subject.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-muted-foreground">{done}/{studyTasks.length}</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* === EXAMS TAB === */}
        <TabsContent value="exams" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Exámenes
            </h2>
            <Button size="sm" onClick={() => setIsExamDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nuevo Examen
            </Button>
          </div>
          <ExamCalendar subjects={currentSemesterSubjects} />

          {/* Completed exams with grades */}
          {(() => {
            const completedPartials = subjects.flatMap(s =>
              s.partialExams
                .filter(p => p.grade !== null && p.grade !== undefined)
                .map(p => ({ ...p, subjectName: s.name }))
            );

            if (completedPartials.length === 0) return null;

            return (
              <Card className="mt-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Exámenes Calificados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {completedPartials.map(exam => (
                      <div key={exam.id} className="flex items-center justify-between p-2.5 bg-accent/50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">{exam.subjectName}</p>
                        </div>
                        <Badge variant={exam.grade! >= 60 ? 'default' : 'destructive'} className="text-sm">
                          {exam.grade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </TabsContent>

        {/* === ANALYTICS TAB === */}
        <TabsContent value="analytics" className="mt-6">
          <AcademicAnalytics subjects={currentSemesterSubjects} gpaData={gpaData} />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AddExamDialog
        open={isExamDialogOpen}
        onOpenChange={setIsExamDialogOpen}
        subjectId={examSubjectId}
        subjectName={examSubjectName}
        subjects={currentSemesterSubjects.map(s => ({ id: s.id, name: s.name }))}
        onSubmit={createExam}
      />
      <AddSubjectTaskDialog
        open={isTaskDialogOpen}
        onOpenChange={setIsTaskDialogOpen}
        subjects={currentSemesterSubjects.map(s => ({ id: s.id, name: s.name }))}
        onSubmit={(data) => addTask(data.subject_id, data)}
      />
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
