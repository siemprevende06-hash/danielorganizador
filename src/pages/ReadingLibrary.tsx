import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useReadingLibrary, Book } from '@/hooks/useReadingLibrary';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Plus, Star, BookMarked, Library, Trash2, Upload, Calendar, ChevronRight, Clock, TrendingUp, TrendingDown, Edit2, LayoutGrid, List, GalleryHorizontal, StickyNote, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, addMonths, startOfWeek, endOfWeek, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ReadingLibrary() {
  const {
    books, loading, addBook, updateBook, startReading, finishBook,
    updateProgress, deleteBook, getBooksByStatus, getCurrentlyReading, getStats, refetch
  } = useReadingLibrary();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [booksPerMonth, setBooksPerMonth] = useState(2);
  const [historyView, setHistoryView] = useState<'grid' | 'list' | 'shelf'>('grid');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [notesOpen, setNotesOpen] = useState(false);
  const [editingNotes, setEditingNotes] = useState('');
  const [searchCompleted, setSearchCompleted] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'rating' | 'title'>('recent');
  const [newBook, setNewBook] = useState({
    title: '', author: '', pages_total: '', genre: '', cover_image_url: '', status: 'to_read' as string,
  });

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      const { data } = await supabase.from('app_settings').select('*').eq('setting_key', 'books_per_month').maybeSingle();
      if (data) setBooksPerMonth((data.setting_value as any)?.value || 2);
    };
    loadSettings();
  }, []);

  const handleImageUpload = async (file: File, bookId?: string) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `book-${bookId || Date.now()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('user-images').upload(`books/${fileName}`, file, { upsert: true });
    if (error) { console.error('Upload error:', error); return null; }
    const { data: { publicUrl } } = supabase.storage.from('user-images').getPublicUrl(`books/${fileName}`);
    return publicUrl;
  };

  const handleAddBook = async () => {
    if (!newBook.title) return;
    await addBook({
      title: newBook.title, author: newBook.author || null,
      pages_total: newBook.pages_total ? parseInt(newBook.pages_total) : null,
      genre: newBook.genre || null, cover_image_url: newBook.cover_image_url || null,
      status: newBook.status as any,
    });
    setNewBook({ title: '', author: '', pages_total: '', genre: '', cover_image_url: '', status: 'to_read' });
    setDialogOpen(false);
  };

  const openEditDialog = (book: Book) => {
    setEditingBook(book);
    setEditDialogOpen(true);
  };

  const handleEditBook = async () => {
    if (!editingBook) return;
    await updateBook(editingBook.id, {
      title: editingBook.title, author: editingBook.author,
      pages_total: editingBook.pages_total, genre: editingBook.genre,
      cover_image_url: editingBook.cover_image_url, notes: editingBook.notes,
    });
    setEditDialogOpen(false);
    setEditingBook(null);
  };

  const currentlyReading = getCurrentlyReading();
  const stats = getStats();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Monthly books: books finished this month OR currently reading
  const booksCompletedThisMonth = books.filter(b =>
    b.status === 'completed' && b.finish_date &&
    new Date(b.finish_date) >= monthStart && new Date(b.finish_date) <= monthEnd
  );
  const booksReadingNow = getBooksByStatus('reading');
  const monthlyProgress = booksCompletedThisMonth.length;
  const monthlyOnTrack = monthlyProgress >= Math.floor(booksPerMonth * (now.getDate() / (differenceInDays(monthEnd, monthStart) + 1)));

  // 3-month timeline
  const timeline = [0, 1, 2].map(offset => {
    const month = addMonths(now, offset);
    const mStart = startOfMonth(month);
    const mEnd = endOfMonth(month);
    const assigned = books.filter(b => {
      if (b.status === 'completed' && b.finish_date) {
        const d = new Date(b.finish_date);
        return d >= mStart && d <= mEnd;
      }
      if (offset === 0 && b.status === 'reading') return true;
      return false;
    });
    return { month, assigned, target: booksPerMonth };
  });

  // Daily pages calculation
  const daysLeftInMonth = differenceInDays(monthEnd, now) + 1;
  const currentBook = getCurrentlyReading();
  const pagesRemaining = currentBook ? (currentBook.pages_total || 0) - currentBook.pages_read : 0;
  const dailyPages = daysLeftInMonth > 0 ? Math.ceil(pagesRemaining / daysLeftInMonth) : 0;

  const renderStars = (rating: number | null, onRate?: (r: number) => void) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star key={star}
          className={cn("w-4 h-4 cursor-pointer transition-colors", star <= (rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-400")}
          onClick={() => onRate?.(star)}
        />
      ))}
    </div>
  );

  const BookCard = ({ book }: { book: Book }) => {
    const progressPercent = book.pages_total ? Math.round((book.pages_read / book.pages_total) * 100) : 0;
    return (
      <Card className="overflow-hidden group">
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
          {book.cover_image_url ? (
            <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
          ) : (
            <BookOpen className="w-12 h-12 text-primary/40" />
          )}
          <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <Upload className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const url = await handleImageUpload(file, book.id);
                if (url) await updateBook(book.id, { cover_image_url: url });
              }
            }} />
          </label>
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{book.title}</h3>
          {book.author && <p className="text-xs text-muted-foreground">{book.author}</p>}
          {book.status === 'reading' && book.pages_total && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground">{book.pages_read}/{book.pages_total} págs</p>
            </div>
          )}
          {book.status === 'completed' && renderStars(book.rating, (r) => updateBook(book.id, { rating: r }))}
          <div className="flex gap-1 pt-1">
            {book.status === 'to_read' && (
              <Button size="sm" variant="outline" className="flex-1 text-xs h-7" onClick={() => startReading(book.id)}>Empezar</Button>
            )}
            {book.status === 'reading' && (
              <Button size="sm" variant="default" className="flex-1 text-xs h-7" onClick={() => finishBook(book.id, 4)}>Terminar</Button>
            )}
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => openEditDialog(book)}>
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => deleteBook(book.id)}>
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-24">
      <div className="animate-pulse space-y-4"><div className="h-8 bg-muted rounded w-1/3" /><div className="h-64 bg-muted rounded" /></div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">📚 Mi Biblioteca</h1>
          <p className="text-muted-foreground">Gestiona tus lecturas pasadas, presentes y futuras</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Agregar Libro</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Agregar Nuevo Libro</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><label className="text-sm font-medium">Título</label><Input placeholder="Título" value={newBook.title} onChange={(e) => setNewBook(p => ({...p, title: e.target.value}))} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Autor</label><Input placeholder="Autor" value={newBook.author} onChange={(e) => setNewBook(p => ({...p, author: e.target.value}))} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm font-medium">Páginas</label><Input type="number" placeholder="320" value={newBook.pages_total} onChange={(e) => setNewBook(p => ({...p, pages_total: e.target.value}))} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Género</label><Input placeholder="Género" value={newBook.genre} onChange={(e) => setNewBook(p => ({...p, genre: e.target.value}))} className="mt-1" /></div>
              </div>
              <div>
                <label className="text-sm font-medium">Portada</label>
                <div className="mt-1 flex items-center gap-3">
                  {newBook.cover_image_url ? (
                    <img src={newBook.cover_image_url} alt="Portada" className="w-16 h-24 object-cover rounded border" />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded border flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="w-3 h-3 mr-1.5" />Subir imagen</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file);
                        if (url) setNewBook(p => ({ ...p, cover_image_url: url }));
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Estado</label>
                <Select value={newBook.status} onValueChange={(v) => setNewBook(p => ({...p, status: v}))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_read">Por Leer</SelectItem>
                    <SelectItem value="reading">Leyendo</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddBook} className="w-full">Agregar Libro</Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Libro</DialogTitle></DialogHeader>
          {editingBook && (
            <div className="space-y-4 pt-4">
              <div><label className="text-sm font-medium">Título</label><Input value={editingBook.title} onChange={(e) => setEditingBook({...editingBook, title: e.target.value})} className="mt-1" /></div>
              <div><label className="text-sm font-medium">Autor</label><Input value={editingBook.author || ''} onChange={(e) => setEditingBook({...editingBook, author: e.target.value})} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm font-medium">Páginas totales</label><Input type="number" value={editingBook.pages_total || ''} onChange={(e) => setEditingBook({...editingBook, pages_total: parseInt(e.target.value) || null})} className="mt-1" /></div>
                <div><label className="text-sm font-medium">Páginas leídas</label><Input type="number" value={editingBook.pages_read} onChange={(e) => setEditingBook({...editingBook, pages_read: parseInt(e.target.value) || 0})} className="mt-1" /></div>
              </div>
              <div>
                <label className="text-sm font-medium">Portada</label>
                <div className="mt-1 flex items-center gap-3">
                  {editingBook.cover_image_url ? (
                    <img src={editingBook.cover_image_url} alt="Portada" className="w-16 h-24 object-cover rounded border" />
                  ) : (
                    <div className="w-16 h-24 bg-muted rounded border flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <label className="cursor-pointer">
                    <Button variant="outline" size="sm" asChild>
                      <span><Upload className="w-3 h-3 mr-1.5" />Subir imagen</span>
                    </Button>
                    <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await handleImageUpload(file, editingBook.id);
                        if (url) setEditingBook({ ...editingBook, cover_image_url: url });
                      }
                    }} />
                  </label>
                </div>
              </div>
              <div><label className="text-sm font-medium">Notas</label><Textarea value={editingBook.notes || ''} onChange={(e) => setEditingBook({...editingBook, notes: e.target.value})} className="mt-1" /></div>
              <Button onClick={handleEditBook} className="w-full">Guardar Cambios</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Stats Overview */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="text-center"><p className="text-2xl font-bold">{stats.totalBooks}</p><p className="text-xs text-muted-foreground">Leídos</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{stats.thisYearBooks}</p><p className="text-xs text-muted-foreground">Este año</p></div>
              <div className="text-center"><p className="text-2xl font-bold">{booksPerMonth * 12}</p><p className="text-xs text-muted-foreground">Meta anual</p></div>
            </div>
            <div className="text-right">
              <p className="text-sm">{stats.totalPages.toLocaleString()} páginas leídas</p>
              <p className="text-xs text-muted-foreground">~{stats.estimatedHours}h de lectura</p>
            </div>
          </div>
          <Progress value={(stats.thisYearBooks / (booksPerMonth * 12)) * 100} className="h-2 mt-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="monthly">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="monthly">📅 Del Mes</TabsTrigger>
          <TabsTrigger value="history">📖 Leídos</TabsTrigger>
          <TabsTrigger value="future">📋 Próximas</TabsTrigger>
          <TabsTrigger value="timeline">🗓️ Cronología</TabsTrigger>
        </TabsList>

        {/* Monthly Goals */}
        <TabsContent value="monthly" className="space-y-4 mt-4">
          <Card className={cn("border-l-4", monthlyOnTrack ? "border-l-green-500" : "border-l-yellow-500")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                Objetivo del Mes: {booksPerMonth} libros
                <Badge variant={monthlyOnTrack ? "default" : "secondary"} className="ml-auto">
                  {monthlyOnTrack ? <><TrendingUp className="w-3 h-3 mr-1" />Al día</> : <><TrendingDown className="w-3 h-3 mr-1" />Atrasado</>}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Progress value={(monthlyProgress / booksPerMonth) * 100} className="h-3 mb-2" />
              <p className="text-sm text-muted-foreground">{monthlyProgress}/{booksPerMonth} completados este mes</p>
            </CardContent>
          </Card>

          {currentBook && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <BookMarked className="w-4 h-4" />Leyendo Ahora
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {currentBook.cover_image_url ? <img src={currentBook.cover_image_url} alt={currentBook.title} className="w-full h-full object-cover" /> : <BookOpen className="w-8 h-8 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-medium">{currentBook.title}</h3>
                    {currentBook.author && <p className="text-sm text-muted-foreground">{currentBook.author}</p>}
                    {currentBook.pages_total && (
                      <>
                        <Progress value={(currentBook.pages_read / currentBook.pages_total) * 100} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Pág {currentBook.pages_read}/{currentBook.pages_total}</span>
                          <span className="font-medium text-foreground">📄 {dailyPages} págs/día necesarias</span>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2">
                      <Input type="number" placeholder="Página actual" className="w-28 h-8 text-xs"
                        onBlur={(e) => { if (e.target.value) updateProgress(currentBook.id, parseInt(e.target.value)); }}
                      />
                      <Button size="sm" variant="default" onClick={() => finishBook(currentBook.id, 4)}>Terminé</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {booksReadingNow.map(book => <BookCard key={book.id} book={book} />)}
          </div>
        </TabsContent>

        {/* History - Enhanced */}
        <TabsContent value="history" className="mt-4 space-y-4">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Input
              placeholder="Buscar libro leído..."
              value={searchCompleted}
              onChange={(e) => setSearchCompleted(e.target.value)}
              className="max-w-xs h-9"
            />
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                <SelectTrigger className="w-[140px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Más recientes</SelectItem>
                  <SelectItem value="rating">Mejor calificados</SelectItem>
                  <SelectItem value="title">Alfabético</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex border rounded-md overflow-hidden">
                <Button size="sm" variant={historyView === 'grid' ? 'default' : 'ghost'} className="h-9 rounded-none" onClick={() => setHistoryView('grid')}>
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button size="sm" variant={historyView === 'list' ? 'default' : 'ghost'} className="h-9 rounded-none" onClick={() => setHistoryView('list')}>
                  <List className="w-4 h-4" />
                </Button>
                <Button size="sm" variant={historyView === 'shelf' ? 'default' : 'ghost'} className="h-9 rounded-none" onClick={() => setHistoryView('shelf')}>
                  <GalleryHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {(() => {
            let completed = getBooksByStatus('completed');
            if (searchCompleted) {
              const q = searchCompleted.toLowerCase();
              completed = completed.filter(b => b.title.toLowerCase().includes(q) || b.author?.toLowerCase().includes(q));
            }
            if (sortBy === 'rating') completed = [...completed].sort((a, b) => (b.rating || 0) - (a.rating || 0));
            else if (sortBy === 'title') completed = [...completed].sort((a, b) => a.title.localeCompare(b.title));
            // 'recent' is default order from DB

            if (completed.length === 0) {
              return (
                <div className="text-center py-12 text-muted-foreground">
                  <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>{searchCompleted ? 'No se encontraron libros' : 'Aún no has completado ningún libro'}</p>
                </div>
              );
            }

            // Grid view
            if (historyView === 'grid') {
              return (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {completed.map(book => (
                    <Card key={book.id} className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all group" onClick={() => { setSelectedBook(book); setEditingNotes(book.notes || ''); setNotesOpen(true); }}>
                      <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                        {book.cover_image_url ? (
                          <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-12 h-12 text-primary/40" />
                        )}
                        {book.notes && (
                          <div className="absolute top-2 right-2 bg-background/90 rounded-full p-1">
                            <StickyNote className="w-3 h-3 text-primary" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-3 space-y-1.5">
                        <h3 className="font-medium text-sm line-clamp-2">{book.title}</h3>
                        {book.author && <p className="text-xs text-muted-foreground">{book.author}</p>}
                        <div className="flex items-center justify-between">
                          {renderStars(book.rating, (r) => { updateBook(book.id, { rating: r }); })}
                        </div>
                        {book.finish_date && (
                          <p className="text-[10px] text-muted-foreground">{format(new Date(book.finish_date), "d MMM yyyy", { locale: es })}</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }

            // List view
            if (historyView === 'list') {
              return (
                <div className="space-y-2">
                  {completed.map(book => (
                    <Card key={book.id} className="cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all" onClick={() => { setSelectedBook(book); setEditingNotes(book.notes || ''); setNotesOpen(true); }}>
                      <CardContent className="p-3 flex items-center gap-4">
                        <div className="w-12 h-16 bg-muted rounded flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {book.cover_image_url ? (
                            <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <BookOpen className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-sm truncate">{book.title}</h3>
                          <p className="text-xs text-muted-foreground">{book.author || 'Sin autor'}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {renderStars(book.rating, (r) => { updateBook(book.id, { rating: r }); })}
                            {book.pages_total && <span className="text-xs text-muted-foreground">{book.pages_total} págs</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          {book.finish_date && (
                            <p className="text-xs text-muted-foreground">{format(new Date(book.finish_date), "d MMM yyyy", { locale: es })}</p>
                          )}
                          {book.genre && <Badge variant="outline" className="text-[10px] mt-1">{book.genre}</Badge>}
                          {book.notes && <StickyNote className="w-3 h-3 text-primary ml-auto mt-1" />}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              );
            }

            // Shelf view
            return (
              <div className="bg-gradient-to-b from-amber-950/10 to-amber-900/5 rounded-xl p-6 border border-border">
                <div className="flex flex-wrap gap-3 justify-center">
                  {completed.map(book => (
                    <div key={book.id} className="relative group cursor-pointer" onClick={() => { setSelectedBook(book); setEditingNotes(book.notes || ''); setNotesOpen(true); }}>
                      <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-sm shadow-md overflow-hidden border border-border hover:scale-110 hover:-translate-y-2 transition-all duration-200">
                        {book.cover_image_url ? (
                          <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                            <span className="text-[8px] text-center px-1 font-medium text-primary/70 line-clamp-3">{book.title}</span>
                          </div>
                        )}
                      </div>
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} className={cn("w-2 h-2", s <= (book.rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-transparent")} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-2 bg-amber-900/20 rounded-full mt-4" />
              </div>
            );
          })()}

          {/* Book Detail/Notes Dialog */}
          <Dialog open={notesOpen} onOpenChange={setNotesOpen}>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
              {selectedBook && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                      <div className="w-12 h-16 bg-muted rounded overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {selectedBook.cover_image_url ? (
                          <img src={selectedBook.cover_image_url} alt={selectedBook.title} className="w-full h-full object-cover" />
                        ) : (
                          <BookOpen className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="text-base">{selectedBook.title}</p>
                        {selectedBook.author && <p className="text-sm font-normal text-muted-foreground">{selectedBook.author}</p>}
                      </div>
                    </DialogTitle>
                  </DialogHeader>

                  <div className="space-y-4 pt-2">
                    {/* Rating */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Calificación</label>
                      <div className="flex items-center gap-1 mt-1">
                        {[1,2,3,4,5].map(s => (
                          <button key={s} onClick={() => { updateBook(selectedBook.id, { rating: s }); setSelectedBook({...selectedBook, rating: s}); }}>
                            <Star className={cn("w-7 h-7 transition-colors", s <= (selectedBook.rating || 0) ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground hover:text-yellow-400")} />
                          </button>
                        ))}
                        {selectedBook.rating && <span className="text-sm text-muted-foreground ml-2">{selectedBook.rating}/5</span>}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedBook.pages_total && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">Páginas</p>
                          <p className="font-medium">{selectedBook.pages_total}</p>
                        </div>
                      )}
                      {selectedBook.genre && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">Género</p>
                          <p className="font-medium">{selectedBook.genre}</p>
                        </div>
                      )}
                      {selectedBook.start_date && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">Empezado</p>
                          <p className="font-medium">{format(new Date(selectedBook.start_date), "d MMM yyyy", { locale: es })}</p>
                        </div>
                      )}
                      {selectedBook.finish_date && (
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs">Terminado</p>
                          <p className="font-medium">{format(new Date(selectedBook.finish_date), "d MMM yyyy", { locale: es })}</p>
                        </div>
                      )}
                    </div>

                    {/* Notes / Summary */}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5" /> Notas / Resumen del libro
                      </label>
                      <Textarea
                        value={editingNotes}
                        onChange={(e) => setEditingNotes(e.target.value)}
                        placeholder="Escribe tus notas, resumen, citas favoritas, lecciones aprendidas..."
                        className="mt-2 min-h-[160px]"
                      />
                      <Button
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          updateBook(selectedBook.id, { notes: editingNotes });
                          setSelectedBook({...selectedBook, notes: editingNotes});
                        }}
                      >
                        Guardar notas
                      </Button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2 border-t border-border">
                      <Button size="sm" variant="outline" onClick={() => { openEditDialog(selectedBook); setNotesOpen(false); }}>
                        <Edit2 className="w-3 h-3 mr-1.5" /> Editar libro
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { deleteBook(selectedBook.id); setNotesOpen(false); }}>
                        <Trash2 className="w-3 h-3 mr-1.5" /> Eliminar
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* Future Reads */}
        <TabsContent value="future" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getBooksByStatus('to_read').map(book => <BookCard key={book.id} book={book} />)}
          </div>
          {getBooksByStatus('to_read').length === 0 && (
            <div className="text-center py-12 text-muted-foreground"><Library className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>No hay libros en la lista de próximas lecturas</p></div>
          )}
        </TabsContent>

        {/* Timeline */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {timeline.map(({ month, assigned, target }, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base capitalize flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {format(month, 'MMMM yyyy', { locale: es })}
                  <Badge variant="outline" className="ml-auto">{assigned.length}/{target}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Progress value={(assigned.length / target) * 100} className="h-2 mb-3" />
                {assigned.length > 0 ? (
                  <div className="space-y-2">
                    {assigned.map(book => (
                      <div key={book.id} className="flex items-center gap-3 text-sm">
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{book.title}</span>
                        <Badge variant={book.status === 'completed' ? 'default' : 'secondary'} className="text-xs ml-auto">
                          {book.status === 'completed' ? '✓ Leído' : 'Leyendo'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin libros asignados aún</p>
                )}
                {i === 0 && currentBook && (
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-1">📖 Libro de la semana</p>
                    <p className="text-sm font-medium">{currentBook.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />{dailyPages} páginas por día para terminar este mes
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}