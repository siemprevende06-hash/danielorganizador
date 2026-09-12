import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Piano, Guitar, ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WeeklySlot {
  key: string;
  label: string;
}

interface BookDef {
  id: string;
  title: string;
  author?: string | null;
}

interface SongDef {
  id: string;
  title: string;
  instrument: string;
  artist?: string | null;
}

type WeekItems = {
  books: string[];
  songs: string[];
  book_pages?: number;
  book_minutes?: number;
  music_minutes?: number;
  music_focus?: string;
};
export type WeekDistribution = Record<string, WeekItems>;

interface WeeklyBookSongDistributionProps {
  weeks: WeeklySlot[];
  activeWeekKey?: string;
  monthLabel: string;
  books: BookDef[];
  songs: SongDef[];
  selectedBookIds: string[];
  selectedSongIds: string[];
  distribution: WeekDistribution;
  onChange: (dist: WeekDistribution) => void;
}

function cleanDistribution(weeks: WeeklySlot[], dist: WeekDistribution): WeekDistribution {
  const out: WeekDistribution = {};
  weeks.forEach(w => {
    const prev = dist[w.key] || {};
    out[w.key] = {
      books: [...(prev.books || [])],
      songs: [...(prev.songs || [])],
      book_pages: prev.book_pages,
      book_minutes: prev.book_minutes,
      music_minutes: prev.music_minutes,
      music_focus: prev.music_focus,
    };
  });
  return out;
}

