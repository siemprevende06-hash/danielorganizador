import { useEffect, useState } from 'react';
import { format, startOfWeek, startOfMonth, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Piano, Guitar, Target, ListChecks, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { pullPlansIntoLocal } from '@/lib/planSync';
import type { WeekBookSongDistribution } from '@/hooks/useMonthlyPlan';

interface BookInfo {
  id: string;
  title: string;
  author: string | null;
  pages_read: number;
  pages_total: number | null;
  status: string;
}

interface SongInfo {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
  practice_minutes: number | null;
  status: string;
}

export function WeeklyFocusCard({ weekStart }: { weekStart: Date }) {
  const weekStartDate = startOfWeek(weekStart, { weekStartsOn: 1 });
  const weekEndDate = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekKey = format(weekStartDate, 'yyyy-MM-dd');
  const monthKey = format(startOfMonth(weekStartDate), 'yyyy-MM-dd');
  const weekLabel = `${format(weekStartDate, 'd MMM', { locale: es })} - ${format(weekEndDate, 'd MMM', { locale: es })}`;

  const [dist, setDist] = useState<WeekBookSongDistribution | null>(null);
  const [books, setBooks] = useState<BookInfo[]>([]);
  const [songs, setSongs] = useState<SongInfo[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await pullPlansIntoLocal();
      } catch { /* sin sync, usamos lo local */ }
      let slot: WeekBookSongDistribution | null = null;
      try {
        const raw = localStorage.getItem(`monthly_plan_${monthKey}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          slot = (parsed.week_distribution || {})[weekKey] || null;
        }
      } catch { /* plan local no disponible */ }
      if (!cancelled) setDist(slot);
    })();
    return () => { cancelled = true; };
  }, [weekKey, monthKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const targets = dist
        ? { books: dist.books || [], songs: dist.songs || [] }
        : { books: [], songs: [] };
      if (targets.books.length + targets.songs.length === 0) {
        if (!cancelled) { setBooks([]); setSongs([]); setLoaded(true); }
        return;
      }
      try {
        const [bRes, sRes] = await Promise.all([
          targets.books.length
            ? supabase.from('reading_library').select('id, title, author, pages_read, pages_total, status').in('id', targets.books)
            : Promise.resolve({ data: [], error: null }),
          targets.songs.length
            ? supabase.from('music_repertoire').select('id, title, artist, instrument, practice_minutes, status').in('id', targets.songs)
            : Promise.resolve({ data: [], error: null }),
        ]);
        if (!cancelled) {
          setBooks((bRes.data as BookInfo[]) || []);
          setSongs((sRes.data as SongInfo[]) || []);
        }
      } catch { /* datos sin conexión */ }
      if (!cancelled) setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [dist]);

  const hasItems = dist && (dist.books.length > 0 || dist.songs.length > 0);

  return (
    <Card className="overflow-hidden border-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl shadow-sm rounded-2xl">
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-500">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-semibold">Enfocado esta semana</p>
              <p className="text-[11px] text-muted-foreground">{weekLabel}</p>
            </div>
          </div>
          <Link to="/weekly-planning" className="text-xs text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
            <ListChecks className="w-3 h-3" /> Planificar <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {!hasItems ? (
          <div className="border-2 border-dashed border-muted-foreground/20 rounded-2xl p-5 text-center">
            <p className="text-xs text-muted-foreground">
              No hay libro ni canción asignados a esta semana.
            </p>
            <p className="text-[10px] text-muted-foreground/70 mt-1">
              Reparte los libros y canciones del mes desde el Plan Semanal.
            </p>
            <Link to="/weekly-planning">
              <Button size="sm" variant="outline" className="h-7 text-[10px] mt-2">
                Ir al Plan Semanal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dist!.books.map(id => {
              const book = books.find(b => b.id === id);
              if (!book) return null;
              const pct = book.pages_total ? Math.min(100, Math.round((book.pages_read / book.pages_total) * 100)) : 0;
              return (
                <div key={id} className="rounded-2xl border border-indigo-200/60 dark:border-indigo-800/40 bg-indigo-50/40 dark:bg-indigo-950/20 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-9 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-tight truncate">{book.title}</p>
                      {book.author && <p className="text-[10px] text-muted-foreground truncate">{book.author}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(dist!.book_pages || 0) > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        📖 {dist!.book_pages} páginas
                      </Badge>
                    )}
                    {(dist!.book_minutes || 0) > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        ⏱ {dist!.book_minutes} min
                      </Badge>
                    )}
                  </div>
                  {book.pages_total ? (
                    <div className="space-y-1">
                      <Progress value={pct} className="h-1.5" />
                      <p className="text-[9px] text-muted-foreground text-right">
                        {book.pages_read}/{book.pages_total} pág · {pct}%
                      </p>
                    </div>
                  ) : (
                    <p className="text-[9px] text-muted-foreground">📚 {book.pages_read} páginas leídas</p>
                  )}
                </div>
              );
            })}

            {dist!.songs.map(id => {
              const song = songs.find(s => s.id === id);
              if (!song) return null;
              return (
                <div key={id} className="rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center shrink-0">
                      {song.instrument === 'piano' ? (
                        <Piano className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Guitar className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold leading-tight truncate">{song.title}</p>
                      {song.artist && <p className="text-[10px] text-muted-foreground truncate">{song.artist}</p>}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(dist!.music_minutes || 0) > 0 && (
                      <Badge variant="secondary" className="text-[9px] px-1.5">
                        🎹 {dist!.music_minutes} min
                      </Badge>
                    )}
                  </div>
                  {(dist!.music_focus || '').trim() !== '' && (
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300">
                      🔎 {dist!.music_focus}
                    </p>
                  )}
                  <p className="text-[9px] text-muted-foreground">
                    {song.practice_minutes || 0} min acumulados
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}