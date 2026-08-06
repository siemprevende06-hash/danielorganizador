import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Piano, Guitar, ChevronRight, ChevronLeft, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookDetail {
  id: string;
  title: string;
  author: string | null;
  cover_image_url: string | null;
}

interface SongDetail {
  id: string;
  title: string;
  artist: string | null;
  instrument: string;
}

interface MonthDistribution {
  books: string[];
  songs: string[];
}

interface Distribution {
  month1: MonthDistribution;
  month2: MonthDistribution;
  month3: MonthDistribution;
}

interface DragDropDistributionProps {
  distribution: Distribution;
  books: BookDetail[];
  songs: SongDetail[];
  monthLabels: string[];
  onDistributionChange: (dist: Distribution) => void;
  onAutoDistribute: () => void;
}

const MONTH_KEYS = ["month1", "month2", "month3"] as const;

export function DragDropDistribution({
  distribution,
  books,
  songs,
  monthLabels,
  onDistributionChange,
  onAutoDistribute,
}: DragDropDistributionProps) {
  const allBookIds = books.map(b => b.id);
  const allSongIds = songs.map(s => s.id);
  const assignedBookIds = new Set(MONTH_KEYS.flatMap(k => distribution[k].books));
  const assignedSongIds = new Set(MONTH_KEYS.flatMap(k => distribution[k].songs));
  const unassignedBooks = books.filter(b => !assignedBookIds.has(b.id));
  const unassignedSongs = songs.filter(s => !assignedSongIds.has(s.id));
  const hasUnassigned = unassignedBooks.length > 0 || unassignedSongs.length > 0;

  const moveItem = (itemId: string, type: "book" | "song", fromMonth: string | null, toMonth: string) => {
    const newDist = MONTH_KEYS.reduce((acc, key) => {
      acc[key] = { books: [...distribution[key].books], songs: [...distribution[key].songs] };
      return acc;
    }, {} as Distribution);

    if (fromMonth) {
      if (type === "book") newDist[fromMonth as keyof Distribution].books = newDist[fromMonth as keyof Distribution].books.filter(id => id !== itemId);
      else newDist[fromMonth as keyof Distribution].songs = newDist[fromMonth as keyof Distribution].songs.filter(id => id !== itemId);
    }

    if (type === "book") newDist[toMonth as keyof Distribution].books.push(itemId);
    else newDist[toMonth as keyof Distribution].songs.push(itemId);

    onDistributionChange(newDist);
  };

  const removeItem = (itemId: string, type: "book" | "song", fromMonth: string) => {
    const newDist = MONTH_KEYS.reduce((acc, key) => {
      acc[key] = { books: [...distribution[key].books], songs: [...distribution[key].songs] };
      return acc;
    }, {} as Distribution);
    if (type === "book") newDist[fromMonth as keyof Distribution].books = newDist[fromMonth as keyof Distribution].books.filter(id => id !== itemId);
    else newDist[fromMonth as keyof Distribution].songs = newDist[fromMonth as keyof Distribution].songs.filter(id => id !== itemId);
    onDistributionChange(newDist);
  };

  const getBook = (id: string) => books.find(b => b.id === id);
  const getSong = (id: string) => songs.find(s => s.id === id);

  const totalItems = allBookIds.length + allSongIds.length;

  if (totalItems === 0) {
    return (
      <Card className="border border-dashed border-muted-foreground/30 bg-muted/20 rounded-2xl">
        <CardContent className="p-6 text-center">
          <p className="text-xs text-muted-foreground">Selecciona libros o canciones arriba para distribuirlos entre los meses</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-indigo-400" />
        <span className="text-sm font-semibold">Distribución por meses</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500" onClick={onAutoDistribute}>
          Auto-distribuir
        </Button>
      </div>

      {/* Unassigned pool */}
      {hasUnassigned && (
        <Card className="border-2 border-dashed border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/10 rounded-2xl">
          <CardContent className="p-3 space-y-2">
            <p className="text-[10px] font-medium text-amber-600/70">Sin asignar — elige un mes para cada elemento</p>
            <div className="flex flex-wrap gap-2">
              {unassignedBooks.map(book => (
                <div key={book.id} className="flex items-center gap-1.5 p-1.5 pr-1 rounded-xl bg-white dark:bg-zinc-950 border shadow-sm">
                  <div className="w-7 h-10 rounded overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-3 h-3 text-indigo-400/60" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium max-w-[100px] truncate">{book.title}</span>
                  <div className="flex gap-0.5 ml-1">
                    {MONTH_KEYS.map((key, mi) => (
                      <button key={key} onClick={() => moveItem(book.id, "book", null, key)}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap">
                        {monthLabels[mi]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {unassignedSongs.map(song => (
                <div key={song.id} className="flex items-center gap-1 p-1.5 pr-1 rounded-lg bg-white dark:bg-zinc-950 border shadow-sm">
                  {song.instrument === "piano" ? <Piano className="h-3 w-3 text-rose-400" /> : <Guitar className="h-3 w-3 text-amber-400" />}
                  <span className="text-[10px] font-medium max-w-[80px] truncate">{song.title}</span>
                  <div className="flex gap-0.5 ml-1">
                    {MONTH_KEYS.map((key, mi) => (
                      <button key={key} onClick={() => moveItem(song.id, "song", null, key)}
                        className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 hover:bg-indigo-200 transition-colors whitespace-nowrap">
                        {monthLabels[mi]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Month columns */}
      <div className="grid grid-cols-3 gap-3">
        {MONTH_KEYS.map((key, mi) => {
          const month = distribution[key];
          const monthBooks = month.books.map(id => getBook(id)).filter(Boolean) as BookDetail[];
          const monthSongs = month.songs.map(id => getSong(id)).filter(Boolean) as SongDetail[];

          const otherMonths = MONTH_KEYS.filter(k => k !== key);

          return (
            <div key={key} className="min-h-[180px] rounded-2xl border-2 border-border/40 bg-white/50 dark:bg-zinc-950/50 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{monthLabels[mi]}</span>
                <Badge variant="outline" className="text-[9px] px-1.5">
                  {monthBooks.length + monthSongs.length} items
                </Badge>
              </div>

              {monthBooks.map(book => (
                <div key={book.id} className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group">
                  <div className="w-8 h-11 rounded-md overflow-hidden bg-gradient-to-br from-indigo-500/20 shrink-0 flex items-center justify-center shadow-sm">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-indigo-400/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium leading-tight truncate">{book.title}</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {otherMonths.map(ok => {
                      const oi = MONTH_KEYS.indexOf(ok);
                      const dir = oi > mi ? "right" : "left";
                      return (
                        <button key={ok} onClick={() => moveItem(book.id, "book", key, ok)}
                          className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${monthLabels[oi]}`}>
                          {dir === "right" ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </button>
                      );
                    })}
                    <button onClick={() => removeItem(book.id, "book", key)}
                      className="text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors" title="Quitar">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {monthSongs.map(song => (
                <div key={song.id} className="flex items-center gap-1.5 p-1.5 px-2 rounded-lg bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group">
                  {song.instrument === "piano" ? <Piano className="h-3 w-3 text-rose-400 shrink-0" /> : <Guitar className="h-3 w-3 text-amber-400 shrink-0" />}
                  <span className="text-[10px] font-medium flex-1 truncate">{song.title}</span>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    {otherMonths.map(ok => {
                      const oi = MONTH_KEYS.indexOf(ok);
                      const dir = oi > mi ? "right" : "left";
                      return (
                        <button key={ok} onClick={() => moveItem(song.id, "song", key, ok)}
                          className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${monthLabels[oi]}`}>
                          {dir === "right" ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </button>
                      );
                    })}
                    <button onClick={() => removeItem(song.id, "song", key)}
                      className="text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors" title="Quitar">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}

              {monthBooks.length === 0 && monthSongs.length === 0 && (
                <div className="flex items-center justify-center h-16">
                  <p className="text-[10px] text-muted-foreground/40">Vacío</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick stats */}
      <div className="flex gap-3 text-[10px] text-muted-foreground justify-center">
        <span>📚 {allBookIds.length} libros</span>
        <span>🎵 {allSongIds.length} canciones</span>
        {hasUnassigned && <span className="text-amber-600 font-medium">⚠️ {unassignedBooks.length + unassignedSongs.length} sin asignar</span>}
      </div>
    </div>
  );
}
