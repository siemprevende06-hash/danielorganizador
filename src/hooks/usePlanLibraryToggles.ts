import { useState } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlanBookLite {
  id: string;
  status?: string | null;
  start_date?: string | null;
}

export interface PlanSongLite {
  id: string;
  status?: string | null;
  learned_at?: string | null;
  mastered_at?: string | null;
  recorded_at?: string | null;
}

export type SongPlanTypeLite = 'learned' | 'mastered' | 'recorded' | undefined;

type SongCheckpointField = 'learned_at' | 'mastered_at' | 'recorded_at';

/** Campo de la canción que representa el tipo de objetivo planificado. */
export function songCheckpointField(plan: SongPlanTypeLite): SongCheckpointField {
  if (plan === 'mastered') return 'mastered_at';
  if (plan === 'recorded') return 'recorded_at';
  return 'learned_at';
}

/**
 * Marca libros como leídos y canciones según su objetivo (aprender / dominar /
 * grabar) desde la pestaña Planificación. Guarda al instante en Supabase y
 * refleja el cambio en pantalla sin recargar la página.
 */
export function usePlanLibraryToggles(books: PlanBookLite[], songs: PlanSongLite[]) {
  const { toast } = useToast();
  const [bookState, setBookState] = useState<Record<string, boolean>>({});
  const [songState, setSongState] = useState<Record<string, boolean>>({});

  const isBookDone = (id: string) => {
    if (id in bookState) return bookState[id];
    return books.find(b => b.id === id)?.status === 'completed';
  };

  const isSongDone = (id: string, plan?: SongPlanTypeLite) => {
    const field = songCheckpointField(plan);
    const key = `${id}:${field}`;
    if (key in songState) return songState[key];
    const song = songs.find(s => s.id === id);
    if (!song) return false;
    const value = song[field] as string | null | undefined;
    if (field === 'mastered_at') return Boolean(value) || song.status === 'mastered';
    return Boolean(value);
  };

  const toggleBook = async (id: string) => {
    const book = books.find(b => b.id === id);
    const next = !isBookDone(id);
    setBookState(prev => ({ ...prev, [id]: next }));

    const patch = next
      ? { status: 'completed', finish_date: format(new Date(), 'yyyy-MM-dd') }
      : { status: book?.start_date ? 'reading' : 'to_read', finish_date: null };

    const { error } = await supabase.from('reading_library').update(patch).eq('id', id);
    if (error) {
      setBookState(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el libro' });
    }
  };

  const toggleSong = async (id: string, plan?: SongPlanTypeLite) => {
    const field = songCheckpointField(plan);
    const key = `${id}:${field}`;
    const next = !isSongDone(id, plan);
    setSongState(prev => ({ ...prev, [key]: next }));

    const patch: Record<string, unknown> = { [field]: next ? new Date().toISOString() : null };
    if (field === 'mastered_at') patch.status = next ? 'mastered' : 'learning';

    const { error } = await supabase.from('music_repertoire').update(patch).eq('id', id);
    if (error) {
      setSongState(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar la canción' });
    }
  };

  return { isBookDone, isSongDone, toggleBook, toggleSong };
}
