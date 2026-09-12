import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Book } from '@/hooks/useReadingLibrary';
import {
  useBookTeachings,
  BookChecklist,
  BookChecklistKind,
  TeachingItem,
} from '@/hooks/useBookTeachings';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  BookOpen, Brain, Zap, Plus, Trash2, ChevronDown, CheckCircle2, ListTodo,
  PencilLine, Check, X, Import, Search, CalendarDays, Layers, PartyPopper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ACTIONS_MARKER = /^##[^\n]*acciones\s+pr[aá]?cticas?.*$/im;

function extractBullets(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => /^[-*•]\s+/.test(l) || /^\d+[.)]\s+/.test(l))
    .map(l => l.replace(/^[-*•]\s+|^\d+[.)]\s+/, '').trim())
    .filter(Boolean);
}

export function parseBookNotes(notes: string | null): { teachings: string[]; actions: string[] } {
  const raw = (notes || '').trim();
  const teachings: string[] = [];
  const actions: string[] = [];
  if (!raw) return { teachings, actions };
  const markerIdx = raw.search(ACTIONS_MARKER);
  if (markerIdx >= 0) {
    teachings.push(...extractBullets(raw.slice(0, markerIdx)));
    actions.push(...extractBullets(raw.slice(markerIdx).replace(ACTIONS_MARKER, '')));
  } else {
    teachings.push(...extractBullets(raw));
  }
  return { teachings, actions };
}

const formatDate = (d: string | null) => {
  if (!d) return null;
  try { return format(new Date(d), "d MMM yyyy", { locale: es }); } catch { return null; }
};

