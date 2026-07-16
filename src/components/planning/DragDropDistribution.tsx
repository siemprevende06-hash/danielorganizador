import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Music, Piano, Guitar, GripVertical } from "lucide-react";
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
  const [dragOver, setDragOver] = useState<string | null>(null);

  const monthKeyToIndex = (key: string) => MONTH_KEYS.indexOf(key as typeof MONTH_KEYS[number]);

  const handleDragStart = (e: React.DragEvent, itemId: string, type: "book" | "song", fromMonth: string) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ itemId, type, fromMonth }));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, monthKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(monthKey);
  };

  const handleDragLeave = () => setDragOver(null);

  const handleDrop = (e: React.DragEvent, toMonth: string) => {
    e.preventDefault();
    setDragOver(null);
    try {
      const { itemId, type, fromMonth } = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (fromMonth === toMonth) return;

      const newDist = { ...distribution };
      const from = { ...newDist[fromMonth as keyof Distribution] };
      const to = { ...newDist[toMonth as keyof Distribution] };

      if (type === "book") {
        from.books = from.books.filter(id => id !== itemId);
        to.books = [...to.books, itemId];
      } else {
        from.songs = from.songs.filter(id => id !== itemId);
        to.songs = [...to.songs, itemId];
      }

      newDist[fromMonth as keyof Distribution] = from;
      newDist[toMonth as keyof Distribution] = to;
      onDistributionChange(newDist);
    } catch {}
  };

  const getBook = (id: string) => books.find(b => b.id === id);
  const getSong = (id: string) => songs.find(s => s.id === id);

  const totalItems = MONTH_KEYS.reduce((sum, key) => sum + distribution[key].books.length + distribution[key].songs.length, 0);

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
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full bg-indigo-400" />
        <span className="text-sm font-semibold">Distribución por meses</span>
        <Button variant="ghost" size="sm" className="h-6 text-[10px] text-indigo-500" onClick={onAutoDistribute}>
          Auto-distribuir
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {MONTH_KEYS.map((key, mi) => {
          const month = distribution[key];
          const monthBooks = month.books.map(id => getBook(id)).filter(Boolean) as BookDetail[];
          const monthSongs = month.songs.map(id => getSong(id)).filter(Boolean) as SongDetail[];

          return (
            <div
              key={key}
              onDragOver={e => handleDragOver(e, key)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, key)}
              className={cn(
                "min-h-[200px] rounded-2xl border-2 border-dashed transition-all p-3 space-y-2",
                dragOver === key
                  ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20"
                  : "border-border/40 bg-white/50 dark:bg-zinc-900/50"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">{monthLabels[mi]}</span>
                <Badge variant="outline" className="text-[9px] px-1.5">
                  {monthBooks.length + monthSongs.length} items
                </Badge>
              </div>

              {/* Books */}
              {monthBooks.map(book => (
                <div
                  key={book.id}
                  draggable
                  onDragStart={e => handleDragStart(e, book.id, "book", key)}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-800 border border-border/50 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                >
                  <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                  <div className="w-8 h-11 rounded-md overflow-hidden bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 shrink-0 flex items-center justify-center shadow-sm">
                    {book.cover_image_url ? (
                      <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <BookOpen className="w-4 h-4 text-indigo-400/60" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-medium leading-tight truncate">{book.title}</p>
                    {book.author && <p className="text-[8px] text-muted-foreground truncate">{book.author}</p>}
                  </div>
                </div>
              ))}

              {/* Songs */}
              {monthSongs.map(song => (
                <div
                  key={song.id}
                  draggable
                  onDragStart={e => handleDragStart(e, song.id, "song", key)}
                  className="flex items-center gap-2 p-1.5 px-2 rounded-lg bg-white dark:bg-zinc-800 border border-border/50 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-all group"
                >
                  <GripVertical className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  {song.instrument === "piano" ? (
                    <Piano className="h-3 w-3 text-rose-400 shrink-0" />
                  ) : (
                    <Guitar className="h-3 w-3 text-amber-400 shrink-0" />
                  )}
                  <span className="text-[10px] font-medium truncate">{song.title}</span>
                </div>
              ))}

              {monthBooks.length === 0 && monthSongs.length === 0 && (
                <div className="flex items-center justify-center h-20">
                  <p className="text-[10px] text-muted-foreground/40">Arrastra items aquí</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
