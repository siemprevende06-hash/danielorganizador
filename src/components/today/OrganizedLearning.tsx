import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Book, Music, Languages, GraduationCap, Briefcase, FolderKanban, Clock, Calendar, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useRoutineBlocksDB, formatTimeDisplay } from '@/hooks/useRoutineBlocksDB';
import { format, differenceInDays, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReadingBook {
  id: string;
  title: string;
  author: string | null;
  pages_read: number | null;
  pages_total: number | null;
  status: string | null;
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

interface LanguageSession {
  id: string;
  vocabulary_completed: boolean | null;
  listening_completed: boolean | null;
  reading_completed: boolean | null;
  speaking_completed: boolean | null;
  grammar_completed: boolean | null;
}

interface AreaTask {
  id: string;
  title: string;
  completed: boolean;
  priority?: string;
  routine_block_id?: string;
  source: string;
}

interface LanguageSettings {
  current_language: string;
  english_level: string | null;
  italian_level: string | null;
}

export function OrganizedLearning() {
  const [activeTab, setActiveTab] = useState('reading');
  const [currentBook, setCurrentBook] = useState<ReadingBook | null>(null);
  const [pianoSong, setPianoSong] = useState<MusicPiece | null>(null);
  const [guitarSong, setGuitarSong] = useState<MusicPiece | null>(null);
  const [musicPreference, setMusicPreference] = useState<'piano' | 'guitar'>('piano');
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null);
  const [todaySession, setTodaySession] = useState<LanguageSession | null>(null);
  const [universityTasks, setUniversityTasks] = useState<AreaTask[]>([]);
  const [projectTasks, setProjectTasks] = useState<AreaTask[]>([]);
  const [entrepreneurshipTasks, setEntrepreneurshipTasks] = useState<AreaTask[]>([]);
  const [loading, setLoading] = useState(true);
  const { blocks } = useRoutineBlocksDB();

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Load all data in parallel
      const [
        bookRes,
        pianoRes,
        guitarRes,
        langSettingsRes,
        langSessionRes,
        uniTasksRes,
        projTasksRes,
        entTasksRes,
      ] = await Promise.all([
        supabase.from('reading_library').select('*').eq('status', 'reading').limit(1).single(),
        supabase.from('music_repertoire').select('*').eq('instrument', 'piano').eq('status', 'learning').limit(1).single(),
        supabase.from('music_repertoire').select('*').eq('instrument', 'guitar').eq('status', 'learning').limit(1).single(),
        supabase.from('language_settings').select('*').limit(1).single(),
        supabase.from('language_sessions').select('*').eq('session_date', today).limit(1).single(),
        supabase.from('tasks').select('*')
          .or(`source.eq.university,area_id.eq.universidad`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        supabase.from('tasks').select('*')
          .or(`source.eq.project,area_id.eq.proyectos`)
          .gte('due_date', `${today}T00:00:00`)
          .lte('due_date', `${today}T23:59:59`),
        supabase.from('entrepreneurship_tasks').select('*').eq('due_date', today),
      ]);

      if (bookRes.data) setCurrentBook(bookRes.data);
      if (pianoRes.data) setPianoSong(pianoRes.data);
      if (guitarRes.data) setGuitarSong(guitarRes.data);
      if (langSettingsRes.data) setLanguageSettings(langSettingsRes.data);
      if (langSessionRes.data) setTodaySession(langSessionRes.data);
      
      setUniversityTasks((uniTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'university',
      })));
      
      setProjectTasks((projTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed || false,
        priority: t.priority,
        routine_block_id: t.routine_block_id,
        source: 'projects',
      })));

      setEntrepreneurshipTasks((entTasksRes.data || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        completed: t.completed,
        source: 'entrepreneurship',
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
    } else {
      setEntrepreneurshipTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !currentCompleted } : t));
    }
  };

  const toggleLanguageTask = async (task: string, currentValue: boolean) => {
    if (!todaySession) {
      const today = format(new Date(), 'yyyy-MM-dd');
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
      
      if (newSession) setTodaySession(newSession);
    } else {
      await supabase
        .from('language_sessions')
        .update({ [`${task}_completed`]: !currentValue })
        .eq('id', todaySession.id);
      
      setTodaySession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
    }
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

  const calculatePagesToday = () => {
    if (!currentBook?.pages_total || !currentBook?.pages_read) return null;
    const remaining = currentBook.pages_total - (currentBook.pages_read || 0);
    const daysInMonth = differenceInDays(endOfMonth(new Date()), new Date()) + 1;
    const pagesPerDay = Math.ceil(remaining / Math.max(daysInMonth, 1));
    return {
      from: currentBook.pages_read + 1,
      to: Math.min(currentBook.pages_read + pagesPerDay, currentBook.pages_total),
      count: pagesPerDay,
      progress: ((currentBook.pages_read || 0) / currentBook.pages_total) * 100
    };
  };

  const pagesToday = calculatePagesToday();
  const readingBlock = findBlockByKeyword(['lectura', 'reading', 'idiomas']);
  const musicBlock = findBlockByKeyword(['piano', 'guitarra', 'música']);
  const languageBlock = findBlockByKeyword(['idiomas', 'language']);
  const deepWorkBlocks = blocks.filter(b => b.title.toLowerCase().includes('deep work'));

  const languageTasks = [
    { key: 'vocabulary', label: 'Vocabulario', duration: 10 },
    { key: 'grammar', label: 'Gramática/Duolingo', duration: 20 },
    { key: 'speaking', label: 'Habla con IA', duration: 10 },
    { key: 'reading', label: 'Lectura', duration: 20 },
    { key: 'listening', label: 'Escucha', duration: 30 },
  ];

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

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" />
          Organización del Día por Área
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="reading" className="text-xs">📖</TabsTrigger>
            <TabsTrigger value="music" className="text-xs">🎵</TabsTrigger>
            <TabsTrigger value="languages" className="text-xs">🌍</TabsTrigger>
            <TabsTrigger value="university" className="text-xs">🎓</TabsTrigger>
            <TabsTrigger value="projects" className="text-xs">🚀</TabsTrigger>
            <TabsTrigger value="entrepreneurship" className="text-xs">💼</TabsTrigger>
          </TabsList>

          {/* Reading Tab */}
          <TabsContent value="reading" className="space-y-4">
            {currentBook ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Book className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{currentBook.title}</h4>
                    {currentBook.author && <p className="text-sm text-muted-foreground">{currentBook.author}</p>}
                  </div>
                </div>

                {pagesToday && (
                  <>
                    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>📄 Páginas para hoy:</span>
                        <span className="font-bold">{pagesToday.from} → {pagesToday.to}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>⏱️ Tiempo estimado:</span>
                        <span>30 minutos</span>
                      </div>
                      {readingBlock && (
                        <div className="flex justify-between text-sm">
                          <span>🕐 Cuándo:</span>
                          <Badge variant="outline">{formatTimeDisplay(readingBlock.startTime)}</Badge>
                        </div>
                      )}
                    </div>
                    <Progress value={pagesToday.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-center">
                      Progreso total: {Math.round(pagesToday.progress)}%
                    </p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay libro en lectura</p>
            )}
          </TabsContent>

          {/* Music Tab */}
          <TabsContent value="music" className="space-y-4">
            <div className="flex gap-2 mb-4">
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

            {currentSong ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Music className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{currentSong.title}</h4>
                    {currentSong.artist && <p className="text-sm text-muted-foreground">{currentSong.artist}</p>}
                  </div>
                  <Badge variant="secondary">{currentSong.difficulty || 'Normal'}</Badge>
                </div>

                {currentSong.notes && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-xs text-muted-foreground mb-1">🎼 Acordes/notas a practicar:</p>
                    <p className="font-mono text-sm">{currentSong.notes}</p>
                  </div>
                )}

                <div className="p-3 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>⏱️ Tiempo de práctica:</span>
                    <span>30 minutos</span>
                  </div>
                  {musicBlock && (
                    <div className="flex justify-between text-sm">
                      <span>🕐 Cuándo:</span>
                      <Badge variant="outline">{formatTimeDisplay(musicBlock.startTime)}</Badge>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No hay canción de {musicPreference === 'piano' ? 'piano' : 'guitarra'} en aprendizaje
              </p>
            )}
          </TabsContent>

          {/* Languages Tab */}
          <TabsContent value="languages" className="space-y-4">
            {languageSettings ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Languages className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">
                    {languageSettings.current_language === 'english' ? 'Inglés' : 'Italiano'}
                  </span>
                  {languageSettings.english_level && (
                    <Badge variant="secondary">{languageSettings.english_level}</Badge>
                  )}
                </div>

                <div className="space-y-2">
                  {languageTasks.map((task) => {
                    const isCompleted = todaySession?.[`${task.key}_completed` as keyof LanguageSession] as boolean || false;
                    return (
                      <div key={task.key} className={`flex items-center gap-3 p-2 rounded-md ${isCompleted ? 'bg-green-500/10' : 'hover:bg-muted/50'}`}>
                        <Checkbox checked={isCompleted} onCheckedChange={() => toggleLanguageTask(task.key, isCompleted)} />
                        <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                          {task.label} ({task.duration} min)
                        </span>
                      </div>
                    );
                  })}
                </div>

                {languageBlock && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <Calendar className="h-3 w-3 inline mr-1" />
                    Bloque: {languageBlock.title} ({formatTimeDisplay(languageBlock.startTime)})
                  </div>
                )}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Configura tu idioma</p>
            )}
          </TabsContent>

          {/* University Tab */}
          <TabsContent value="university" className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <span className="font-semibold">Universidad - Hoy</span>
              <Badge variant="outline">
                {universityTasks.filter(t => t.completed).length}/{universityTasks.length}
              </Badge>
            </div>

            {deepWorkBlocks.length > 0 && (
              <div className="p-2 rounded bg-blue-500/10 text-sm mb-3">
                <span className="font-medium">⏱️ Bloques de estudio:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {deepWorkBlocks.slice(0, 3).map(block => (
                    <Badge key={block.id} variant="secondary" className="text-xs">
                      {formatTimeDisplay(block.startTime)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {universityTasks.length > 0 ? (
              <div className="space-y-2">
                {universityTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`}>
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id, task.source, task.completed)} />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.priority === 'high' && <Badge variant="destructive" className="text-xs">Alta</Badge>}
                    {task.routine_block_id && (
                      <Badge variant="outline" className="text-xs">{getBlockTime(task.routine_block_id)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay tareas universitarias hoy</p>
            )}
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderKanban className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Proyectos - Hoy</span>
              <Badge variant="outline">
                {projectTasks.filter(t => t.completed).length}/{projectTasks.length}
              </Badge>
            </div>

            {projectTasks.length > 0 ? (
              <div className="space-y-2">
                {projectTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`}>
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id, task.source, task.completed)} />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                    {task.priority === 'high' && <Badge variant="destructive" className="text-xs">Alta</Badge>}
                    {task.routine_block_id && (
                      <Badge variant="outline" className="text-xs">{getBlockTime(task.routine_block_id)}</Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay tareas de proyectos hoy</p>
            )}
          </TabsContent>

          {/* Entrepreneurship Tab */}
          <TabsContent value="entrepreneurship" className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Emprendimiento - Hoy</span>
              <Badge variant="outline">
                {entrepreneurshipTasks.filter(t => t.completed).length}/{entrepreneurshipTasks.length}
              </Badge>
            </div>

            {entrepreneurshipTasks.length > 0 ? (
              <div className="space-y-2">
                {entrepreneurshipTasks.map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-md ${task.completed ? 'bg-green-500/10' : 'hover:bg-muted/50'}`}>
                    <Checkbox checked={task.completed} onCheckedChange={() => toggleTask(task.id, task.source, task.completed)} />
                    <span className={`flex-1 text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">No hay tareas de emprendimiento hoy</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
