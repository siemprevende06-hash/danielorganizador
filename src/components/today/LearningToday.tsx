import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Book, Music, Languages, Clock, Calendar } from 'lucide-react';
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

interface LanguageSettings {
  current_language: string;
  english_level: string | null;
  italian_level: string | null;
}

interface LanguageSession {
  id: string;
  vocabulary_completed: boolean | null;
  vocabulary_duration: number | null;
  listening_completed: boolean | null;
  listening_duration: number | null;
  reading_completed: boolean | null;
  reading_duration: number | null;
  speaking_completed: boolean | null;
  speaking_duration: number | null;
  grammar_completed: boolean | null;
  grammar_duration: number | null;
}

export function LearningToday() {
  const [currentBook, setCurrentBook] = useState<ReadingBook | null>(null);
  const [currentSong, setCurrentSong] = useState<MusicPiece | null>(null);
  const [languageSettings, setLanguageSettings] = useState<LanguageSettings | null>(null);
  const [todaySession, setTodaySession] = useState<LanguageSession | null>(null);
  const [loading, setLoading] = useState(true);
  const { blocks } = useRoutineBlocksDB();

  useEffect(() => {
    loadLearningData();
  }, []);

  const loadLearningData = async () => {
    try {
      // Load current book (status = 'reading')
      const { data: bookData } = await supabase
        .from('reading_library')
        .select('*')
        .eq('status', 'reading')
        .limit(1)
        .single();
      
      if (bookData) setCurrentBook(bookData);

      // Load current song (status = 'learning')
      const { data: songData } = await supabase
        .from('music_repertoire')
        .select('*')
        .eq('status', 'learning')
        .limit(1)
        .single();
      
      if (songData) setCurrentSong(songData);

      // Load language settings
      const { data: langSettings } = await supabase
        .from('language_settings')
        .select('*')
        .limit(1)
        .single();
      
      if (langSettings) setLanguageSettings(langSettings);

      // Load today's language session
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: sessionData } = await supabase
        .from('language_sessions')
        .select('*')
        .eq('session_date', today)
        .limit(1)
        .single();
      
      if (sessionData) setTodaySession(sessionData);
    } catch (error) {
      console.error('Error loading learning data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLanguageTask = async (task: string, currentValue: boolean) => {
    if (!todaySession) {
      // Create new session for today
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: newSession, error } = await supabase
        .from('language_sessions')
        .insert({
          session_date: today,
          language: languageSettings?.current_language || 'english',
          block_type: 'morning',
          [`${task}_completed`]: true,
        })
        .select()
        .single();
      
      if (newSession && !error) {
        setTodaySession(newSession);
      }
    } else {
      const { error } = await supabase
        .from('language_sessions')
        .update({ [`${task}_completed`]: !currentValue })
        .eq('id', todaySession.id);
      
      if (!error) {
        setTodaySession(prev => prev ? { ...prev, [`${task}_completed`]: !currentValue } : null);
      }
    }
  };

  // Find relevant blocks
  const findBlockByKeyword = (keywords: string[]) => {
    return blocks.find(block => 
      keywords.some(kw => block.title.toLowerCase().includes(kw.toLowerCase()))
    );
  };

  const readingBlock = findBlockByKeyword(['lectura', 'reading', 'idiomas']);
  const musicBlock = findBlockByKeyword(['piano', 'guitarra', 'música', 'music']);
  const languageBlock = findBlockByKeyword(['idiomas', 'language', 'inglés', 'italiano']);

  // Calculate pages to read today
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

  const languageTasks = [
    { key: 'vocabulary', label: 'Vocabulario', duration: 10, time: '5:30 PM' },
    { key: 'grammar', label: 'Gramática/Duolingo', duration: 20, time: '5:40 PM' },
    { key: 'speaking', label: 'Habla con IA', duration: 10, time: '6:00 PM' },
    { key: 'reading', label: 'Lectura', duration: 20, time: '6:10 PM' },
    { key: 'listening', label: 'Escucha', duration: 30, time: '6:30 PM' },
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasContent = currentBook || currentSong || languageSettings;

  if (!hasContent) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Book className="h-4 w-4" />
          Lo que estoy aprendiendo hoy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Book */}
        {currentBook && (
          <div className="p-4 rounded-lg border bg-card/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Book className="h-5 w-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-foreground truncate">{currentBook.title}</h4>
                {currentBook.author && (
                  <p className="text-sm text-muted-foreground">{currentBook.author}</p>
                )}
              </div>
            </div>

            {pagesToday && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Páginas para hoy:</span>
                  <span className="font-semibold">
                    {pagesToday.from} → {pagesToday.to} ({pagesToday.count} páginas)
                  </span>
                </div>

                {readingBlock && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>30 min en bloque {readingBlock.title}</span>
                    <Badge variant="outline" className="ml-auto">
                      {formatTimeDisplay(readingBlock.startTime)}
                    </Badge>
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progreso total</span>
                    <span>{Math.round(pagesToday.progress)}%</span>
                  </div>
                  <Progress value={pagesToday.progress} className="h-2" />
                </div>
              </>
            )}
          </div>
        )}

        {/* Current Song */}
        {currentSong && (
          <div className="p-4 rounded-lg border bg-card/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Music className="h-5 w-5 text-purple-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground truncate">{currentSong.title}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {currentSong.instrument === 'piano' ? '🎹' : '🎸'} {currentSong.instrument}
                  </Badge>
                </div>
                {currentSong.artist && (
                  <p className="text-sm text-muted-foreground">{currentSong.artist}</p>
                )}
              </div>
            </div>

            {currentSong.notes && (
              <div className="p-3 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground mb-1">Acordes/notas a repasar:</p>
                <p className="text-sm font-mono">{currentSong.notes}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              {currentSong.difficulty && (
                <Badge variant="outline" className="text-xs">
                  Dificultad: {currentSong.difficulty}
                </Badge>
              )}
              
              {musicBlock && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>30 min</span>
                  <Badge variant="outline">
                    {formatTimeDisplay(musicBlock.startTime)}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Language Learning */}
        {languageSettings && (
          <div className="p-4 rounded-lg border bg-card/50 space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Languages className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">
                    Idioma del día: {languageSettings.current_language === 'english' ? 'Inglés' : 'Italiano'}
                  </h4>
                  {languageSettings.current_language === 'english' && languageSettings.english_level && (
                    <Badge variant="secondary">{languageSettings.english_level}</Badge>
                  )}
                  {languageSettings.current_language === 'italian' && languageSettings.italian_level && (
                    <Badge variant="secondary">{languageSettings.italian_level}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {languageTasks.map((task) => {
                const isCompleted = todaySession?.[`${task.key}_completed` as keyof LanguageSession] as boolean || false;
                
                return (
                  <div 
                    key={task.key}
                    className={`flex items-center gap-3 p-2 rounded-md transition-colors ${
                      isCompleted ? 'bg-green-500/10 border border-green-500/20' : 'hover:bg-muted/50'
                    }`}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => toggleLanguageTask(task.key, isCompleted)}
                    />
                    <span className={`flex-1 text-sm ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                      {task.label} ({task.duration} min)
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {task.time}
                    </Badge>
                  </div>
                );
              })}
            </div>

            {languageBlock && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                <Calendar className="h-3 w-3" />
                <span>Bloque: {languageBlock.title} ({formatTimeDisplay(languageBlock.startTime)} - {formatTimeDisplay(languageBlock.endTime)})</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
