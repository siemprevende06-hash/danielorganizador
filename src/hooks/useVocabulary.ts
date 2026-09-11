import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface VocabularyWord {
  id: string;
  user_id: string | null;
  language: string | null;
  word: string;
  translation: string | null;
  context_en: string | null;
  context_es: string | null;
  book_id: string | null;
  book_title: string | null;
  status: string | null;
  review_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export type VocabStatus = 'new' | 'learning' | 'learned';

export const useVocabulary = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchWords = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_vocabulary')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWords((data as VocabularyWord[]) || []);
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWords();
  }, [fetchWords]);

  const addWord = async (input: {
    word: string;
    translation?: string | null;
    context_en?: string | null;
    context_es?: string | null;
    book_id?: string | null;
    book_title?: string | null;
    language?: string;
  }) => {
    const language = input.language || 'english';
    const existing = words.find(
      w => w.word.toLowerCase() === input.word.toLowerCase() && (w.language || 'english') === language
    );

    try {
      if (existing) {
        const { error } = await supabase
          .from('user_vocabulary')
          .update({
            translation: input.translation || existing.translation || null,
            context_en: input.context_en || existing.context_en || null,
            context_es: input.context_es || existing.context_es || null,
            book_id: input.book_id || existing.book_id || null,
            book_title: input.book_title || existing.book_title || null,
            review_count: (existing.review_count || 0) + 1,
          })
          .eq('id', existing.id);

        if (error) throw error;
        setWords(prev => prev.map(w => w.id === existing.id ? { ...w, ...input, review_count: (w.review_count || 0) + 1 } : w));
        toast({ title: 'Palabra actualizada', description: `"${existing.word}" ya estaba en tu vocabulario` });
        return existing;
      }

      const { data, error } = await supabase
        .from('user_vocabulary')
        .insert({
          word: input.word,
          language,
          translation: input.translation || null,
          context_en: input.context_en || null,
          context_es: input.context_es || null,
          book_id: input.book_id || null,
          book_title: input.book_title || null,
          status: 'new',
          review_count: 1,
        })
        .select()
        .single();

      if (error) throw error;
      setWords(prev => [data as VocabularyWord, ...prev]);
      toast({ title: 'Guardada en vocabulario 📚', description: `"${input.word}" agregada a tu lista` });
      return data;
    } catch (error) {
      console.error('Error adding vocabulary word:', error);
      toast({ title: 'Error', description: 'No se pudo guardar la palabra', variant: 'destructive' });
      return null;
    }
  };

  const updateWord = async (id: string, updates: Partial<VocabularyWord>) => {
    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      setWords(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    } catch (error) {
      console.error('Error updating vocabulary word:', error);
      toast({ title: 'Error', description: 'No se pudo actualizar la palabra', variant: 'destructive' });
    }
  };

  const deleteWord = async (id: string) => {
    try {
      const { error } = await supabase
        .from('user_vocabulary')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setWords(prev => prev.filter(w => w.id !== id));
    } catch (error) {
      console.error('Error deleting vocabulary word:', error);
    }
  };

  return {
    words,
    loading,
    addWord,
    updateWord,
    deleteWord,
    refetch: fetchWords,
  };
};