import { useState, useEffect, useMemo } from 'react';
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
  Calendar, AlertTriangle, CheckCircle2, Play, BarChart3, Award, AlarmClock, CalendarClock, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUniversity, type SubjectTask } from '@/hooks/useUniversity';
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
import { AssignTaskToBlockDialog } from '@/components/university/AssignTaskToBlockDialog';
import { useAreaCovers, coverKey } from '@/hooks/useAreaCovers';
import { useImageUpload } from '@/hooks/useImageUpload';
import { differenceInDays, parseISO, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useActiveSelections } from '@/hooks/useActiveSelections';
import { cn } from '@/lib/utils';
import { z } from 'zod';

const subjectSchema = z.object({
  name: z.string().trim().min(1, "El nombre es requerido").max(200, "El nombre es muy largo"),
  code: z.string().max(50).optional(),
  professor: z.string().max(100).optional(),
  schedule: z.string().max(200).optional()
});

interface AssignTarget {
  id: string;
  title: string;
  subjectName: string;
}

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
  const { covers, saveCover, removeCover } = useAreaCovers();
  const { uploadImage, deleteImage } = useImageUpload();

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

  const [uploadingSubjectId, setUploadingSubjectId] = useState<string | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<AssignTarget | null>(null);

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

  const studyMeta = useMemo(() => {
    const studyTasks = totalTasks.filter(t => t.task_type === 'study');
    const sessions = studyTasks.reduce((acc, t) => acc + (t.studySessions?.count || 0), 0);
    const minutes = studyTasks.reduce((acc, t) => acc + (t.studySessions?.minutes || 0), 0);
    const target = studyTasks.reduce((acc, t) => acc + (t.estimated_minutes || 0), 0);
    const byTask: Record<string, { count: number; minutes: number }> = {};
    studyTasks.forEach(t => {
      if (t.studySessions && t.studySessions.count > 0) byTask[t.id] = t.studySessions;
    });
    return { sessions, minutes, target, byTask };
  }, [subjects]);

  const coverFor = useMemo(() => (id: string) => covers[coverKey('sub', id)] || null, [covers]);

  const handleUploadCover = async (subjectId: string, file: File) => {
    setUploadingSubjectId(subjectId);
    try {
      const url = await uploadImage(file, 'subject-covers');
      if (url) await saveCover('sub', subjectId, url);
    } finally {
      setUploadingSubjectId(null);
    }
  };

  const handleRemoveCover = async (subjectId: string) => {
    const cover = covers[coverKey('sub', subjectId)];
    if (cover) {
      try { await deleteImage(cover); } catch {}
    }
    removeCover('sub', subjectId);
  };

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

  const openAssign = (task: SubjectTask, subjectName: string) => {
    setAssignTarget({ id: task.id, title: task.title, subjectName });
    setAssignDialogOpen(true);
  };

  const subjectTasks = useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach(s => s.tasks.forEach(t => map.set(t.id, s.name)));
    return map;
  }, [subjects]);

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

  const semesterLabel = `${settings.current_semester}° Semestre · ${settings.current_year}° Año`;

  const sortByDue = (a: SubjectTask, b: SubjectTask) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  };

  const subjectFor = (task: SubjectTask) => subjects.find(s => s.tasks.some(t => t.id === task.id));

  return (
    <div className="container mx-auto px-4 py-24 space-y-6 max-w-6xl">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-indigo-600 text-white p-6 sm:p-8 shadow-lg">
        <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-blue-300/20 blur-2xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <header>
            <Badge className="bg-white/20 text-white border-white/30 mb-3">
              <Sparkles className="h-3 w-3 mr-1" />
              {semesterLabel}
            </Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <GraduationCap className="h-6 w-6" />
              </span>
              Universidad
            </h1>
            <p className="text-white/80 text-sm mt-2 max-w-md">
              Calcula tus parciales, planifica el estudio por temas y encaja tus bloques de foco.
            </p>
          </header>
          <div className="flex gap-2 flex-wrap">
            <UniversitySettings
              currentYear={settings.current_year}
              currentSemester={settings.current_semester}
              academicSchedule={settings.academic_schedule}
              onSave={updateSettings}
            />
            <Button size="sm" variant="secondary" className="bg-white text-primary hover:bg-white/90" onClick={() => setIsSubjectDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nueva Asignatura
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{currentSemesterSubjects.length}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Asignaturas</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{pendingDeliveryTasks.length}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><Target className="h-3 w-3" /> Entregas pendientes</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-sky-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{todayStudyMinutes}m</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> Estudio hoy</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{studyMeta.sessions}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><AlarmClock className="h-3 w-3" /> Sesiones acumuladas</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{upcomingPartials.length}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><CalendarClock className="h-3 w-3" /> Próximos (14d)</p>
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 text-white p-3 shadow-sm">
          <p className="text-2xl font-extrabold leading-none">{overallGPA !== null ? overallGPA.toFixed(1) : '—'}</p>
          <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1"><Award className="h-3 w-3" /> Promedio</p>
        </div>
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
                          cover={coverFor(subject.id)}
                          uploadingCover={uploadingSubjectId === subject.id}
                          onUploadCover={(file) => handleUploadCover(subject.id, file)}
                          onRemoveCover={() => handleRemoveCover(subject.id)}
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
                      .sort(sortByDue)
                      .slice(0, 5)
                      .map(task => {
                        const subject = subjectFor(task);
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
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Asignar a bloque de hoy"
                                onClick={() => openAssign(task, subject?.name || 'Universidad')}>
                                <CalendarClock className="h-3 w-3" />
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
            <RoutineBlockSchedule studySessionsByTask={studyMeta.byTask} />
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
                cover={coverFor(selectedSubject.id)}
                uploadingCover={uploadingSubjectId === selectedSubject.id}
                onUploadCover={(file) => handleUploadCover(selectedSubject.id, file)}
                onRemoveCover={() => handleRemoveCover(selectedSubject.id)}
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
                    cover={coverFor(subject.id)}
                    uploadingCover={uploadingSubjectId === subject.id}
                    onUploadCover={(file) => handleUploadCover(subject.id, file)}
                    onRemoveCover={() => handleRemoveCover(subject.id)}
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
                      .sort(sortByDue)
                      .map(task => {
                        const daysLeft = task.due_date ? differenceInDays(parseISO(task.due_date), new Date()) : null;
                        const subj = subjectFor(task);

                        return (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 bg-accent/50 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Badge variant="outline" className="text-[10px]">{subj?.name}</Badge>
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
                              <Button size="sm" variant="outline" className="h-7 w-7 p-0" title="Asignar a Deep Work"
                                onClick={() => openAssign(task, subj?.name || 'Universidad')}>
                                <CalendarClock className="h-3 w-3" />
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
                    <CardDescription>
                      {pendingStudyTasks.length} pendientes · {studyMeta.sessions} sesiones acumuladas
                    </CardDescription>
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
                    {pendingStudyTasks
                      .sort((a, b) => {
                        const pa = a.studySessions?.minutes || 0;
                        const pb = b.studySessions?.minutes || 0;
                        const ta = a.estimated_minutes || 0;
                        const tb = b.estimated_minutes || 0;
                        return (pa / (ta || 1)) - (pb / (tb || 1));
                      })
                      .map(task => {
                        const subj = subjectFor(task);
                        const sessions = task.studySessions || { count: 0, minutes: 0 };
                        const target = task.estimated_minutes || 0;
                        const pct = target > 0 ? Math.min(100, Math.round((sessions.minutes / target) * 100)) : 0;
                        return (
                          <div key={task.id} className="p-2.5 bg-blue-500/10 rounded-lg border border-blue-500/20 space-y-1.5">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{task.title}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  <Badge variant="outline" className="text-[10px]">{subj?.name}</Badge>
                                  <Badge className="text-[10px] bg-blue-600 py-0">
                                    <AlarmClock className="h-2.5 w-2.5 mr-0.5" />
                                    {sessions.count} ses · {sessions.minutes}m
                                  </Badge>
                                  {target > 0 && (
                                    <span className="text-[10px] text-muted-foreground">meta {target}m</span>
                                  )}
                                </div>
                              </div>
                              <Button size="sm" className="h-7 text-xs shrink-0"
                                onClick={() => goToFocusWithTask(task.id, task.title)}>
                                <Play className="h-3 w-3 mr-1" />Focus
                              </Button>
                            </div>
                            {target > 0 && (
                              <Progress value={pct} className="h-1.5 bg-blue-500/20"
                                indicatorClassName={cn(pct >= 100 && 'bg-blue-600')} />
                            )}
                            <div className="flex items-center gap-2 pt-0.5">
                              <Button size="sm" variant="outline" className="h-6 text-[10px] shrink-0"
                                onClick={() => openAssign(task, subj?.name || 'Universidad')}>
                                <CalendarClock className="h-3 w-3 mr-1" />Deep Work
                              </Button>
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] shrink-0"
                                onClick={() => toggleTask(task.id)}>
                                <CheckCircle2 className="h-3 w-3 mr-1" />Completar
                              </Button>
                            </div>
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
                      const subjMinutes = studyTasks.reduce((acc, t) => acc + (t.studySessions?.minutes || 0), 0);
                      return (
                        <div key={subject.id} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium">{subject.name}</span>
                            <span className="text-muted-foreground flex items-center gap-2">
                              {subjMinutes > 0 && (
                                <span className="flex items-center gap-0.5 text-blue-600">
                                  <AlarmClock className="h-3 w-3" />{subjMinutes}m
                                </span>
                              )}
                              {done}/{studyTasks.length}
                            </span>
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
        subjects={currentSemesterSubjects.map(s => ({ id: s.id, name: s.name, topics: s.topics.map(t => ({ id: t.id, title: t.title })) }))}
        onSubmit={(data) => addTask(data.subject_id, data)}
      />
      <AssignTaskToBlockDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        task={assignTarget ? { ...assignTarget, source: 'university' } : null}
        onAssigned={() => {
          setAssignTarget(null);
          window.dispatchEvent(new CustomEvent('taskAssignmentChanged'));
        }}
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