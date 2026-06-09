import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Briefcase, GraduationCap, FolderKanban, Book, Music,
  TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  source: string;
  subject_name?: string;
  routine_block_id?: string;
}

interface MusicPiece {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
  difficulty: string | null;
}

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  wallet_name?: string;
}

export function TaskAccordion() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const [loading, setLoading] = useState(true);
  const [universityTasks, setUniversityTasks] = useState<Task[]>([]);
  const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState<Task[]>([]);
  const [projectTasks, setProjectTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pianoSongs, setPianoSongs] = useState<MusicPiece[]>([]);
  const [guitarSongs, setGuitarSongs] = useState<MusicPiece[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expandedSections, setExpandedSections] = useState<string[]>(['tasks', 'finances']);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const [
        uniTasksRes, entTasksRes, projTasksRes,
        subjectsRes, pianoRes, guitarRes,
        transRes, walletsRes,
      ] = await Promise.all([
        supabase.from('tasks').select('*')
          .or(`source.eq.university,area_id.eq.universidad`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        supabase.from('entrepreneurship_tasks').select('*')
          .eq('due_date', today),
        supabase.from('tasks').select('*')
          .or(`source.eq.project,area_id.eq.proyectos,area_id.eq.proyectos-personales`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        supabase.from('university_subjects').select('*'),
        supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning'),
        supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning'),
        supabase.from('transactions').select('id, description, amount, transaction_type, wallet_id')
          .gte('transaction_date', `${today}T00:00:00`)
          .lte('transaction_date', `${today}T23:59:59`)
          .order('created_at', { ascending: false }),
        supabase.from('wallets').select('id, name'),
      ]);

      const subjectMap = new Map((subjectsRes.data || []).map(s => [s.id, s.name]));
      setUniversityTasks((uniTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        source: 'university',
        subject_name: t.source_id ? subjectMap.get(t.source_id) : undefined,
        routine_block_id: t.routine_block_id,
      })));

      setEntrepreneurshipTasks((entTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        source: 'entrepreneurship',
        routine_block_id: t.routine_block_id,
      })));

      setProjectTasks((projTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        source: 'projects',
        routine_block_id: t.routine_block_id,
      })));

      setSubjects(subjectsRes.data || []);
      setPianoSongs(pianoRes.data || []);
      setGuitarSongs(guitarRes.data || []);

      const walletMap = new Map((walletsRes.data || []).map((w: any) => [w.id, w.name]));
      setTransactions((transRes.data || []).map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.transaction_type as 'income' | 'expense',
        wallet_name: walletMap.get(t.wallet_id),
      })));
    } catch (error) {
      console.error('Error loading task data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = async (taskId: string, source: string, currentCompleted: boolean) => {
    const table = source === 'entrepreneurship' ? 'entrepreneurship_tasks' : 'tasks';
    await supabase.from(table).update({ completed: !currentCompleted }).eq('id', taskId);

    if (source === 'university') {
      setUniversityTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    } else if (source === 'projects') {
      setProjectTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    } else if (source === 'entrepreneurship') {
      setEntrepreneurshipTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    }
  };

  const renderTaskItem = (task: Task) => (
    <div key={task.id} className={cn(
      "flex items-center gap-3 p-2 rounded-md transition-all",
      task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id, task.source, task.completed)}
      />
      <div className="flex-1 min-w-0">
        <span className={cn("text-sm block truncate", task.completed && "line-through text-muted-foreground")}>
          {task.title}
        </span>
        {task.subject_name && (
          <span className="text-xs text-muted-foreground">{task.subject_name}</span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalIncome - totalExpense;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Book className="h-4 w-4" />
          Detalles del Día
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="multiple" value={expandedSections} onValueChange={setExpandedSections}>
          {/* TASKS */}
          <AccordionItem value="tasks" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Tareas del Día</span>
                <Badge variant="secondary" className="ml-2">
                  {universityTasks.filter(t => t.completed).length + entrepreneurshipTasks.filter(t => t.completed).length + projectTasks.filter(t => t.completed).length}/
                  {universityTasks.length + entrepreneurshipTasks.length + projectTasks.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-4">
              {/* Universidad */}
              {subjects.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs text-muted-foreground mb-2">📚 Asignaturas:</p>
                  <div className="flex flex-wrap gap-1">
                    {subjects.map(sub => (
                      <Badge key={sub.id} variant="outline" className="text-xs cursor-pointer hover:bg-muted"
                        style={{ borderColor: sub.color || undefined }}
                        onClick={() => navigate(`/university?subject=${sub.id}`)}>
                        {sub.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-semibold">Universidad</span>
                </div>
                <div className="space-y-1">
                  {universityTasks.length > 0 ? (
                    universityTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-semibold">Emprendimiento</span>
                </div>
                <div className="space-y-1">
                  {entrepreneurshipTasks.length > 0 ? (
                    entrepreneurshipTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <FolderKanban className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-semibold">Proyectos Personales</span>
                </div>
                <div className="space-y-1">
                  {projectTasks.length > 0 ? (
                    projectTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* MUSIC */}
          {(pianoSongs.length > 0 || guitarSongs.length > 0) && (
            <AccordionItem value="music" className="border rounded-lg mb-3 overflow-hidden">
              <AccordionTrigger className="px-4 py-3 bg-pink-500/10 hover:bg-pink-500/20">
                <div className="flex items-center gap-3">
                  <Music className="h-5 w-5 text-pink-600" />
                  <span className="font-semibold">Música en Aprendizaje</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 py-3 space-y-3">
                {pianoSongs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">🎹 Piano</p>
                    {pianoSongs.map(song => (
                      <div key={song.id} className="flex items-center justify-between p-2 rounded bg-muted/30 mb-1">
                        <div>
                          <p className="text-sm font-medium">{song.title}</p>
                          {song.artist && <p className="text-xs text-muted-foreground">{song.artist}</p>}
                        </div>
                        {song.difficulty && <Badge variant="outline" className="text-xs">{song.difficulty}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
                {guitarSongs.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">🎸 Guitarra</p>
                    {guitarSongs.map(song => (
                      <div key={song.id} className="flex items-center justify-between p-2 rounded bg-muted/30 mb-1">
                        <div>
                          <p className="text-sm font-medium">{song.title}</p>
                          {song.artist && <p className="text-xs text-muted-foreground">{song.artist}</p>}
                        </div>
                        {song.difficulty && <Badge variant="outline" className="text-xs">{song.difficulty}</Badge>}
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* FINANCES */}
          <AccordionItem value="finances" className="border rounded-lg overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Finanzas del Día</span>
                <Badge variant={netFlow >= 0 ? "default" : "destructive"} className="text-xs">
                  {netFlow >= 0 ? '+' : ''}${Math.abs(netFlow).toLocaleString()}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <TrendingUp className="w-4 h-4 text-green-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-green-600">{totalIncome === 0 ? '- ' : '+'}${totalIncome.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Ingresos</p>
                </div>
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <TrendingDown className="w-4 h-4 text-red-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-red-600">{totalExpense === 0 ? '- ' : '-'}${totalExpense.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground">Gastos</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <Wallet className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className={cn("text-lg font-bold", netFlow >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Neto</p>
                </div>
              </div>

              {transactions.length > 0 ? (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {transactions.slice(0, 10).map(t => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm truncate max-w-[200px]">{t.description}</span>
                      </div>
                      <span className={cn("text-sm font-medium", t.type === 'income' ? 'text-green-600' : 'text-red-600')}>
                        {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No hay movimientos hoy</p>
              )}

              <Button variant="outline" className="w-full" onClick={() => navigate('/finance')}>
                <Wallet className="h-4 w-4 mr-2" />
                Ver todas las finanzas
              </Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}
