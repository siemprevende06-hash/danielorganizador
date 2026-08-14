import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
export const useReadingLibrary = () => {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const fetchBooks = async () => {
        try {
            const { data, error } = await supabase
                .from('reading_library')
                .select('*')
                .order('created_at', { ascending: false });
            if (error)
                throw error;
            setBooks(data || []);
        }
        catch (error) {
            console.error('Error fetching books:', error);
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchBooks();
    }, []);
    const addBook = async (book) => {
        try {
            const { data, error } = await supabase
                .from('reading_library')
                .insert({
                title: book.title || '',
                author: book.author,
                cover_image_url: book.cover_image_url,
                status: book.status || 'to_read',
                pages_total: book.pages_total,
                pages_read: book.pages_read || 0,
                genre: book.genre,
                notes: book.notes,
            })
                .select()
                .single();
            if (error)
                throw error;
            setBooks(prev => [data, ...prev]);
            toast({
                title: "Libro agregado",
                description: book.title,
            });
            return data;
        }
        catch (error) {
            console.error('Error adding book:', error);
            toast({
                title: "Error",
                description: "No se pudo agregar el libro",
                variant: "destructive",
            });
            return null;
        }
    };
    const updateBook = async (id, updates) => {
        try {
            const { error } = await supabase
                .from('reading_library')
                .update(updates)
                .eq('id', id);
            if (error)
                throw error;
            setBooks(prev => prev.map(book => book.id === id ? { ...book, ...updates } : book));
        }
        catch (error) {
            console.error('Error updating book:', error);
            toast({
                title: "Error",
                description: "No se pudo actualizar el libro",
                variant: "destructive",
            });
        }
    };
    const startReading = async (id) => {
        await updateBook(id, {
            status: 'reading',
            start_date: new Date().toISOString().split('T')[0]
        });
        toast({
            title: "¡A leer!",
            description: "Libro marcado como 'Leyendo'",
        });
    };
    const finishBook = async (id, rating) => {
        const book = books.find(b => b.id === id);
        await updateBook(id, {
            status: 'completed',
            finish_date: new Date().toISOString().split('T')[0],
            pages_read: book?.pages_total || book?.pages_read || 0,
            rating,
        });
        toast({
            title: "¡Libro completado!",
            description: "Felicitaciones por terminar el libro 📚",
        });
    };
    const updateProgress = async (id, pagesRead) => {
        const book = books.find(b => b.id === id);
        if (!book)
            return;
        const updates = { pages_read: pagesRead };
        if (book.pages_total && pagesRead >= book.pages_total) {
            updates.status = 'completed';
            updates.finish_date = new Date().toISOString().split('T')[0];
        }
        await updateBook(id, updates);
    };
    const deleteBook = async (id) => {
        try {
            const { error } = await supabase
                .from('reading_library')
                .delete()
                .eq('id', id);
            if (error)
                throw error;
            setBooks(prev => prev.filter(book => book.id !== id));
            toast({
                title: "Libro eliminado",
            });
        }
        catch (error) {
            console.error('Error deleting book:', error);
        }
    };
    const getBooksByStatus = (status) => {
        return books.filter(book => book.status === status);
    };
    const getCurrentlyReading = () => getBooksByStatus('reading')[0];
    const getStats = () => {
        const completed = books.filter(b => b.status === 'completed');
        const thisYear = completed.filter(b => b.finish_date && new Date(b.finish_date).getFullYear() === new Date().getFullYear());
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
