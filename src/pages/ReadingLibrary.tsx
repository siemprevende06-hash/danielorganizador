import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReadingLibrary, Book } from '@/hooks/useReadingLibrary';
import { BookOpen, Plus, Star, BookMarked, Library, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReadingLibrary() {
  const {
    books,
    loading,
    addBook,
    updateBook,
    startReading,
    finishBook,
    updateProgress,
    deleteBook,
    getBooksByStatus,
    getCurrentlyReading,
    getStats,
  } = useReadingLibrary();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    pages_total: '',
    genre: '',
    cover_image_url: '',
  });

  const currentlyReading = getCurrentlyReading();
  const stats = getStats();

  const handleAddBook = async () => {
    if (!newBook.title) return;
    
    await addBook({
      title: newBook.title,
      author: newBook.author || null,
      pages_total: newBook.pages_total ? parseInt(newBook.pages_total) : null,
      genre: newBook.genre || null,
      cover_image_url: newBook.cover_image_url || null,
      status: 'to_read',
    });
    
    setNewBook({ title: '', author: '', pages_total: '', genre: '', cover_image_url: '' });
    setDialogOpen(false);
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={cn(
              "w-3 h-3",
              star <= rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
            )}
          />
        ))}
      </div>
    );
  };

  const BookCard = ({ book }: { book: Book }) => {
    const progressPercent = book.pages_total 
      ? Math.round((book.pages_read / book.pages_total) * 100)
      : 0;

    return (
      <Card className="overflow-hidden">
        <div className="aspect-[2/3] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
          {book.cover_image_url ? (
            <img 
              src={book.cover_image_url} 
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <BookOpen className="w-12 h-12 text-primary/40" />
          )}
        </div>
        <CardContent className="p-3 space-y-2">
          <h3 className="font-medium text-sm line-clamp-2">{book.title}</h3>
          {book.author && (
            <p className="text-xs text-muted-foreground">{book.author}</p>
          )}
          {book.status === 'reading' && book.pages_total && (
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-1.5" />
              <p className="text-xs text-muted-foreground">
                {book.pages_read}/{book.pages_total} págs ({progressPercent}%)
              </p>
            </div>
          )}
          {book.status === 'completed' && renderStars(book.rating)}
          
          <div className="flex gap-1 pt-2">
            {book.status === 'to_read' && (
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1 text-xs h-7"
                onClick={() => startReading(book.id)}
              >
                Empezar
              </Button>
            )}
            {book.status === 'reading' && (
              <Button 
                size="sm" 
                variant="default" 
                className="flex-1 text-xs h-7"
                onClick={() => finishBook(book.id, 4)}
              >
                Terminar
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              onClick={() => deleteBook(book.id)}
            >
              <Trash2 className="w-3 h-3 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-24">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-24 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            📚 Mi Biblioteca
          </h1>
          <p className="text-muted-foreground">
            Tu colección de libros y lecturas
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Libro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Libro</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  placeholder="Atomic Habits"
                  value={newBook.title}
                  onChange={(e) => setNewBook(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Autor</label>
                <Input
                  placeholder="James Clear"
                  value={newBook.author}
                  onChange={(e) => setNewBook(prev => ({ ...prev, author: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Páginas</label>
                  <Input
                    type="number"
                    placeholder="320"
                    value={newBook.pages_total}
                    onChange={(e) => setNewBook(prev => ({ ...prev, pages_total: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Género</label>
                  <Input
                    placeholder="Productividad"
                    value={newBook.genre}
                    onChange={(e) => setNewBook(prev => ({ ...prev, genre: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">URL de portada (opcional)</label>
                <Input
                  placeholder="https://..."
                  value={newBook.cover_image_url}
                  onChange={(e) => setNewBook(prev => ({ ...prev, cover_image_url: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <Button onClick={handleAddBook} className="w-full">
                Agregar Libro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </header>

      {/* Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalBooks}</p>
                <p className="text-xs text-muted-foreground">Leídos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.thisYearBooks}</p>
                <p className="text-xs text-muted-foreground">Este año</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.yearlyGoal}</p>
                <p className="text-xs text-muted-foreground">Meta anual</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm">{stats.totalPages.toLocaleString()} páginas leídas</p>
              <p className="text-xs text-muted-foreground">~{stats.estimatedHours}h de lectura</p>
            </div>
          </div>
          <Progress 
            value={(stats.thisYearBooks / stats.yearlyGoal) * 100} 
            className="h-2 mt-3" 
          />
        </CardContent>
      </Card>

      {/* Currently Reading */}
      {currentlyReading && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookMarked className="w-4 h-4" />
              📖 Leyendo Ahora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="w-20 h-28 bg-muted rounded flex items-center justify-center flex-shrink-0">
                {currentlyReading.cover_image_url ? (
                  <img 
                    src={currentlyReading.cover_image_url} 
                    alt={currentlyReading.title}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <BookOpen className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="font-medium">{currentlyReading.title}</h3>
                {currentlyReading.author && (
                  <p className="text-sm text-muted-foreground">{currentlyReading.author}</p>
                )}
                {currentlyReading.pages_total && (
                  <div className="space-y-1">
                    <Progress 
                      value={(currentlyReading.pages_read / currentlyReading.pages_total) * 100} 
                      className="h-2" 
                    />
                    <p className="text-xs text-muted-foreground">
                      Página {currentlyReading.pages_read} de {currentlyReading.pages_total}
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Página actual"
                    className="w-24 h-8 text-xs"
                    onBlur={(e) => {
                      if (e.target.value) {
                        updateProgress(currentlyReading.id, parseInt(e.target.value));
                      }
                    }}
                  />
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={() => finishBook(currentlyReading.id, 4)}
                  >
                    Terminé
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="to_read">
        <TabsList>
          <TabsTrigger value="to_read">
            Por Leer ({getBooksByStatus('to_read').length})
          </TabsTrigger>
          <TabsTrigger value="reading">
            Leyendo ({getBooksByStatus('reading').length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completados ({getBooksByStatus('completed').length})
          </TabsTrigger>
        </TabsList>

        {(['to_read', 'reading', 'completed'] as const).map(status => (
          <TabsContent key={status} value={status} className="mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {getBooksByStatus(status).map(book => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
            {getBooksByStatus(status).length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Library className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay libros en esta categoría</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
