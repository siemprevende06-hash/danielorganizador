import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Briefcase, GraduationCap, FolderKanban, Book, Music, Gamepad2, Dumbbell, 
  Droplet, Wallet, Clock, Target, Play, ChevronDown, Flame,
  Globe, Palette, Box, Settings, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useDailyAreaStats, AREA_IDS } from '@/hooks/useDailyAreaStats';
import { toast } from 'sonner';

interface AreaTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  routine_block_id?: string;
  source: string;
  description?: string;
  subject_id?: string;
  subject_name?: string;
}

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface MusicPiece {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
  notes: string | null;
  difficulty: string | null;
  status: string | null;
}

interface ReadingBook {
  id: string;
  title: string;
  author: string | null;
  pages_read: number | null;
  pages_total: number | null;
  status: string | null;
}

interface LanguageSettings {
  current_language: string;
  english_level: string | null;
  italian_level: string | null;
}

interface LanguageSession {
  id: string;
  vocabulary_completed: boolean | null;
  listening_completed: boolean | null;
  reading_completed: boolean | null;
  speaking_completed: boolean | null;
  grammar_completed: boolean | null;
}

interface TrivialTask {
  id: string;
  title: string;
  completed: boolean;
}

interface TodayTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  wallet_name?: string;
}

interface Project {
  id: string;
  title: string;
  status: string;
  tasks_completed: number;
  tasks_total: number;
}

interface Entrepreneurship {
  id: string;
  name: string;
  tasks_completed: number;
  tasks_total: number;
}

