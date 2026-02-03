import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Book, Music, Target, CheckCircle2, Circle, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';

interface MonthlyBook {
  id: string;
  title: string;
  author: string | null;
  status: string | null;
  pages_read: number | null;
  pages_total: number | null;
  start_date: string | null;
  finish_date: string | null;
}

interface MonthlySong {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
  status: string | null;
  difficulty: string | null;
  notes: string | null;
}

interface MonthlyGoal {
  books: {
    target: number;
    current: MonthlyBook[];
    completed: number;
  };
  piano: {
    target: number;
    current: MonthlySong[];
    completed: number;
  };
  guitar: {
    target: number;
    current: MonthlySong[];
    completed: number;
  };
}

export function MonthlyGoalsSection() {
  const [goals, setGoals] = useState<MonthlyGoal>({
    books: { target: 2, current: [], completed: 0 },
    piano: { target: 1, current: [], completed: 0 },
    guitar: { target: 1, current: [], completed: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: es });

  useEffect(() => {
    loadMonthlyGoals();
  }, [currentMonth]);

  const loadMonthlyGoals = async () => {
    setLoading(true);

    // Load books being read or completed this month
    const { data: booksData } = await supabase
      .from('reading_library')
      .select('*')
      .or(`status.eq.reading,and(status.eq.read,finish_date.gte.${monthStartStr},finish_date.lte.${monthEndStr})`);

    // Load songs being learned or mastered this month
    const { data: songsData } = await supabase
      .from('music_repertoire')
      .select('*');

    const books = booksData || [];
    const songs = songsData || [];

    // Filter books for this month
    const currentBooks = books.filter(b => b.status === 'reading');
    const completedBooks = books.filter(b => 
      b.status === 'read' && 
      b.finish_date && 
      b.finish_date >= monthStartStr && 
      b.finish_date <= monthEndStr
    );

    // Filter songs by instrument
    const pianoSongs = songs.filter(s => s.instrument === 'piano');
    const guitarSongs = songs.filter(s => s.instrument === 'guitar');

    const currentPiano = pianoSongs.filter(s => s.status === 'learning');
    const completedPiano = pianoSongs.filter(s => s.status === 'mastered');
    
    const currentGuitar = guitarSongs.filter(s => s.status === 'learning');
    const completedGuitar = guitarSongs.filter(s => s.status === 'mastered');

    setGoals({
      books: {
        target: 2,
        current: [...currentBooks, ...completedBooks],
        completed: completedBooks.length,
      },
      piano: {
        target: 1,
        current: [...currentPiano.slice(0, 1), ...completedPiano.slice(-1)],
        completed: completedPiano.length > 0 ? 1 : 0,
      },
      guitar: {
        target: 1,
        current: [...currentGuitar.slice(0, 1), ...completedGuitar.slice(-1)],
        completed: completedGuitar.length > 0 ? 1 : 0,
      },
    });

    setLoading(false);
  };

  const getProgress = (completed: number, target: number) => {
    return Math.min(100, (completed / target) * 100);
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'reading' || status === 'learning') {
      return <Badge variant="secondary" className="text-xs">En progreso</Badge>;
    }
    if (status === 'read' || status === 'mastered') {
      return <Badge className="text-xs bg-green-500">Completado</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Pendiente</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold capitalize flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Metas de {monthName}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Books Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Book className="w-5 h-5 text-amber-500" />
              <span className="font-medium">Libros</span>
            </div>
            <Badge variant={goals.books.completed >= goals.books.target ? "default" : "outline"}>
              {goals.books.completed}/{goals.books.target}
            </Badge>
          </div>
          
          <Progress value={getProgress(goals.books.completed, goals.books.target)} className="h-2" />
          
          {goals.books.current.length > 0 ? (
            <div className="space-y-2">
              {goals.books.current.map((book) => (
                <div key={book.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    {book.status === 'read' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{book.title}</p>
                      {book.author && (
                        <p className="text-xs text-muted-foreground">{book.author}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {book.pages_read && book.pages_total && (
                      <span className="text-xs text-muted-foreground">
                        {book.pages_read}/{book.pages_total} pág
                      </span>
                    )}
                    {getStatusBadge(book.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No hay libros asignados este mes
            </p>
          )}

          {goals.books.completed < goals.books.target && (
            <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 p-2 rounded">
              <AlertTriangle className="w-4 h-4" />
              <span>Faltan {goals.books.target - goals.books.completed} libro(s) por completar</span>
            </div>
          )}
        </div>

        {/* Piano Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎹</span>
              <span className="font-medium">Piano</span>
            </div>
            <Badge variant={goals.piano.completed >= goals.piano.target ? "default" : "outline"}>
              {goals.piano.completed}/{goals.piano.target}
            </Badge>
          </div>
          
          <Progress value={getProgress(goals.piano.completed, goals.piano.target)} className="h-2" />
          
          {goals.piano.current.length > 0 ? (
            <div className="space-y-2">
              {goals.piano.current.map((song) => (
                <div key={song.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    {song.status === 'mastered' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{song.title}</p>
                      {song.artist && (
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {song.difficulty && (
                      <Badge variant="outline" className="text-xs">{song.difficulty}</Badge>
                    )}
                    {getStatusBadge(song.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No hay canción de piano asignada
            </p>
          )}
        </div>

        {/* Guitar Goal */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎸</span>
              <span className="font-medium">Guitarra</span>
            </div>
            <Badge variant={goals.guitar.completed >= goals.guitar.target ? "default" : "outline"}>
              {goals.guitar.completed}/{goals.guitar.target}
            </Badge>
          </div>
          
          <Progress value={getProgress(goals.guitar.completed, goals.guitar.target)} className="h-2" />
          
          {goals.guitar.current.length > 0 ? (
            <div className="space-y-2">
              {goals.guitar.current.map((song) => (
                <div key={song.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                  <div className="flex items-center gap-2">
                    {song.status === 'mastered' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{song.title}</p>
                      {song.artist && (
                        <p className="text-xs text-muted-foreground">{song.artist}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {song.difficulty && (
                      <Badge variant="outline" className="text-xs">{song.difficulty}</Badge>
                    )}
                    {getStatusBadge(song.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              No hay canción de guitarra asignada
            </p>
          )}
        </div>

        {/* Summary */}
        <div className="pt-3 border-t flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso general del mes:</span>
          <span className="font-bold">
            {Math.round(
              ((goals.books.completed / goals.books.target) * 33.3) +
              ((goals.piano.completed / goals.piano.target) * 33.3) +
              ((goals.guitar.completed / goals.guitar.target) * 33.3)
            )}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
