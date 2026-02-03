import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Briefcase, GraduationCap, FolderKanban, Book, Music, Gamepad2, Dumbbell, 
  Droplet, Wallet, Clock, Target, Play, ChevronRight, ChevronDown, 
  Globe, Palette, Box
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface AreaTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  routine_block_id?: string;
  source: string;
  description?: string;
  subject_id?: string;
}

interface Subject {
  id: string;
  name: string;
  color: string | null;
}

interface UniversitySchedule {
  day: string;
  time: string;
  subject: string;
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

const AREA_STRUCTURE = {
  professional: {
    label: 'Profesional/Académico',
    icon: Briefcase,
    color: 'bg-blue-500/10 text-blue-600',
    areas: ['universidad', 'emprendimiento', 'proyectos']
  },
  development: {
    label: 'Desarrollo Personal',
    icon: Target,
    color: 'bg-purple-500/10 text-purple-600',
    subgroups: {
      intellectual: {
        label: 'Hobbies Intelectuales',
        icon: Book,
        areas: ['lectura', 'ajedrez', 'idiomas']
      },
      artistic: {
        label: 'Hobbies Artísticos',
        icon: Palette,
        areas: ['guitarra', 'piano', 'dibujo']
      },
      physical: {
        label: 'Hobbies Físicos',
        icon: Dumbbell,
        areas: ['gym', 'calistenia', 'boxeo']
      }
    }
  },
  appearance: {
    label: 'Apariencia',
    icon: Droplet,
    color: 'bg-pink-500/10 text-pink-600',
    areas: ['skincare-mañana', 'skincare-noche']
  },
  finances: {
    label: 'Finanzas',
    icon: Wallet,
    color: 'bg-green-500/10 text-green-600',
    areas: ['finanzas']
  }
};

export function OrganizedDayStructure() {
  const navigate = useNavigate();
  const today = format(new Date(), 'yyyy-MM-dd');
  const isWeekendDay = isWeekend(new Date());
  const { blocks } = useRoutineBlocksDB();

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
        projTasksRes,
        trivialRes,
        subjectsRes,
        pianoRes,
        guitarRes,
        bookRes,
        langSettingsRes,
        langSessionRes,
        focusRes,
      ] = await Promise.all([
        // University tasks
        supabase.from('tasks').select('*')
          .or(`source.eq.university,area_id.eq.universidad`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        // Entrepreneurship tasks
        supabase.from('entrepreneurship_tasks').select('*').eq('due_date', today),
        // Project tasks
        supabase.from('tasks').select('*')
          .or(`source.eq.project,area_id.eq.proyectos,area_id.eq.proyectos-personales`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        // Trivial tasks (tasks marked as trivial or low priority general tasks)
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
      ]);

      // Map tasks
      setUniversityTasks((uniTasksRes.data || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'university',
        description: t.description,
      })));

