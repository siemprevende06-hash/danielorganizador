import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BookOpen, Piano, Guitar, ChevronRight, ChevronLeft, X, Sparkles, CopyPlus, CalendarRange, Eraser } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

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

export interface DayRange {
  startDay?: string | null;
  endDay?: string | null;
}

export type DayRanges = Record<string, DayRange>;

type WeekItems = {
  books: string[];
  songs: string[];
  book_ranges?: DayRanges;
  song_ranges?: DayRanges;
  book_pages?: number;
  book_minutes?: number;
  music_minutes?: number;
  music_focus?: string;
};
export type WeekDistribution = Record<string, WeekItems>;

const DAY_KEYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

export function weekDates(weekKey: string): Date[] {
  const [y, m, d] = weekKey.split('-').map(Number);
  const start = new Date(y || 1970, (m || 1) - 1, d || 1);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

function dayKeyOf(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function normalizeRange(range: DayRange): DayRange {
  const start = range.startDay || null;
  const end = range.endDay || null;
  if (!start) return {};
  if (!end) return { startDay: start, endDay: null };
  if (end < start) return { startDay: end, endDay: start };
  return { startDay: start, endDay: end };
}

export function formatDayRange(range: DayRange | undefined): string | null {
  if (!range?.startDay) return null;
  const end = range.endDay || range.startDay;
  const startLabel = format(parseISO(range.startDay), 'EEE d', { locale: es });
  const endLabel = format(parseISO(end), 'EEE d', { locale: es });
  return startLabel === endLabel ? startLabel : `${startLabel} \u2192 ${endLabel}`;
}

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
    const prev: any = dist[w.key] || {};
    const books = [...new Set<string>(prev.books || [])];
    const songs = [...new Set<string>(prev.songs || [])];
    out[w.key] = {
      books,
      songs,
      book_ranges: pickRanges(prev.book_ranges, books),
      song_ranges: pickRanges(prev.song_ranges, songs),
      book_pages: prev.book_pages,
      book_minutes: prev.book_minutes,
      music_minutes: prev.music_minutes,
      music_focus: prev.music_focus,
    };
  });
  return out;
}

function pickRanges(source: any, ids: string[]): DayRanges {
  const out: DayRanges = {};
  ids.forEach(id => {
    const r = normalizeRange(source?.[id] || {});
    if (r.startDay) out[id] = r;
  });
  return out;
}

function rangesKeyOf(type: 'book' | 'song'): 'book_ranges' | 'song_ranges' {
  return type === 'book' ? 'book_ranges' : 'song_ranges';
}

function idsKeyOf(type: 'book' | 'song'): 'books' | 'songs' {
  return type === 'book' ? 'books' : 'songs';
}

