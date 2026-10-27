import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Book {
  id: string;
  user_id: string | null;
  title: string;
  author: string | null;
  bilingual_txt: string | null;
  reading_pair_index: number | null;
  cover_image_url: string | null;
  status: 'to_read' | 'reading' | 'completed';
  start_date: string | null;
  finish_date: string | null;
  rating: number | null;
  notes: string | null;
  pages_total: number | null;
  pages_read: number;
  genre: string | null;
  created_at: string;
  updated_at: string;
  /** Fechas derivadas de las sesiones de lectura (no se guardan en la tabla). */
  sessions_first_date?: string | null;
  sessions_last_date?: string | null;
}

const todayISO = () => new Date().toISOString().split('T')[0];

type BookDates = Pick<Book, 'start_date' | 'finish_date' | 'status' | 'created_at' | 'sessions_first_date' | 'sessions_last_date'>;

/** yyyy-MM-dd en hora local a partir de un timestamp ISO. */
const localISODate = (value: string): string | null => {
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/** Inicio con evidencia real de lectura: fecha guardada o primera sesión. */
export const trackedStartDate = (book: BookDates): string | null =>
  book.start_date || book.sessions_first_date || null;

/**
 * Fecha de inicio real de un libro, por orden de fiabilidad:
 * 1. `start_date` guardada, 2. primera sesión de lectura, 3. fecha en que se
 * agregó el libro a la biblioteca (`created_at`), que es cuando se empezó.
 */
export const effectiveStartDate = (book: BookDates): string | null =>
  trackedStartDate(book)
  || (book.status !== 'to_read' && book.created_at ? localISODate(book.created_at) : null);

/**
 * Fecha de fin real: la guardada o la última sesión de lectura si el libro
 * está completado. Un libro en curso no tiene fecha de fin.
 */
export const effectiveFinishDate = (book: BookDates): string | null =>
  book.finish_date || (book.status === 'completed' ? book.sessions_last_date || null : null);

export const useReadingLibrary = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBooks = async () => {
    try {
      const [booksRes, sessionsRes] = await Promise.all([
        supabase
          .from('reading_library')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('reading_sessions')
          .select('book_id, session_date')
          .order('session_date', { ascending: true }),
      ]);

      const { data, error } = booksRes;
      if (error) throw error;

      // Fechas de respaldo: la primera y la última sesión de lectura de cada libro.
      // Hay libros viejos con start_date/finish_date vacíos pero con sesiones registradas.
      const sessionRange: Record<string, { first: string; last: string }> = {};
      if (sessionsRes.error) {
        console.warn('No se pudieron leer las sesiones de lectura:', sessionsRes.error);
      } else {
        for (const s of (sessionsRes.data || []) as { book_id: string | null; session_date: string | null }[]) {
          if (!s.book_id || !s.session_date) continue;
          const range = sessionRange[s.book_id];
          if (!range) sessionRange[s.book_id] = { first: s.session_date, last: s.session_date };
          else if (s.session_date > range.last) range.last = s.session_date;
        }
      }

      const rows = ((data || []) as Book[]).map(book => ({
        ...book,
        sessions_first_date: sessionRange[book.id]?.first ?? null,
        sessions_last_date: sessionRange[book.id]?.last ?? null,
      }));

      setBooks(rows);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const addBook = async (book: Partial<Book>) => {
    try {
      const status = (book.status || 'to_read') as Book['status'];
      const today = todayISO();
      // Las fechas se registran solas al crear el libro en estado Leyendo/Completado.
      const start_date = book.start_date ?? (status === 'reading' ? today : null);
      const finish_date = book.finish_date ?? (status === 'completed' ? today : null);
      const { data, error } = await supabase
        .from('reading_library')
        .insert({
          title: book.title || '',
          author: book.author,
          cover_image_url: book.cover_image_url,
          status,
          pages_total: book.pages_total,
          pages_read: book.pages_read || 0,
          genre: book.genre,
          notes: book.notes,
          start_date,
          finish_date,
        })
        .select()
        .single();

      if (error) throw error;
      
      setBooks(prev => [data as Book, ...prev]);
      toast({
        title: "Libro agregado",
        description: book.title,
      });
      
      return data;
    } catch (error) {
      console.error('Error adding book:', error);
      toast({
        title: "Error",
        description: "No se pudo agregar el libro",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateBook = async (id: string, updates: Partial<Book>) => {
    try {
      const current = books.find(b => b.id === id);
      const next: Partial<Book> = { ...updates };
      // Autocompletar fechas al cambiar de estado, para no perder el histórico.
      if (current && next.status) {
        if (next.status === 'reading' && !current.start_date && !next.start_date) {
          next.start_date = todayISO();
        }
        if (next.status === 'completed' && !current.finish_date && !next.finish_date) {
          next.finish_date = todayISO();
        }
      }
      const { error } = await supabase
        .from('reading_library')
        .update(next)
        .eq('id', id);

      if (error) throw error;

      setBooks(prev => prev.map(book => 
        book.id === id ? { ...book, ...next } : book
      ));
    } catch (error) {
      console.error('Error updating book:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el libro",
        variant: "destructive",
      });
    }
  };

  const startReading = async (id: string) => {
    // `updateBook` rellena start_date si el libro aún no tenía fecha de inicio.
    await updateBook(id, { status: 'reading' });
    toast({
      title: "¡A leer!",
      description: "Libro marcado como 'Leyendo'",
    });
  };

  const finishBook = async (id: string, rating?: number) => {
    const book = books.find(b => b.id === id);
    await updateBook(id, { 
      status: 'completed', 
      finish_date: book?.finish_date ?? todayISO(),
      pages_read: book?.pages_total || book?.pages_read || 0,
      rating,
    });
    toast({
      title: "¡Libro completado!",
      description: "Felicitaciones por terminar el libro 📚",
    });
  };

  const updateProgress = async (id: string, pagesRead: number, extra?: Partial<Book>) => {
    const book = books.find(b => b.id === id);
    if (!book) return;

    const updates: Partial<Book> = { pages_read: pagesRead, ...extra };
    if (pagesRead > 0 && book.status === 'to_read') {
      updates.status = 'reading';
    }
    if (pagesRead > 0 && !book.start_date && !updates.start_date) {
      updates.start_date = todayISO();
    }
    if (book.pages_total && pagesRead >= book.pages_total) {
      updates.status = 'completed';
      updates.finish_date = book.finish_date ?? todayISO();
    }
    
    await updateBook(id, updates);
  };

  const deleteBook = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reading_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setBooks(prev => prev.filter(book => book.id !== id));
      toast({
        title: "Libro eliminado",
      });
    } catch (error) {
      console.error('Error deleting book:', error);
    }
  };

  const getBooksByStatus = (status: Book['status']) => {
    return books.filter(book => book.status === status);
  };

  const getCurrentlyReading = () => getBooksByStatus('reading')[0];

  const getStats = () => {
    const completed = books.filter(b => b.status === 'completed');
    const thisYear = completed.filter(b => {
      const finish = effectiveFinishDate(b);
      return finish && new Date(finish).getFullYear() === new Date().getFullYear();
    });
    const totalPages = completed.reduce((acc, b) => acc + (b.pages_total || 0), 0);
    
    return {
      totalBooks: completed.length,
      thisYearBooks: thisYear.length,
      yearlyGoal: 24,
      totalPages,
      estimatedHours: Math.round(totalPages / 40), // ~40 pages per hour
    };
  };

  return {
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
    refetch: fetchBooks,
  };
};
