import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  BookOpen, ChevronDown, ChevronRight, PlusCircle, Trash2, 
  Clock, FileText, Play, Calendar, Target, GraduationCap,
  Pencil, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Subject, SubjectTopic, PartialExam, SubjectTask } from '@/hooks/useUniversity';
import { format, parseISO, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

interface SubjectDetailCardProps {
  subject: Subject;
  onDeleteSubject: (id: string) => void;
  onAddTopic: (subjectId: string, title: string, description?: string, isForFinal?: boolean) => Promise<boolean>;
  onDeleteTopic: (topicId: string) => Promise<boolean>;
  onAddPartialExam: (subjectId: string, data: {
    title: string;
    exam_date?: string;
    weight_percentage?: number;
    topicIds?: string[];
  }) => Promise<boolean>;
  onUpdatePartialExamGrade: (examId: string, grade: number, status?: string) => Promise<boolean>;
  onDeletePartialExam: (examId: string) => Promise<boolean>;
  onAddTask: (subjectId: string, data: {
    title: string;
    description?: string;
    due_date?: string;
    task_type: 'delivery' | 'study';
    estimated_minutes?: number;
    topic_id?: string;
  }) => Promise<boolean>;
  onToggleTask: (taskId: string) => Promise<boolean>;
  onDeleteTask: (taskId: string) => Promise<boolean>;
}

export function SubjectDetailCard({
  subject,
  onDeleteSubject,
  onAddTopic,
  onDeleteTopic,
  onAddPartialExam,
  onUpdatePartialExamGrade,
  onDeletePartialExam,
  onAddTask,
  onToggleTask,
  onDeleteTask
}: SubjectDetailCardProps) {
  const navigate = useNavigate();
  const [isTopicsOpen, setIsTopicsOpen] = useState(false);
  const [isExamsOpen, setIsExamsOpen] = useState(false);
  const [isTasksOpen, setIsTasksOpen] = useState(true);

  // Topic dialog
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');
  const [isForFinal, setIsForFinal] = useState(true);

  // Partial exam dialog
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examWeight, setExamWeight] = useState('20');
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);

  // Grade dialog
  const [isGradeDialogOpen, setIsGradeDialogOpen] = useState(false);
  const [currentExamForGrade, setCurrentExamForGrade] = useState<PartialExam | null>(null);
  const [gradeValue, setGradeValue] = useState('');

  // Task dialog
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskType, setTaskType] = useState<'delivery' | 'study'>('delivery');
  const [taskMinutes, setTaskMinutes] = useState('30');
  const [taskTopicId, setTaskTopicId] = useState('');

  const deliveryTasks = subject.tasks.filter(t => t.task_type === 'delivery');
  const studyTasks = subject.tasks.filter(t => t.task_type === 'study');

  const handleAddTopic = async () => {
    if (!newTopicTitle.trim()) return;
    const success = await onAddTopic(subject.id, newTopicTitle, newTopicDescription, isForFinal);
    if (success) {
      setNewTopicTitle('');
      setNewTopicDescription('');
      setIsForFinal(true);
      setIsTopicDialogOpen(false);
    }
  };

  const handleAddExam = async () => {
    if (!examTitle.trim()) return;
    const success = await onAddPartialExam(subject.id, {
      title: examTitle,
      exam_date: examDate || undefined,
      weight_percentage: parseInt(examWeight) || 20,
      topicIds: selectedTopicIds
    });
    if (success) {
      setExamTitle('');
      setExamDate('');
      setExamWeight('20');
      setSelectedTopicIds([]);
      setIsExamDialogOpen(false);
    }
  };

  const handleAddGrade = async () => {
    if (!currentExamForGrade || !gradeValue) return;
    const grade = parseFloat(gradeValue);
    if (isNaN(grade)) return;
    const success = await onUpdatePartialExamGrade(currentExamForGrade.id, grade);
    if (success) {
      setGradeValue('');
      setCurrentExamForGrade(null);
      setIsGradeDialogOpen(false);
    }
  };

  const handleAddTask = async () => {
    if (!taskTitle.trim()) return;
    const success = await onAddTask(subject.id, {
      title: taskTitle,
      description: taskDescription || undefined,
      due_date: taskDueDate || undefined,
      task_type: taskType,
      estimated_minutes: taskType === 'study' ? parseInt(taskMinutes) || 30 : undefined,
      topic_id: taskTopicId || undefined
    });
    if (success) {
      setTaskTitle('');
      setTaskDescription('');
      setTaskDueDate('');
      setTaskType('delivery');
      setTaskMinutes('30');
      setTaskTopicId('');
      setIsTaskDialogOpen(false);
    }
  };

  const goToFocus = (task: SubjectTask) => {
    navigate(`/focus?taskId=${task.id}&title=${encodeURIComponent(task.title)}&area=universidad`);
  };

  const getExamUrgency = (exam: PartialExam) => {
    if (!exam.exam_date) return { color: 'text-muted-foreground', bg: 'bg-muted' };
    const days = differenceInDays(parseISO(exam.exam_date), new Date());
    if (days < 0) return { color: 'text-muted-foreground', bg: 'bg-muted', text: 'Pasado' };
    if (days <= 3) return { color: 'text-destructive', bg: 'bg-destructive/10', text: `${days}d` };
    if (days <= 7) return { color: 'text-yellow-600', bg: 'bg-yellow-500/10', text: `${days}d` };
    return { color: 'text-green-600', bg: 'bg-green-500/10', text: `${days}d` };
  };

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" />
              {subject.name}
            </CardTitle>
            <CardDescription className="flex gap-2 mt-1">
              {subject.code && <Badge variant="outline">{subject.code}</Badge>}
              {subject.credits && <Badge variant="secondary">{subject.credits} créditos</Badge>}
            </CardDescription>
            {subject.professor && (
              <p className="text-xs text-muted-foreground mt-1">Prof. {subject.professor}</p>
            )}
            {subject.schedule && (
              <p className="text-xs text-muted-foreground">{subject.schedule}</p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={() => onDeleteSubject(subject.id)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Topics Section */}
        <Collapsible open={isTopicsOpen} onOpenChange={setIsTopicsOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {isTopicsOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                <span className="font-semibold text-sm">Temas ({subject.topics.length})</span>
              </Button>
            </CollapsibleTrigger>
            <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Tema
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Tema</DialogTitle>
                  <DialogDescription>Añade un tema del contenido de {subject.name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Título del Tema</label>
                    <Input 
                      value={newTopicTitle} 
                      onChange={(e) => setNewTopicTitle(e.target.value)} 
                      placeholder="Ej: Derivadas e Integrales"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción (opcional)</label>
                    <Textarea 
                      value={newTopicDescription} 
                      onChange={(e) => setNewTopicDescription(e.target.value)} 
                      placeholder="Subtemas, notas..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={isForFinal} 
                      onCheckedChange={(c) => setIsForFinal(c === true)}
                    />
                    <label className="text-sm">Este tema va al examen final</label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTopic}>Agregar Tema</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CollapsibleContent className="mt-2 space-y-1">
            {subject.topics.map((topic, index) => (
              <div key={topic.id} className="flex items-center gap-2 p-2 bg-accent/50 rounded-md">
                <span className="text-xs text-muted-foreground font-mono">{index + 1}.</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{topic.title}</p>
                  {topic.description && (
                    <p className="text-xs text-muted-foreground">{topic.description}</p>
                  )}
                </div>
                {topic.is_for_final && (
                  <Badge variant="outline" className="text-xs">Final</Badge>
                )}
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeleteTopic(topic.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
            {subject.topics.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No hay temas agregados</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Partial Exams Section */}
        <Collapsible open={isExamsOpen} onOpenChange={setIsExamsOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {isExamsOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                <span className="font-semibold text-sm">Parciales ({subject.partialExams.length})</span>
              </Button>
            </CollapsibleTrigger>
            <Dialog open={isExamDialogOpen} onOpenChange={setIsExamDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Parcial
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Examen Parcial</DialogTitle>
                  <DialogDescription>Crea un examen parcial para {subject.name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nombre del Parcial</label>
                    <Input 
                      value={examTitle} 
                      onChange={(e) => setExamTitle(e.target.value)} 
                      placeholder="Ej: Primer Parcial"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Fecha</label>
                      <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Peso (%)</label>
                      <Input 
                        type="number" 
                        value={examWeight} 
                        onChange={(e) => setExamWeight(e.target.value)}
                        min="0" max="100"
                      />
                    </div>
                  </div>
                  {subject.topics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Temas del Parcial</label>
                      <div className="max-h-32 overflow-y-auto space-y-1 mt-1">
                        {subject.topics.map(topic => (
                          <div key={topic.id} className="flex items-center gap-2">
                            <Checkbox 
                              checked={selectedTopicIds.includes(topic.id)}
                              onCheckedChange={(c) => {
                                if (c) {
                                  setSelectedTopicIds([...selectedTopicIds, topic.id]);
                                } else {
                                  setSelectedTopicIds(selectedTopicIds.filter(id => id !== topic.id));
                                }
                              }}
                            />
                            <span className="text-sm">{topic.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleAddExam}>Crear Parcial</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CollapsibleContent className="mt-2 space-y-2">
            {subject.partialExams.map((exam) => {
              const urgency = getExamUrgency(exam);
              const topicNames = subject.topics
                .filter(t => exam.topics.includes(t.id))
                .map(t => t.title);

              return (
                <div key={exam.id} className={`p-3 rounded-md border ${urgency.bg}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{exam.title}</span>
                        <Badge variant="outline" className="text-xs">{exam.weight_percentage}%</Badge>
                        {exam.exam_date && (
                          <span className={`text-xs ${urgency.color}`}>
                            {format(parseISO(exam.exam_date), "d MMM", { locale: es })}
                          </span>
                        )}
                      </div>
                      {topicNames.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Temas: {topicNames.join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {exam.grade !== null && exam.grade !== undefined ? (
                        <Badge variant={exam.grade >= 60 ? 'default' : 'destructive'}>
                          {exam.grade}
                        </Badge>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setCurrentExamForGrade(exam);
                            setIsGradeDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3 w-3 mr-1" />
                          Nota
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDeletePartialExam(exam.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
            {subject.partialExams.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No hay parciales programados</p>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Tasks Section */}
        <Collapsible open={isTasksOpen} onOpenChange={setIsTasksOpen}>
          <div className="flex items-center justify-between">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {isTasksOpen ? <ChevronDown className="h-4 w-4 mr-1" /> : <ChevronRight className="h-4 w-4 mr-1" />}
                <span className="font-semibold text-sm">Tareas ({subject.tasks.length})</span>
              </Button>
            </CollapsibleTrigger>
            <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-3 w-3 mr-1" />
                  Tarea
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Agregar Tarea</DialogTitle>
                  <DialogDescription>Añade una tarea a {subject.name}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Tipo de Tarea</label>
                    <Select value={taskType} onValueChange={(v) => setTaskType(v as 'delivery' | 'study')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="delivery">📄 Tarea a Entregar</SelectItem>
                        <SelectItem value="study">📚 Tiempo de Estudio</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Título</label>
                    <Input 
                      value={taskTitle} 
                      onChange={(e) => setTaskTitle(e.target.value)} 
                      placeholder={taskType === 'delivery' ? "Ej: Resolver ejercicios Cap. 5" : "Ej: Estudiar derivadas"}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Descripción (opcional)</label>
                    <Textarea 
                      value={taskDescription} 
                      onChange={(e) => setTaskDescription(e.target.value)} 
                      placeholder="Detalles..."
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">
                        {taskType === 'delivery' ? 'Fecha de Entrega' : 'Fecha'}
                      </label>
                      <Input type="date" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
                    </div>
                    {taskType === 'study' && (
                      <div>
                        <label className="text-sm font-medium">Duración (min)</label>
                        <Input 
                          type="number" 
                          value={taskMinutes} 
                          onChange={(e) => setTaskMinutes(e.target.value)}
                          min="5"
                        />
                      </div>
                    )}
                  </div>
                  {subject.topics.length > 0 && (
                    <div>
                      <label className="text-sm font-medium">Tema Relacionado (opcional)</label>
                      <Select value={taskTopicId} onValueChange={setTaskTopicId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar tema..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Ninguno</SelectItem>
                          {subject.topics.map(topic => (
                            <SelectItem key={topic.id} value={topic.id}>{topic.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={handleAddTask}>Agregar Tarea</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <CollapsibleContent className="mt-2 space-y-3">
            {/* Delivery Tasks */}
            {deliveryTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Tareas a Entregar</p>
                {deliveryTasks.map(task => (
                  <div key={task.id} className="flex items-start gap-2 p-2 bg-accent/50 rounded-md">
                    <Checkbox 
                      checked={task.completed}
                      onCheckedChange={() => onToggleTask(task.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(parseISO(task.due_date), "d MMM", { locale: es })}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {!task.completed && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => goToFocus(task)}>
                          <Play className="h-3 w-3 text-primary" />
                        </Button>
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteTask(task.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Study Tasks */}
            {studyTasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Tiempos de Estudio</p>
                {studyTasks.map(task => {
                  const relatedTopic = subject.topics.find(t => t.id === task.topic_id);
                  return (
                    <div key={task.id} className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-md border border-blue-500/20">
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => onToggleTask(task.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {task.estimated_minutes && (
                            <Badge variant="secondary" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {task.estimated_minutes} min
                            </Badge>
                          )}
                          {relatedTopic && (
                            <Badge variant="outline" className="text-xs">{relatedTopic.title}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!task.completed && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            className="h-7"
                            onClick={() => goToFocus(task)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Focus
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteTask(task.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {subject.tasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No hay tareas</p>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Grade Dialog */}
      <Dialog open={isGradeDialogOpen} onOpenChange={setIsGradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Nota</DialogTitle>
            <DialogDescription>
              Ingresa la nota de {currentExamForGrade?.title}
            </DialogDescription>
          </DialogHeader>
          <div>
            <label className="text-sm font-medium">Nota (0-100)</label>
            <Input 
              type="number" 
              value={gradeValue} 
              onChange={(e) => setGradeValue(e.target.value)}
              min="0" max="100"
              placeholder="75"
            />
          </div>
          <DialogFooter>
            <Button onClick={handleAddGrade}>Guardar Nota</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
