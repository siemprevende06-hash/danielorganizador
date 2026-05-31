import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface JournalEntry {
  id: string;
  date: string;
  content: string;
}

export const useJournalEntries = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadEntries = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('journal_entries')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedEntries = data?.map((row: any) => ({
          id: row.id,
          date: row.created_at,
          content: row.content,
        })) || [];

        // Migration from localStorage
        const stored = localStorage.getItem('journalEntries');
        if (stored && formattedEntries.length === 0) {
          const localEntries = JSON.parse(stored) as JournalEntry[];
          for (const entry of localEntries) {
            await supabase.from('journal_entries').insert({
              content: entry.content,
              entry_date: new Date(entry.date).toISOString().split('T')[0],
              created_at: entry.date,
            });
          }
          setEntries(localEntries);
          localStorage.removeItem('journalEntries');
        } else {
          setEntries(formattedEntries);
        }
      } catch (error) {
        console.error('Error loading journal entries:', error);
        const stored = localStorage.getItem('journalEntries');
        if (stored) setEntries(JSON.parse(stored));
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, []);

  const addEntry = useCallback(async (content: string) => {
    const now = new Date().toISOString();
    try {
      const { data, error } = await supabase
        .from('journal_entries')
        .insert({
          content,
          entry_date: now.split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      const newEntry: JournalEntry = {
        id: data.id,
        date: data.created_at,
        content: data.content,
      };
      setEntries(prev => [newEntry, ...prev]);
      return newEntry;
    } catch (error) {
      console.error('Error adding entry:', error);
      return null;
    }
  }, []);

  const deleteEntry = useCallback(async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      setEntries(prev => prev.filter(e => e.id !== entryId));
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  }, []);

  return { entries, isLoading, addEntry, deleteEntry };
};