export function OrganizedDayStructure() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const isWeekendDay = isWeekend(new Date());
  const { blocks } = useRoutineBlocksDB();
  const areaStats = useDailyAreaStats();

  // State
  const [loading, setLoading] = useState(true);
  const [universityTasks, setUniversityTasks] = useState<AreaTask[]>([]);
  const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState<AreaTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<AreaTask[]>([]);
  const [trivialTasks, setTrivialTasks] = useState<TrivialTask[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [pianoSong, setPianoSong] = useState<MusicPiece | null>(null);
  const [guitarSong, setGuitarSong] = useState<MusicPiece | null>(null);
  const [currentBook, setCurrentBook] = useState<ReadingBook | null>(null);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null);
  const [languageSession, setLanguageSession] = useState<LanguageSession | null>(null);
  const [focusTime, setFocusTime] = useState<Record<string, number>>({});
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['professional', 'development']);
  const [transactions, setTransactions] = useState<TodayTransaction[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [entrepreneurships, setEntrepreneurships] = useState<Entrepreneurship[]>([]);
  
  // Editing states
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [tempGoalValue, setTempGoalValue] = useState<number>(0);
  
  // Music preference toggle
  const [musicPreference, setMusicPreference] = useState<'piano' | 'guitar'>('piano');

  useEffect(() => {
    loadAllData();
  }, [today]);

  const loadAllData = async () => {
    try {
      const [
        uniTasksRes,
        entTasksRes,
        entRes,
        projTasksRes,
        projRes,
        trivialRes,
        subjectsRes,
        pianoRes,
        guitarRes,
        bookRes,
        langSettingsRes,
        langSessionRes,
        focusRes,
        transRes,
        walletsRes,
      ] = await Promise.all([
        // University tasks
        supabase.from('tasks').select('*')
          .or(`source.eq.university,area_id.eq.universidad`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        // Entrepreneurship tasks for today
        supabase.from('entrepreneurship_tasks').select('*, entrepreneurship:entrepreneurships(name)')
          .eq('due_date', today),
        // All entrepreneurships with task counts
        supabase.from('entrepreneurships').select('id, name'),
        // Project tasks
        supabase.from('tasks').select('*')
          .or(`source.eq.project,area_id.eq.proyectos,area_id.eq.proyectos-personales`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        // Active projects
        supabase.from('projects').select('*').eq('status', 'active'),
        // Trivial tasks
        supabase.from('tasks').select('*')
          .eq('priority', 'trivial')
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        // University subjects
        supabase.from('university_subjects').select('*'),
        // Piano song
        supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning').limit(1).single(),
        // Guitar song
        supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning').limit(1).single(),
        // Current book
        supabase.from('reading_library').select('*').eq('status', 'reading').limit(1).single(),
        // Language settings
        supabase.from('language_settings').select('*').limit(1).single(),
        // Language session
        supabase.from('language_sessions').select('*').eq('session_date', today).limit(1).single(),
        // Focus sessions for today
        supabase.from('focus_sessions').select('*')
          .gte('start_time', `${today}T00:00:00`)
          .lte('start_time', `${today}T23:59:59`),
        // Today's transactions
        supabase.from('transactions').select('id, description, amount, transaction_type, wallet_id')
          .gte('transaction_date', `${today}T00:00:00`)
          .lte('transaction_date', `${today}T23:59:59`)
          .order('created_at', { ascending: false }),
        // Wallets for names
        supabase.from('wallets').select('id, name'),
      ]);

      // Process university tasks with subject names
      const subjectMap = new Map((subjectsRes.data || []).map(s => [s.id, s.name]));
      setUniversityTasks((uniTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'university',
        description: t.description,
        subject_name: t.source_id ? subjectMap.get(t.source_id) : undefined,
      })));

      setEntrepreneurshipTasks((entTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        source: 'entrepreneurship',
        routine_block_id: t.routine_block_id,
      })));

      // Process entrepreneurships with task counts
      const entTasksByEnt = (entTasksRes.data || []).reduce((acc: any, t: any) => {
        const entId = t.entrepreneurship_id;
        if (!acc[entId]) acc[entId] = { total: 0, completed: 0 };
        acc[entId].total++;
        if (t.completed) acc[entId].completed++;
        return acc;
      }, {});
      
      setEntrepreneurships((entRes.data || []).map((e: any) => ({
        id: e.id,
        name: e.name,
        tasks_completed: entTasksByEnt[e.id]?.completed || 0,
        tasks_total: entTasksByEnt[e.id]?.total || 0,
      })));

      setProjectTasks((projTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'projects',
      })));

      // Process projects with task counts
      const projTasksByProj = (projTasksRes.data || []).reduce((acc: any, t: any) => {
        const projId = t.source_id;
        if (!acc[projId]) acc[projId] = { total: 0, completed: 0 };
        acc[projId].total++;
        if (t.completed) acc[projId].completed++;
        return acc;
      }, {});

      setProjects((projRes.data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status,
        tasks_completed: projTasksByProj[p.id]?.completed || 0,
        tasks_total: projTasksByProj[p.id]?.total || 0,
      })));

      setTrivialTasks((trivialRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
      })));

      setSubjects(subjectsRes.data || []);
      if (pianoRes.data) setPianoSong(pianoRes.data);
      if (guitarRes.data) setGuitarSong(guitarRes.data);
      if (bookRes.data) setCurrentBook(bookRes.data);
      if (langSettingsRes.data) setLanguageSettings(langSettingsRes.data);
      if (langSessionRes.data) setLanguageSession(langSessionRes.data);

      // Calculate focus time per area
      const focusData = focusRes.data || [];
      const timeByArea: Record<string, number> = {};
      focusData.forEach((session: any) => {
        const area = session.task_area || 'general';
        const duration = session.duration_minutes || 0;
        timeByArea[area] = (timeByArea[area] || 0) + duration;
      });
      setFocusTime(timeByArea);

      // Process transactions
      const walletMap = new Map((walletsRes.data || []).map((w: any) => [w.id, w.name]));
      setTransactions((transRes.data || []).map((t: any) => ({
        id: t.id,
        description: t.description,
        amount: Number(t.amount),
        type: t.transaction_type as 'income' | 'expense',
        wallet_name: walletMap.get(t.wallet_id),
      })));

    } catch (error) {
      console.error('Error loading data:', error);
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

  const toggleTrivialTask = async (taskId: string, currentCompleted: boolean) => {
    await supabase.from('tasks').update({ completed: !currentCompleted }).eq('id', taskId);
    setTrivialTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
  };

  const toggleLanguageTask = async (task: string, currentValue: boolean) => {
    if (!languageSession) {
      const { data: newSession } = await supabase
        .from('language_sessions')
        .insert({
          session_date: today,
          language: languageSettings?.current_language || 'english',
          block_type: 'morning',
          [`${task}_completed`]: true,
        })
        .select()
        .single();
      if (newSession) setLanguageSession(newSession);
    } else {
      await supabase
        .from('language_sessions')
        .update({ [`${task}_completed`]: !currentValue })
        .eq('id', languageSession.id);
      setLanguageSession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
    }
  };

  const changeLanguage = async (lang: 'english' | 'italian') => {
    if (languageSettings) {
      await supabase
        .from('language_settings')
        .update({ current_language: lang })
        .eq('id', (languageSettings as any).id);
      setLanguageSettings(prev => prev ? { ...prev, current_language: lang } : null);
      toast.success(`Idioma cambiado a ${lang === 'english' ? 'Inglés' : 'Italiano'}`);
    } else {
      const { data } = await supabase
        .from('language_settings')
        .insert({ current_language: lang })
        .select()
        .single();
      if (data) setLanguageSettings(data);
    }
  };

  const goToFocus = (taskTitle: string, taskId?: string, area?: string) => {
    navigate('/focus', { state: { taskTitle, taskId, area } });
  };

  const getBlockTime = (blockId?: string) => {
    if (!blockId) return null;
    const block = blocks.find(b => b.id === blockId);
    return block ? formatTimeDisplay(block.startTime) : null;
  };

  const saveGoalEdit = async (areaId: string) => {
    await areaStats.updateTimeGoal(areaId as any, tempGoalValue);
    setEditingGoal(null);
  };

  const languageTasks = [
    { key: 'vocabulary', label: 'Vocabulario', duration: 10 },
    { key: 'grammar', label: 'Gramática/Duolingo', duration: 20 },
    { key: 'speaking', label: 'Habla con IA', duration: 10 },
    { key: 'reading', label: 'Lectura', duration: 20 },
    { key: 'listening', label: 'Escucha', duration: 30 },
  ];

  const deepWorkBlocks = blocks.filter(b => b.title.toLowerCase().includes('deep work'));
  const currentSong = musicPreference === 'piano' ? pianoSong : guitarSong;

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netFlow = totalIncome - totalExpense;

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  // Stat card component for consistent styling
  const AreaStatCard = ({ 
    areaId, 
    icon: Icon, 
    title, 
    iconColor,
    children,
    showTimeTracking = true,
    showCompletion = true,
  }: {
    areaId: string;
    icon: any;
    title: string;
    iconColor: string;
    children?: React.ReactNode;
    showTimeTracking?: boolean;
    showCompletion?: boolean;
  }) => {
    const stat = areaStats.stats[areaId as keyof typeof areaStats.stats];
    const streak = areaStats.getStreak(areaId as any);
    const isCompleted = areaStats.isCompleted(areaId as any);
    const timeSpent = focusTime[areaId] || stat?.time_spent_minutes || 0;
    const timeGoal = stat?.time_goal_minutes || 60;
    const progress = timeGoal > 0 ? Math.min(100, Math.round((timeSpent / timeGoal) * 100)) : 0;

    return (
      <div className={cn(
        "p-3 rounded-lg border transition-all",
        isCompleted ? "bg-green-500/10 border-green-500/30" : "bg-muted/30"
      )}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon className={cn("h-4 w-4", iconColor)} />
            <span className="font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <Badge variant="secondary" className="text-xs gap-1">
                <Flame className="h-3 w-3 text-orange-500" />
                {streak}
              </Badge>
            )}
            {showCompletion && (
              <Checkbox
                checked={isCompleted}
                onCheckedChange={() => areaStats.toggleCompletion(areaId as any)}
              />
            )}
          </div>
        </div>

        {showTimeTracking && (
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Tiempo: {timeSpent} / {timeGoal} min</span>
              {editingGoal === areaId ? (
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={tempGoalValue}
                    onChange={(e) => setTempGoalValue(parseInt(e.target.value) || 0)}
                    className="w-16 h-6 text-xs"
                  />
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => saveGoalEdit(areaId)}>
                    ✓
                  </Button>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 px-1"
                  onClick={() => {
                    setEditingGoal(areaId);
                    setTempGoalValue(timeGoal);
                  }}
                >
                  <Settings className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-right text-muted-foreground">{progress}%</p>
          </div>
        )}

        {children}
      </div>
    );
  };

  const renderTaskItem = (task: AreaTask, showFocusButton = true) => (
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
      {task.routine_block_id && (
        <Badge variant="outline" className="text-xs shrink-0">
          <Clock className="w-3 h-3 mr-1" />
          {getBlockTime(task.routine_block_id)}
        </Badge>
      )}
      {showFocusButton && !task.completed && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 shrink-0"
          onClick={() => goToFocus(task.title, task.id, task.source)}
        >
          <Play className="w-3 h-3 mr-1" />
          Focus
        </Button>
      )}
    </div>
  );

  return (
    <Card className="border-2 border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Organización del Día por Áreas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" value={expandedGroups} onValueChange={setExpandedGroups}>
          {/* PROFESIONAL/ACADÉMICO */}
          <AccordionItem value="professional" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20">
              <div className="flex items-center gap-3">
                <Briefcase className="h-5 w-5 text-blue-600" />
                <span className="font-semibold">Profesional/Académico</span>
                <Badge variant="secondary" className="ml-2">
                  {universityTasks.filter(t => t.completed).length + entrepreneurshipTasks.filter(t => t.completed).length + projectTasks.filter(t => t.completed).length}/
                  {universityTasks.length + entrepreneurshipTasks.length + projectTasks.length}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-4">
              {/* Universidad */}
              <AreaStatCard
                areaId={AREA_IDS.universidad}
                icon={GraduationCap}
                title="Universidad"
                iconColor="text-blue-600"
              >
                {/* Subjects */}
                {subjects.length > 0 && (
                  <div className="mb-3">
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
                {/* Deep work blocks */}
                {deepWorkBlocks.length > 0 && (
                  <div className="p-2 rounded bg-blue-500/5 text-sm mb-3">
                    <span className="font-medium text-xs">⏱️ Bloques de estudio:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {deepWorkBlocks.slice(0, 4).map(block => (
                        <Badge key={block.id} variant="secondary" className="text-xs">
                          {formatTimeDisplay(block.startTime)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* Tasks */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {universityTasks.length > 0 ? (
                    universityTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </AreaStatCard>

              {/* Emprendimiento */}
              <AreaStatCard
                areaId={AREA_IDS.emprendimiento}
                icon={Briefcase}
                title="Emprendimiento"
                iconColor="text-purple-600"
              >
                {/* Active entrepreneurships */}
                {entrepreneurships.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {entrepreneurships.map(ent => (
                      <div key={ent.id} className="flex items-center justify-between p-2 rounded bg-purple-500/5">
                        <span className="text-sm font-medium">{ent.name}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={ent.tasks_total > 0 ? (ent.tasks_completed / ent.tasks_total) * 100 : 0} className="w-16 h-2" />
                          <span className="text-xs text-muted-foreground">{ent.tasks_completed}/{ent.tasks_total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Tasks */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {entrepreneurshipTasks.length > 0 ? (
                    entrepreneurshipTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </AreaStatCard>

              {/* Proyectos Personales */}
              <AreaStatCard
                areaId={AREA_IDS.proyectos}
                icon={FolderKanban}
                title="Proyectos Personales"
                iconColor="text-orange-600"
              >
                {/* Active projects */}
                {projects.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {projects.map(proj => (
                      <div key={proj.id} className="flex items-center justify-between p-2 rounded bg-orange-500/5">
                        <span className="text-sm font-medium truncate max-w-[150px]">{proj.title}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{proj.status}</Badge>
                          <span className="text-xs text-muted-foreground">{proj.tasks_completed}/{proj.tasks_total}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Tasks */}
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {projectTasks.length > 0 ? (
                    projectTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground py-2">No hay tareas para hoy</p>
                  )}
                </div>
              </AreaStatCard>
            </AccordionContent>
          </AccordionItem>

          {/* DESARROLLO PERSONAL */}
          <AccordionItem value="development" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20">
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-purple-600" />
                <span className="font-semibold">Desarrollo Personal</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-4">
              {/* Hobbies Intelectuales */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-amber-500/5">
                  <Book className="h-4 w-4 text-amber-600" />
                  <span className="font-medium flex-1 text-left">Hobbies Intelectuales</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-4 space-y-4">
                  {/* Lectura */}
                  <AreaStatCard
                    areaId={AREA_IDS.lectura}
                    icon={Book}
                    title="Lectura"
                    iconColor="text-amber-600"
                  >
                    {currentBook ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{currentBook.title}</p>
                        {currentBook.author && <p className="text-xs text-muted-foreground">{currentBook.author}</p>}
                        {currentBook.pages_total && currentBook.pages_read !== null && (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span>Páginas: {currentBook.pages_read}/{currentBook.pages_total}</span>
                              <span className="text-muted-foreground">
                                Meta hoy: ~{Math.ceil((currentBook.pages_total - currentBook.pages_read) / 15)} págs
                              </span>
                            </div>
                            <Progress value={(currentBook.pages_read / currentBook.pages_total) * 100} className="h-2" />
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay libro en lectura</p>
                    )}
                  </AreaStatCard>

                  {/* Ajedrez */}
                  <AreaStatCard
                    areaId={AREA_IDS.ajedrez}
                    icon={Gamepad2}
                    title="Ajedrez"
                    iconColor="text-slate-600"
                    showTimeTracking={false}
                  >
                    <p className="text-sm text-muted-foreground">Marcar partida diaria como completada</p>
                  </AreaStatCard>

                  {/* Idiomas */}
                  <AreaStatCard
                    areaId={AREA_IDS.idiomas}
                    icon={Globe}
                    title={`Idiomas: ${languageSettings?.current_language === 'english' ? 'Inglés' : 'Italiano'}`}
                    iconColor="text-blue-600"
                  >
                    {/* Language selector */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        variant={languageSettings?.current_language === 'english' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => changeLanguage('english')}
                      >
                        🇺🇸 Inglés
                      </Button>
                      <Button
                        variant={languageSettings?.current_language === 'italian' ? 'default' : 'outline'}
                        size="sm"
                        className="flex-1"
                        onClick={() => changeLanguage('italian')}
                      >
                        🇮🇹 Italiano
                      </Button>
                    </div>
                    
                    {/* Language sub-tasks */}
                    <div className="space-y-2">
                      {languageTasks.map(task => {
                        const isCompleted = languageSession?.[`${task.key}_completed` as keyof LanguageSession] as boolean || false;
                        return (
                          <div key={task.key} className={cn(
                            "flex items-center gap-3 p-2 rounded-md",
                            isCompleted ? 'bg-green-500/10' : 'hover:bg-muted/50'
                          )}>
                            <Checkbox
                              checked={isCompleted}
                              onCheckedChange={() => toggleLanguageTask(task.key, isCompleted)}
                            />
                            <span className={cn(
                              "flex-1 text-sm",
                              isCompleted && "line-through text-muted-foreground"
                            )}>
                              {task.label} ({task.duration} min)
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Add English course day */}
                    <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => toast.info('Día de curso de inglés añadido a la rutina')}>
                      <Plus className="h-3 w-3 mr-1" />
                      Añadir día de curso
                    </Button>
                  </AreaStatCard>
                </CollapsibleContent>
              </Collapsible>

              {/* Hobbies Artísticos */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-pink-500/5">
                  <Palette className="h-4 w-4 text-pink-600" />
                  <span className="font-medium flex-1 text-left">Hobbies Artísticos</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-4 space-y-4">
                  {/* Music Toggle */}
                  <div className="flex gap-2 mb-3">
                    <Button
                      variant={musicPreference === 'piano' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMusicPreference('piano')}
                      className="flex-1"
                    >
                      🎹 Piano
                    </Button>
                    <Button
                      variant={musicPreference === 'guitar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setMusicPreference('guitar')}
                      className="flex-1"
                    >
                      🎸 Guitarra
                    </Button>
                  </div>

                  {/* Current Song */}
                  <AreaStatCard
                    areaId={musicPreference === 'piano' ? AREA_IDS.piano : AREA_IDS.guitarra}
                    icon={Music}
                    title={musicPreference === 'piano' ? 'Piano' : 'Guitarra'}
                    iconColor="text-purple-600"
                  >
                    {currentSong ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{currentSong.title}</p>
                        {currentSong.artist && <p className="text-xs text-muted-foreground">{currentSong.artist}</p>}
                        <Badge variant="secondary" className="text-xs">{currentSong.difficulty || 'Normal'}</Badge>
                        {currentSong.notes && (
                          <div className="mt-2 p-2 rounded bg-muted/50">
                            <p className="text-xs text-muted-foreground">🎼 Acordes/notas a practicar:</p>
                            <p className="font-mono text-sm">{currentSong.notes}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No hay canción de {musicPreference === 'piano' ? 'piano' : 'guitarra'} en aprendizaje
                      </p>
                    )}
                  </AreaStatCard>

                  {/* Dibujo - Solo fines de semana */}
                  {isWeekendDay && (
                    <AreaStatCard
                      areaId={AREA_IDS.dibujo}
                      icon={Palette}
                      title="Dibujo"
                      iconColor="text-rose-600"
                    >
                      <Badge variant="secondary" className="text-xs">Solo fines de semana</Badge>
                      <p className="text-sm text-muted-foreground mt-2">Práctica de dibujo y sketching</p>
                    </AreaStatCard>
                  )}
                  {!isWeekendDay && (
                    <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                      🎨 Dibujo disponible solo los fines de semana
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Hobbies Físicos */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50 bg-green-500/5">
                  <Dumbbell className="h-4 w-4 text-green-600" />
                  <span className="font-medium flex-1 text-left">Hobbies Físicos</span>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-4 space-y-3">
                  {/* Gym */}
                  <AreaStatCard
                    areaId={AREA_IDS.gym}
                    icon={Dumbbell}
                    title="Gym"
                    iconColor="text-green-600"
                  >
                    <p className="text-sm text-muted-foreground">Entrenamiento de fuerza</p>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/vida-daniel')}>
                      Ver rutina
                    </Button>
                  </AreaStatCard>

                  {/* Calistenia */}
                  <AreaStatCard
                    areaId={AREA_IDS.calistenia}
                    icon={Box}
                    title="Calistenia"
                    iconColor="text-teal-600"
                  >
                    <p className="text-sm text-muted-foreground">Ejercicios de peso corporal</p>
                  </AreaStatCard>

                  {/* Boxeo - Solo fines de semana */}
                  {isWeekendDay && (
                    <AreaStatCard
                      areaId={AREA_IDS.boxeo}
                      icon={Target}
                      title="Boxeo"
                      iconColor="text-red-600"
                    >
                      <Badge variant="secondary" className="text-xs">Solo fines de semana</Badge>
                      <p className="text-sm text-muted-foreground mt-2">Entrenamiento de boxeo</p>
                    </AreaStatCard>
                  )}
                  {!isWeekendDay && (
                    <div className="p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                      🥊 Boxeo disponible solo los fines de semana
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </AccordionContent>
          </AccordionItem>

          {/* APARIENCIA */}
          <AccordionItem value="appearance" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-pink-500/10 hover:bg-pink-500/20">
              <div className="flex items-center gap-3">
                <Droplet className="h-5 w-5 text-pink-600" />
                <span className="font-semibold">Apariencia</span>
                <div className="flex items-center gap-1">
                  {areaStats.getStreak(AREA_IDS.skincare_am) > 0 && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Flame className="h-3 w-3 text-orange-500" />
                      {areaStats.getStreak(AREA_IDS.skincare_am)}
                    </Badge>
                  )}
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <AreaStatCard
                  areaId={AREA_IDS.skincare_am}
                  icon={Droplet}
                  title="Skincare Mañana"
                  iconColor="text-amber-600"
                  showTimeTracking={false}
                >
                  <p className="text-xs text-muted-foreground">Limpieza, hidratante, protector solar</p>
                </AreaStatCard>
                
                <AreaStatCard
                  areaId={AREA_IDS.skincare_pm}
                  icon={Droplet}
                  title="Skincare Noche"
                  iconColor="text-indigo-600"
                  showTimeTracking={false}
                >
                  <p className="text-xs text-muted-foreground">Limpieza profunda, tratamiento, hidratante</p>
                </AreaStatCard>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FINANZAS */}
          <AccordionItem value="finances" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Finanzas</span>
                <Badge variant={netFlow >= 0 ? "default" : "destructive"} className="text-xs">
                  {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-3">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-green-500/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Ingresos</span>
                  </div>
                  <p className="text-lg font-bold text-green-600">+${totalIncome.toLocaleString()}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-red-500/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-red-500 mb-1">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-medium">Gastos</span>
                  </div>
                  <p className="text-lg font-bold text-red-600">-${totalExpense.toLocaleString()}</p>
                </div>
                
                <div className="p-3 rounded-lg bg-primary/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-primary mb-1">
                    <Wallet className="w-4 h-4" />
                    <span className="text-xs font-medium">Neto</span>
                  </div>
                  <p className={cn("text-lg font-bold", netFlow >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Transactions */}
              {transactions.length > 0 ? (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {transactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                      <div className="flex items-center gap-2">
                        {t.type === 'income' ? (
                          <ArrowUpRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm truncate max-w-[150px]">{t.description}</span>
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

        {/* TAREAS TRIVIALES */}
        {trivialTasks.length > 0 && (
          <div className="mt-4 p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📌</span>
              <span className="font-medium">Tareas Triviales</span>
              <Badge variant="outline" className="text-xs">Necesarias pero no aportan a metas</Badge>
            </div>
            <div className="space-y-2">
              {trivialTasks.map(task => (
                <div key={task.id} className={cn(
                  "flex items-center gap-3 p-2 rounded-md",
                  task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'
                )}>
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTrivialTask(task.id, task.completed)}
                  />
                  <span className={cn(
                    "flex-1 text-sm",
                    task.completed && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
