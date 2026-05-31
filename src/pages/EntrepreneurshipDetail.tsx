import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight, Edit3,
  DollarSign, ListTodo, CheckCircle2, TrendingUp, Calendar, Briefcase
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Subtask { id: string; title: string; completed: boolean; }
interface EntrepreneurshipTask {
  id: string; title: string; description: string; task_type: 'normal' | 'improvement';
  completed: boolean; due_date?: string; subtasks: Subtask[];
}
interface Income {
  id: string; amount: number; description: string | null; income_date: string; income_type: string;
}
interface Entrepreneurship { id: string; name: string; description: string | null; cover_image: string | null; }

export default function EntrepreneurshipDetail() {
  const { id } = useParams<{ id: string }>();
  const [ent, setEnt] = useState<Entrepreneurship | null>(null);
  const [tasks, setTasks] = useState<EntrepreneurshipTask[]>([]);
  const [income, setIncome] = useState<Income[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  
  // Task dialog
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<EntrepreneurshipTask | null>(null);
  const [taskType, setTaskType] = useState<'normal' | 'improvement'>('normal');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [dueDate, setDueDate] = useState('');
  
  // Subtask
  const [subtaskInput, setSubtaskInput] = useState('');
  const [addingSubtaskTo, setAddingSubtaskTo] = useState<string | null>(null);
  
  // Income dialog
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().slice(0, 10));
  const [incomeType, setIncomeType] = useState('revenue');
  
  // Edit entrepreneurship
  const [editEntOpen, setEditEntOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');

  useEffect(() => { if (id) { loadAll(); } }, [id]);

  const loadAll = () => { loadEnt(); loadTasks(); loadIncome(); };

  const loadEnt = async () => {
    const { data } = await supabase.from('entrepreneurships').select('*').eq('id', id).single();
    if (data) setEnt(data);
  };

  const loadTasks = async () => {
    const { data: tasksData } = await supabase.from('entrepreneurship_tasks')
      .select('*').eq('entrepreneurship_id', id).order('created_at', { ascending: false });
    const enriched = await Promise.all((tasksData || []).map(async (t) => {
      const { data: subs } = await supabase.from('subtasks').select('*').eq('task_id', t.id).order('created_at');
      return { ...t, description: t.description || '', task_type: t.task_type as 'normal' | 'improvement', subtasks: subs || [] };
    }));
    setTasks(enriched);
  };

  const loadIncome = async () => {
    const { data } = await supabase.from('entrepreneurship_income')
      .select('*').eq('entrepreneurship_id', id).order('income_date', { ascending: false });
    setIncome(data || []);
  };

  // Entrepreneurship edit
  const saveEnt = async () => {
    if (!editName.trim()) return;
    await supabase.from('entrepreneurships').update({ name: editName.trim(), description: editDescription.trim() || null }).eq('id', id);
    setEditEntOpen(false);
    loadEnt();
    toast.success('Actualizado');
  };

  // Tasks CRUD
  const openNewTask = (type: 'normal' | 'improvement') => {
    setEditingTask(null); setTaskType(type); setTitle(''); setDesc(''); setDueDate(''); setTaskDialogOpen(true);
  };
  const openEditTask = (task: EntrepreneurshipTask) => {
    setEditingTask(task); setTaskType(task.task_type); setTitle(task.title); setDesc(task.description); setDueDate(task.due_date || ''); setTaskDialogOpen(true);
  };

  const saveTask = async () => {
    if (!title.trim()) { toast.error('Título requerido'); return; }
    if (editingTask) {
      await supabase.from('entrepreneurship_tasks').update({ title: title.trim(), description: desc.trim() || null, due_date: dueDate || null }).eq('id', editingTask.id);
      toast.success('Tarea actualizada');
    } else {
      await supabase.from('entrepreneurship_tasks').insert({
        entrepreneurship_id: id, title: title.trim(), description: desc.trim() || null,
        task_type: taskType, completed: false, due_date: dueDate || null
      });
      toast.success('Tarea creada');
    }
    setTaskDialogOpen(false); loadTasks();
  };

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    await supabase.from('entrepreneurship_tasks').update({ completed: !task.completed }).eq('id', taskId);
    loadTasks();
  };

  const deleteTask = async (taskId: string) => {
    await supabase.from('entrepreneurship_tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    toast.success('Tarea eliminada');
  };

  // Subtasks
  const addSubtask = async (taskId: string) => {
    if (!subtaskInput.trim()) return;
    await supabase.from('subtasks').insert({ task_id: taskId, title: subtaskInput.trim(), completed: false });
    setSubtaskInput(''); setAddingSubtaskTo(null); loadTasks();
  };

  const toggleSubtask = async (subId: string, completed: boolean) => {
    await supabase.from('subtasks').update({ completed: !completed }).eq('id', subId);
    loadTasks();
  };

  const deleteSubtask = async (subId: string) => {
    await supabase.from('subtasks').delete().eq('id', subId);
    loadTasks();
  };

  // Income
  const saveIncome = async () => {
    if (!incomeAmount || isNaN(Number(incomeAmount))) { toast.error('Monto inválido'); return; }
    await supabase.from('entrepreneurship_income').insert({
      entrepreneurship_id: id, amount: Number(incomeAmount),
      description: incomeDesc.trim() || null, income_date: incomeDate, income_type: incomeType
    });
    setIncomeDialogOpen(false); setIncomeAmount(''); setIncomeDesc(''); loadIncome();
    toast.success('Ingreso registrado');
  };

  const deleteIncome = async (incId: string) => {
    await supabase.from('entrepreneurship_income').delete().eq('id', incId);
    setIncome(prev => prev.filter(i => i.id !== incId));
    toast.success('Ingreso eliminado');
  };

  const toggle = (taskId: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(taskId) ? n.delete(taskId) : n.add(taskId); return n;
  });

  if (!ent) return <div className="container mx-auto px-4 pt-24 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  const normalTasks = tasks.filter(t => t.task_type === 'normal');
  const improvementTasks = tasks.filter(t => t.task_type === 'improvement');
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.completed).length;
  const taskProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalIncome = income.reduce((s, i) => s + Number(i.amount), 0);

  const TaskCard = ({ task }: { task: EntrepreneurshipTask }) => {
    const isExpanded = expanded.has(task.id);
    const subsDone = task.subtasks.filter(s => s.completed).length;
    return (
      <Card className={`border-border transition-all ${task.completed ? 'opacity-60' : ''}`}>
        <CardContent className="p-0">
          <div className="flex items-start gap-3 p-3">
            <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id)} className="mt-0.5" />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggle(task.id)}>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {task.title}
                </span>
                {task.subtasks.length > 0 && (
                  <Badge variant="outline" className="text-[10px]">{subsDone}/{task.subtasks.length}</Badge>
                )}
              </div>
              {task.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{task.description}</p>}
              {task.due_date && (
                <div className="flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            <div className="flex gap-0.5 flex-shrink-0">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEditTask(task)}>
                <Edit3 className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteTask(task.id)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggle(task.id)}>
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="px-3 pb-3 border-t border-border pt-2 space-y-1.5">
              {task.subtasks.map(sub => (
                <div key={sub.id} className="flex items-center gap-2 pl-6">
                  <Checkbox checked={sub.completed} onCheckedChange={() => toggleSubtask(sub.id, sub.completed)} className="h-3.5 w-3.5" />
                  <span className={`text-xs flex-1 ${sub.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{sub.title}</span>
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteSubtask(sub.id)}>
                    <Trash2 className="h-2.5 w-2.5 text-muted-foreground" />
                  </Button>
                </div>
              ))}
              {addingSubtaskTo === task.id ? (
                <div className="flex gap-2 pl-6">
                  <Input className="h-7 text-xs" placeholder="Subtarea..." value={subtaskInput}
                    onChange={e => setSubtaskInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addSubtask(task.id)}
                    autoFocus />
                  <Button size="sm" className="h-7 text-xs" onClick={() => addSubtask(task.id)}>+</Button>
                </div>
              ) : (
                <Button variant="ghost" size="sm" className="h-6 text-[10px] ml-6 gap-1" onClick={() => { setAddingSubtaskTo(task.id); setSubtaskInput(''); }}>
                  <Plus className="h-3 w-3" /> Subtarea
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 pt-20 pb-24 space-y-5" style={{ paddingTop: 'max(5rem, calc(env(safe-area-inset-top) + 4rem))' }}>
      {/* Header */}
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <Link to="/entrepreneurship">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground truncate">{ent.name}</h1>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => { setEditName(ent.name); setEditDescription(ent.description || ''); setEditEntOpen(true); }}>
                <Edit3 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </div>
            {ent.description && <p className="text-xs text-muted-foreground truncate">{ent.description}</p>}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <ListTodo className="h-5 w-5 mx-auto text-primary mb-1" />
            <div className="text-lg font-bold text-foreground">{completedTasks}/{totalTasks}</div>
            <div className="text-[10px] text-muted-foreground">Tareas</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <CheckCircle2 className="h-5 w-5 mx-auto text-green-500 mb-1" />
            <div className="text-lg font-bold text-foreground">{taskProgress}%</div>
            <div className="text-[10px] text-muted-foreground">Progreso</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-3 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
            <div className="text-lg font-bold text-foreground">${totalIncome.toLocaleString()}</div>
            <div className="text-[10px] text-muted-foreground">Ingresos</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-foreground">Progreso general</span>
            <span className="text-xs font-bold text-primary">{taskProgress}%</span>
          </div>
          <Progress value={taskProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="normal">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="normal" className="text-xs">Tareas ({normalTasks.length})</TabsTrigger>
          <TabsTrigger value="improvement" className="text-xs">Mejoras ({improvementTasks.length})</TabsTrigger>
          <TabsTrigger value="income" className="text-xs">Ingresos ({income.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="normal" className="space-y-3 mt-3">
          <Button size="sm" className="gap-1.5 w-full" variant="outline" onClick={() => openNewTask('normal')}>
            <Plus className="h-4 w-4" /> Nueva Tarea
          </Button>
          {normalTasks.map(t => <TaskCard key={t.id} task={t} />)}
          {normalTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin tareas aún</p>}
        </TabsContent>

        <TabsContent value="improvement" className="space-y-3 mt-3">
          <Button size="sm" className="gap-1.5 w-full" variant="outline" onClick={() => openNewTask('improvement')}>
            <Plus className="h-4 w-4" /> Nueva Mejora
          </Button>
          {improvementTasks.map(t => <TaskCard key={t.id} task={t} />)}
          {improvementTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin mejoras aún</p>}
        </TabsContent>

        <TabsContent value="income" className="space-y-3 mt-3">
          <Button size="sm" className="gap-1.5 w-full" variant="outline" onClick={() => setIncomeDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Registrar Ingreso
          </Button>
          
          {income.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Total ingresos</span>
                <span className="text-lg font-bold text-primary">${totalIncome.toLocaleString()}</span>
              </CardContent>
            </Card>
          )}

          {income.map(inc => (
            <Card key={inc.id} className="border-border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">${Number(inc.amount).toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(inc.income_date).toLocaleDateString()}</span>
                  </div>
                  {inc.description && <p className="text-xs text-muted-foreground truncate">{inc.description}</p>}
                  <Badge variant="outline" className="text-[10px] mt-1">{inc.income_type === 'revenue' ? 'Ingreso' : inc.income_type}</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 flex-shrink-0" onClick={() => deleteIncome(inc.id)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </CardContent>
            </Card>
          ))}
          {income.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">Sin ingresos registrados</p>}
        </TabsContent>
      </Tabs>

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask ? 'Editar' : 'Nueva'} {taskType === 'normal' ? 'Tarea' : 'Mejora'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-3">
            <Input placeholder="Título" value={title} onChange={e => setTitle(e.target.value)} />
            <Textarea placeholder="Descripción" value={desc} onChange={e => setDesc(e.target.value)} rows={2} />
            <div>
              <label className="text-xs text-muted-foreground">Fecha de vencimiento</label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <Button onClick={saveTask} className="w-full">{editingTask ? 'Guardar' : 'Crear'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Income Dialog */}
      <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Ingreso</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <div>
              <label className="text-xs text-muted-foreground">Monto ($)</label>
              <Input type="number" placeholder="0" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} />
            </div>
            <Input placeholder="Descripción (opcional)" value={incomeDesc} onChange={e => setIncomeDesc(e.target.value)} />
            <div>
              <label className="text-xs text-muted-foreground">Fecha</label>
              <Input type="date" value={incomeDate} onChange={e => setIncomeDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Tipo</label>
              <select className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm" value={incomeType} onChange={e => setIncomeType(e.target.value)}>
                <option value="revenue">Ingreso</option>
                <option value="investment">Inversión recibida</option>
                <option value="refund">Reembolso</option>
                <option value="other">Otro</option>
              </select>
            </div>
            <Button onClick={saveIncome} className="w-full">Registrar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Ent Dialog */}
      <Dialog open={editEntOpen} onOpenChange={setEditEntOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Emprendimiento</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-3">
            <Input placeholder="Nombre" value={editName} onChange={e => setEditName(e.target.value)} />
            <Textarea placeholder="Descripción" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={2} />
            <Button onClick={saveEnt} className="w-full">Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
