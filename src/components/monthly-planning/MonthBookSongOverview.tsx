import { format, startOfWeek, startOfMonth, endOfMonth, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Piano, Guitar } from 'lucide-react';
import type { MonthlyPlanData } from '@/hooks/useMonthlyPlan';

interface BookDef {
  id: string;
  title: string;
  author?: string | null;
}

interface SongDef {
  id: string;
  title: string;
  artist?: string | null;
  instrument: string;
}

interface MonthBookSongOverviewProps {
  month: Date;
  planData: MonthlyPlanData;
  books: BookDef[];
  songs: SongDef[];
}

function monthWeeksOf(month: Date) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfMonth(month);
  const weeks: { key: string; label: string }[] = [];
  let cursor = new Date(first);
  while (cursor <= last) {
    const end = addDays(cursor, 6);
    weeks.push({
      key: format(cursor, 'yyyy-MM-dd'),
      label: `${format(cursor, 'd MMM', { locale: es })} - ${format(end, 'd MMM', { locale: es })}`,
    });
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

export function MonthBookSongOverview({ month, planData, books, songs }: MonthBookSongOverviewProps) {
  const weeks = monthWeeksOf(month);
  const dist = planData.week_distribution || {};
  const bookMap = new Map(books.map(b => [b.id, b]));
  const songMap = new Map(songs.map(s => [s.id, s]));
  const selectedBookIds = planData.books.selected || [];
  const selectedSongIds = planData.songs.selected || [];

  const bookWeeksOf = (id: string) => weeks.filter(w => (dist[w.key]?.books || []).includes(id));
  const songWeeksOf = (id: string) => weeks.filter(w => (dist[w.key]?.songs || []).includes(id));

  const assignedBooks = new Set(weeks.flatMap(w => dist[w.key]?.books || []));
  const assignedSongs = new Set(weeks.flatMap(w => dist[w.key]?.songs || []));
  const unassignedBooks = selectedBookIds.filter(id => !assignedBooks.has(id));
  const unassignedSongs = selectedSongIds.filter(id => !assignedSongs.has(id));

  if (selectedBookIds.length === 0 && selectedSongIds.length === 0) {
    return null;
  }

  return (
    <Card className="overflow-hidden border border-indigo-200/60 dark:border-indigo-800/40 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-500" />
          <p className="text-sm font-semibold">
            Libros y canciones de {format(month, 'MMMM yyyy', { locale: es })}
          </p>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {selectedBookIds.length} 📚 · {selectedSongIds.length} 🎵
          </Badge>
        </div>

        {selectedBookIds.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">📚 Libros planificados del mes</p>
            {selectedBookIds.map(id => {
              const book = bookMap.get(id);
              if (!book) return null;
              const wk = bookWeeksOf(id);
              const totalPages = wk.reduce((s, w) => s + (dist[w.key]?.book_pages || 0), 0);
              const totalMin = wk.reduce((s, w) => s + (dist[w.key]?.book_minutes || 0), 0);
              return (
                <div key={id} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/50 shadow-sm">
                  <div className="w-6 h-8 rounded overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center">
                    <BookOpen className="w-3 h-3 text-indigo-400/70" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{book.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {wk.length > 0
                        ? `Sem: ${wk.map(w => w.label).join(' · ')}`
                        : 'Sin asignar a una semana'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {totalPages > 0 && <p className="text-[9px] font-semibold text-indigo-500">📖 {totalPages} pág</p>}
                    {totalMin > 0 && <p className="text-[9px] text-muted-foreground">⏱ {totalMin} min</p>}
                    {totalPages === 0 && totalMin === 0 && <p className="text-[9px] text-muted-foreground/50">sin meta</p>}
                  </div>
                </div>
              );
            })}
            {unassignedBooks.length > 0 && (
              <p className="text-[10px] text-amber-600/80">⚠️ {unassignedBooks.length} libro(s) sin semana: repártelos en el Plan Semanal</p>
            )}
          </div>
        )}

        {selectedSongIds.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">🎵 Canciones planificadas del mes</p>
            {selectedSongIds.map(id => {
              const song = songMap.get(id);
              if (!song) return null;
              const wk = songWeeksOf(id);
              const totalMin = wk.reduce((s, w) => s + (dist[w.key]?.music_minutes || 0), 0);
              return (
                <div key={id} className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-zinc-950/60 border border-border/50 shadow-sm">
                  <div className="w-6 h-6 rounded overflow-hidden bg-gradient-to-br from-emerald-500/20 shrink-0 flex items-center justify-center">
                    {song.instrument === 'piano' ? (
                      <Piano className="w-3 h-3 text-rose-400/80" />
                    ) : (
                      <Guitar className="w-3 h-3 text-amber-400/80" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium truncate">{song.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {wk.length > 0
                        ? `Sem: ${wk.map(w => w.label).join(' · ')}`
                        : 'Sin asignar a una semana'}
                    </p>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    {wk.length > 0 && (
                      <>
                        {totalMin > 0 && <p className="text-[9px] font-semibold text-emerald-500">🎹 {totalMin} min</p>}
                        {wk.some(w => (dist[w.key]?.music_focus || '').trim()) && (
                          <p className="text-[9px] text-muted-foreground">🔎 {wk[0].label}</p>
                        )}
                      </>
                    )}
                    {totalMin === 0 && <p className="text-[9px] text-muted-foreground/50">sin meta</p>}
                  </div>
                </div>
              );
            })}
            {unassignedSongs.length > 0 && (
              <p className="text-[10px] text-amber-600/80">⚠️ {unassignedSongs.length} canción(es) sin semana: repártelas en el Plan Semanal</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}