function Section({ kind, bookId, list }: { kind: BookChecklistKind; bookId: string; list: TeachingItem[] }) {
  const { addItem, deleteItem, toggleItem, editItem } = useBookTeachings();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  const isTeachings = kind === 'teachings';
  const Icon = isTeachings ? Brain : Zap;

  const handleAdd = () => {
    if (!draft.trim()) return;
    addItem(bookId, kind, draft);
    setDraft('');
  };

  return (
    <div className="rounded-lg border bg-muted/30">
      <div className="flex items-center gap-2 px-3 py-2 border-b">
        <Icon className={cn("w-4 h-4", isTeachings ? "text-primary" : "text-green-600 dark:text-green-400")} />
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-none">
            {isTeachings ? 'Enseñanzas a tener en cuenta' : 'Acciones a aplicar'}
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {list.filter(i => i.done).length}/{list.length} {isTeachings ? 'interiorizadas' : 'aplicadas'}
          </p>
        </div>
      </div>

      <div className="p-2 space-y-1">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground px-2 py-1">
            {isTeachings ? 'Aún sin enseñanzas anotadas.' : 'Aún sin acciones anotadas.'}
          </p>
        )}
        {list.map(item => (
          <div key={item.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted group">
            <Checkbox
              checked={item.done}
              onCheckedChange={() => toggleItem(bookId, kind, item.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="flex items-center gap-1.5">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        editItem(bookId, kind, item.id, editingText);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                    className="h-7 text-sm"
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => { editItem(bookId, kind, item.id, editingText); setEditingId(null); }}>
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p className={cn("text-sm leading-snug", item.done && "line-through text-muted-foreground")}>
                  {item.text}
                </p>
              )}
              {item.last_applied_at && (
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                  <CalendarDays className="w-3 h-3" />
                  {item.done ? 'Aplicada' : 'Última vez'}: {formatDate(item.last_applied_at)}
                </p>
              )}
            </div>
            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { setEditingId(item.id); setEditingText(item.text); }}>
                <PencilLine className="w-3 h-3" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => deleteItem(bookId, kind, item.id)}>
                <Trash2 className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          </div>
        ))}

        <div className="flex items-center gap-1.5 px-2 pt-1">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            placeholder={isTeachings ? 'Nueva enseñanza...' : 'Nueva acción...'}
            className="h-8 text-sm"
          />
          <Button size="icon" variant="outline" className="h-8 w-8 shrink-0" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddBookDialog({ books, existing, onAdd }: { books: Book[]; existing: Set<string>; onAdd: (id: string) => void }) {
  const available = books.filter(b => !existing.has(b.id));
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const confirm = () => {
    if (!selected) { toast.error('Elige un libro'); return; }
    onAdd(selected);
    setSelected(null);
    setOpen(false);
    toast.success('Libro añadido al checklist');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="w-4 h-4 mr-1.5" />Añadir libro</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Añadir libro al checklist</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todos tus libros ya tienen checklist.</p>
          ) : (
            <>
              <Select value={selected || undefined} onValueChange={setSelected}>
                <SelectTrigger><SelectValue placeholder="Elige un libro..." /></SelectTrigger>
                <SelectContent>
                  {available.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.title}{b.author ? ` — ${b.author}` : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="w-full" onClick={confirm} disabled={!selected}>Añadir</Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function BookTeachingsTab({ books }: { books: Book[] }) {
  const { store, getBook, addBook, removeBook, importFromNotes, toggleItem, deleteItem } = useBookTeachings();
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'books' | 'pending'>('books');

  const bookById = useMemo(() => {
    const map = new Map<string, Book>();
    books.forEach(b => map.set(b.id, b));
    return map;
  }, [books]);

  const entries = useMemo(() => {
    return Object.entries(store)
      .map(([bookId, checklist]) => ({ bookId, checklist }))
      .sort((a, b) => (bookById.get(a.bookId)?.title || '').localeCompare(bookById.get(b.bookId)?.title || ''));
  }, [store, bookById]);

  const totals = useMemo(() => {
    let teachings = 0, actions = 0, applied = 0;
    for (const [, cl] of Object.entries(store)) {
      teachings += cl.teachings.length;
      actions += cl.actions.length;
      applied += cl.teachings.filter(i => i.done).length + cl.actions.filter(i => i.done).length;
    }
    const total = teachings + actions;
    return { teachings, actions, applied, total, pct: total ? Math.round((applied / total) * 100) : 0 };
  }, [store]);

  const searchLower = search.trim().toLowerCase();

  const filteredEntries = entries.filter(({ bookId, checklist }) => {
    if (!searchLower) return true;
    const bookTitle = bookById.get(bookId)?.title?.toLowerCase() || '';
    const texts = [
      ...checklist.teachings.map(i => i.text),
      ...checklist.actions.map(i => i.text),
    ].join(' ').toLowerCase();
    return bookTitle.includes(searchLower) || texts.includes(searchLower);
  });

  const pendingItems = useMemo(() => {
    const rows: { bookId: string; kind: BookChecklistKind; item: TeachingItem }[] = [];
    for (const [bookId, cl] of Object.entries(store)) {
      for (const kind of ['teachings', 'actions'] as BookChecklistKind[]) {
        for (const item of cl[kind]) {
          if (!item.done) rows.push({ bookId, kind, item });
        }
      }
    }
    const q = searchLower;
    return rows.filter(r => {
      if (!q) return true;
      const bookTitle = bookById.get(r.bookId)?.title?.toLowerCase() || '';
      return bookTitle.includes(q) || r.item.text.toLowerCase().includes(q);
    });
  }, [store, searchLower, bookById]);

  const renderItem = (row: { bookId: string; kind: BookChecklistKind; item: TeachingItem }) => {
    return (
      <div key={row.item.id} className="flex items-start gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
        <Checkbox
          checked={row.item.done}
          onCheckedChange={() => toggleItem(row.bookId, row.kind, row.item.id)}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-snug">{row.item.text}</p>
          {formatDate(row.item.last_applied_at) && (
            <p className="text-[11px] text-muted-foreground">Última vez: {formatDate(row.item.last_applied_at)}</p>
          )}
        </div>
        <Badge variant={row.kind === 'teachings' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
          {row.kind === 'teachings' ? 'Enseñanza' : 'Acción'}
        </Badge>
        <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => deleteItem(row.bookId, row.kind, row.item.id)}>
          <Trash2 className="w-3 h-3 text-destructive" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="text-center"><p className="text-2xl font-bold">{entries.length}</p><p className="text-xs text-muted-foreground">Libros</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{totals.teachings}</p><p className="text-xs text-muted-foreground">Enseñanzas</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{totals.actions}</p><p className="text-xs text-muted-foreground">Acciones</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-green-600 dark:text-green-400">{totals.applied}</p><p className="text-xs text-muted-foreground">Aplicadas</p></div>
            </div>
            {totals.total > 0 && (
              <div className="w-40">
                <p className="text-xs text-muted-foreground mb-1 text-right">{totals.pct}% aplicado</p>
                <Progress value={totals.pct} className="h-2" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Controles */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative w-full max-w-xs">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar libro o enseñanza..."
            className="pl-8 h-9"
          />
        </div>
        <AddBookDialog books={books} existing={new Set(Object.keys(store))} onAdd={addBook} />
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
          <Layers className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="font-medium text-foreground">Aún no tienes checklists</p>
          <p className="text-sm mt-1 mb-4">Añade un libro y anota qué enseñanzas y acciones aplicar en tu día a día.</p>
          <AddBookDialog books={books} existing={new Set(Object.keys(store))} onAdd={addBook} />
        </div>
      ) : (
        <Tabs value={view} onValueChange={(v) => setView(v as any)}>
          <TabsList>
            <TabsTrigger value="books"><BookOpen className="w-3.5 h-3.5 mr-1.5" />Por libro</TabsTrigger>
            <TabsTrigger value="pending"><ListTodo className="w-3.5 h-3.5 mr-1.5" />Pendientes ({pendingItems.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="books" className="mt-4 space-y-3">
            {filteredEntries.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">Sin resultados.</p>
            )}
            {filteredEntries.map(({ bookId, checklist }) => (
              <BookRow
                key={bookId}
                bookId={bookId}
                book={bookById.get(bookId)}
                checklist={checklist}
                onRemove={() => removeBook(bookId)}
                onImport={(teach, act) => { importFromNotes(bookId, teach, act); toast.success('Enseñanzas y acciones importadas del contenido del libro'); }}
              />
            ))}
          </TabsContent>

          <TabsContent value="pending" className="mt-4">
            {pendingItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed rounded-xl">
                <PartyPopper className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-foreground">¡Todo aplicado!</p>
                <p className="text-sm mt-1">Has aplicado todas las enseñanzas y acciones.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Marca lo que apliques en tu día y se moverá a "aplicadas". 🏷️ Cada vez que lo marques se actualiza la fecha.</p>
                {[...new Set(pendingItems.map(p => p.bookId))].map(bookId => {
                  const book = bookById.get(bookId);
                  const rows = pendingItems.filter(p => p.bookId === bookId);
                  return (
                    <Card key={bookId}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          {book?.cover_image_url ? (
                            <img src={book.cover_image_url} alt={book.title} className="w-7 h-10 object-cover rounded" />
                          ) : (
                            <div className="w-7 h-10 bg-muted rounded flex items-center justify-center">
                              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{book?.title || 'Libro no disponible'}</p>
                            <p className="text-[11px] text-muted-foreground">{rows.length} pendientes</p>
                          </div>
                        </div>
                        {rows.map(renderItem)}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function BookRow({
  bookId, book, checklist, onRemove, onImport,
}: {
  bookId: string;
  book: Book | undefined;
  checklist: BookChecklist;
  onRemove: () => void;
  onImport: (teachings: string[], actions: string[]) => void;
}) {
  const [open, setOpen] = useState(true);
  const total = checklist.teachings.length + checklist.actions.length;
  const applied = checklist.teachings.filter(i => i.done).length + checklist.actions.filter(i => i.done).length;
  const pct = total ? Math.round((applied / total) * 100) : 0;
  const canImport = total === 0;
  const parsed = useMemo(() => parseBookNotes(book?.notes || null), [book?.notes]);
  const hasNotesBullets = parsed.teachings.length > 0 || parsed.actions.length > 0;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <Card className={cn("transition-colors", applied === total && total > 0 && "border-green-600/40")}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center gap-3 p-3 cursor-pointer select-none">
            {book?.cover_image_url ? (
              <img src={book.cover_image_url} alt={book.title} className="w-9 h-13 object-cover rounded shrink-0" style={{ height: 52 }} />
            ) : (
              <div className="w-9 bg-muted rounded flex items-center justify-center shrink-0" style={{ height: 52 }}>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{book?.title || 'Libro no disponible'}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {book ? (book.author || 'Sin autor') : 'Ya no está en tu biblioteca'}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {total > 0 && (
                <div className="hidden sm:block w-28">
                  <div className="flex justify-between text-[11px] text-muted-foreground mb-0.5">
                    <span>{applied}/{total}</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              )}
              <Badge variant={applied === total && total > 0 ? 'default' : 'secondary'} className="text-[10px]">
                {total === 0 ? 'Vacío' : applied === total ? 'Completo ✓' : `${applied}/${total}`}
              </Badge>
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {!book && (
              <p className="text-xs text-amber-600">Este libro ya no existe en tu biblioteca.</p>
            )}
            {canImport && hasNotesBullets && (
              <Button size="sm" variant="outline" className="text-xs w-full" onClick={() => onImport(parsed.teachings, parsed.actions)}>
                <Import className="w-3.5 h-3.5 mr-1.5" />
                Importar del contenido guardado ({parsed.teachings.length} enseñanzas, {parsed.actions.length} acciones)
              </Button>
            )}
            <Section kind="teachings" bookId={bookId} list={checklist.teachings} />
            <Section kind="actions" bookId={bookId} list={checklist.actions} />

            <div className="flex justify-end pt-1">
              <Button size="sm" variant="ghost" className="text-xs text-destructive" onClick={() => {
                if (confirm(`¿Eliminar el checklist de "${book?.title || 'este libro'}"?`)) onRemove();
              }}>
                <Trash2 className="w-3 h-3 mr-1.5" />Quitar checklist
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}