export function WeeklyBookSongDistribution({
  weeks,
  activeWeekKey,
  monthLabel,
  books,
  songs,
  selectedBookIds,
  selectedSongIds,
  distribution,
  onChange,
}: WeeklyBookSongDistributionProps) {
  const dist = cleanDistribution(weeks, distribution);

  const bookMap = new Map(books.map(b => [b.id, b]));
  const songMap = new Map(songs.map(s => [s.id, s]));

  const assignedBookIds = new Set(weeks.flatMap(w => dist[w.key].books));
  const assignedSongIds = new Set(weeks.flatMap(w => dist[w.key].songs));

  const unassignedBookIds = selectedBookIds.filter(id => !assignedBookIds.has(id));
  const unassignedSongIds = selectedSongIds.filter(id => !assignedSongIds.has(id));
  const hasUnassigned = unassignedBookIds.length > 0 || unassignedSongIds.length > 0;

  const totalItems = selectedBookIds.length + selectedSongIds.length;

  const moveItem = (itemId: string, type: 'book' | 'song', fromKey: string | null, toKey: string) => {
    const next = cleanDistribution(weeks, dist);
    if (fromKey && next[fromKey]) {
      if (type === 'book') next[fromKey] = { ...next[fromKey], books: next[fromKey].books.filter(id => id !== itemId) };
      else next[fromKey] = { ...next[fromKey], songs: next[fromKey].songs.filter(id => id !== itemId) };
    }
    if (next[toKey]) {
      if (type === 'book') next[toKey] = { ...next[toKey], books: [...next[toKey].books, itemId] };
      else next[toKey] = { ...next[toKey], songs: [...next[toKey].songs, itemId] };
    }
    onChange(next);
  };

  const removeItem = (itemId: string, type: 'book' | 'song', fromKey: string) => {
    const next = cleanDistribution(weeks, dist);
    if (type === 'book') next[fromKey] = { ...next[fromKey], books: next[fromKey].books.filter(id => id !== itemId) };
    else next[fromKey] = { ...next[fromKey], songs: next[fromKey].songs.filter(id => id !== itemId) };
    onChange(next);
  };

  const setWeekField = (weekKey: string, patch: Partial<WeekItems>) => {
    const next = cleanDistribution(weeks, dist);
    next[weekKey] = { ...next[weekKey], ...patch };
    onChange(next);
  };

  const autoDistribute = () => {
    const next: WeekDistribution = {};
    weeks.forEach(w => (next[w.key] = { books: [...dist[w.key].books], songs: [...dist[w.key].songs] }));
    const queue: { id: string; type: 'book' | 'song' }[] = [
      ...unassignedBookIds.map(id => ({ id, type: 'book' as const })),
      ...unassignedSongIds.map(id => ({ id, type: 'song' as const })),
    ];
    if (weeks.length === 0) return;
    queue.forEach(({ id, type }, i) => {
      const key = weeks[i % weeks.length].key;
      if (type === 'book') next[key] = { ...next[key], books: [...next[key].books, id] };
      else next[key] = { ...next[key], songs: [...next[key].songs, id] };
    });
    onChange(next);
  };

  if (totalItems === 0) {
    return (
      <Card className="border border-dashed border-muted-foreground/30 bg-muted/20 rounded-2xl">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground">
            No hay libros ni canciones seleccionados en el plan mensual de {monthLabel}.
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1">
            Selecciona libros y canciones en la Planificación Mensual para repartirlos por semanas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden border border-gray-200/70 dark:border-gray-800/70 shadow-sm">
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full bg-indigo-400" />
          <span className="text-sm font-semibold">Libros y canciones por semana · {monthLabel}</span>
          {hasUnassigned && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500 ml-auto" onClick={autoDistribute}>
              <Sparkles className="w-3 h-3 mr-1" />
              Auto-repartir
            </Button>
          )}
        </div>

        {hasUnassigned && (
          <div className="border-2 border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl p-3 space-y-2">
            <p className="text-[10px] font-medium text-amber-600/70">
              Sin asignar — elige una semana para cada elemento
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedBookIds.map(rawId => {
                const book = bookMap.get(rawId);
                if (!book) return null;
                return (
                  <div key={book.id} className="flex items-center gap-1.5 p-1.5 pr-1 rounded-xl bg-white dark:bg-zinc-950 border shadow-sm">
                    <div className="w-5 h-7 rounded overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center">
                      <BookOpen className="w-3 h-3 text-indigo-400/60" />
                    </div>
                    <span className="text-[10px] font-medium max-w-[110px] truncate">{book.title}</span>
                    <div className="flex gap-0.5 ml-1">
                      {weeks.map((w, wi) => (
                        <button
                          key={w.key}
                          onClick={() => moveItem(book.id, 'book', null, w.key)}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap"
                          title={w.label}
                        >
                          Sem {wi + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
              {unassignedSongIds.map(rawId => {
                const song = songMap.get(rawId);
                if (!song) return null;
                return (
                  <div key={song.id} className="flex items-center gap-1 p-1.5 pr-1 rounded-lg bg-white dark:bg-zinc-950 border shadow-sm">
                    {song.instrument === 'piano' ? (
                      <Piano className="h-3 w-3 text-rose-400 shrink-0" />
                    ) : (
                      <Guitar className="h-3 w-3 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[10px] font-medium max-w-[90px] truncate">{song.title}</span>
                    <div className="flex gap-0.5 ml-1">
                      {weeks.map((w, wi) => (
                        <button
                          key={w.key}
                          onClick={() => moveItem(song.id, 'song', null, w.key)}
                          className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap"
                          title={w.label}
                        >
                          Sem {wi + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {weeks.map((w, wi) => {
            const isActive = w.key === activeWeekKey;
            const weekBooks = dist[w.key].books.map(id => bookMap.get(id)).filter(Boolean) as BookDef[];
            const weekSongs = dist[w.key].songs.map(id => songMap.get(id)).filter(Boolean) as SongDef[];
            const prev = wi > 0 ? weeks[wi - 1] : null;
            const next = wi < weeks.length - 1 ? weeks[wi + 1] : null;

            return (
              <div
                key={w.key}
                className={cn(
                  'min-h-[140px] rounded-2xl border-2 p-3 space-y-2 transition-colors',
                  isActive
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-950/20'
                    : 'border-border/40 bg-white/50 dark:bg-zinc-950/50'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn('text-[11px] font-semibold', isActive ? 'text-indigo-600 dark:text-indigo-300' : '')}>
                    Sem {wi + 1} · {w.label}
                  </span>
                  <Badge variant="outline" className="text-[9px] px-1.5">
                    {weekBooks.length + weekSongs.length}
                  </Badge>
                </div>

                {weekBooks.map(book => (
                  <div key={book.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group">
                    <BookOpen className="h-3 w-3 text-indigo-400 shrink-0" />
                    <span className="text-[10px] font-medium flex-1 truncate">{book.title}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {prev && (
                        <button onClick={() => moveItem(book.id, 'book', w.key, prev.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${prev.label}`}>
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                      )}
                      {next && (
                        <button onClick={() => moveItem(book.id, 'book', w.key, next.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${next.label}`}>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => removeItem(book.id, 'book', w.key)} className="text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors" title="Quitar semana">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {weekBooks.length > 0 && (
                  <div className="border-t border-border/40 pt-1.5 space-y-1">
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground">📖 Páginas a leer</span>
                      <Input
                        type="number" min={0}
                        placeholder="0"
                        value={dist[w.key].book_pages ?? ''}
                        onChange={e => setWeekField(w.key, { book_pages: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-6 mt-0.5 text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground">⏱ Min de lectura</span>
                      <Input
                        type="number" min={0}
                        placeholder="0"
                        value={dist[w.key].book_minutes ?? ''}
                        onChange={e => setWeekField(w.key, { book_minutes: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-6 mt-0.5 text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </label>
                  </div>
                )}

                {weekSongs.map(song => (
                  <div key={song.id} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group">
                    {song.instrument === 'piano' ? (
                      <Piano className="h-3 w-3 text-rose-400 shrink-0" />
                    ) : (
                      <Guitar className="h-3 w-3 text-amber-400 shrink-0" />
                    )}
                    <span className="text-[10px] font-medium flex-1 truncate">{song.title}</span>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {prev && (
                        <button onClick={() => moveItem(song.id, 'song', w.key, prev.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${prev.label}`}>
                          <ChevronLeft className="h-3 w-3" />
                        </button>
                      )}
                      {next && (
                        <button onClick={() => moveItem(song.id, 'song', w.key, next.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${next.label}`}>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                      <button onClick={() => removeItem(song.id, 'song', w.key)} className="text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors" title="Quitar semana">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {weekSongs.length > 0 && (
                  <div className="border-t border-border/40 pt-1.5 space-y-1">
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground">🎹 Min de práctica</span>
                      <Input
                        type="number" min={0}
                        placeholder="0"
                        value={dist[w.key].music_minutes ?? ''}
                        onChange={e => setWeekField(w.key, { music_minutes: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="h-6 mt-0.5 text-[10px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[9px] text-muted-foreground">🔎 Qué practicar (sección/parte)</span>
                      <Input
                        type="text"
                        placeholder="Intro, estribillo, compases..."
                        value={dist[w.key].music_focus || ''}
                        onChange={e => setWeekField(w.key, { music_focus: e.target.value })}
                        className="h-6 mt-0.5 text-[10px]"
                      />
                    </label>
                  </div>
                )}

                {weekBooks.length === 0 && weekSongs.length === 0 && (
                  <div className="flex items-center justify-center h-14">
                    <p className="text-[10px] text-muted-foreground/40">Vacío</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex gap-3 text-[10px] text-muted-foreground justify-center">
          <span>📚 {selectedBookIds.length} libros</span>
          <span>🎵 {selectedSongIds.length} canciones</span>
          {hasUnassigned && (
            <span className="text-amber-600 font-medium">⚠️ {unassignedBookIds.length + unassignedSongIds.length} sin asignar</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}