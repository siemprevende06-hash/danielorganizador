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
import { BookOpen, Plus, Star, BookMarked, Library, Trash2, Upload, Calendar, ChevronRight, Clock, TrendingUp, TrendingDown, Edit2 } from 'lucide-react';
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
          <TabsTrigger value="history">📖 Historial</TabsTrigger>
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

        {/* History */}
        <TabsContent value="history" className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {getBooksByStatus('completed').map(book => <BookCard key={book.id} book={book} />)}
          </div>
          {getBooksByStatus('completed').length === 0 && (
            <div className="text-center py-12 text-muted-foreground"><Library className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Aún no has completado ningún libro</p></div>
          )}
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