      setEntrepreneurshipTasks((entTasksRes.data || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        source: 'entrepreneurship',
        routine_block_id: t.routine_block_id,
      })));

      setProjectTasks((projTasksRes.data || []).map(t => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'projects',
      })));

      setTrivialTasks((trivialRes.data || []).map(t => ({
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
      focusData.forEach(session => {
        const area = session.task_area || 'general';
        const duration = session.duration_minutes || 0;
        timeByArea[area] = (timeByArea[area] || 0) + duration;
      });
      setFocusTime(timeByArea);

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

  const goToFocus = (taskTitle: string, taskId?: string, area?: string) => {
    navigate('/focus', { state: { taskTitle, taskId, area } });
  };

  const findBlockByKeyword = (keywords: string[]) => {
    return blocks.find(block =>
      keywords.some(kw => block.title.toLowerCase().includes(kw.toLowerCase()))
    );
  };

  const getBlockTime = (blockId?: string) => {
    if (!blockId) return null;
    const block = blocks.find(b => b.id === blockId);
    return block ? formatTimeDisplay(block.startTime) : null;
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto" />
        </CardContent>
      </Card>
    );
  }

  const renderTaskItem = (task: AreaTask, showFocusButton = true) => (
    <div key={task.id} className={cn(
      "flex items-center gap-3 p-2 rounded-md transition-all",
      task.completed ? 'bg-green-500/10 opacity-60' : 'hover:bg-muted/50'
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => toggleTask(task.id, task.source, task.completed)}
      />
      <span className={cn("flex-1 text-sm", task.completed && "line-through text-muted-foreground")}>
        {task.title}
      </span>
      {task.routine_block_id && (
        <Badge variant="outline" className="text-xs">
          <Clock className="w-3 h-3 mr-1" />
          {getBlockTime(task.routine_block_id)}
        </Badge>
      )}
      {showFocusButton && !task.completed && (
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2"
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
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                  <GraduationCap className="h-4 w-4 text-blue-600" />
                  <span className="font-medium flex-1 text-left">Universidad</span>
                  <Badge variant="outline">{universityTasks.filter(t => t.completed).length}/{universityTasks.length}</Badge>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-6 space-y-3">
                  {/* Subjects */}
                  {subjects.length > 0 && (
                    <div className="mb-3">
                      <p className="text-xs text-muted-foreground mb-2">📚 Asignaturas:</p>
                      <div className="flex flex-wrap gap-1">
                        {subjects.map(sub => (
                          <Badge key={sub.id} variant="outline" className="text-xs"
                            style={{ borderColor: sub.color || undefined }}>
                            {sub.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Deep work blocks */}
                  {deepWorkBlocks.length > 0 && (
                    <div className="p-2 rounded bg-blue-500/5 text-sm mb-3">
                      <span className="font-medium">⏱️ Bloques de estudio:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {deepWorkBlocks.slice(0, 4).map(block => (
                          <Badge key={block.id} variant="secondary" className="text-xs">
                            {formatTimeDisplay(block.startTime)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Focus time tracked */}
                  {focusTime['university'] > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      ⏱️ Tiempo de estudio hoy: <span className="font-semibold">{focusTime['university']} min</span>
                    </div>
                  )}
                  {/* Tasks */}
                  {universityTasks.length > 0 ? (
                    universityTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay tareas para hoy</p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Emprendimiento */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                  <Briefcase className="h-4 w-4 text-purple-600" />
                  <span className="font-medium flex-1 text-left">Emprendimiento</span>
                  <Badge variant="outline">{entrepreneurshipTasks.filter(t => t.completed).length}/{entrepreneurshipTasks.length}</Badge>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-6 space-y-2">
                  {focusTime['entrepreneurship'] > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      ⏱️ Tiempo trabajado hoy: <span className="font-semibold">{focusTime['entrepreneurship']} min</span>
                    </div>
                  )}
                  {entrepreneurshipTasks.length > 0 ? (
                    entrepreneurshipTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay tareas para hoy</p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Proyectos Personales */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger className="flex items-center gap-2 w-full p-2 rounded hover:bg-muted/50">
                  <FolderKanban className="h-4 w-4 text-orange-600" />
                  <span className="font-medium flex-1 text-left">Proyectos Personales</span>
                  <Badge variant="outline">{projectTasks.filter(t => t.completed).length}/{projectTasks.length}</Badge>
                  <ChevronDown className="h-4 w-4" />
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 pl-6 space-y-2">
                  {focusTime['projects'] > 0 && (
                    <div className="text-xs text-muted-foreground mb-2">
                      ⏱️ Tiempo trabajado hoy: <span className="font-semibold">{focusTime['projects']} min</span>
                    </div>
                  )}
                  {projectTasks.length > 0 ? (
                    projectTasks.map(task => renderTaskItem(task))
                  ) : (
                    <p className="text-sm text-muted-foreground">No hay tareas para hoy</p>
                  )}
                </CollapsibleContent>
              </Collapsible>
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
                  <div className="p-3 rounded-lg border bg-amber-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Book className="h-4 w-4 text-amber-600" />
                      <span className="font-medium">Lectura</span>
                    </div>
                    {currentBook ? (
                      <div className="space-y-2">
                        <p className="text-sm font-semibold">{currentBook.title}</p>
                        {currentBook.author && <p className="text-xs text-muted-foreground">{currentBook.author}</p>}
                        {currentBook.pages_total && currentBook.pages_read !== null && (
                          <>
                            <Progress value={(currentBook.pages_read / currentBook.pages_total) * 100} className="h-2" />
                            <p className="text-xs text-muted-foreground">
                              {currentBook.pages_read}/{currentBook.pages_total} páginas
                            </p>
                          </>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No hay libro en lectura</p>
                    )}
                  </div>

                  {/* Ajedrez */}
                  <div className="p-3 rounded-lg border bg-slate-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Gamepad2 className="h-4 w-4 text-slate-600" />
                      <span className="font-medium">Ajedrez</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Práctica diaria de tácticas y partidas</p>
                  </div>

                  {/* Idiomas */}
                  <div className="p-3 rounded-lg border bg-blue-500/5">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-4 w-4 text-blue-600" />
                      <span className="font-medium">
                        Idiomas: {languageSettings?.current_language === 'english' ? 'Inglés' : 'Italiano'}
                      </span>
                    </div>
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
                  </div>
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
                  {currentSong ? (
                    <div className="p-3 rounded-lg border bg-purple-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Music className="h-4 w-4 text-purple-600" />
                        <span className="font-medium">{currentSong.title}</span>
                        <Badge variant="secondary" className="text-xs">{currentSong.difficulty || 'Normal'}</Badge>
                      </div>
                      {currentSong.artist && <p className="text-xs text-muted-foreground">{currentSong.artist}</p>}
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

                  {/* Dibujo - Solo fines de semana */}
                  {isWeekendDay && (
                    <div className="p-3 rounded-lg border bg-rose-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="h-4 w-4 text-rose-600" />
                        <span className="font-medium">Dibujo</span>
                        <Badge variant="secondary" className="text-xs">Solo fines de semana</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">Práctica de dibujo y sketching</p>
                    </div>
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
                  <div className="p-3 rounded-lg border bg-green-500/5">
                    <div className="flex items-center gap-2">
                      <Dumbbell className="h-4 w-4 text-green-600" />
                      <span className="font-medium">Gym</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Entrenamiento de fuerza - 1 hora</p>
                  </div>

                  {/* Calistenia */}
                  <div className="p-3 rounded-lg border bg-teal-500/5">
                    <div className="flex items-center gap-2">
                      <Box className="h-4 w-4 text-teal-600" />
                      <span className="font-medium">Calistenia</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Ejercicios de peso corporal</p>
                  </div>

                  {/* Boxeo - Solo fines de semana */}
                  {isWeekendDay && (
                    <div className="p-3 rounded-lg border bg-red-500/5">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-red-600" />
                        <span className="font-medium">Boxeo</span>
                        <Badge variant="secondary" className="text-xs">Solo fines de semana</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Entrenamiento de boxeo</p>
                    </div>
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
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 rounded-lg border bg-amber-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌅</span>
                    <span className="font-medium">Skincare Mañana</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Limpieza, hidratante, protector solar</p>
                </div>
                <div className="p-3 rounded-lg border bg-indigo-500/5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌙</span>
                    <span className="font-medium">Skincare Noche</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Limpieza profunda, tratamiento, hidratante</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* FINANZAS */}
          <AccordionItem value="finances" className="border rounded-lg mb-3 overflow-hidden">
            <AccordionTrigger className="px-4 py-3 bg-green-500/10 hover:bg-green-500/20">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-green-600" />
                <span className="font-semibold">Finanzas</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 py-3">
              <p className="text-sm text-muted-foreground">Revisa tus finanzas en la sección de Finanzas del día</p>
              <Button variant="outline" className="mt-2" onClick={() => navigate('/finance')}>
                <Wallet className="h-4 w-4 mr-2" />
                Ver Finanzas
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