function withoutItem(week: WeekItems, itemId: string, type: 'book' | 'song'): WeekItems {
  const idsKey = idsKeyOf(type);
  const rKey = rangesKeyOf(type);
  const ranges = { ...(week[rKey] || {}) };
  delete ranges[itemId];
  return { ...week, [idsKey]: week[idsKey].filter(id => id !== itemId), [rKey]: ranges };
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

  const multiWeekCount = [...new Set([...assignedBookIds, ...assignedSongIds])].filter(id => {
    const count = weeks.filter(w => dist[w.key].books.includes(id) || dist[w.key].songs.includes(id)).length;
    return count > 1;
  }).length;

  const totalItems = selectedBookIds.length + selectedSongIds.length;

  const moveItem = (itemId: string, type: 'book' | 'song', fromKey: string | null, toKey: string) => {
    const next = cleanDistribution(weeks, dist);
    const idsKey = idsKeyOf(type);
    if (fromKey && next[fromKey]) next[fromKey] = withoutItem(next[fromKey], itemId, type);
    if (next[toKey]) {
      const ids = next[toKey][idsKey];
      if (!ids.includes(itemId)) next[toKey] = { ...next[toKey], [idsKey]: [...ids, itemId] };
    }
    onChange(next);
  };

  const duplicateItem = (itemId: string, type: 'book' | 'song', fromKey: string, toKey: string) => {
    if (fromKey === toKey) return;
    const next = cleanDistribution(weeks, dist);
    if (!next[toKey]) return;
    const idsKey = idsKeyOf(type);
    const rKey = rangesKeyOf(type);
    if (next[toKey][idsKey].includes(itemId)) return;
    const src = dist[fromKey];
    const srcRange = src?.[rKey]?.[itemId];
    next[toKey] = {
      ...next[toKey],
      [idsKey]: [...next[toKey][idsKey], itemId],
      [rKey]: srcRange ? { ...(next[toKey][rKey] || {}), [itemId]: { ...srcRange } } : next[toKey][rKey],
    };
    onChange(next);
  };

  const removeItem = (itemId: string, type: 'book' | 'song', fromKey: string) => {
    const next = cleanDistribution(weeks, dist);
    if (next[fromKey]) next[fromKey] = withoutItem(next[fromKey], itemId, type);
    onChange(next);
  };

  const setWeekField = (weekKey: string, patch: Partial<WeekItems>) => {
    const next = cleanDistribution(weeks, dist);
    next[weekKey] = { ...next[weekKey], ...patch };
    onChange(next);
  };

  const pickDay = (weekKey: string, itemId: string, type: 'book' | 'song', day: string) => {
    const next = cleanDistribution(weeks, dist);
    const rKey = rangesKeyOf(type);
    const current = next[weekKey][rKey]?.[itemId];
    let range: DayRange;
    if (!current?.startDay) {
      range = { startDay: day, endDay: null };
    } else if (current.endDay || day === current.startDay) {
      range = { startDay: day, endDay: null };
    } else if (day < current.startDay) {
      range = { startDay: day, endDay: current.startDay };
    } else {
      range = { startDay: current.startDay, endDay: day };
    }
    next[weekKey] = { ...next[weekKey], [rKey]: { ...(next[weekKey][rKey] || {}), [itemId]: normalizeRange(range) } };
    onChange(next);
  };

  const clearDayRange = (weekKey: string, itemId: string, type: 'book' | 'song') => {
    const next = cleanDistribution(weeks, dist);
    const rKey = rangesKeyOf(type);
    const ranges = { ...(next[weekKey][rKey] || {}) };
    delete ranges[itemId];
    next[weekKey] = { ...next[weekKey], [rKey]: ranges };
    onChange(next);
  };

  const autoDistribute = () => {
    const next: WeekDistribution = {};
    weeks.forEach(w => (next[w.key] = { ...dist[w.key], books: [...dist[w.key].books], songs: [...dist[w.key].songs] }));
    const queue: { id: string; type: 'book' | 'song' }[] = [
      ...unassignedBookIds.map(id => ({ id, type: 'book' as const })),
      ...unassignedSongIds.map(id => ({ id, type: 'song' as const })),
    ];
    if (weeks.length === 0) return;
    queue.forEach(({ id, type }, i) => {
      const key = weeks[i % weeks.length].key;
      const idsKey = idsKeyOf(type);
      if (next[key][idsKey].includes(id)) return;
      next[key] = { ...next[key], [idsKey]: [...next[key][idsKey], id] };
    });
    onChange(next);
  };

  const daysOfWeek = (weekKey: string) => weekDates(weekKey);

  const renderItemRow = (
    itemId: string,
    type: 'book' | 'song',
    weekKey: string,
    icon: ReactNode,
    tone: string,
    title: string,
    otherWeeks: { prev: WeeklySlot | null; next: WeeklySlot | null },
  ) => {
    const range = dist[weekKey][rangesKeyOf(type)]?.[itemId];
    const rangeLabel = formatDayRange(range);
    const days = daysOfWeek(weekKey);
    return (
      <div key={`${type}-${itemId}`} className="rounded-lg bg-white dark:bg-zinc-950 border border-border/50 shadow-sm group">
        <div className="flex items-center gap-1.5 p-1.5">
          <span className={cn('shrink-0', tone)}>{icon}</span>
          <span className="text-[10px] font-medium flex-1 truncate">{title}</span>
          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
            {otherWeeks.prev && (
              <button onClick={() => moveItem(itemId, type, weekKey, otherWeeks.prev.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${otherWeeks.prev.label}`}>
                <ChevronLeft className="h-3 w-3" />
              </button>
            )}
            {otherWeeks.next && (
              <button onClick={() => moveItem(itemId, type, weekKey, otherWeeks.next.key)} className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title={`Mover a ${otherWeeks.next.label}`}>
                <ChevronRight className="h-3 w-3" />
              </button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-[9px] p-0.5 rounded hover:bg-muted transition-colors" title="También en otra semana">
                  <CopyPlus className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="text-[10px]">También en estas semanas</DropdownMenuLabel>
                {weeks.map((w, wi) => (
                  <DropdownMenuItem
                    key={w.key}
                    disabled={w.key === weekKey}
                    onSelect={e => { e.preventDefault(); duplicateItem(itemId, type, weekKey, w.key); }}
                    className="text-[10px]"
                  >
                    Sem {wi + 1} · {w.label}
                    {w.key === weekKey && <span className="ml-auto text-[9px] text-muted-foreground">actual</span>}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <button onClick={() => removeItem(itemId, type, weekKey)} className="text-[9px] p-0.5 rounded hover:bg-red-100 hover:text-red-500 transition-colors" title="Quitar de esta semana">
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1 px-1.5 pb-1.5 flex-wrap">
          {days.map((d, di) => {
            const key = dayKeyOf(d);
            const isStart = range?.startDay === key;
            const isEnd = (range?.endDay || range?.startDay) === key;
            const inRange = !!range?.startDay && key >= range.startDay! && key <= (range.endDay || range.startDay)!;
            return (
              <button
                key={key}
                onClick={() => pickDay(weekKey, itemId, type, key)}
                title={`${format(d, 'EEEE d MMMM', { locale: es })}${range?.startDay ? ` · toca de nuevo para marcar el final` : ''}`}
                className={cn(
                  'text-[8px] w-[13px] h-[13px] rounded-[3px] border transition-colors font-semibold leading-none',
                  isStart || isEnd
                    ? 'bg-indigo-500 text-white border-indigo-500'
                    : inRange
                      ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                      : 'bg-muted/40 text-muted-foreground/70 border-transparent hover:bg-muted',
                )}
              >
                {DAY_KEYS[di]}
              </button>
            );
          })}
          {rangeLabel ? (
            <span className="text-[9px] text-indigo-600 dark:text-indigo-300 font-medium ml-0.5 inline-flex items-center gap-0.5">
              <CalendarRange className="h-2.5 w-2.5" />{rangeLabel}
            </span>
          ) : (
            <span className="text-[9px] text-muted-foreground/50">día inicio → día fin</span>
          )}
          {range?.startDay && (
            <button onClick={() => clearDayRange(weekKey, itemId, type)} className="ml-auto text-muted-foreground/60 hover:text-red-500 transition-colors" title="Quitar rango de días">
              <Eraser className="h-2.5 w-2.5" />
            </button>
          )}
        </div>
      </div>
    );
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

        <p className="text-[9px] text-muted-foreground/70 flex items-center gap-1">
          <CalendarRange className="h-3 w-3 shrink-0" />
          Un libro o canción puede estar en varias semanas: usa <span className="font-semibold">+&nbsp;copiar</span> en su tarjeta y marca el día de inicio y el día final (de → hasta).
        </p>

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
                  renderItemRow(
                    book.id,
                    'book',
                    w.key,
                    <BookOpen className="h-3 w-3 text-indigo-400" />,
                    'text-indigo-400',
                    book.title,
                    { prev, next },
                  )
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
                  renderItemRow(
                    song.id,
                    'song',
                    w.key,
                    song.instrument === 'piano'
                      ? <Piano className="h-3 w-3 text-rose-400" />
                      : <Guitar className="h-3 w-3 text-amber-400" />,
                    song.instrument === 'piano' ? 'text-rose-400' : 'text-amber-400',
                    song.title,
                    { prev, next },
                  )
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

        <div className="flex gap-3 text-[10px] text-muted-foreground justify-center flex-wrap">
          <span>📚 {selectedBookIds.length} libros</span>
          <span>🎵 {selectedSongIds.length} canciones</span>
          {multiWeekCount > 0 && (
            <span className="text-indigo-500 font-medium">🔁 {multiWeekCount} en varias semanas</span>
          )}
          {hasUnassigned && (
            <span className="text-amber-600 font-medium">⚠️ {unassignedBookIds.length + unassignedSongIds.length} sin asignar</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}